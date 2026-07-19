import type { EstiloLayout, Layout, Orientacao, ProporcaoId, SlotLayout } from '../tipos'
import { PROPORCOES_VERTICAIS } from './formatos'

const TODAS: Orientacao[] = ['vertical', 'quadrado', 'paisagem']
const ALTAS: Orientacao[] = ['vertical', 'quadrado']

function slot(id: string, x: number, y: number, w: number, h: number): SlotLayout {
  return { id, x, y, w, h }
}

type Opcoes = Partial<Pick<Layout, 'gap' | 'margem' | 'contorno' | 'linhaInterna'>>

function montar(
  id: string,
  nome: string,
  estilo: EstiloLayout,
  orientacoes: Orientacao[],
  slots: SlotLayout[],
  opcoes: Opcoes = {},
): Layout {
  return {
    id,
    nome,
    estilo,
    orientacoes,
    qtdFotos: slots.length,
    // Nas grades o espaçamento vem do gap; nos layouts livres a posição de cada
    // foto já embute o respiro, então o padrão é zero.
    gap: opcoes.gap ?? (estilo === 'grade' ? 12 : 0),
    margem: opcoes.margem ?? 0,
    contorno: opcoes.contorno,
    linhaInterna: opcoes.linhaInterna,
    slots,
  }
}

function grade(id: string, nome: string, colunas: number, linhas: number): Layout {
  const slots: SlotLayout[] = []
  for (let l = 0; l < linhas; l++) {
    for (let c = 0; c < colunas; c++) {
      slots.push(slot(`s${l * colunas + c + 1}`, c / colunas, l / linhas, 1 / colunas, 1 / linhas))
    }
  }
  return montar(id, nome, 'grade', TODAS, slots)
}

/**
 * Catálogo de layouts. Coordenadas relativas (0..1) — os slots não precisam
 * ladrilhar a tela nem ser disjuntos: quando se sobrepõem, vale a ordem do
 * array (o último é desenhado por cima).
 */
