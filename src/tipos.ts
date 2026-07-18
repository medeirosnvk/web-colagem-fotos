export type Plataforma = 'instagram' | 'facebook'
export type Destino = 'feed' | 'stories' | 'reels'
export type ProporcaoId = '1:1' | '4:5' | '3:4' | '1.91:1' | '9:16'
export type CorFundo = '#FFFFFF' | '#000000'

/** Um formato de exportação: destino + plataforma + proporção → pixels exatos. */
export interface Formato {
  id: string
  plataforma: Plataforma
  destino: Destino
  proporcao: ProporcaoId
  rotulo: string
  largura: number
  altura: number
  recomendado?: boolean
  observacao?: string
}

/** Retângulo em coordenadas relativas (0..1) dentro da tela da colagem. */
export interface SlotLayout {
  id: string
  x: number
  y: number
  w: number
  h: number
}

export type EstiloLayout = 'grade' | 'moldura' | 'livre' | 'sobreposto'

export type Orientacao = 'vertical' | 'quadrado' | 'paisagem'

/** Filete decorativo desenhado sobre a colagem inteira. */
export interface LinhaInterna {
  /** Distância da borda da colagem, em px na base 1080. */
  inset: number
  /** Espessura, em px na base 1080. */
  largura: number
}

export interface Layout {
  id: string
  nome: string
  estilo: EstiloLayout
  /** Proporções em que este layout faz sentido. */
  orientacoes: Orientacao[]
  qtdFotos: number
  /** Espaçamento entre slots, em px na base de largura 1080. */
  gap: number
  /** Margem externa, em px na base de largura 1080. */
  margem: number
  /**
   * Borda na cor de fundo em volta de cada foto, em px na base 1080. É o que
   * separa as fotos nos layouts sobrepostos (recorte de revista).
   */
  contorno?: number
  linhaInterna?: LinhaInterna
  slots: SlotLayout[]
}

/** Imagem carregada pelo usuário — nunca sai do navegador. */
export interface Imagem {
  id: string
  nome: string
  url: string
  largura: number
  altura: number
  el: HTMLImageElement
}

/** Estado de preenchimento de um slot. */
export interface EstadoSlot {
  slotId: string
  imagemId?: string
  /** 1 = cover exato (preenche o slot sem sobra). */
  escala: number
  /** -1..1 */
  offsetX: number
  /** -1..1 */
  offsetY: number
}

export interface Retangulo {
  x: number
  y: number
  w: number
  h: number
}
