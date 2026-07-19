import { create } from 'zustand'
import type { CorFundo, Destino, EstadoSlot, Imagem, Plataforma } from '../tipos'
import { formatoPorId, formatosDe } from '../data/formatos'
import { layoutPorId, layoutsDe } from '../data/layouts'
import { clamp } from '../lib/cover'

/** Quantos passos de histórico ficam guardados. */
const LIMITE_HISTORICO = 60

/** Janela em que duas edições do mesmo tipo viram um único passo de desfazer. */
const JANELA_FUSAO_MS = 700

/**
 * O que o desfazer/refazer restaura. É o "documento": tudo que muda a colagem.
 * Seleção de slot e o próprio histórico ficam de fora — são estado de tela.
 */
interface Documento {
  imagens: Imagem[]
  plataforma: Plataforma
  destino: Destino
  corFundo: CorFundo
  formatoId: string
  layoutId: string
  slots: EstadoSlot[]
  gap: number
  margem: number
  permitirReduzir: boolean
}

interface EstadoColagem extends Documento {
  slotSelecionado: string | null
  passado: Documento[]
  futuro: Documento[]

  desfazer: () => void
  refazer: () => void

  adicionarImagens: (imagens: Imagem[]) => void
  removerImagem: (id: string) => void
  limparTudo: () => void

  definirPlataforma: (plataforma: Plataforma) => void
  definirDestino: (destino: Destino) => void
  definirCorFundo: (cor: CorFundo) => void
  definirFormato: (formatoId: string) => void
  definirLayout: (layoutId: string) => void
  definirEspacamento: (gap: number, margem: number) => void

  atribuirImagem: (slotId: string, imagemId: string) => void
  usarImagem: (imagemId: string) => void
  trocarSlots: (a: string, b: string) => void
  limparSlot: (slotId: string) => void
  selecionarSlot: (slotId: string | null) => void
  ajustarSlot: (slotId: string, patch: Partial<Omit<EstadoSlot, 'slotId'>>) => void
  redefinirSlot: (slotId: string) => void
  preencherAutomaticamente: () => void
  esvaziarSlots: () => void
  alternarPermitirReduzir: () => void
}

/**
 * Toda imagem já carregada, viva ou não. O histórico pode segurar imagens que
 * saíram da bandeja, então o Object URL só é revogado quando nenhum ponto do
 * histórico alcança mais aquela imagem.
 */
const registro = new Map<string, Imagem>()

function coletarLixo(s: EstadoColagem) {
  const vivos = new Set<string>()
  for (const doc of [s, ...s.passado, ...s.futuro]) {
    for (const img of doc.imagens) vivos.add(img.id)
  }
  for (const [id, img] of registro) {
    if (!vivos.has(id)) {
      URL.revokeObjectURL(img.url)
      registro.delete(id)
    }
  }
}

function documento(s: EstadoColagem): Documento {
  return {
    imagens: s.imagens,
    plataforma: s.plataforma,
    destino: s.destino,
    corFundo: s.corFundo,
    formatoId: s.formatoId,
    layoutId: s.layoutId,
    slots: s.slots,
    gap: s.gap,
    margem: s.margem,
    permitirReduzir: s.permitirReduzir,
  }
}

function slotsVazios(layoutId: string): EstadoSlot[] {
  const layout = layoutPorId(layoutId)
  if (!layout) return []
  return layout.slots.map((s) => ({ slotId: s.id, escala: 1, offsetX: 0, offsetY: 0 }))
}

/**
 * Troca o layout preservando as imagens já posicionadas, na ordem. Cada layout
 * traz o próprio espaçamento: grades pedem gap, layouts livres já embutem o
 * respiro nas coordenadas.
 */
function trocarLayout(s: Documento, layoutId: string): Partial<Documento> {
  const layout = layoutPorId(layoutId)
  if (!layout) return {}

  const novos = slotsVazios(layoutId)
  const usadas = s.slots.filter((x) => x.imagemId)
  novos.forEach((novo, i) => {
    const antiga = usadas[i]
    if (antiga) {
      novo.imagemId = antiga.imagemId
      novo.escala = antiga.escala
      novo.offsetX = antiga.offsetX
      novo.offsetY = antiga.offsetY
    }
  })

  return { layoutId, slots: novos, gap: layout.gap, margem: layout.margem }
}

/** Troca o formato; se o layout atual não serve para a nova proporção, adota o primeiro que serve. */
function trocarFormato(s: Documento, formatoId: string): Partial<Documento> {
  const formato = formatoPorId(formatoId)
  if (!formato) return {}

  const validos = layoutsDe(formato.proporcao)
  if (validos.some((l) => l.id === s.layoutId)) return { formatoId }
  return { formatoId, ...trocarLayout(s, validos[0].id) }
}

