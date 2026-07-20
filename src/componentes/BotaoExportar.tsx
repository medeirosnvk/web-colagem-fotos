import { useEffect, useRef, useState } from 'react'
import { AlertCircle, Check, Download, Loader2 } from 'lucide-react'
import { useColagemStore } from '../store/useColagemStore'
import { useExportacaoStore } from '../store/useExportacaoStore'
import { SeletorEscopo, SeletorTipoArquivo } from './SeletorTipoArquivo'

function formatarBytes(bytes: number) {
  return bytes > 1_048_576
    ? `${(bytes / 1_048_576).toFixed(1)} MB`
    : `${Math.round(bytes / 1024)} KB`
}

/**
 * Exportação inteira: seletor de formato e botão, sempre no topo. Como não há
 * mais aba de exportação, o retorno (arquivo gerado, erro) aparece aqui.
 */
export function BotaoExportar() {
  const exportar = useExportacaoStore((s) => s.exportar)
  const ocupado = useExportacaoStore((s) => s.ocupado)
  const tipo = useExportacaoStore((s) => s.tipo)
  const escopo = useExportacaoStore((s) => s.escopo)
  const erro = useExportacaoStore((s) => s.erro)
  const gerados = useExportacaoStore((s) => s.gerados)
  const laminas = useColagemStore((s) => s.laminas)
  const laminaAtivaId = useColagemStore((s) => s.laminaAtivaId)

  const alvo = escopo === 'todas' ? laminas : laminas.filter((l) => l.id === laminaAtivaId)
  const temFoto = alvo.some((l) => l.slots.some((x) => x.imagemId))
  const vazios = alvo.reduce((n, l) => n + l.slots.filter((x) => !x.imagemId).length, 0)

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

  const titulo = !temFoto
    ? 'Ponha ao menos uma foto na colagem'
    : [
        `Baixar ${alvo.length > 1 ? `${alvo.length} arquivos` : '1 arquivo'} em ${tipo.toUpperCase()}, na resolução exata do formato`,
        vazios > 0 &&
          `${vazios} ${vazios === 1 ? 'slot vazio sai' : 'slots vazios saem'} com a cor de fundo`,
        gerados.length > 0 &&
          `Gerado: ${gerados.map((g) => `${g.nome} · ${formatarBytes(g.bytes)}`).join('\n')}`,
      ]
        .filter(Boolean)
        .join('\n')

  return (
    <div className="flex items-center gap-2">
      {erro && (
        <span
          title={erro}
          className="flex items-center gap-1.5 text-xs text-red-400"
        >
          <AlertCircle size={13} /> falha ao exportar
        </span>
      )}

      <SeletorEscopo />
      <SeletorTipoArquivo />

      <button
        type="button"
        onClick={aoClicar}
        disabled={ocupado || !temFoto}
        title={titulo}
        className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500 disabled:bg-elevado disabled:text-suave"
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
