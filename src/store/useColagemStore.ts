import { create } from 'zustand'
import type { CorFundo, Destino, EstadoSlot, Imagem, Lamina, Plataforma } from '../tipos'
import { formatoPorId, formatosDe } from '../data/formatos'
import { layoutPorId, layoutsDe } from '../data/layouts'
import { clamp } from '../lib/cover'

/** Quantos passos de histórico ficam guardados. */
const LIMITE_HISTORICO = 60

/** Janela em que duas edições do mesmo tipo viram um único passo de desfazer. */
const JANELA_FUSAO_MS = 700

/**
 * O que o desfazer/refazer restaura. É o "documento": tudo que muda a colagem.
 * Lâmina ativa, seleção de slot e o próprio histórico ficam de fora — são
 * estado de tela.
 *
 * Formato, cor de fundo e bandeja de fotos são do documento inteiro; layout,
 * preenchimento e espaçamento são de cada lâmina.
 */
interface Documento {
  imagens: Imagem[]
  plataforma: Plataforma
  destino: Destino
  corFundo: CorFundo
  formatoId: string
  laminas: Lamina[]
  permitirReduzir: boolean
}

interface EstadoColagem extends Documento {
  laminaAtivaId: string
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

  adicionarLamina: () => void
  duplicarLamina: (id: string) => void
  removerLamina: (id: string) => void
  selecionarLamina: (id: string) => void

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
  esvaziarLamina: (id?: string) => void
  alternarPermitirReduzir: () => void
}

/** A lâmina em edição. Selector: componentes que a usam re-renderizam ao trocar. */
export function laminaAtiva(s: EstadoColagem): Lamina {
  return s.laminas.find((l) => l.id === s.laminaAtivaId) ?? s.laminas[0]
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
    laminas: s.laminas,
    permitirReduzir: s.permitirReduzir,
  }
}

let sequencia = 0
const novoId = () => `lamina-${++sequencia}`

function slotsVazios(layoutId: string): EstadoSlot[] {
  const layout = layoutPorId(layoutId)
  if (!layout) return []
  return layout.slots.map((s) => ({ slotId: s.id, escala: 1, offsetX: 0, offsetY: 0 }))
}

function novaLamina(layoutId: string): Lamina {
  const layout = layoutPorId(layoutId)
  return {
    id: novoId(),
    layoutId,
    slots: slotsVazios(layoutId),
    gap: layout?.gap ?? 12,
    margem: layout?.margem ?? 0,
  }
}

/**
 * Troca o layout de uma lâmina preservando as imagens já posicionadas, na
 * ordem. Cada layout traz o próprio espaçamento: grades pedem gap, layouts
 * livres já embutem o respiro nas coordenadas.
 */
function migrarLayout(lamina: Lamina, layoutId: string): Partial<Lamina> {
  const layout = layoutPorId(layoutId)
  if (!layout) return {}

  const novos = slotsVazios(layoutId)
  const usadas = lamina.slots.filter((x) => x.imagemId)
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

/**
 * Troca o formato. Como o formato vale para o documento todo, cada lâmina cujo
 * layout não serve para a nova proporção migra para o primeiro que serve.
 */
function trocarFormato(s: Documento, formatoId: string): Partial<Documento> {
  const formato = formatoPorId(formatoId)
  if (!formato) return {}

  const validos = layoutsDe(formato.proporcao)
  const laminas = s.laminas.map((l) =>
    validos.some((v) => v.id === l.layoutId) ? l : { ...l, ...migrarLayout(l, validos[0].id) },
  )
  return { formatoId, laminas }
}

/** Aplica um patch só na lâmina em edição. */
function naLaminaAtiva(
  s: EstadoColagem,
  fn: (l: Lamina) => Partial<Lamina> | null,
): Partial<Documento> | null {
  const atual = laminaAtiva(s)
  if (!atual) return null
  const patch = fn(atual)
  if (!patch) return null
  return { laminas: s.laminas.map((l) => (l.id === atual.id ? { ...l, ...patch } : l)) }
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
    laminas: [novaLamina(layout.id)],
    permitirReduzir: false,
  }
}