function documentoInicial(): Documento {
  const opcoes = formatosDe('instagram', 'feed')
  const formato = opcoes.find((f) => f.recomendado) ?? opcoes[0]
  const layout = layoutsDe(formato.proporcao)[0]

  return {
    imagens: [],
    plataforma: 'instagram',
    destino: 'feed',
    corFundo: '#FFFFFF',
    formatoId: formato.id,
    layoutId: layout.id,
    slots: slotsVazios(layout.id),
    gap: layout.gap,
    margem: layout.margem,
    permitirReduzir: false,
  }
}

/** Mantém a seleção só se o slot ainda existir no documento restaurado. */
function selecaoValida(doc: Documento, slotId: string | null): string | null {
  return doc.slots.some((s) => s.slotId === slotId) ? slotId : null
}

export const useColagemStore = create<EstadoColagem>((set, get) => {
  let ultimaTag: string | null = null
  let ultimoEm = 0

  /**
   * Aplica uma mudança no documento empilhando um passo de histórico. Duas
   * edições seguidas com a mesma `tag` (arrastar uma foto, mexer num slider)
   * viram um passo só — senão o desfazer andaria de pixel em pixel.
   */
  function editar(
    fn: (s: EstadoColagem) => (Partial<Documento> & { slotSelecionado?: string | null }) | null,
    tag?: string,
  ) {
    set((s) => {
      const patch = fn(s)
      if (!patch) return {}

      const agora = Date.now()
      const funde = tag != null && tag === ultimaTag && agora - ultimoEm < JANELA_FUSAO_MS
      ultimaTag = tag ?? null
      ultimoEm = agora

      const passado = funde
        ? s.passado
        : [...s.passado, documento(s)].slice(-LIMITE_HISTORICO)

      return { ...patch, passado, futuro: [] }
    })
    coletarLixo(get())
  }

  return {
    ...documentoInicial(),
    slotSelecionado: null,
    passado: [],
    futuro: [],

    desfazer: () => {
      const s = get()
      const alvo = s.passado[s.passado.length - 1]
      if (!alvo) return
      ultimaTag = null
      set({
        ...alvo,
        passado: s.passado.slice(0, -1),
        futuro: [...s.futuro, documento(s)],
        slotSelecionado: selecaoValida(alvo, s.slotSelecionado),
      })
      coletarLixo(get())
    },

    refazer: () => {
      const s = get()
      const alvo = s.futuro[s.futuro.length - 1]
      if (!alvo) return
      ultimaTag = null
      set({
        ...alvo,
        passado: [...s.passado, documento(s)].slice(-LIMITE_HISTORICO),
        futuro: s.futuro.slice(0, -1),
        slotSelecionado: selecaoValida(alvo, s.slotSelecionado),
      })
      coletarLixo(get())
    },

    adicionarImagens: (novas) => {
      novas.forEach((i) => registro.set(i.id, i))
      editar((s) => (novas.length === 0 ? null : { imagens: [...s.imagens, ...novas] }))
    },

    removerImagem: (id) =>
      editar((s) => ({
        imagens: s.imagens.filter((i) => i.id !== id),
        slots: s.slots.map((slot) =>
          slot.imagemId === id ? { slotId: slot.slotId, escala: 1, offsetX: 0, offsetY: 0 } : slot,
        ),
      })),

    /** Recomeço do zero: descarta o histórico, então as imagens somem de vez. */
    limparTudo: () => {
      ultimaTag = null
      set({ ...documentoInicial(), slotSelecionado: null, passado: [], futuro: [] })
      coletarLixo(get())
    },

    definirPlataforma: (plataforma) =>
      editar((s) => {
        if (s.plataforma === plataforma) return null
        const opcoes = formatosDe(plataforma, s.destino)
        const escolhido = opcoes.some((f) => f.id === s.formatoId)
          ? s.formatoId
          : (opcoes.find((f) => f.recomendado) ?? opcoes[0]).id
        return { plataforma, ...trocarFormato(s, escolhido) }
      }),

    definirDestino: (destino) =>
      editar((s) => {
        if (s.destino === destino) return null
        const opcoes = formatosDe(s.plataforma, destino)
        const escolhido = opcoes.some((f) => f.id === s.formatoId)
          ? s.formatoId
          : (opcoes.find((f) => f.recomendado) ?? opcoes[0]).id
        return { destino, ...trocarFormato(s, escolhido) }
      }),

    definirCorFundo: (corFundo) => editar((s) => (s.corFundo === corFundo ? null : { corFundo })),

    definirFormato: (formatoId) =>
      editar((s) => (s.formatoId === formatoId ? null : trocarFormato(s, formatoId))),

    definirLayout: (layoutId) =>
      editar((s) => {
        if (s.layoutId === layoutId) return null
        const patch = trocarLayout(s, layoutId)
        return { ...patch, slotSelecionado: patch.slots?.[0]?.slotId ?? null }
      }),

    definirEspacamento: (gap, margem) =>
      editar((s) => (s.gap === gap && s.margem === margem ? null : { gap, margem }), 'espacamento'),

    atribuirImagem: (slotId, imagemId) =>
      editar((s) => ({
        slots: s.slots.map((slot) =>
          slot.slotId === slotId ? { slotId, imagemId, escala: 1, offsetX: 0, offsetY: 0 } : slot,
        ),
        slotSelecionado: slotId,
      })),

    /** Clique numa miniatura: vai para o slot selecionado, ou para o primeiro vazio. */
    usarImagem: (imagemId) =>
      editar((s) => {
        const selecionado = s.slots.find((x) => x.slotId === s.slotSelecionado)
        const alvo = selecionado?.imagemId ? selecionado : (s.slots.find((x) => !x.imagemId) ?? selecionado)
        if (!alvo) return null
        return {
          slots: s.slots.map((slot) =>
            slot.slotId === alvo.slotId
              ? { slotId: alvo.slotId, imagemId, escala: 1, offsetX: 0, offsetY: 0 }
              : slot,
          ),
          slotSelecionado: alvo.slotId,
        }
      }),

    trocarSlots: (a, b) =>
      editar((s) => {
        const sa = s.slots.find((x) => x.slotId === a)
        const sb = s.slots.find((x) => x.slotId === b)
        if (!sa || !sb) return null
        return {
          slots: s.slots.map((slot) => {
            if (slot.slotId === a) return { ...sb, slotId: a }
            if (slot.slotId === b) return { ...sa, slotId: b }
            return slot
          }),
        }
      }),

    limparSlot: (slotId) =>
      editar((s) => ({
        slots: s.slots.map((slot) =>
          slot.slotId === slotId ? { slotId, escala: 1, offsetX: 0, offsetY: 0 } : slot,
        ),
      })),

    selecionarSlot: (slotSelecionado) => set({ slotSelecionado }),

    ajustarSlot: (slotId, patch) =>
      editar(
        (s) => ({
          slots: s.slots.map((slot) => {
            if (slot.slotId !== slotId) return slot
            const minimo = s.permitirReduzir ? 0.3 : 1
            return {
              ...slot,
              ...patch,
              escala: clamp(patch.escala ?? slot.escala, minimo, 5),
              offsetX: clamp(patch.offsetX ?? slot.offsetX, -1, 1),
              offsetY: clamp(patch.offsetY ?? slot.offsetY, -1, 1),
            }
          }),
        }),
        `ajuste:${slotId}`,
      ),

    redefinirSlot: (slotId) =>
      editar((s) => ({
        slots: s.slots.map((slot) =>
          slot.slotId === slotId ? { ...slot, escala: 1, offsetX: 0, offsetY: 0 } : slot,
        ),
      })),

    preencherAutomaticamente: () =>
      editar((s) => {
        const usadas = new Set(s.slots.map((x) => x.imagemId).filter(Boolean))
        const disponiveis = s.imagens.map((i) => i.id).filter((id) => !usadas.has(id))
        if (disponiveis.length === 0 || s.slots.every((x) => x.imagemId)) return null

        let cursor = 0
        return {
          slots: s.slots.map((slot) => {
            if (slot.imagemId) return slot
            const id = disponiveis[cursor++]
            return id ? { slotId: slot.slotId, imagemId: id, escala: 1, offsetX: 0, offsetY: 0 } : slot
          }),
        }
      }),

    esvaziarSlots: () =>
      editar((s) =>
        s.slots.every((x) => !x.imagemId)
          ? null
          : { slots: s.slots.map((x) => ({ slotId: x.slotId, escala: 1, offsetX: 0, offsetY: 0 })) },
      ),

    alternarPermitirReduzir: () =>
      editar((s) => {
        const permitir = !s.permitirReduzir
        return {
          permitirReduzir: permitir,
          slots: permitir ? s.slots : s.slots.map((x) => ({ ...x, escala: Math.max(1, x.escala) })),
        }
      }),
  }
})