export const CATALOGO: Record<string, Layout> = {
  // ------------------------------------------------------------------
  // Grades — fotos encostadas, ocupando a tela inteira
  // ------------------------------------------------------------------
  unica: montar('unica', '1 foto — tela cheia', 'grade', TODAS, [slot('s1', 0, 0, 1, 1)]),

  'duas-empilhadas': montar('duas-empilhadas', '2 fotos — empilhadas', 'grade', TODAS, [
    slot('s1', 0, 0, 1, 0.5),
    slot('s2', 0, 0.5, 1, 0.5),
  ]),
  'duas-lado-a-lado': montar('duas-lado-a-lado', '2 fotos — lado a lado', 'grade', TODAS, [
    slot('s1', 0, 0, 0.5, 1),
    slot('s2', 0.5, 0, 0.5, 1),
  ]),

  'tres-grande-esquerda': montar(
    'tres-grande-esquerda',
    '3 fotos — grande à esquerda',
    'grade',
    TODAS,
    [slot('s1', 0, 0, 0.6, 1), slot('s2', 0.6, 0, 0.4, 0.5), slot('s3', 0.6, 0.5, 0.4, 0.5)],
  ),
  'tres-grande-direita': montar(
    'tres-grande-direita',
    '3 fotos — grande à direita',
    'grade',
    TODAS,
    [slot('s1', 0, 0, 0.4, 0.5), slot('s2', 0, 0.5, 0.4, 0.5), slot('s3', 0.4, 0, 0.6, 1)],
  ),
  'tres-grande-topo': montar('tres-grande-topo', '3 fotos — grande no topo', 'grade', TODAS, [
    slot('s1', 0, 0, 1, 0.6),
    slot('s2', 0, 0.6, 0.5, 0.4),
    slot('s3', 0.5, 0.6, 0.5, 0.4),
  ]),
  'tres-grande-base': montar('tres-grande-base', '3 fotos — grande embaixo', 'grade', TODAS, [
    slot('s1', 0, 0, 0.5, 0.4),
    slot('s2', 0.5, 0, 0.5, 0.4),
    slot('s3', 0, 0.4, 1, 0.6),
  ]),
  'tres-faixas-horizontais': montar(
    'tres-faixas-horizontais',
    '3 fotos — faixas horizontais',
    'grade',
    TODAS,
    [slot('s1', 0, 0, 1, 1 / 3), slot('s2', 0, 1 / 3, 1, 1 / 3), slot('s3', 0, 2 / 3, 1, 1 / 3)],
  ),
  'tres-faixas-verticais': montar(
    'tres-faixas-verticais',
    '3 fotos — faixas verticais',
    'grade',
    TODAS,
    [slot('s1', 0, 0, 1 / 3, 1), slot('s2', 1 / 3, 0, 1 / 3, 1), slot('s3', 2 / 3, 0, 1 / 3, 1)],
  ),

  'quatro-grade': grade('quatro-grade', '4 fotos — grade 2x2', 2, 2),
  'quatro-grande-topo': montar('quatro-grande-topo', '4 fotos — grande no topo', 'grade', TODAS, [
    slot('s1', 0, 0, 1, 0.55),
    slot('s2', 0, 0.55, 1 / 3, 0.45),
    slot('s3', 1 / 3, 0.55, 1 / 3, 0.45),
    slot('s4', 2 / 3, 0.55, 1 / 3, 0.45),
  ]),
  'quatro-grande-esquerda': montar(
    'quatro-grande-esquerda',
    '4 fotos — grande à esquerda',
    'grade',
    TODAS,
    [
      slot('s1', 0, 0, 0.55, 1),
      slot('s2', 0.55, 0, 0.45, 1 / 3),
      slot('s3', 0.55, 1 / 3, 0.45, 1 / 3),
      slot('s4', 0.55, 2 / 3, 0.45, 1 / 3),
    ],
  ),

  'seis-2x3': grade('seis-2x3', '6 fotos — grade 2x3', 2, 3),
  'seis-3x2': grade('seis-3x2', '6 fotos — grade 3x2', 3, 2),

  // ------------------------------------------------------------------
  // Moldura — foto flutuando com bastante respiro na cor de fundo
  // ------------------------------------------------------------------
  'moldura-centro': montar('moldura-centro', 'Moldura — foto centralizada', 'moldura', TODAS, [
    slot('s1', 0.08, 0.08, 0.84, 0.84),
  ]),
  polaroid: montar('polaroid', 'Polaroide — espaço para legenda', 'moldura', ALTAS, [
    slot('s1', 0.08, 0.07, 0.84, 0.7),
  ]),
  'moldura-faixa': montar('moldura-faixa', 'Faixa central — muito ar', 'moldura', ALTAS, [
    slot('s1', 0.06, 0.24, 0.88, 0.5),
  ]),
  'moldura-titulo': montar('moldura-titulo', 'Espaço para título no topo', 'moldura', ALTAS, [
    slot('s1', 0.08, 0.28, 0.84, 0.64),
  ]),
  'moldura-alta': montar('moldura-alta', 'Retrato estreito', 'moldura', ALTAS, [
    slot('s1', 0.16, 0.08, 0.68, 0.84),
  ]),
  'filete-tela-cheia': montar(
    'filete-tela-cheia',
    'Tela cheia com filete',
    'moldura',
    TODAS,
    [slot('s1', 0, 0, 1, 1)],
    { linhaInterna: { inset: 90, largura: 6 } },
  ),

  // ------------------------------------------------------------------
  // Livre — assimétrico, sem sobreposição
  // ------------------------------------------------------------------
  'livre-duas-escada': montar('livre-duas-escada', '2 fotos — escada', 'livre', TODAS, [
    slot('s1', 0.32, 0.06, 0.62, 0.4),
    slot('s2', 0.06, 0.52, 0.62, 0.4),
  ]),
  'livre-duas-desencontradas': montar(
    'livre-duas-desencontradas',
    '2 fotos — desencontradas',
    'livre',
    ALTAS,
    [slot('s1', 0.06, 0.08, 0.5, 0.36), slot('s2', 0.44, 0.5, 0.5, 0.42)],
  ),
  // Medidos a partir dos templates de referência (colagens 9:16 em fundo
  // branco): fotos grandes, margens generosas e algumas sangrando pela borda.
  'livre-duas-moldura-empilhada': montar(
    'livre-duas-moldura-empilhada',
    '2 fotos — empilhadas com moldura',
    'livre',
    TODAS,
    [slot('s1', 0.07, 0.03, 0.86, 0.45), slot('s2', 0.07, 0.52, 0.86, 0.45)],
  ),
  'livre-duas-sangradas': montar(
    'livre-duas-sangradas',
    '2 fotos — desencontradas sangradas',
    'livre',
    TODAS,
    [slot('s1', 0.13, 0, 0.87, 0.49), slot('s2', 0, 0.51, 0.87, 0.49)],
  ),
  'livre-duas-grandes': montar(
    'livre-duas-grandes',
    '2 fotos — desencontradas grandes',
    'livre',
    TODAS,
    [slot('s1', 0.23, 0.03, 0.72, 0.46), slot('s2', 0.05, 0.53, 0.9, 0.44)],
  ),

  'livre-tres-revista': montar('livre-tres-revista', '3 fotos — revista', 'livre', ALTAS, [
    slot('s1', 0.06, 0.05, 0.88, 0.4),
    slot('s2', 0.06, 0.48, 0.43, 0.3),
    slot('s3', 0.51, 0.48, 0.43, 0.3),
  ]),
  'livre-tres-zigue-zague': montar(
    'livre-tres-zigue-zague',
    '3 fotos — zigue-zague',
    'livre',
    ALTAS,
    [
      slot('s1', 0.3, 0.04, 0.64, 0.29),
      slot('s2', 0.06, 0.355, 0.64, 0.29),
      slot('s3', 0.3, 0.67, 0.64, 0.29),
    ],
  ),
  'livre-tres-coluna': montar('livre-tres-coluna', '3 fotos — coluna sangrada', 'livre', TODAS, [
    slot('s1', 0.06, 0, 0.88, 0.32),
    slot('s2', 0.06, 0.345, 0.88, 0.31),
    slot('s3', 0.06, 0.69, 0.88, 0.31),
  ]),
  'livre-tres-escada-larga': montar(
    'livre-tres-escada-larga',
    '3 fotos — escada larga',
    'livre',
    TODAS,
    [
      slot('s1', 0.03, 0.02, 0.64, 0.33),
      slot('s2', 0.34, 0.35, 0.64, 0.3),
      slot('s3', 0.03, 0.65, 0.64, 0.33),
    ],
  ),
  'livre-tres-lateral': montar(
    'livre-tres-lateral',
    '3 fotos — grande à esquerda solta',
    'livre',
    TODAS,
    [
      slot('s1', 0.03, 0.21, 0.46, 0.58),
      slot('s2', 0.51, 0.04, 0.46, 0.38),
      slot('s3', 0.51, 0.58, 0.46, 0.37),
    ],
  ),

  'livre-quatro-mosaico': montar('livre-quatro-mosaico', '4 fotos — mosaico solto', 'livre', ALTAS, [
    slot('s1', 0.06, 0.06, 0.52, 0.34),
    slot('s2', 0.62, 0.06, 0.32, 0.34),
    slot('s3', 0.06, 0.44, 0.32, 0.34),
    slot('s4', 0.42, 0.44, 0.52, 0.34),
  ]),
  'livre-quatro-colunas': montar(
    'livre-quatro-colunas',
    '4 fotos — colunas desencontradas',
    'livre',
    TODAS,
    [
      slot('s1', 0.04, 0.06, 0.45, 0.37),
      slot('s2', 0.52, 0.17, 0.45, 0.37),
      slot('s3', 0.04, 0.46, 0.45, 0.37),
      slot('s4', 0.52, 0.56, 0.45, 0.37),
    ],
  ),
  'livre-quatro-destaque-faixa': montar(
    'livre-quatro-destaque-faixa',
    '4 fotos — destaque + faixa sangrada',
    'livre',
    TODAS,
    [
      slot('s1', 0.08, 0.04, 0.85, 0.59),
      slot('s2', 0, 0.67, 0.32, 0.33),
      slot('s3', 0.34, 0.67, 0.32, 0.33),
      slot('s4', 0.68, 0.67, 0.32, 0.33),
    ],
  ),

  'sangrado-lateral': montar('sangrado-lateral', 'Sangrado lateral + flutuante', 'livre', TODAS, [
    slot('s1', 0.42, 0, 0.58, 1),
    slot('s2', 0.06, 0.3, 0.4, 0.4),
  ]),
  'sangrado-topo': montar('sangrado-topo', 'Sangrado no topo + flutuante', 'livre', ALTAS, [
    slot('s1', 0, 0, 1, 0.55),
    slot('s2', 0.12, 0.62, 0.76, 0.3),
  ]),

  // ------------------------------------------------------------------
  // Sobreposto — fotos se cruzando, com contorno na cor de fundo
  // ------------------------------------------------------------------
  'sobreposta-dupla': montar(
    'sobreposta-dupla',
    '2 fotos — sobrepostas',
    'sobreposto',
    TODAS,
    [slot('s1', 0.06, 0.1, 0.56, 0.46), slot('s2', 0.38, 0.44, 0.56, 0.46)],
    { contorno: 14 },
  ),
  'sobreposta-cantos': montar(
    'sobreposta-cantos',
    '2 fotos — cantos opostos',
    'sobreposto',
    TODAS,
    [slot('s1', 0.05, 0.08, 0.66, 0.5), slot('s2', 0.42, 0.46, 0.53, 0.42)],
    { contorno: 14 },
  ),
  'sobreposta-tripla': montar(
    'sobreposta-tripla',
    '3 fotos — colagem sobreposta',
    'sobreposto',
    ALTAS,
    [
      slot('s1', 0.3, 0.04, 0.66, 0.3),
      slot('s2', 0.06, 0.26, 0.52, 0.44),
      slot('s3', 0.42, 0.58, 0.52, 0.32),
    ],
    { contorno: 14 },
  ),
  'sobreposta-pilha': montar(
    'sobreposta-pilha',
    '3 fotos — pilha diagonal',
    'sobreposto',
    ALTAS,
    [
      slot('s1', 0.06, 0.06, 0.6, 0.42),
      slot('s2', 0.24, 0.29, 0.6, 0.42),
      slot('s3', 0.34, 0.52, 0.6, 0.42),
    ],
    { contorno: 14 },
  ),
}

