import type { Layout } from '../tipos'

/** Aplica o espaçamento e o contorno escolhidos pelo usuário sobre o layout do catálogo. */
export function layoutEfetivo(
  layout: Layout,
  gap: number,
  margem: number,
  contorno?: number,
): Layout {
  return { ...layout, gap, margem, contorno: contorno ?? layout.contorno }
}
