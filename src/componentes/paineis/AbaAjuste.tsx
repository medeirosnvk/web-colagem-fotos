import { Eraser, Maximize2, MousePointer2, RotateCcw, Wand2 } from 'lucide-react'
import { laminaAtiva, useColagemStore } from '../../store/useColagemStore'
import { Botao } from '../ui/Botao'
import { Secao } from './PainelLateral'

export function AbaAjuste() {
  const lamina = useColagemStore(laminaAtiva)
  const slotSelecionado = useColagemStore((s) => s.slotSelecionado)
  const permitirReduzir = useColagemStore((s) => s.permitirReduzir)
  const temImagens = useColagemStore((s) => s.imagens.length > 0)
  const ajustarSlot = useColagemStore((s) => s.ajustarSlot)
  const redefinirSlot = useColagemStore((s) => s.redefinirSlot)
  const preencher = useColagemStore((s) => s.preencherAutomaticamente)
  const esvaziar = useColagemStore((s) => s.esvaziarSlots)
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
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1.5 flex items-center justify-between text-xs text-neutral-400">
                <span className="flex items-center gap-1.5">
                  <Maximize2 size={12} /> Zoom
                </span>
                <span className="tabular-nums text-neutral-300">
                  {Math.round(slot.escala * 100)}%
                </span>
              </span>
              <input
                type="range"
                min={minimo}
                max={5}
                step={0.01}
                value={slot.escala}
                onChange={(e) => ajustarSlot(slot.slotId, { escala: Number(e.target.value) })}
              />
              <span className="mt-1 block text-[11px] leading-snug text-neutral-600">
                100% preenche o slot exatamente. Role o mouse sobre a foto para o mesmo efeito.
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs text-neutral-400">Posição horizontal</span>
              <input
                type="range"
                min={-1}
                max={1}
                step={0.01}
                value={slot.offsetX}
                onChange={(e) => ajustarSlot(slot.slotId, { offsetX: Number(e.target.value) })}
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs text-neutral-400">Posição vertical</span>
              <input
                type="range"
                min={-1}
                max={1}
                step={0.01}
                value={slot.offsetY}
                onChange={(e) => ajustarSlot(slot.slotId, { offsetY: Number(e.target.value) })}
              />
            </label>

            <Botao
              variante="fantasma"
              onClick={() => redefinirSlot(slot.slotId)}
              className="w-full"
            >
              <RotateCcw size={14} /> Recentralizar
            </Botao>
          </div>
        ) : (
          <p className="flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900 p-3 text-xs text-neutral-500">
            <MousePointer2 size={12} className="shrink-0" /> Clique numa foto da colagem para
            ajustar zoom e posição.
          </p>
        )}
      </Secao>

      <Secao titulo="Preenchimento">
        <div className="space-y-2">
          <Botao
            variante="secundario"
            onClick={preencher}
            disabled={!temImagens}
            className="w-full"
          >
            <Wand2 size={14} /> Preencher slots vazios
          </Botao>
          <Botao variante="fantasma" onClick={esvaziar} className="w-full">
            <Eraser size={14} /> Esvaziar todos os slots
          </Botao>
        </div>
      </Secao>

      <Secao titulo="Espaçamento">
        <label className="block">
          <span className="mb-1.5 flex items-center justify-between text-xs text-neutral-400">
            Entre as fotos
            <span className="tabular-nums text-neutral-300">{gap} px</span>
          </span>
          <input
            type="range"
            min={0}
            max={80}
            step={2}
            value={gap}
            onChange={(e) => definirEspacamento(Number(e.target.value), margem)}
          />
        </label>

        <label className="mt-4 block">
          <span className="mb-1.5 flex items-center justify-between text-xs text-neutral-400">
            Margem externa
            <span className="tabular-nums text-neutral-300">{margem} px</span>
          </span>
          <input
            type="range"
            min={0}
            max={120}
            step={2}
            value={margem}
            onChange={(e) => definirEspacamento(gap, Number(e.target.value))}
          />
        </label>

        <label className="mt-4 flex cursor-pointer items-start gap-2 text-xs text-neutral-400">
          <input
            type="checkbox"
            checked={permitirReduzir}
            onChange={alternarPermitirReduzir}
            className="mt-0.5 accent-violet-500"
          />
          <span>
            Permitir reduzir além do preenchimento
            <span className="mt-0.5 block text-[11px] leading-snug text-neutral-600">
              O vão que sobrar dentro do slot fica com a cor de fundo.
            </span>
          </span>
        </label>
      </Secao>
    </div>
  )
}
