import type { EstadoSlot, Layout, Retangulo, SlotLayout } from '../tipos'

/**
 * Converte um slot em coordenadas relativas para o retângulo em pixels do
 * canvas final, já descontando gap interno e margem externa.
 *
 * gap e margem são definidos na base de largura 1080; aqui são escalados para
 * a largura real do formato, de modo que o layout seja independente da
 * resolução.
 */
export function retanguloDoSlot(
  s: SlotLayout,
  layout: Layout,
  larguraCanvas: number,
  alturaCanvas: number,
): Retangulo {
  const escala = larguraCanvas / 1080
  const gap = (layout.gap * escala) / 2
  const margem = layout.margem * escala
  const eps = 0.0001

  const esquerda = s.x <= eps ? margem : gap
  const topo = s.y <= eps ? margem : gap
  const direita = s.x + s.w >= 1 - eps ? margem : gap
  const base = s.y + s.h >= 1 - eps ? margem : gap

  const x = s.x * larguraCanvas + esquerda
  const y = s.y * alturaCanvas + topo
  const w = s.w * larguraCanvas - esquerda - direita
  const h = s.h * alturaCanvas - topo - base

  return { x, y, w, h: Math.max(0, h) }
}

/**
 * Retângulo (em pixels do canvas) onde a imagem inteira será desenhada.
 * Depois é recortado pelo slot — é isso que garante que editor e exportação
 * usem exatamente a mesma geometria.
 *
 * escala 1 = cover exato. Acima de 1 dá zoom; abaixo de 1 a imagem encolhe e
 * o vão aparece com a cor de fundo (só se o usuário reduzir de propósito).
 */
export function retanguloDaImagem(
  destino: Retangulo,
  imgLargura: number,
  imgAltura: number,
  estado: Pick<EstadoSlot, 'escala' | 'offsetX' | 'offsetY'>,
): Retangulo {
  const cover = Math.max(destino.w / imgLargura, destino.h / imgAltura)
  const s = cover * estado.escala

  const w = imgLargura * s
  const h = imgAltura * s

  // Folga disponível para arrastar em cada eixo (metade para cada lado).
  const folgaX = Math.abs(w - destino.w) / 2
  const folgaY = Math.abs(h - destino.h) / 2

  const x = destino.x + (destino.w - w) / 2 + clamp(estado.offsetX, -1, 1) * folgaX
  const y = destino.y + (destino.h - h) / 2 + clamp(estado.offsetY, -1, 1) * folgaY

  return { x, y, w, h }
}

/**
 * Fatia da imagem original visível dentro do slot (source rect do drawImage).
 * Só é válido quando a imagem cobre o slot (escala >= 1); com escala < 1 a
 * imagem não preenche e o desenho é feito pelo retângulo de destino.
 */
export function calcularSourceRect(
  destino: Retangulo,
  imgLargura: number,
  imgAltura: number,
  estado: Pick<EstadoSlot, 'escala' | 'offsetX' | 'offsetY'>,
): Retangulo {
  const desenho = retanguloDaImagem(destino, imgLargura, imgAltura, estado)
  const fator = imgLargura / desenho.w

  return {
    x: (destino.x - desenho.x) * fator,
    y: (destino.y - desenho.y) * fator,
    w: destino.w * fator,
    h: destino.h * fator,
  }
}

/** Escala mínima que ainda preenche o slot inteiro. */
export const ESCALA_COVER = 1

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}
