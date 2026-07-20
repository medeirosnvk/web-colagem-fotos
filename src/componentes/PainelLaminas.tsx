import type { ReactNode } from 'react'
import { Copy, Eraser, Layers, Plus, Trash2 } from 'lucide-react'
import { laminaAtiva, useColagemStore } from '../store/useColagemStore'
import { formatoPorId } from '../data/formatos'
import { layoutPorId } from '../data/layouts'
import { TelaColagem } from './editor/TelaColagem'
import { FAIXA } from './ui/faixa'
import type { Lamina } from '../tipos'

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
    <button
      type="button"
      title={titulo ?? rotulo}
      aria-label={rotulo}
      onClick={onClick}
      disabled={desabilitado}
      className={`flex flex-1 items-center justify-center rounded py-1 text-suave transition-colors hover:bg-elevado disabled:pointer-events-none disabled:opacity-30 ${
        perigo ? 'hover:text-red-400' : 'hover:text-realce-forte'
      }`}
    >
      {children}
    </button>
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
        className={`block w-full rounded-lg border p-1.5 transition-colors ${
          ativa
            ? 'border-violet-500 bg-violet-500/10'
            : 'border-borda bg-superficie hover:border-borda-forte'
        }`}
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
        <span className="mt-1 flex items-center justify-between px-0.5 text-[10px] text-suave">
          <span className={ativa ? 'font-semibold text-realce-forte' : ''}>{numero}</span>
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
          <Eraser size={12} />
        </Acao>
        <Acao rotulo={`Duplicar lâmina ${numero}`} onClick={() => duplicar(lamina.id)}>
          <Copy size={12} />
        </Acao>
        <Acao
          rotulo={`Remover lâmina ${numero}`}
          titulo={total > 1 ? undefined : 'A última lâmina não pode ser removida'}
          onClick={() => remover(lamina.id)}
          desabilitado={total <= 1}
          perigo
        >
          <Trash2 size={12} />
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

      <button
        type="button"
        onClick={adicionar}
        title={titulo}
        className={`flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-borda-forte text-[11px] text-suave transition-colors hover:border-violet-500 hover:text-realce-forte ${
          horizontal ? 'w-24 shrink-0 flex-col' : 'w-full py-3'
        }`}
      >
        <Plus size={13} /> Lâmina
      </button>
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
    <aside className="flex w-32 shrink-0 flex-col border-r border-borda bg-painel">
      <header className={`${FAIXA} gap-1.5 px-3`}>
        <Layers size={14} className="text-realce" />
        <h2 className="text-xs font-semibold text-texto">Lâminas</h2>
        <span className="rounded-full bg-elevado px-1.5 text-[10px] text-suave">
          {laminas.length}
        </span>
      </header>

      <ConteudoLaminas />
    </aside>
  )
}
