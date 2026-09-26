import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

/**
 * Cartão selecionável das abas (proporção, layout): um botão com borda que
 * ganha o realce do `primary` quando é a opção em uso.
 */
export function CartaoOpcao({
  ativo,
  className,
  ...resto
}: ComponentProps<'button'> & { ativo: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={ativo}
      className={cn(
        'flex cursor-pointer flex-col items-center rounded-lg border bg-card p-2 text-card-foreground shadow-xs transition-[color,background-color,border-color,box-shadow] outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50',
        ativo && 'border-primary bg-primary/5 ring-1 ring-primary/40 hover:bg-primary/10',
        className,
      )}
      {...resto}
    />
  )
}
