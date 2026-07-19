import { Info } from 'lucide-react'
import { useColagemStore } from '../../store/useColagemStore'
import { formatoPorId } from '../../data/formatos'
import { layoutPorId } from '../../data/layouts'
import { TelaColagem } from '../editor/TelaColagem'
import { PainelAjuste } from '../editor/PainelAjuste'

export function Etapa5Montagem() {
  const formato = formatoPorId(useColagemStore((s) => s.formatoId))
  const layout = layoutPorId(useColagemStore((s) => s.layoutId))
  const slots = useColagemStore((s) => s.slots)
  const imagens = useColagemStore((s) => s.imagens)
  const destino = useColagemStore((s) => s.destino)

  if (!formato || !layout) return null

  const preenchidos = slots.filter((s) => s.imagemId).length
  const temZonaSegura = destino === 'stories' || destino === 'reels'

  return (
    <div className="flex h-full min-h-0">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-3">
          <div>
            <h1 className="text-sm font-semibold">Monte a colagem</h1>
            <p className="text-xs text-neutral-500">
              {layout.nome} · {formato.largura}×{formato.altura} px · {preenchidos} de{' '}
              {layout.slots.length} slots preenchidos
            </p>
          </div>
          <p className="flex items-center gap-1.5 text-xs text-neutral-500">
            <Info size={13} /> Arraste para reposicionar · role o mouse para dar zoom
          </p>
        </div>

        {temZonaSegura && (
          <p className="border-b border-neutral-800 bg-cyan-500/5 px-6 py-2 text-xs text-cyan-200/90">
            As faixas pontilhadas <strong>não são cortadas</strong> — é onde o
            {destino === 'reels' ? ' Reels' : ' Stories'} desenha perfil, legenda e botões por cima
            da sua colagem. Evite rostos e texto ali.
          </p>
        )}

        <div className="flex flex-1 items-center justify-center overflow-auto p-6">
          {imagens.length === 0 ? (
            <p className="text-sm text-neutral-500">
              Carregue fotos na etapa 1 para começar a montar.
            </p>
          ) : (
            <TelaColagem larguraMax={620} alturaMax={560} />
          )}
        </div>
      </div>

      <PainelAjuste />
    </div>
  )
}
