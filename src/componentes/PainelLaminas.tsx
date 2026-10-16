import type { ReactNode } from 'react'
import { Copy, Eraser, Layers, Plus, Trash2 } from 'lucide-react'
import { laminaAtiva, useColagemStore } from '../store/useColagemStore'
import { formatoPorId } from '../data/formatos'
import { layoutPorId } from '../data/layouts'
import { quadrosDe } from '../lib/cover'
import { TelaColagem } from './editor/TelaColagem'
import type { Lamina } from '../tipos'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

/** Altura das miniaturas: todas iguais, para a faixa ler como o carrossel deslizando. */
const ALTURA_MINIATURA = 96
/** Largura mínima de uma lâmina — abaixo disso as três ações não cabem. */
const LARGURA_MIN = 76

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

function Miniatura({
  lamina,
  numero,
  primeiroPost,
}: {
  lamina: Lamina
  numero: number
  /** Posição do primeiro post desta lâmina no carrossel (1-based). */
  primeiroPost: number
}) {
  const ativa = useColagemStore((s) => s.laminaAtivaId === lamina.id)
  const total = useColagemStore((s) => s.laminas.length)
  const selecionar = useColagemStore((s) => s.selecionarLamina)
  const duplicar = useColagemStore((s) => s.duplicarLamina)
  const remover = useColagemStore((s) => s.removerLamina)
  const esvaziar = useColagemStore((s) => s.esvaziarLamina)
  const formato = formatoPorId(useColagemStore((s) => s.formatoId))

  const layout = layoutPorId(lamina.layoutId)
  const preenchidos = lamina.slots.filter((s) => s.imagemId).length
  const quadros = layout ? quadrosDe(layout) : 1
  const largura = formato ? (ALTURA_MINIATURA * formato.largura * quadros) / formato.altura : 72
  const posts =
    quadros > 1 ? `posts ${primeiroPost}–${primeiroPost + quadros - 1}` : `post ${primeiroPost}`

  return (
    <div className="shrink-0" style={{ width: Math.max(LARGURA_MIN, largura + 14) }}>
      <button
        type="button"
        onClick={() => selecionar(lamina.id)}
        title={`Lâmina ${numero} · ${posts} · ${layout?.nome ?? ''} · ${preenchidos} de ${lamina.slots.length} slots`}
        aria-current={ativa ? 'true' : undefined}
        className={cn(
          'block w-full cursor-pointer rounded-lg border bg-card p-1.5 shadow-xs transition-colors hover:bg-accent',
          ativa && 'border-primary bg-primary/5 ring-1 ring-primary/40 hover:bg-primary/10',
        )}
      >
        <span className="flex items-center justify-center">
          <TelaColagem
            larguraMax={largura}
            alturaMax={ALTURA_MINIATURA}
            interativo={false}
            mostrarZonaSegura={false}
            rotularPosts={false}
            lamina={lamina}
          />
        </span>
        <span className="mt-1 flex items-center justify-between gap-1 px-0.5 text-[10px] text-muted-foreground">
          <span className={cn('truncate', ativa && 'font-semibold text-primary')}>
            {quadros > 1 ? `${primeiroPost}–${primeiroPost + quadros - 1}` : primeiroPost}
          </span>
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
 * Lâminas lado a lado, na ordem do carrossel — como ele aparece ao deslizar.
 * Uma lâmina contínua ocupa a largura de todos os seus posts.
 */
export function ConteudoLaminas() {
  const laminas = useColagemStore((s) => s.laminas)
  const adicionar = useColagemStore((s) => s.adicionarLamina)
  const ativa = useColagemStore(laminaAtiva)
  const formato = formatoPorId(useColagemStore((s) => s.formatoId))

  const titulo = `Nova lâmina em ${formato?.proporcao ?? ''}, com o layout da atual (${
    layoutPorId(ativa?.layoutId ?? null)?.nome ?? ''
  })`

  let post = 1
  const inicios = laminas.map((l) => {
    const inicio = post
    post += quadrosDe(layoutPorId(l.layoutId) ?? {})
    return inicio
  })

  return (
    <div className="flex min-h-0 items-start gap-2 overflow-x-auto p-3">
      {laminas.map((lamina, i) => (
        <Miniatura key={lamina.id} lamina={lamina} numero={i + 1} primeiroPost={inicios[i]} />
      ))}

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={adicionar}
            className="w-20 shrink-0 flex-col border-dashed text-xs text-muted-foreground"
            style={{ height: ALTURA_MINIATURA + 30 }}
          >
            <Plus /> Lâmina
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">{titulo}</TooltipContent>
      </Tooltip>
    </div>
  )
}

/**
 * Faixa de lâminas do layout amplo, embaixo da colagem. Cada uma é uma colagem
 * com layout e preenchimento próprios; formato, cor de fundo e bandeja de fotos
 * são compartilhados.
 */
export function FaixaLaminas() {
  const laminas = useColagemStore((s) => s.laminas)
  const posts = useColagemStore((s) =>
    s.laminas.reduce((n, l) => n + quadrosDe(layoutPorId(l.layoutId) ?? {}), 0),
  )

  return (
    <section className="shrink-0 border-t bg-sidebar">
      <header className="flex items-center gap-1.5 px-3 pt-2">
        <Layers className="size-3.5 text-muted-foreground" />
        <h2 className="text-xs font-medium">Lâminas</h2>
        <Badge variant="secondary" className="h-4 px-1.5 text-[10px] tabular-nums">
          {laminas.length}
        </Badge>
        {posts !== laminas.length && (
          <span className="text-[11px] text-muted-foreground">· {posts} posts no carrossel</span>
        )}
      </header>

      <ConteudoLaminas />
    </section>
  )
}
