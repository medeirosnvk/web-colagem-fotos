import { create } from 'zustand'
import type { CorFundo, Destino, EstadoSlot, Imagem, Plataforma } from '../tipos'
import { formatoPorId, formatosDe } from '../data/formatos'
import { layoutPorId, layoutsDe } from '../data/layouts'
import { clamp } from '../lib/cover'

export const TOTAL_ETAPAS = 6

export type Etapa = 1 | 2 | 3 | 4 | 5 | 6

interface EstadoColagem {
  etapa: Etapa
  imagens: Imagem[]
  plataforma: Plataforma | null
  destino: Destino | null
  corFundo: CorFundo
  formatoId: string | null
  layoutId: string | null
  slots: EstadoSlot[]
  slotSelecionado: string | null
  permitirReduzir: boolean
  gap: number
  margem: number

  irPara: (etapa: Etapa) => void
  proxima: () => void
  anterior: () => void

  adicionarImagens: (imagens: Imagem[]) => void
  removerImagem: (id: string) => void
  limparTudo: () => void

  definirPlataformaDestino: (plataforma: Plataforma, destino: Destino) => void
  definirCorFundo: (cor: CorFundo) => void
  definirFormato: (formatoId: string) => void
  definirLayout: (layoutId: string) => void
  definirEspacamento: (gap: number, margem: number) => void

  atribuirImagem: (slotId: string, imagemId: string) => void
  trocarSlots: (a: string, b: string) => void
  limparSlot: (slotId: string) => void
  selecionarSlot: (slotId: string | null) => void
  ajustarSlot: (slotId: string, patch: Partial<Omit<EstadoSlot, 'slotId'>>) => void
  redefinirSlot: (slotId: string) => void
  preencherAutomaticamente: () => void
  alternarPermitirReduzir: () => void
}

/**
 * Última etapa acessível, dado o estado atual. Como seletor derivado (e não
 * como método), qualquer componente que a use re-renderiza quando o
 * pré-requisito muda.
 */
export function maxEtapaLiberada(s: {
  imagens: unknown[]
  plataforma: unknown
  destino: unknown
  formatoId: unknown
  layoutId: unknown
  slots: EstadoSlot[]
}): Etapa {
  if (s.imagens.length === 0) return 1
  if (!s.plataforma || !s.destino) return 2
  if (!s.formatoId || !s.layoutId) return 4
  if (!s.slots.some((x) => x.imagemId)) return 5
  return 6
}

function slotsVazios(layoutId: string | null): EstadoSlot[] {
  const layout = layoutPorId(layoutId)
  if (!layout) return []
  return layout.slots.map((s) => ({ slotId: s.id, escala: 1, offsetX: 0, offsetY: 0 }))
}

