import { useEffect, useRef, useState } from 'react'
import { Check, Download, Loader2 } from 'lucide-react'
import { useColagemStore } from '../store/useColagemStore'
import { useExportacaoStore } from '../store/useExportacaoStore'
import { SeletorTipoArquivo } from './SeletorTipoArquivo'

/**
 * Ação principal do app, sempre à mão no topo: escolhe o formato no seletor e
 * baixa o arquivo na resolução exata do formato da colagem.
 */
export function BotaoExportar() {
  const exportar = useExportacaoStore((s) => s.exportar)
  const ocupado = useExportacaoStore((s) => s.ocupado)
  const tipo = useExportacaoStore((s) => s.tipo)
  const temFoto = useColagemStore((s) => s.slots.some((x) => x.imagemId))

  const [concluido, setConcluido] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), [])

  async function aoClicar() {
    await exportar()
    if (useExportacaoStore.getState().erro) return
    setConcluido(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setConcluido(false), 2500)
  }

  return (
    <div className="flex items-center gap-2">
      <SeletorTipoArquivo />

      <button
        type="button"
        onClick={aoClicar}
        disabled={ocupado || !temFoto}
        title={
          temFoto
            ? `Baixar a colagem em ${tipo.toUpperCase()}, na resolução exata do formato`
            : 'Ponha ao menos uma foto na colagem'
        }
        className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500 disabled:bg-neutral-800 disabled:text-neutral-500"
      >
        {ocupado ? (
          <Loader2 size={15} className="animate-spin" />
        ) : concluido ? (
          <Check size={15} />
        ) : (
          <Download size={15} />
        )}
        {ocupado ? 'Exportando…' : concluido ? 'Baixado!' : 'Exportar'}
      </button>
    </div>
  )
}
