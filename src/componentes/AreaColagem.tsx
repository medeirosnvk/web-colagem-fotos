import { Info, MousePointer2 } from 'lucide-react'
import { laminaAtiva, useColagemStore } from '../store/useColagemStore'
import { formatoPorId } from '../data/formatos'
import { layoutPorId } from '../data/layouts'
import { useMedidas } from '../lib/useMedidas'
import { TelaColagem } from './editor/TelaColagem'
import { FAIXA } from './ui/faixa'
import { Badge } from '@/components/ui/badge'

/** Respiro entre a colagem e as bordas da área central. */
const FOLGA = 48
const FOLGA_ESTREITA = 16

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
  const folga = largura < 560 ? FOLGA_ESTREITA : FOLGA

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-muted/40 dark:bg-background">
      <div className={`${FAIXA} justify-between gap-4 bg-background px-6`}>
        <p className="flex min-w-0 items-center gap-2 truncate text-xs text-muted-foreground">
          {totalLaminas > 1 && (
            <Badge variant="outline" className="shrink-0 border-primary/40 text-primary tabular-nums">
              Lâmina {indice + 1}/{totalLaminas}
            </Badge>
          )}
          <span className="truncate font-medium text-foreground">{layout.nome}</span>
          <span className="tabular-nums">
            {formato.largura}×{formato.altura} px · {preenchidos} de {slots.length} slots
          </span>
        </p>
        <p className="hidden shrink-0 items-center gap-1.5 text-xs text-muted-foreground xl:flex">
          <MousePointer2 className="size-3" /> arraste para trocar de lugar · clique e arraste
          para reposicionar
        </p>
      </div>

      {temZonaSegura && (
        <p className="border-b bg-cyan-500/10 px-6 py-1.5 text-xs text-zona">
          <Info className="mr-1 inline size-3" />
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
              larguraMax={Math.max(80, largura - folga)}
              alturaMax={Math.max(80, altura - folga)}
            />
          </div>
        )}

        {!temImagens && (
          <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
            <p className="rounded-full border bg-popover/95 px-4 py-1.5 text-xs text-popover-foreground shadow-lg backdrop-blur">
              Carregue fotos na barra da esquerda e arraste para os slots.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