export const useColagemStore = create<EstadoColagem>((set, get) => ({
  etapa: 1,
  imagens: [],
  plataforma: null,
  destino: null,
  corFundo: '#FFFFFF',
  formatoId: null,
  layoutId: null,
  slots: [],
  slotSelecionado: null,
  permitirReduzir: false,
  gap: 12,
  margem: 0,

  irPara: (etapa) => {
    if (etapa <= maxEtapaLiberada(get())) set({ etapa })
  },
  proxima: () => {
    const proxima = Math.min(TOTAL_ETAPAS, get().etapa + 1) as Etapa
    if (proxima <= maxEtapaLiberada(get())) set({ etapa: proxima })
  },
  anterior: () => set({ etapa: Math.max(1, get().etapa - 1) as Etapa }),

  adicionarImagens: (novas) => set((s) => ({ imagens: [...s.imagens, ...novas] })),

  removerImagem: (id) =>
    set((s) => {
      const alvo = s.imagens.find((i) => i.id === id)
      if (alvo) URL.revokeObjectURL(alvo.url)
      return {
        imagens: s.imagens.filter((i) => i.id !== id),
        slots: s.slots.map((slot) =>
          slot.imagemId === id
            ? { slotId: slot.slotId, escala: 1, offsetX: 0, offsetY: 0 }
            : slot,
        ),
      }
    }),

  limparTudo: () =>
    set((s) => {
      s.imagens.forEach((i) => URL.revokeObjectURL(i.url))
      return {
        etapa: 1,
        imagens: [],
        plataforma: null,
        destino: null,
        formatoId: null,
        layoutId: null,
        slots: [],
        slotSelecionado: null,
      }
    }),

  definirPlataformaDestino: (plataforma, destino) => {
    const atual = get()
    const opcoes = formatosDe(plataforma, destino)
    const aindaVale = opcoes.some((f) => f.id === atual.formatoId)
    const escolhido = aindaVale
      ? atual.formatoId
      : (opcoes.find((f) => f.recomendado) ?? opcoes[0])?.id ?? null

    const formato = formatoPorId(escolhido)
    const layoutValido =
      formato && layoutsDe(formato.proporcao).some((l) => l.id === atual.layoutId)

    set({
      plataforma,
      destino,
      formatoId: escolhido,
      layoutId: layoutValido ? atual.layoutId : null,
      slots: layoutValido ? atual.slots : [],
    })
  },

  definirCorFundo: (corFundo) => set({ corFundo }),

  definirFormato: (formatoId) => {
    const atual = get()
    const formato = formatoPorId(formatoId)
    const layoutValido =
      formato && layoutsDe(formato.proporcao).some((l) => l.id === atual.layoutId)
    set({
      formatoId,
      layoutId: layoutValido ? atual.layoutId : null,
      slots: layoutValido ? atual.slots : [],
    })
  },

  definirLayout: (layoutId) => {
    const anterior = get().slots
    const novos = slotsVazios(layoutId)
    const layout = layoutPorId(layoutId)
    // Preserva as imagens já posicionadas, na ordem, ao trocar de layout.
    const usadas = anterior.filter((s) => s.imagemId)
    novos.forEach((s, i) => {
      const antiga = usadas[i]
      if (antiga) {
        s.imagemId = antiga.imagemId
        s.escala = antiga.escala
        s.offsetX = antiga.offsetX
        s.offsetY = antiga.offsetY
      }
    })
    // Cada layout traz o próprio espaçamento: grades pedem gap, layouts livres
    // já embutem o respiro nas coordenadas.
    set({
      layoutId,
      slots: novos,
      slotSelecionado: novos[0]?.slotId ?? null,
      gap: layout?.gap ?? 12,
      margem: layout?.margem ?? 0,
    })
  },

  definirEspacamento: (gap, margem) => set({ gap, margem }),

  atribuirImagem: (slotId, imagemId) =>
    set((s) => ({
      slots: s.slots.map((slot) =>
        slot.slotId === slotId
          ? { slotId, imagemId, escala: 1, offsetX: 0, offsetY: 0 }
          : slot,
      ),
      slotSelecionado: slotId,
    })),

  trocarSlots: (a, b) =>
    set((s) => {
      const sa = s.slots.find((x) => x.slotId === a)
      const sb = s.slots.find((x) => x.slotId === b)
      if (!sa || !sb) return s
      return {
        slots: s.slots.map((slot) => {
          if (slot.slotId === a) return { ...sb, slotId: a }
          if (slot.slotId === b) return { ...sa, slotId: b }
          return slot
        }),
      }
    }),

  limparSlot: (slotId) =>
    set((s) => ({
      slots: s.slots.map((slot) =>
        slot.slotId === slotId
          ? { slotId, escala: 1, offsetX: 0, offsetY: 0 }
          : slot,
      ),
    })),

  selecionarSlot: (slotSelecionado) => set({ slotSelecionado }),

  ajustarSlot: (slotId, patch) =>
    set((s) => ({
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
    })),

  redefinirSlot: (slotId) =>
    set((s) => ({
      slots: s.slots.map((slot) =>
        slot.slotId === slotId ? { ...slot, escala: 1, offsetX: 0, offsetY: 0 } : slot,
      ),
    })),

  preencherAutomaticamente: () =>
    set((s) => {
      const disponiveis = s.imagens.map((i) => i.id)
      let cursor = 0
      return {
        slots: s.slots.map((slot) => {
          if (slot.imagemId) return slot
          const id = disponiveis[cursor++]
          return id ? { slotId: slot.slotId, imagemId: id, escala: 1, offsetX: 0, offsetY: 0 } : slot
        }),
      }
    }),

  alternarPermitirReduzir: () =>
    set((s) => {
      const permitir = !s.permitirReduzir
      return {
        permitirReduzir: permitir,
        slots: permitir ? s.slots : s.slots.map((x) => ({ ...x, escala: Math.max(1, x.escala) })),
      }
    }),
}))
