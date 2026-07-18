import { useColagemStore } from '../../store/useColagemStore'
import { formatoPorId, ZONA_SEGURA_PX } from '../../data/formatos'
import { layoutPorId } from '../../data/layouts'
import { layoutEfetivo } from '../../lib/layoutEfetivo'
import { retanguloDoSlot } from '../../lib/cover'
import { SlotEditor } from './SlotEditor'

/**
 * Desenha a colagem na tela usando exatamente a mesma geometria da exportação
 * (retanguloDoSlot + retanguloDaImagem), apenas multiplicada por `escala`.
 * É isso que garante que o resultado exportado bata com o editor.
 */
export function TelaColagem({
  larguraMax,
  alturaMax,
  interativo = true,
  mostrarZonaSegura = true,
}: {
  larguraMax: number
  alturaMax: number
  interativo?: boolean
  mostrarZonaSegura?: boolean
}) {
  const formato = formatoPorId(useColagemStore((s) => s.formatoId))
  const layoutBase = layoutPorId(useColagemStore((s) => s.layoutId))
  const gap = useColagemStore((s) => s.gap)
  const margem = useColagemStore((s) => s.margem)
  const corFundo = useColagemStore((s) => s.corFundo)
  const slots = useColagemStore((s) => s.slots)
  const imagens = useColagemStore((s) => s.imagens)
  const destinoWizard = useColagemStore((s) => s.destino)

  if (!formato || !layoutBase) return null

  const layout = layoutEfetivo(layoutBase, gap, margem)
  const escala = Math.min(larguraMax / formato.largura, alturaMax / formato.altura)

  const temZonaSegura =
    mostrarZonaSegura && (destinoWizard === 'stories' || destinoWizard === 'reels')

  return (
    <div
      className="relative shadow-2xl shadow-black/60"
      style={{
        width: formato.largura * escala,
        height: formato.altura * escala,
        backgroundColor: corFundo,
      }}
    >
      {layout.slots.map((s, i) => {
        const estado = slots.find((x) => x.slotId === s.id) ?? {
          slotId: s.id,
          escala: 1,
          offsetX: 0,
          offsetY: 0,
        }
        return (
          <SlotEditor
            key={s.id}
            slotId={s.id}
            numero={i + 1}
            destino={retanguloDoSlot(s, layout, formato.largura, formato.altura)}
            estado={estado}
            imagem={imagens.find((img) => img.id === estado.imagemId)}
            escala={escala}
            interativo={interativo}
            contorno={(layout.contorno ?? 0) * (formato.largura / 1080)}
            corFundo={corFundo}
          />
        )
      })}

      {layout.linhaInterna && (
        <div
          className="pointer-events-none absolute border-white"
          style={{
            left: layout.linhaInterna.inset * (formato.largura / 1080) * escala,
            top: layout.linhaInterna.inset * (formato.largura / 1080) * escala,
            right: layout.linhaInterna.inset * (formato.largura / 1080) * escala,
            bottom: layout.linhaInterna.inset * (formato.largura / 1080) * escala,
            borderWidth: layout.linhaInterna.largura * (formato.largura / 1080) * escala,
          }}
        />
      )}

      {/* Overlay informativo — nunca é exportado. */}
      {temZonaSegura && (
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute inset-x-0 top-0 border-b border-dashed border-cyan-300/70 bg-cyan-400/10"
            style={{ height: ZONA_SEGURA_PX.topo * escala }}
          >
            <span className="absolute bottom-1 left-2 text-[10px] font-medium text-cyan-200">
              zona da interface (topo)
            </span>
          </div>
          <div
            className="absolute inset-x-0 bottom-0 border-t border-dashed border-cyan-300/70 bg-cyan-400/10"
            style={{ height: ZONA_SEGURA_PX.base * escala }}
          >
            <span className="absolute top-1 left-2 text-[10px] font-medium text-cyan-200">
              zona da interface (base)
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
