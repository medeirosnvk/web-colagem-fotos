import type { CorFundo, Layout } from '../tipos'
import { retanguloDoSlot } from '../lib/cover'
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
  const escala = largura / 1080
  const contorno = (layout.contorno ?? 0) * escala
  const retangulos = layout.slots.map((s) => retanguloDoSlot(s, layout, largura, altura))

  return (
    <div
      className="relative overflow-hidden rounded"
      style={{ width: largura, height: altura, backgroundColor: corFundo }}
    >
      {retangulos.map((r, i) => {
        // Sem contorno, uma foto por cima de outra some no preview (mesmo
        // cinza). Um fio na cor de fundo separa as duas.
        const fio = contorno || (retangulos.slice(0, i).some((a) => sobrepoe(a, r)) ? 1 : 0)
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
