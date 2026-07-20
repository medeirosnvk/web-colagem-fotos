import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variante = 'primario' | 'secundario' | 'fantasma' | 'perigo'

const ESTILOS: Record<Variante, string> = {
  primario:
    'bg-violet-600 text-white hover:bg-violet-500 disabled:bg-elevado disabled:text-suave',
  secundario:
    'bg-elevado text-texto hover:bg-elevado disabled:text-suave',
  fantasma:
    'bg-transparent text-texto hover:bg-elevado hover:text-texto disabled:text-tenue',
  perigo: 'bg-transparent text-red-400 hover:bg-red-500/10',
}

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante
  children: ReactNode
}

export function Botao({ variante = 'secundario', className = '', children, ...resto }: Props) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed ${ESTILOS[variante]} ${className}`}
      {...resto}
    >
      {children}
    </button>
  )
}

export function Cartao({
  ativo,
  onClick,
  children,
  className = '',
}: {
  ativo: boolean
  onClick: () => void
  children: ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border p-4 text-left transition-all ${
        ativo
          ? 'border-violet-500 bg-violet-500/10 ring-1 ring-violet-500/40'
          : 'border-borda bg-superficie hover:border-borda-forte'
      } ${className}`}
    >
      {children}
    </button>
  )
}
