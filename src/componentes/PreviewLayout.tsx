import type { CorFundo, Layout } from '../tipos'
import { retanguloDoSlot } from '../lib/cover'

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

  return (
    <div
      className="relative overflow-hidden rounded"
      style={{ width: largura, height: altura, backgroundColor: corFundo }}
    >
      {layout.slots.map((s) => {
        const r = retanguloDoSlot(s, layout, largura, altura)
        return (
          <div
            key={s.id}
            className={claro ? 'absolute bg-neutral-300' : 'absolute bg-neutral-700'}
            style={{
              left: r.x,
              top: r.y,
              width: r.w,
              height: r.h,
              outline: contorno ? `${Math.max(1, contorno)}px solid ${corFundo}` : undefined,
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
