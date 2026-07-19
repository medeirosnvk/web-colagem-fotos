import { create } from 'zustand'
import { useColagemStore } from './useColagemStore'
import { formatoPorId } from '../data/formatos'
import { layoutPorId } from '../data/layouts'
import { layoutEfetivo } from '../lib/layoutEfetivo'
import { exportarColagem, type TipoArquivo } from '../lib/exportarColagem'

/**
 * Estado da exportação fora do store da colagem: não é documento, não entra no
 * desfazer. Fica num store próprio porque dois lugares disparam a mesma
 * exportação — o botão do topo e a aba Exportar — e os dois precisam ver o
 * mesmo "exportando…" e o mesmo resultado.
 */
interface EstadoExportacao {
  /** Tipo escolhido no seletor. PNG e JPG são baixados um de cada vez. */
  tipo: TipoArquivo
  ocupado: boolean
  erro: string | null
  gerados: { nome: string; bytes: number }[]
  definirTipo: (tipo: TipoArquivo) => void
  exportar: () => Promise<void>
}

export const useExportacaoStore = create<EstadoExportacao>((set, get) => ({
  tipo: 'png',
  ocupado: false,
  erro: null,
  gerados: [],

  definirTipo: (tipo) => set({ tipo }),

  exportar: async () => {
    const tipos: TipoArquivo[] = [get().tipo]
    const s = useColagemStore.getState()
    const formato = formatoPorId(s.formatoId)
    const layoutBase = layoutPorId(s.layoutId)
    if (!formato || !layoutBase) return

    set({ ocupado: true, erro: null })
    try {
      const resultado = await exportarColagem(
        {
          formato,
          layout: layoutEfetivo(layoutBase, s.gap, s.margem),
          corFundo: s.corFundo,
          slots: s.slots,
          imagens: s.imagens,
        },
        tipos,
      )
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
