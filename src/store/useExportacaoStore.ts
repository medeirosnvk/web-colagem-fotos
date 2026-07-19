import { create } from 'zustand'
import { laminaAtiva, useColagemStore } from './useColagemStore'
import { formatoPorId } from '../data/formatos'
import { layoutPorId } from '../data/layouts'
import { layoutEfetivo } from '../lib/layoutEfetivo'
import { exportarColagens, type ParametrosRender, type TipoArquivo } from '../lib/exportarColagem'

/** O que entra na exportação: só a lâmina em edição ou o documento inteiro. */
export type Escopo = 'atual' | 'todas'

/**
 * Estado da exportação fora do store da colagem: não é documento, não entra no
 * desfazer. Fica num store próprio porque o seletor de formato, o de escopo e
 * o botão são componentes irmãos e precisam ver o mesmo estado.
 */
interface EstadoExportacao {
  tipo: TipoArquivo
  escopo: Escopo
  ocupado: boolean
  erro: string | null
  gerados: { nome: string; bytes: number }[]
  definirTipo: (tipo: TipoArquivo) => void
  definirEscopo: (escopo: Escopo) => void
  exportar: () => Promise<void>
}

export const useExportacaoStore = create<EstadoExportacao>((set, get) => ({
  tipo: 'png',
  escopo: 'atual',
  ocupado: false,
  erro: null,
  gerados: [],

  definirTipo: (tipo) => set({ tipo }),
  definirEscopo: (escopo) => set({ escopo }),

  exportar: async () => {
    const { tipo, escopo } = get()
    const s = useColagemStore.getState()
    const formato = formatoPorId(s.formatoId)
    if (!formato) return

    const alvo = escopo === 'todas' ? s.laminas : [laminaAtiva(s)]
    const itens: ParametrosRender[] = []
    for (const lamina of alvo) {
      const layoutBase = layoutPorId(lamina.layoutId)
      if (!layoutBase) continue
      itens.push({
        formato,
        layout: layoutEfetivo(layoutBase, lamina.gap, lamina.margem),
        corFundo: s.corFundo,
        slots: lamina.slots,
        imagens: s.imagens,
      })
    }
    if (itens.length === 0) return

    set({ ocupado: true, erro: null })
    try {
      const resultado = await exportarColagens(itens, tipo)
      set({ gerados: resultado.map((r) => ({ nome: r.nome, bytes: r.bytes })) })
    } catch (e) {
      set({
        erro: e instanceof Error ? e.message : 'Falha inesperada ao exportar.',
        gerados: [],
      })
    } finally {
      set({ ocupado: false })
    }
  },
}))
