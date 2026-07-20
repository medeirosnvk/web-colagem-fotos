import { create } from 'zustand'

export type Tema = 'escuro' | 'claro'

const CHAVE = 'phrame:tema'

/**
 * Tema da interface. Vive fora do documento da colagem: não entra no
 * desfazer e não tem nada a ver com a `corFundo` da colagem, que é escolha de
 * exportação.
 */
interface EstadoTema {
  tema: Tema
  definirTema: (tema: Tema) => void
  alternar: () => void
}

function preferido(): Tema {
  try {
    const salvo = localStorage.getItem(CHAVE)
    if (salvo === 'claro' || salvo === 'escuro') return salvo
  } catch {
    // navegador com storage bloqueado: cai na preferência do sistema
  }
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'claro' : 'escuro'
}

function aplicar(tema: Tema) {
  document.documentElement.classList.toggle('claro', tema === 'claro')
  try {
    localStorage.setItem(CHAVE, tema)
  } catch {
    // sem storage, o tema vale só para esta sessão
  }
}

const inicial = preferido()
// Aplica antes do primeiro render para não piscar o tema errado.
document.documentElement.classList.toggle('claro', inicial === 'claro')

export const useTemaStore = create<EstadoTema>((set, get) => ({
  tema: inicial,

  definirTema: (tema) => {
    aplicar(tema)
    set({ tema })
  },

  alternar: () => get().definirTema(get().tema === 'claro' ? 'escuro' : 'claro'),
}))
