import { Copy, Layers, Plus, Trash2 } from 'lucide-react'
import { laminaAtiva, useColagemStore } from '../store/useColagemStore'
import { formatoPorId } from '../data/formatos'
import { layoutPorId } from '../data/layouts'
import { TelaColagem } from './editor/TelaColagem'
import { FAIXA } from './ui/faixa'
import type { Lamina } from '../tipos'

const LARGURA_MINIATURA = 84
const ALTURA_MAX_MINIATURA = 118

function Miniatura({ lamina, numero }: { lamina: Lamina; numero: number }) {
  const ativa = useColagemStore((s) => s.laminaAtivaId === lamina.id)
  const total = useColagemStore((s) => s.laminas.length)
  const selecionar = useColagemStore((s) => s.selecionarLamina)
  const duplicar = useColagemStore((s) => s.duplicarLamina)
  const remover = useColagemStore((s) => s.removerLamina)

  const layout = layoutPorId(lamina.layoutId)
  const preenchidos = lamina.slots.filter((s) => s.imagemId).length

  return (
    <div className="group relative">
      <button
        type="button"
        onClick={() => selecionar(lamina.id)}
        title={`${layout?.nome ?? 'Lâmina'} · ${preenchidos} de ${lamina.slots.length} slots`}
        aria-current={ativa ? 'true' : undefined}
        className={`block w-full rounded-lg border p-1.5 transition-colors ${
          ativa
            ? 'border-violet-500 bg-violet-500/10'
            : 'border-neutral-800 bg-neutral-900 hover:border-neutral-600'
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
        <span className="mt-1 flex items-center justify-between px-0.5 text-[10px] text-neutral-500">
          <span className={ativa ? 'font-semibold text-violet-300' : ''}>{numero}</span>
          <span className="tabular-nums">
            {preenchidos}/{lamina.slots.length}
          </span>
        </span>
      </button>

      <div className="absolute top-2 right-2 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={() => duplicar(lamina.id)}
          title="Duplicar lâmina"
          className="rounded bg-black/75 p-1 text-neutral-300 hover:text-violet-300"
        >
          <Copy size={11} />
        </button>
        {total > 1 && (
          <button
            type="button"
            onClick={() => remover(lamina.id)}
            title="Remover lâmina"
            className="rounded bg-black/75 p-1 text-neutral-300 hover:text-red-400"
          >
            <Trash2 size={11} />
          </button>
        )}
      </div>
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
  const adicionar = useColagemStore((s) => s.adicionarLamina)
  const ativa = useColagemStore(laminaAtiva)
  const formato = formatoPorId(useColagemStore((s) => s.formatoId))

  return (
    <aside className="flex w-28 shrink-0 flex-col border-r border-neutral-800 bg-neutral-950">
      <header className={`${FAIXA} gap-1.5 px-3`}>
        <Layers size={14} className="text-violet-400" />
        <h2 className="text-xs font-semibold text-neutral-200">Lâminas</h2>
        <span className="rounded-full bg-neutral-800 px-1.5 text-[10px] text-neutral-400">
          {laminas.length}
        </span>
      </header>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-2">
        {laminas.map((lamina, i) => (
          <Miniatura key={lamina.id} lamina={lamina} numero={i + 1} />
        ))}

        <button
          type="button"
          onClick={adicionar}
          title={`Nova lâmina em ${formato?.proporcao ?? ''}, com o layout da atual (${
            layoutPorId(ativa?.layoutId ?? null)?.nome ?? ''
          })`}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-neutral-700 py-3 text-[11px] text-neutral-400 transition-colors hover:border-violet-500 hover:text-violet-200"
        >
          <Plus size={13} /> Lâmina
        </button>
      </div>
    </aside>
  )
}
