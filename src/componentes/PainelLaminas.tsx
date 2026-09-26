import type { ReactNode } from 'react'
import { Copy, Eraser, Layers, Plus, Trash2 } from 'lucide-react'
import { laminaAtiva, useColagemStore } from '../store/useColagemStore'
import { formatoPorId } from '../data/formatos'
import { layoutPorId } from '../data/layouts'
import { TelaColagem } from './editor/TelaColagem'
import { FAIXA } from './ui/faixa'
import type { Lamina } from '../tipos'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

const LARGURA_MINIATURA = 84
const ALTURA_MAX_MINIATURA = 118

/** Ação de uma lâmina: pequena, mas sempre visível — nada escondido no hover. */
function Acao({
  rotulo,
  titulo,
  onClick,
  desabilitado,
  perigo,
  children,
}: {
  /** Nome curto da ação — é o que o leitor de tela anuncia. */
  rotulo: string
  /** Tooltip: pode explicar o efeito, o `rotulo` não deve. */
  titulo?: string
  onClick: () => void
  desabilitado?: boolean
  perigo?: boolean
  children: ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="flex flex-1">
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={rotulo}
            onClick={onClick}
            disabled={desabilitado}
            className={cn(
              'flex-1 text-muted-foreground',
              perigo && 'hover:bg-destructive/10 hover:text-destructive',
            )}
          >
            {children}
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom">{titulo ?? rotulo}</TooltipContent>
    </Tooltip>
  )
}

function Miniatura({ lamina, numero }: { lamina: Lamina; numero: number }) {
  const ativa = useColagemStore((s) => s.laminaAtivaId === lamina.id)
  const total = useColagemStore((s) => s.laminas.length)
  const selecionar = useColagemStore((s) => s.selecionarLamina)
  const duplicar = useColagemStore((s) => s.duplicarLamina)
  const remover = useColagemStore((s) => s.removerLamina)
  const esvaziar = useColagemStore((s) => s.esvaziarLamina)

  const layout = layoutPorId(lamina.layoutId)
  const preenchidos = lamina.slots.filter((s) => s.imagemId).length

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => selecionar(lamina.id)}
        title={`${layout?.nome ?? 'Lâmina'} · ${preenchidos} de ${lamina.slots.length} slots`}
        aria-current={ativa ? 'true' : undefined}
        className={cn(
          'block w-full cursor-pointer rounded-lg border bg-card p-1.5 shadow-xs transition-colors hover:bg-accent',
          ativa && 'border-primary bg-primary/5 ring-1 ring-primary/40 hover:bg-primary/10',
        )}
      >
        <span className="flex items-center justify-center">
          <TelaColagem
            larguraMax={LARGURA_MINIATURA}
            alturaMax={ALTURA_MAX_MINIATURA}
            interativo={false}
            mostrarZonaSegura={false}
            lamina={lamina}
          />
        </span>
        <span className="mt-1 flex items-center justify-between px-0.5 text-[10px] text-muted-foreground">
          <span className={cn(ativa && 'font-semibold text-primary')}>{numero}</span>
          <span className="tabular-nums">
            {preenchidos}/{lamina.slots.length}
          </span>
        </span>
      </button>

      <div className="mt-0.5 flex gap-0.5">
        <Acao
          rotulo={`Esvaziar lâmina ${numero}`}
          titulo={`Esvaziar lâmina ${numero} — tira as fotos, mantém a montagem`}
          onClick={() => esvaziar(lamina.id)}
          desabilitado={preenchidos === 0}
        >
          <Eraser />
        </Acao>
        <Acao rotulo={`Duplicar lâmina ${numero}`} onClick={() => duplicar(lamina.id)}>
          <Copy />
        </Acao>
        <Acao
          rotulo={`Remover lâmina ${numero}`}
          titulo={total > 1 ? undefined : 'A última lâmina não pode ser removida'}
          onClick={() => remover(lamina.id)}
          desabilitado={total <= 1}
          perigo
        >
          <Trash2 />
        </Acao>
      </div>
    </div>
  )
}

/**
 * Lista de lâminas. Em coluna no layout amplo; em fila horizontal rolável no
 * compacto, onde altura é o recurso escasso.
 */
export function ConteudoLaminas({ horizontal = false }: { horizontal?: boolean }) {
  const laminas = useColagemStore((s) => s.laminas)
  const adicionar = useColagemStore((s) => s.adicionarLamina)
  const ativa = useColagemStore(laminaAtiva)
  const formato = formatoPorId(useColagemStore((s) => s.formatoId))

  const titulo = `Nova lâmina em ${formato?.proporcao ?? ''}, com o layout da atual (${
    layoutPorId(ativa?.layoutId ?? null)?.nome ?? ''
  })`

  return (
    <div
      className={
        horizontal
          ? 'flex min-h-0 gap-2 overflow-x-auto p-3'
          : 'min-h-0 flex-1 space-y-2 overflow-y-auto p-2'
      }
    >
      {laminas.map((lamina, i) => (
        <div key={lamina.id} className={horizontal ? 'w-24 shrink-0' : ''}>
          <Miniatura lamina={lamina} numero={i + 1} />
        </div>
      ))}

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={adicionar}
            className={cn(
              'border-dashed text-xs text-muted-foreground',
              horizontal ? 'h-auto w-24 shrink-0 flex-col' : 'w-full',
            )}
          >
            <Plus /> Lâmina
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">{titulo}</TooltipContent>
      </Tooltip>
    </div>
  )
}

/**
 * Pilha de lâminas do documento. Cada uma é uma colagem com layout e
 * preenchimento próprios; formato, cor de fundo e bandeja de fotos são
 * compartilhados.
 */
export function PainelLaminas() {
  const laminas = useColagemStore((s) => s.laminas)

  return (
    <aside className="flex w-32 shrink-0 flex-col border-r bg-sidebar">
      <header className={`${FAIXA} gap-1.5 px-3`}>
        <Layers className="size-3.5 text-muted-foreground" />
        <h2 className="text-xs font-medium">Lâminas</h2>
        <Badge variant="secondary" className="ml-auto h-4 px-1.5 text-[10px] tabular-nums">
          {laminas.length}
        </Badge>
      </header>

      <ConteudoLaminas />
    </aside>
  )
}
