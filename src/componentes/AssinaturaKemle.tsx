import { cn } from '@/lib/utils'

/** Assinatura "Um produto Kemle". O símbolo é uma máscara local (segue a cor do texto nos dois temas); nenhuma requisição extra. */
export function AssinaturaKemle({ className }: { className?: string }) {
  const mascara = 'url(/kemle-mark.svg) center / contain no-repeat'
  return (
    <p className={cn('flex items-center justify-center gap-1.5 text-xs text-muted-foreground', className)}>
      <span
        aria-hidden="true"
        className="inline-block size-3.5 shrink-0 bg-current"
        style={{ WebkitMask: mascara, mask: mascara }}
      />
      <span>
        Um produto{' '}
        <a
          href="https://kemle.com.br"
          target="_blank"
          rel="noopener"
          className="font-medium underline-offset-2 hover:text-foreground hover:underline"
        >
          Kemle
        </a>
      </span>
    </p>
  )
}
