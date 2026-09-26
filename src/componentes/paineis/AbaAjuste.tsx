import { Eraser, Maximize2, MousePointer2, RotateCcw, Wand2 } from 'lucide-react'
import { laminaAtiva, useColagemStore } from '../../store/useColagemStore'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Secao } from './PainelLateral'

export function AbaAjuste() {
  const lamina = useColagemStore(laminaAtiva)
  const slotSelecionado = useColagemStore((s) => s.slotSelecionado)
  const permitirReduzir = useColagemStore((s) => s.permitirReduzir)
  const temImagens = useColagemStore((s) => s.imagens.length > 0)
  const ajustarSlot = useColagemStore((s) => s.ajustarSlot)
  const redefinirSlot = useColagemStore((s) => s.redefinirSlot)
  const preencher = useColagemStore((s) => s.preencherAutomaticamente)
  const esvaziar = useColagemStore((s) => s.esvaziarLamina)
  const alternarPermitirReduzir = useColagemStore((s) => s.alternarPermitirReduzir)
  const definirEspacamento = useColagemStore((s) => s.definirEspacamento)

  const { slots, gap, margem } = lamina
  const slot = slots.find((s) => s.slotId === slotSelecionado)
  const indice = slots.findIndex((s) => s.slotId === slotSelecionado) + 1
  const minimo = permitirReduzir ? 0.3 : 1

  return (
    <div className="space-y-6">
      <Secao titulo={slot?.imagemId ? `Foto do slot ${indice}` : 'Foto selecionada'}>
        {slot?.imagemId ? (
          <div className="space-y-5">
            <Controle
              rotulo={
                <>
                  <Maximize2 className="size-3" /> Zoom
                </>
              }
              valor={`${Math.round(slot.escala * 100)}%`}
              ajuda="100% preenche o slot exatamente. Role o mouse sobre a foto para o mesmo efeito."
            >
              <Slider
                min={minimo}
                max={5}
                step={0.01}
                value={[slot.escala]}
                onValueChange={([v]) => ajustarSlot(slot.slotId, { escala: v })}
              />
            </Controle>

            <Controle rotulo="Posição horizontal">
              <Slider
                min={-1}
                max={1}
                step={0.01}
                value={[slot.offsetX]}
                onValueChange={([v]) => ajustarSlot(slot.slotId, { offsetX: v })}
              />
            </Controle>

            <Controle rotulo="Posição vertical">
              <Slider
                min={-1}
                max={1}
                step={0.01}
                value={[slot.offsetY]}
                onValueChange={([v]) => ajustarSlot(slot.slotId, { offsetY: v })}
              />
            </Controle>

            <Button
              variant="outline"
              size="sm"
              onClick={() => redefinirSlot(slot.slotId)}
              className="w-full"
            >
              <RotateCcw /> Recentralizar
            </Button>
          </div>
        ) : (
          <p className="flex items-center gap-2 rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
            <MousePointer2 className="size-3.5 shrink-0" /> Clique numa foto da colagem para
            ajustar zoom e posição.
          </p>
        )}
      </Secao>

      <Secao titulo="Preenchimento">
        <div className="grid gap-2">
          <Button variant="secondary" size="sm" onClick={preencher} disabled={!temImagens}>
            <Wand2 /> Preencher slots vazios
          </Button>
          <Button variant="ghost" size="sm" onClick={() => esvaziar()}>
            <Eraser /> Esvaziar todos os slots
          </Button>
        </div>
      </Secao>

      <Secao titulo="Espaçamento">
        <div className="space-y-5">
          <Controle rotulo="Entre as fotos" valor={`${gap} px`}>
            <Slider
              min={0}
              max={80}
              step={2}
              value={[gap]}
              onValueChange={([v]) => definirEspacamento(v, margem)}
            />
          </Controle>

          <Controle rotulo="Margem externa" valor={`${margem} px`}>
            <Slider
              min={0}
              max={120}
              step={2}
              value={[margem]}
              onValueChange={([v]) => definirEspacamento(gap, v)}
            />
          </Controle>

          <div className="flex items-start gap-2.5">
            <Checkbox
              id="permitir-reduzir"
              checked={permitirReduzir}
              onCheckedChange={alternarPermitirReduzir}
              className="mt-0.5"
            />
            <div className="grid gap-1">
              <Label htmlFor="permitir-reduzir" className="text-xs font-normal">
                Permitir reduzir além do preenchimento
              </Label>
              <p className="text-xs leading-snug text-muted-foreground">
                O vão que sobrar dentro do slot fica com a cor de fundo.
              </p>
            </div>
          </div>
        </div>
      </Secao>
    </div>
  )
}

/** Rótulo + valor atual em cima, slider embaixo, ajuda opcional no pé. */
function Controle({
  rotulo,
  valor,
  ajuda,
  children,
}: {
  rotulo: ReactNode
  valor?: string
  ajuda?: string
  children: ReactNode
}) {
  return (
    <div className="grid gap-2.5">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-foreground">{rotulo}</span>
        {valor && <span className="text-muted-foreground tabular-nums">{valor}</span>}
      </div>
      {children}
      {ajuda && <p className="text-xs leading-snug text-muted-foreground">{ajuda}</p>}
    </div>
  )
}