/** Mantém a lâmina/seleção só se ainda existirem no documento restaurado. */
function ajustarFoco(doc: Documento, laminaId: string, slotId: string | null) {
  const lamina = doc.laminas.find((l) => l.id === laminaId) ?? doc.laminas[0]
  return {
    laminaAtivaId: lamina.id,
    slotSelecionado: lamina.slots.some((s) => s.slotId === slotId) ? slotId : null,
  }
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
    fn: (
      s: EstadoColagem,
    ) => (Partial<Documento> & { slotSelecionado?: string | null; laminaAtivaId?: string }) | null,
    tag?: string,
  ) {
    set((s) => {
      const patch = fn(s)
      if (!patch) return {}

      const agora = Date.now()
      const funde = tag != null && tag === ultimaTag && agora - ultimoEm < JANELA_FUSAO_MS
      ultimaTag = tag ?? null
      ultimoEm = agora

      const passado = funde ? s.passado : [...s.passado, documento(s)].slice(-LIMITE_HISTORICO)

      return { ...patch, passado, futuro: [] }
    })
    coletarLixo(get())
  }

  const inicial = documentoInicial()

  return {
    ...inicial,
    laminaAtivaId: inicial.laminas[0].id,
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
        ...ajustarFoco(alvo, s.laminaAtivaId, s.slotSelecionado),
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
        ...ajustarFoco(alvo, s.laminaAtivaId, s.slotSelecionado),
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
        // a foto some de todas as lâminas, não só da que está em edição
        laminas: s.laminas.map((l) => ({
          ...l,
          slots: l.slots.map((slot) =>
            slot.imagemId === id ? { slotId: slot.slotId, escala: 1, offsetX: 0, offsetY: 0 } : slot,
          ),
        })),
      })),

    /** Recomeço do zero: descarta o histórico, então as imagens somem de vez. */
    limparTudo: () => {
      ultimaTag = null
      const doc = documentoInicial()
      set({
        ...doc,
        laminaAtivaId: doc.laminas[0].id,
        slotSelecionado: null,
        passado: [],
        futuro: [],
      })
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

    /** Nova lâmina em branco, com o mesmo layout da atual, logo depois dela. */
    adicionarLamina: () =>
      editar((s) => {
        const atual = laminaAtiva(s)
        const nova = novaLamina(atual.layoutId)
        const i = s.laminas.indexOf(atual)
        return {
          laminas: [...s.laminas.slice(0, i + 1), nova, ...s.laminas.slice(i + 1)],
          laminaAtivaId: nova.id,
          slotSelecionado: null,
        }
      }),

    duplicarLamina: (id) =>
      editar((s) => {
        const alvo = s.laminas.find((l) => l.id === id)
        if (!alvo) return null
        const copia: Lamina = { ...alvo, id: novoId(), slots: alvo.slots.map((x) => ({ ...x })) }
        const i = s.laminas.indexOf(alvo)
        return {
          laminas: [...s.laminas.slice(0, i + 1), copia, ...s.laminas.slice(i + 1)],
          laminaAtivaId: copia.id,
          slotSelecionado: null,
        }
      }),

    /** A última lâmina não pode ser removida — sempre existe uma colagem. */
    removerLamina: (id) =>
      editar((s) => {
        if (s.laminas.length <= 1) return null
        const i = s.laminas.findIndex((l) => l.id === id)
        if (i < 0) return null
        const laminas = s.laminas.filter((l) => l.id !== id)
        const foco = laminas[Math.min(i, laminas.length - 1)]
        return { laminas, laminaAtivaId: foco.id, slotSelecionado: null }
      }),

    selecionarLamina: (laminaAtivaId) => set({ laminaAtivaId, slotSelecionado: null }),

    definirLayout: (layoutId) =>
      editar((s) => {
        const atual = laminaAtiva(s)
        if (atual.layoutId === layoutId) return null
        const patch = naLaminaAtiva(s, (l) => migrarLayout(l, layoutId))
        if (!patch) return null
        return { ...patch, slotSelecionado: null }
      }),

    definirEspacamento: (gap, margem) =>
      editar(
        (s) => naLaminaAtiva(s, (l) => (l.gap === gap && l.margem === margem ? null : { gap, margem })),
        'espacamento',
      ),

    atribuirImagem: (slotId, imagemId) =>
      editar((s) => {
        const patch = naLaminaAtiva(s, (l) => ({
          slots: l.slots.map((slot) =>
            slot.slotId === slotId ? { slotId, imagemId, escala: 1, offsetX: 0, offsetY: 0 } : slot,
          ),
        }))
        return patch && { ...patch, slotSelecionado: slotId }
      }),

    /**
     * Clique/toque numa miniatura: vai para o slot selecionado, ou para o
     * primeiro vazio.
     *
     * Depois de preencher, a seleção anda para o próximo slot vazio. Sem isso,
     * o slot recém-preenchido continuaria selecionado e o toque seguinte
     * **substituiria** a foto em vez de seguir adiante — o que quebra o
     * preenchimento por toques sucessivos, que é o caminho principal no
     * celular.
     */
    usarImagem: (imagemId) =>
      editar((s) => {
        const atual = laminaAtiva(s)
        const selecionado = atual.slots.find((x) => x.slotId === s.slotSelecionado)
        const alvo =
          selecionado?.imagemId ? selecionado : (atual.slots.find((x) => !x.imagemId) ?? selecionado)
        if (!alvo) return null

        const slots = atual.slots.map((slot) =>
          slot.slotId === alvo.slotId
            ? { slotId: alvo.slotId, imagemId, escala: 1, offsetX: 0, offsetY: 0 }
            : slot,
        )
        const proximoVazio = slots.find((x) => !x.imagemId)

        return {
          laminas: s.laminas.map((l) => (l.id === atual.id ? { ...l, slots } : l)),
          slotSelecionado: proximoVazio?.slotId ?? alvo.slotId,
        }
      }),

    trocarSlots: (a, b) =>
      editar((s) =>
        naLaminaAtiva(s, (l) => {
          const sa = l.slots.find((x) => x.slotId === a)
          const sb = l.slots.find((x) => x.slotId === b)
          if (!sa || !sb) return null
          return {
            slots: l.slots.map((slot) => {
              if (slot.slotId === a) return { ...sb, slotId: a }
              if (slot.slotId === b) return { ...sa, slotId: b }
              return slot
            }),
          }
        }),
      ),

    limparSlot: (slotId) =>
      editar((s) =>
        naLaminaAtiva(s, (l) => ({
          slots: l.slots.map((slot) =>
            slot.slotId === slotId ? { slotId, escala: 1, offsetX: 0, offsetY: 0 } : slot,
          ),
        })),
      ),

    selecionarSlot: (slotSelecionado) => set({ slotSelecionado }),

    ajustarSlot: (slotId, patch) =>
      editar(
        (s) =>
          naLaminaAtiva(s, (l) => ({
            slots: l.slots.map((slot) => {
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
          })),
        `ajuste:${slotId}`,
      ),

    redefinirSlot: (slotId) =>
      editar((s) =>
        naLaminaAtiva(s, (l) => ({
          slots: l.slots.map((slot) =>
            slot.slotId === slotId ? { ...slot, escala: 1, offsetX: 0, offsetY: 0 } : slot,
          ),
        })),
      ),

    /**
     * Preenche a lâmina atual com fotos que não estão em nenhuma outra lâmina.
     * É o que permite distribuir um álbum inteiro: adiciona lâmina, preenche,
     * repete — sem repetir foto.
     */
    preencherAutomaticamente: () =>
      editar((s) => {
        const usadas = new Set(s.laminas.flatMap((l) => l.slots.map((x) => x.imagemId)))
        const disponiveis = s.imagens.map((i) => i.id).filter((id) => !usadas.has(id))
        if (disponiveis.length === 0) return null

        let cursor = 0
        return naLaminaAtiva(s, (l) =>
          l.slots.every((x) => x.imagemId)
            ? null
            : {
                slots: l.slots.map((slot) => {
                  if (slot.imagemId) return slot
                  const id = disponiveis[cursor++]
                  return id
                    ? { slotId: slot.slotId, imagemId: id, escala: 1, offsetX: 0, offsetY: 0 }
                    : slot
                }),
              },
        )
      }),

    /** Tira as fotos de uma lâmina sem mexer no layout. Sem `id`, a ativa. */
    esvaziarLamina: (id) =>
      editar((s) => {
        const alvo = s.laminas.find((l) => l.id === (id ?? s.laminaAtivaId))
        if (!alvo || alvo.slots.every((x) => !x.imagemId)) return null
        return {
          laminas: s.laminas.map((l) =>
            l.id === alvo.id
              ? {
                  ...l,
                  slots: l.slots.map((x) => ({
                    slotId: x.slotId,
                    escala: 1,
                    offsetX: 0,
                    offsetY: 0,
                  })),
                }
              : l,
          ),
        }
      }),

    alternarPermitirReduzir: () =>
      editar((s) => {
        const permitir = !s.permitirReduzir
        return {
          permitirReduzir: permitir,
          laminas: permitir
            ? s.laminas
            : s.laminas.map((l) => ({
                ...l,
                slots: l.slots.map((x) => ({ ...x, escala: Math.max(1, x.escala) })),
              })),
        }
      }),
  }
})
