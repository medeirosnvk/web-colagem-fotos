import type { Formato, Plataforma, Destino, ProporcaoId } from '../tipos'

/**
 * Tabela de formatos (dados de 2026). Base de largura 1080, exceto onde a
 * plataforma especifica outra coisa (Facebook link/paisagem = 1200x630).
 */
export const FORMATOS: Formato[] = [
  // ---------- Instagram · Feed ----------
  {
    id: 'ig-feed-1-1',
    plataforma: 'instagram',
    destino: 'feed',
    proporcao: '1:1',
    rotulo: 'Quadrado 1:1',
    largura: 1080,
    altura: 1080,
  },
  {
    id: 'ig-feed-4-5',
    plataforma: 'instagram',
    destino: 'feed',
    proporcao: '4:5',
    rotulo: 'Retrato 4:5',
    largura: 1080,
    altura: 1350,
    recomendado: true,
    observacao: 'Ocupa mais espaço vertical no feed. É a escolha mais segura.',
  },
  {
    id: 'ig-feed-3-4',
    plataforma: 'instagram',
    destino: 'feed',
    proporcao: '3:4',
    rotulo: 'Retrato 3:4',
    largura: 1080,
    altura: 1440,
    observacao: 'Casa exatamente com a miniatura do grid do perfil.',
  },
  {
    id: 'ig-feed-191-1',
    plataforma: 'instagram',
    destino: 'feed',
    proporcao: '1.91:1',
    rotulo: 'Paisagem 1.91:1',
    largura: 1080,
    altura: 566,
  },

  // ---------- Instagram · Stories / Reels ----------
  {
    id: 'ig-stories-9-16',
    plataforma: 'instagram',
    destino: 'stories',
    proporcao: '9:16',
    rotulo: 'Tela cheia 9:16',
    largura: 1080,
    altura: 1920,
    recomendado: true,
  },
  {
    id: 'ig-reels-9-16',
    plataforma: 'instagram',
    destino: 'reels',
    proporcao: '9:16',
    rotulo: 'Tela cheia 9:16',
    largura: 1080,
    altura: 1920,
    recomendado: true,
  },

  // ---------- Facebook · Feed ----------
  {
    id: 'fb-feed-1-1',
    plataforma: 'facebook',
    destino: 'feed',
    proporcao: '1:1',
    rotulo: 'Quadrado 1:1',
    largura: 1080,
    altura: 1080,
  },
  {
    id: 'fb-feed-4-5',
    plataforma: 'facebook',
    destino: 'feed',
    proporcao: '4:5',
    rotulo: 'Retrato 4:5',
    largura: 1080,
    altura: 1350,
    recomendado: true,
  },
  {
    id: 'fb-feed-191-1',
    plataforma: 'facebook',
    destino: 'feed',
    proporcao: '1.91:1',
    rotulo: 'Paisagem 1.91:1',
    largura: 1200,
    altura: 630,
    observacao: 'Formato usado também em prévias de link.',
  },

  // ---------- Facebook · Stories / Reels ----------
  {
    id: 'fb-stories-9-16',
    plataforma: 'facebook',
    destino: 'stories',
    proporcao: '9:16',
    rotulo: 'Tela cheia 9:16',
    largura: 1080,
    altura: 1920,
    recomendado: true,
  },
  {
    id: 'fb-reels-9-16',
    plataforma: 'facebook',
    destino: 'reels',
    proporcao: '9:16',
    rotulo: 'Tela cheia 9:16',
    largura: 1080,
    altura: 1920,
    recomendado: true,
  },
]

export const ROTULO_PLATAFORMA: Record<Plataforma, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
}

export const ROTULO_DESTINO: Record<Destino, string> = {
  feed: 'Feed',
  stories: 'Stories',
  reels: 'Reels',
}

export function formatosDe(plataforma: Plataforma, destino: Destino): Formato[] {
  return FORMATOS.filter((f) => f.plataforma === plataforma && f.destino === destino)
}

export function formatoPorId(id: string | null): Formato | undefined {
  return FORMATOS.find((f) => f.id === id)
}

/** Proporções vistas como "altas" — priorizam empilhamento vertical. */
export const PROPORCOES_VERTICAIS: ProporcaoId[] = ['9:16', '3:4', '4:5']

/** Zona segura (px na base 1080x1920) para Stories e Reels. */
export const ZONA_SEGURA_PX = { topo: 250, base: 250 }
