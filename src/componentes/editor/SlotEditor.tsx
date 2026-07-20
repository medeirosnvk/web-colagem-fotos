import { useRef, type PointerEvent, type WheelEvent } from 'react'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { GripVertical, ImageOff, Trash2 } from 'lucide-react'
import type { EstadoSlot, Imagem, Retangulo } from '../../tipos'
import { retanguloDaImagem, clamp } from '../../lib/cover'
import { useColagemStore } from '../../store/useColagemStore'

interface Props {
  slotId: string
  /**
   * Chave única da instância de `TelaColagem` que desenhou este slot.
   *
   * Os ids de slot (`s1`, `s2`…) vêm do layout e se repetem entre lâminas, e a
   * mesma lâmina aparece duas vezes na tela: na colagem grande e na miniatura
   * do painel. O dnd-kit exige id único por contexto — com ids repetidos ele
   * não acha droppable nenhum e o drop simplesmente não acontece. Por isso a
   * chave vem da instância (via `useId`), não da lâmina.
   */
  instancia: string
  destino: Retangulo
  estado: EstadoSlot
  imagem?: Imagem
  escala: number
  interativo: boolean
  numero: number
  /** Contorno na cor de fundo, em px do canvas final. */
  contorno: number
  corFundo: string
}

export function SlotEditor({
  slotId,
  instancia,
  destino,
  estado,
  imagem,
  escala,
  interativo,
  numero,
  contorno,
  corFundo,
}: Props) {
  const selecionado = useColagemStore((s) => s.slotSelecionado === slotId)
  const permitirReduzir = useColagemStore((s) => s.permitirReduzir)
  const selecionarSlot = useColagemStore((s) => s.selecionarSlot)
  const ajustarSlot = useColagemStore((s) => s.ajustarSlot)
  const limparSlot = useColagemStore((s) => s.limparSlot)

  const arraste = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null)
  /** Onde o ponteiro desceu — serve para separar clique de arrasto. */
  const inicio = useRef<{ x: number; y: number } | null>(null)

  const { setNodeRef: refSolta, isOver } = useDroppable({
    id: `slot:${instancia}:${slotId}`,
    data: { tipo: 'slot', slotId },
    disabled: !interativo,
  })

  /**
   * A foto só vira "peça arrastável" enquanto **não** está selecionada: aí o
   * arrasto a leva para outro slot. Depois de selecionada, o mesmo gesto passa
   * a reposicionar a foto dentro do slot — são as duas coisas que se quer fazer
   * com uma foto, separadas por um clique.
   */
  const podeMudarDeSlot = interativo && !!imagem && !selecionado

  const {
    attributes,
    listeners,
    setNodeRef: refPega,
    isDragging,
  } = useDraggable({
    id: `slotdrag:${instancia}:${slotId}`,
    data: { tipo: 'slot', slotId },
    disabled: !podeMudarDeSlot,
  })

  // A alça continua movendo a foto mesmo com o slot selecionado — é a saída
  // para quem já ajustou o enquadramento e só então quis trocar de lugar.
  const alca = useDraggable({
    id: `slotalca:${instancia}:${slotId}`,
    data: { tipo: 'slot', slotId },
    disabled: !interativo || !imagem,
  })

  // Geometria idêntica à da exportação, só multiplicada pela escala do preview.
  const desenho = imagem
    ? retanguloDaImagem(destino, imagem.largura, imagem.altura, estado)
    : null

  function aoApontar(e: PointerEvent<HTMLDivElement>) {
    if (!interativo || !imagem) return
    inicio.current = { x: e.clientX, y: e.clientY }

    // Slot não selecionado: quem manda no gesto é o dnd-kit (levar para outro
    // slot). Não capturamos o ponteiro nem começamos a reposicionar.
    if (!selecionado) return

    e.currentTarget.setPointerCapture(e.pointerId)
    arraste.current = { x: e.clientX, y: e.clientY, offsetX: estado.offsetX, offsetY: estado.offsetY }
  }

  /**
   * O `onPointerDown` do dnd-kit e o nosso precisam conviver no mesmo elemento.
   * Como o spread de `listeners` vem antes no JSX, declarar `onPointerDown`
   * depois o substituiria e o sensor nunca dispararia — daí a composição
   * explícita.
   */
  function aoDescer(e: PointerEvent<HTMLDivElement>) {
    aoApontar(e)
    if (podeMudarDeSlot) listeners?.onPointerDown?.(e)
  }

  function aoMover(e: PointerEvent<HTMLDivElement>) {
    if (!arraste.current || !imagem || !desenho) return

    // Converte o deslocamento do mouse (px de tela) em variação de offset.
    const folgaX = Math.abs(desenho.w - destino.w) / 2
    const folgaY = Math.abs(desenho.h - destino.h) / 2
    const dx = (e.clientX - arraste.current.x) / escala
    const dy = (e.clientY - arraste.current.y) / escala

    ajustarSlot(slotId, {
      offsetX: folgaX > 0.5 ? clamp(arraste.current.offsetX + dx / folgaX, -1, 1) : 0,
      offsetY: folgaY > 0.5 ? clamp(arraste.current.offsetY + dy / folgaY, -1, 1) : 0,
    })
  }

  function aoSoltar(e: PointerEvent<HTMLDivElement>) {
    // Ponteiro desceu e subiu praticamente no mesmo lugar: foi clique, não
    // arrasto — e clique é o que seleciona a foto para poder reposicioná-la.
    const p = inicio.current
    if (p && imagem && Math.hypot(e.clientX - p.x, e.clientY - p.y) < 4) {
      selecionarSlot(slotId)
    }
    inicio.current = null
    arraste.current = null
    e.currentTarget.releasePointerCapture?.(e.pointerId)
  }

  function aoRolar(e: WheelEvent<HTMLDivElement>) {
    if (!interativo || !imagem) return
    const minimo = permitirReduzir ? 0.3 : 1
    const fator = e.deltaY < 0 ? 1.06 : 1 / 1.06
    ajustarSlot(slotId, { escala: clamp(estado.escala * fator, minimo, 5) })
    selecionarSlot(slotId)
  }

  const vazio = !imagem

  return (
    <div
      ref={refSolta}
      className={`absolute overflow-hidden ${isDragging || alca.isDragging ? 'opacity-40' : ''}`}
      style={{
        left: destino.x * escala,
        top: destino.y * escala,
        width: destino.w * escala,
        height: destino.h * escala,
        // outline fica fora da caixa sem afetar o layout — equivale ao
        // fillRect expandido que a exportação pinta antes da foto.
        outline: contorno ? `${contorno * escala}px solid ${corFundo}` : undefined,
      }}
    >
      <div
        ref={refPega}
        {...(podeMudarDeSlot ? listeners : {})}
        {...(podeMudarDeSlot ? attributes : {})}
        className="group relative h-full w-full"
        onPointerDown={aoDescer}
        onPointerMove={aoMover}
        onPointerUp={aoSoltar}
        onPointerCancel={aoSoltar}
        onWheel={aoRolar}
        style={{
          cursor: interativo && imagem ? (selecionado ? 'move' : 'grab') : 'default',
          touchAction: 'none',
        }}
      >
        {imagem && desenho && (
          <img
            src={imagem.url}
            alt=""
            draggable={false}
            className="pointer-events-none absolute max-w-none select-none"
            style={{
              left: (desenho.x - destino.x) * escala,
              top: (desenho.y - destino.y) * escala,
              width: desenho.w * escala,
              height: desenho.h * escala,
            }}
          />
        )}

        {vazio && interativo && (
          <div
            className={`flex h-full w-full flex-col items-center justify-center gap-1 border-2 border-dashed text-center transition-colors ${
              isOver
                ? 'border-violet-400 bg-violet-500/25 text-violet-100'
                : 'border-neutral-500/60 bg-neutral-500/10 text-neutral-400'
            }`}
          >
            <ImageOff size={16} />
            <span className="px-1 text-[11px] leading-tight">
              {isOver ? 'Solte aqui' : `Slot ${numero}`}
            </span>
          </div>
        )}

        {isOver && !vazio && (
          <div className="pointer-events-none absolute inset-0 border-2 border-violet-400 bg-violet-500/25" />
        )}

        {interativo && !vazio && (
          <>
            <div
              className={`pointer-events-none absolute inset-0 transition-colors ${
                selecionado ? 'ring-2 ring-violet-400 ring-inset' : ''
              }`}
            />
            <button
              ref={alca.setNodeRef}
              {...alca.attributes}
              {...alca.listeners}
              title="Arrastar para outro slot"
              className="absolute top-1 left-1 cursor-grab rounded bg-black/60 p-1 text-neutral-200 opacity-0 transition-opacity group-hover:opacity-100"
            >
              <GripVertical size={13} />
            </button>
            <button
              type="button"
              title="Remover do slot"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => limparSlot(slotId)}
              className="absolute top-1 right-1 rounded bg-black/60 p-1 text-neutral-200 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-400"
            >
              <Trash2 size={13} />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
