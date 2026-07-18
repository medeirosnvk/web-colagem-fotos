import type { Layout } from '../tipos'

/** Aplica o espaçamento escolhido pelo usuário sobre o layout do catálogo. */
export function layoutEfetivo(layout: Layout, gap: number, margem: number): Layout {
  return { ...layout, gap, margem }
}