export const ROTULO_ESTILO: Record<EstiloLayout, string> = {
  grade: 'Grades',
  moldura: 'Moldura e respiro',
  livre: 'Assimétricos',
  sobreposto: 'Sobrepostos',
}

export const DESCRICAO_ESTILO: Record<EstiloLayout, string> = {
  grade: 'Fotos encostadas, preenchendo a tela inteira.',
  moldura: 'Foto flutuando na cor de fundo, com área livre para texto.',
  livre: 'Posições assimétricas, sem sobreposição.',
  sobreposto: 'Fotos se cruzando, separadas por um contorno na cor de fundo.',
}

/** Ordem dos estilos na etapa de layout. */
const ORDEM_ESTILOS: EstiloLayout[] = ['grade', 'moldura', 'livre', 'sobreposto']

/** Ordem das grades em proporções altas (empilhamento vertical primeiro). */
const GRADES_VERTICAL = [
  'unica',
  'duas-empilhadas',
  'duas-lado-a-lado',
  'tres-grande-topo',
  'tres-grande-base',
  'tres-faixas-horizontais',
  'tres-grande-esquerda',
  'tres-grande-direita',
  'tres-faixas-verticais',
  'quatro-grade',
  'quatro-grande-topo',
  'quatro-grande-esquerda',
  'seis-2x3',
  'seis-3x2',
]

