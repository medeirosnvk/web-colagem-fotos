import type { CorFundo, Layout } from '../tipos'
import { contornosDosSlots, quadrosDe, retanguloDoSlot } from '../lib/cover'
import { sobrepoe } from '../lib/areaVisivel'

/** Preview esquemático: os mesmos slots do editor, desenhados como retângulos. */
export function PreviewLayout({
  layout,
  largura,
  altura,
  corFundo,
}: {
  layout: Layout
  largura: number
  altura: number
  corFundo: CorFundo
}) {
  const claro = corFundo === '#FFFFFF'
  const quadros = quadrosDe(layout)
  const escala = largura / quadros / 1080
  const retangulos = layout.slots.map((s) => retanguloDoSlot(s, layout, largura, altura))
  const contornos = contornosDosSlots(layout, retangulos)

  return (
    <div
      className="relative overflow-hidden rounded"
      style={{ width: largura, height: altura, backgroundColor: corFundo }}
    >
      {retangulos.map((r, i) => {
        // Sem contorno, uma foto por cima de outra some no preview (mesmo
        // cinza). Um fio na cor de fundo separa as duas.
        const fio = contornos[i] * escala || (retangulos.slice(0, i).some((a) => sobrepoe(a, r)) ? 1 : 0)
        return (
          <div
            key={layout.slots[i].id}
            className={claro ? 'absolute bg-neutral-300' : 'absolute bg-neutral-700'}
            style={{
              left: r.x,
              top: r.y,
              width: r.w,
              height: r.h,
              outline: fio ? `${Math.max(1, fio)}px solid ${corFundo}` : undefined,
            }}
          />
        )
      })}

      {Array.from({ length: quadros - 1 }, (_, i) => (
        <div
          key={i}
          className="absolute inset-y-0 border-l border-dashed border-primary/70"
          style={{ left: ((i + 1) * largura) / quadros }}
        />
      ))}

      {layout.linhaInterna && (
        <div
          className="absolute border-white/70"
          style={{
            left: layout.linhaInterna.inset * escala,
            top: layout.linhaInterna.inset * escala,
            right: layout.linhaInterna.inset * escala,
            bottom: layout.linhaInterna.inset * escala,
            borderWidth: Math.max(1, layout.linhaInterna.largura * escala),
          }}
        />
      )}
    </div>
  )
}
