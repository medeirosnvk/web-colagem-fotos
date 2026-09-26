import type { ComponentProps } from 'react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

/**
 * Botão só de ícone, com a dica num tooltip. A `dica` também vira o
 * `aria-label` — é o que o leitor de tela anuncia.
 */
export function BotaoIcone({
  dica,
  lado,
  variant = 'ghost',
  size = 'icon-sm',
  ...resto
}: ComponentProps<typeof Button> & {
  dica: string
  lado?: ComponentProps<typeof TooltipContent>['side']
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {/* span: botão desabilitado não dispara eventos, e o tooltip ainda deve aparecer */}
        <span className="inline-flex">
          <Button variant={variant} size={size} aria-label={dica} {...resto} />
        </span>
      </TooltipTrigger>
      <TooltipContent side={lado}>{dica}</TooltipContent>
    </Tooltip>
  )
}