/** Ordem das grades em paisagem (divisões verticais primeiro). */
const GRADES_PAISAGEM = [
  'unica',
  'duas-lado-a-lado',
  'duas-empilhadas',
  'tres-grande-esquerda',
  'tres-grande-direita',
  'tres-faixas-verticais',
  'tres-grande-topo',
  'tres-faixas-horizontais',
  'quatro-grande-esquerda',
  'quatro-grade',
  'quatro-grande-topo',
  'seis-3x2',
  'seis-2x3',
]

const GRADES_QUADRADO = [
  'unica',
  'duas-lado-a-lado',
  'duas-empilhadas',
  'tres-grande-esquerda',
  'tres-grande-direita',
  'tres-grande-topo',
  'tres-faixas-verticais',
  'tres-faixas-horizontais',
  'quatro-grade',
  'quatro-grande-topo',
  'quatro-grande-esquerda',
  'seis-3x2',
  'seis-2x3',
]

export function orientacaoDe(proporcao: ProporcaoId): Orientacao {
  if (PROPORCOES_VERTICAIS.includes(proporcao)) return 'vertical'
  if (proporcao === '1:1') return 'quadrado'
  return 'paisagem'
}

function ordemGrades(orientacao: Orientacao): string[] {
  if (orientacao === 'vertical') return GRADES_VERTICAL
  if (orientacao === 'quadrado') return GRADES_QUADRADO
  return GRADES_PAISAGEM
}

/** Layouts de uma proporção, agrupados por estilo. */
export function layoutsAgrupados(
  proporcao: ProporcaoId,
): { estilo: EstiloLayout; layouts: Layout[] }[] {
  const orientacao = orientacaoDe(proporcao)
  const cabem = Object.values(CATALOGO).filter((l) => l.orientacoes.includes(orientacao))

  return ORDEM_ESTILOS.map((estilo) => {
    const layouts = cabem.filter((l) => l.estilo === estilo)
    if (estilo === 'grade') {
      const ordem = ordemGrades(orientacao)
      layouts.sort((a, b) => ordem.indexOf(a.id) - ordem.indexOf(b.id))
    }
    return { estilo, layouts }
  }).filter((g) => g.layouts.length > 0)
}

/** Layouts disponíveis para uma proporção, já ordenados por adequação. */
export function layoutsDe(proporcao: ProporcaoId): Layout[] {
  return layoutsAgrupados(proporcao).flatMap((g) => g.layouts)
}

export function layoutPorId(id: string | null): Layout | undefined {
  return id ? CATALOGO[id] : undefined
}
