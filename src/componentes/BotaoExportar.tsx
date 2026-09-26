import { useEffect, useRef, useState } from 'react'
import { AlertCircle, Check, Download, Loader2 } from 'lucide-react'
import { useColagemStore } from '../store/useColagemStore'
import { useExportacaoStore } from '../store/useExportacaoStore'
import { SeletorEscopo, SeletorTipoArquivo } from './SeletorTipoArquivo'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

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
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="flex items-center gap-1.5 text-xs text-destructive">
              <AlertCircle className="size-3.5" /> falha ao exportar
            </span>
          </TooltipTrigger>
          <TooltipContent>{erro}</TooltipContent>
        </Tooltip>
      )}

      <SeletorEscopo />
      <SeletorTipoArquivo />

      <Tooltip>
        <TooltipTrigger asChild>
          {/* span: botão desabilitado não dispara eventos, e a dica explica por quê */}
          <span className="inline-flex">
            <Button size="sm" onClick={aoClicar} disabled={ocupado || !temFoto}>
              {ocupado ? <Loader2 className="animate-spin" /> : concluido ? <Check /> : <Download />}
              {/* em tela estreita o cabeçalho não comporta o rótulo: fica só o ícone */}
              <span className="hidden sm:inline">
                {ocupado ? 'Exportando…' : concluido ? 'Baixado!' : 'Exportar'}
              </span>
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="end" className="max-w-72 whitespace-pre-line">
          {titulo}
        </TooltipContent>
      </Tooltip>
    </div>
  )
}
