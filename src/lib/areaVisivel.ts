import type { Retangulo } from '../tipos'

export function sobrepoe(a: Retangulo, b: Retangulo): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
}

/**
 * Onde pôr o placeholder de um slot que fica parcialmente coberto pelos slots
 * desenhados depois dele — senão o "Slot 1" de um fundo em tela cheia cai no
 * centro, justo embaixo da foto de destaque.
 *
 * Toma a caixa que envolve tudo o que cobre o slot e escolhe a maior das quatro
 * faixas livres em volta dela. Devolve o centro dessa faixa em fração (0..1)
 * do próprio slot; sem nada por cima, é o centro do slot.
 */
export function centroVisivel(slot: Retangulo, cobrindo: Retangulo[]): { x: number; y: number } {
  const sobre = cobrindo.filter((c) => sobrepoe(slot, c))
  if (sobre.length === 0) return { x: 0.5, y: 0.5 }

  const x0 = Math.max(slot.x, Math.min(...sobre.map((c) => c.x)))
  const y0 = Math.max(slot.y, Math.min(...sobre.map((c) => c.y)))
  const x1 = Math.min(slot.x + slot.w, Math.max(...sobre.map((c) => c.x + c.w)))
  const y1 = Math.min(slot.y + slot.h, Math.max(...sobre.map((c) => c.y + c.h)))

  const faixas: Retangulo[] = [
    { x: slot.x, y: slot.y, w: slot.w, h: y0 - slot.y },
    { x: slot.x, y: y1, w: slot.w, h: slot.y + slot.h - y1 },
    { x: slot.x, y: slot.y, w: x0 - slot.x, h: slot.h },
    { x: x1, y: slot.y, w: slot.x + slot.w - x1, h: slot.h },
  ]
  const maior = faixas.reduce((a, b) => (b.w * b.h > a.w * a.h ? b : a))
  if (maior.w * maior.h <= 0) return { x: 0.5, y: 0.5 }

  return {
    x: (maior.x + maior.w / 2 - slot.x) / slot.w,
    y: (maior.y + maior.h / 2 - slot.y) / slot.h,
  }
}
