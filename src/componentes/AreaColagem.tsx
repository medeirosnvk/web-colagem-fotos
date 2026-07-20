import { Info, MousePointer2 } from 'lucide-react'
import { laminaAtiva, useColagemStore } from '../store/useColagemStore'
import { formatoPorId } from '../data/formatos'
import { layoutPorId } from '../data/layouts'
import { useMedidas } from '../lib/useMedidas'
import { TelaColagem } from './editor/TelaColagem'
import { FAIXA } from './ui/faixa'

/** Respiro entre a colagem e as bordas da área central. */
const FOLGA = 48

export function AreaColagem() {
  const formato = formatoPorId(useColagemStore((s) => s.formatoId))
  const lamina = useColagemStore(laminaAtiva)
  const indice = useColagemStore((s) => s.laminas.findIndex((l) => l.id === s.laminaAtivaId))
  const totalLaminas = useColagemStore((s) => s.laminas.length)
  const temImagens = useColagemStore((s) => s.imagens.length > 0)
  const destino = useColagemStore((s) => s.destino)
  const selecionarSlot = useColagemStore((s) => s.selecionarSlot)

  const { ref, largura, altura } = useMedidas<HTMLDivElement>()

  const layout = layoutPorId(lamina?.layoutId ?? null)
  if (!formato || !layout || !lamina) return null

  const slots = lamina.slots
  const preenchidos = slots.filter((s) => s.imagemId).length
  const temZonaSegura = destino === 'stories' || destino === 'reels'

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className={`${FAIXA} justify-between gap-4 px-6`}>
        <p className="truncate text-xs text-suave">
          {totalLaminas > 1 && (
            <>
              <span className="font-medium text-realce-forte">
                Lâmina {indice + 1}/{totalLaminas}
              </span>
              <span className="text-tenue"> · </span>
            </>
          )}
          <span className="font-medium text-texto">{layout.nome}</span>
          <span className="text-tenue"> · </span>
          {formato.largura}×{formato.altura} px
          <span className="text-tenue"> · </span>
          {preenchidos} de {slots.length} slots
        </p>
        <p className="hidden shrink-0 items-center gap-1.5 text-xs text-suave xl:flex">
          <MousePointer2 size={12} /> arraste para trocar de lugar · clique e arraste para
          reposicionar
        </p>
      </div>

      {temZonaSegura && (
        <p className="border-b border-borda bg-cyan-500/10 px-6 py-1.5 text-[11px] text-zona">
          <Info size={11} className="mr-1 inline" />
          As faixas pontilhadas <strong>não são cortadas</strong> — é onde o
          {destino === 'reels' ? ' Reels' : ' Stories'} desenha perfil, legenda e botões por cima.
        </p>
      )}

      {/*
        Fundo da área: clicar aqui desseleciona. As fotos param o pointerdown
        antes de chegar neste ponto; os vãos da colagem e os slots vazios não,
        porque ali é "fora da imagem".
      */}
      <div
        ref={ref}
        onPointerDown={() => selecionarSlot(null)}
        className="relative min-h-0 flex-1 overflow-hidden"
      >
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
            <p className="rounded-full border border-borda-forte bg-superficie/90 px-4 py-1.5 text-xs text-texto shadow-lg">
              Carregue fotos na barra da esquerda e arraste para os slots.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
