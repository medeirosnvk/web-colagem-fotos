import { Info, MousePointer2 } from 'lucide-react'
import { laminaAtiva, useColagemStore } from '../store/useColagemStore'
import { formatoPorId } from '../data/formatos'
import { layoutPorId } from '../data/layouts'
import { useMedidas } from '../lib/useMedidas'
import { TelaColagem } from './editor/TelaColagem'

/** Respiro entre a colagem e as bordas da área central. */
const FOLGA = 48

export function AreaColagem() {
  const formato = formatoPorId(useColagemStore((s) => s.formatoId))
  const lamina = useColagemStore(laminaAtiva)
  const indice = useColagemStore((s) => s.laminas.findIndex((l) => l.id === s.laminaAtivaId))
  const totalLaminas = useColagemStore((s) => s.laminas.length)
  const temImagens = useColagemStore((s) => s.imagens.length > 0)
  const destino = useColagemStore((s) => s.destino)

  const { ref, largura, altura } = useMedidas<HTMLDivElement>()

  const layout = layoutPorId(lamina?.layoutId ?? null)
  if (!formato || !layout || !lamina) return null

  const slots = lamina.slots
  const preenchidos = slots.filter((s) => s.imagemId).length
  const temZonaSegura = destino === 'stories' || destino === 'reels'

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="flex items-center justify-between gap-4 border-b border-neutral-800 px-6 py-2.5">
        <p className="truncate text-xs text-neutral-400">
          {totalLaminas > 1 && (
            <>
              <span className="font-medium text-violet-300">
                Lâmina {indice + 1}/{totalLaminas}
              </span>
              <span className="text-neutral-600"> · </span>
            </>
          )}
          <span className="font-medium text-neutral-200">{layout.nome}</span>
          <span className="text-neutral-600"> · </span>
          {formato.largura}×{formato.altura} px
          <span className="text-neutral-600"> · </span>
          {preenchidos} de {slots.length} slots
        </p>
        <p className="hidden shrink-0 items-center gap-1.5 text-xs text-neutral-500 xl:flex">
          <MousePointer2 size={12} /> arraste para reposicionar · role para dar zoom
        </p>
      </div>

      {temZonaSegura && (
        <p className="border-b border-neutral-800 bg-cyan-500/5 px-6 py-1.5 text-[11px] text-cyan-200/90">
          <Info size={11} className="mr-1 inline" />
          As faixas pontilhadas <strong>não são cortadas</strong> — é onde o
          {destino === 'reels' ? ' Reels' : ' Stories'} desenha perfil, legenda e botões por cima.
        </p>
      )}

      <div ref={ref} className="relative min-h-0 flex-1 overflow-hidden">
        {largura > 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <TelaColagem
              larguraMax={Math.max(120, largura - FOLGA)}
              alturaMax={Math.max(120, altura - FOLGA)}
            />
          </div>
        )}

        {!temImagens && (
          <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
            <p className="rounded-full border border-neutral-700 bg-neutral-900/90 px-4 py-1.5 text-xs text-neutral-300 shadow-lg">
              Carregue fotos na barra da esquerda e arraste para os slots.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
