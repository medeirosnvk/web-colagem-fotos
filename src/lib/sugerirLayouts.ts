import type { Imagem, Layout } from '../tipos'

/**
 * Sugestão de layouts pela proporção das fotos.
 *
 * Para cada layout, pareia fotos com slots de modo que a foto deitada vá para o
 * slot deitado e a em pé para o em pé, e mede quanto de cada foto continua
 * visível no corte "cover" (o mesmo de `cover.ts`): `min(p, s) / max(p, s)`,
 * onde p e s são largura/altura da foto e do slot em pixels do formato.
 */
export interface Sugestao {
  layout: Layout
  /** Média da fração visível das fotos colocadas (0..1). */
  aproveitamento: number
  /** Slots que ficariam vazios (mais slots que fotos). */
  slotsVazios: number
  /** Fotos que ficariam de fora (mais fotos que slots). */
  fotosDeFora: number
  /** Foto → slot, já casados pela proporção. */
  atribuicoes: { slotId: string; imagemId: string }[]
}

/** Quanto da foto aparece num slot, recortando por cover. */
function visivel(foto: number, slot: number): number {
  return Math.min(foto, slot) / Math.max(foto, slot)
}

interface Item {
  id: string
  razao: number
}

/**
 * Pareamento ótimo que preserva a ordem entre duas listas ordenadas pela
 * proporção (a ≤ b em tamanho): escolhe quais itens de `b` recebem um par.
 * Devolve a soma das notas e os pares (índices em a, b).
 */
function parear(a: Item[], b: Item[], nota: (x: Item, y: Item) => number) {
  const n = a.length
  const m = b.length
  const dp = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(-Infinity))
  for (let j = 0; j <= m; j++) dp[0][j] = 0
  for (let i = 1; i <= n; i++) {
    for (let j = i; j <= m; j++) {
      dp[i][j] = Math.max(dp[i][j - 1], dp[i - 1][j - 1] + nota(a[i - 1], b[j - 1]))
    }
  }
  const pares: [number, number][] = []
  for (let i = n, j = m; i > 0;) {
    if (j > i && dp[i][j] === dp[i][j - 1]) j--
    else {
      pares.push([i - 1, j - 1])
      i--
      j--
    }
  }
  return { soma: dp[n][m], pares }
}

function avaliar(layout: Layout, fotos: Imagem[], largura: number, altura: number): Sugestao {
  const slots: Item[] = layout.slots
    .map((s) => ({ id: s.id, razao: (s.w * largura) / (s.h * altura) }))
    .sort((x, y) => x.razao - y.razao)
  const imagens: Item[] = fotos
    .map((f) => ({ id: f.id, razao: f.largura / f.altura }))
    .sort((x, y) => x.razao - y.razao)

  const fotosMenos = imagens.length <= slots.length
  const { soma, pares } = fotosMenos
    ? parear(imagens, slots, (f, s) => visivel(f.razao, s.razao))
    : parear(slots, imagens, (s, f) => visivel(f.razao, s.razao))

  const atribuicoes = pares.map(([i, j]) =>
    fotosMenos
      ? { imagemId: imagens[i].id, slotId: slots[j].id }
      : { imagemId: imagens[j].id, slotId: slots[i].id },
  )
  const colocadas = Math.min(imagens.length, slots.length)
  return {
    layout,
    aproveitamento: colocadas ? soma / colocadas : 0,
    slotsVazios: Math.max(0, slots.length - imagens.length),
    fotosDeFora: Math.max(0, imagens.length - slots.length),
    atribuicoes,
  }
}

/**
 * Melhores layouts para as fotos dadas, no formato (largura × altura em px).
 * Prefere layouts com o mesmo número de fotos; se não houver nenhum (ex.: 5
 * fotos), considera os tamanhos vizinhos, penalizando slot vazio e foto de fora.
 */
export function sugerirLayouts(
  layouts: Layout[],
  fotos: Imagem[],
  largura: number,
  altura: number,
  limite = 4,
): Sugestao[] {
  if (fotos.length === 0 || layouts.length === 0) return []

  const tamanhos = [...new Set(layouts.map((l) => l.qtdFotos))].sort((a, b) => a - b)
  const n = Math.min(fotos.length, tamanhos[tamanhos.length - 1])
  const usadas = fotos.slice(0, n)

  let alvo = tamanhos.filter((t) => t === n)
  if (alvo.length === 0) {
    const abaixo = tamanhos.filter((t) => t < n).pop()
    const acima = tamanhos.find((t) => t > n)
    alvo = [abaixo, acima].filter((t): t is number => t !== undefined)
  }

  return layouts
    .filter((l) => alvo.includes(l.qtdFotos))
    .map((l) => avaliar(l, usadas, largura, altura))
    .sort((a, b) => {
      // nota final: aproveitamento médio, descontado o que não se encaixa
      const pa = (a.aproveitamento * (n - a.fotosDeFora)) / (n + a.slotsVazios)
      const pb = (b.aproveitamento * (n - b.fotosDeFora)) / (n + b.slotsVazios)
      return pb - pa
    })
    .slice(0, limite)
}
