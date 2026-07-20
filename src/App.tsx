import { useEffect, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { Moon, RotateCcw, Redo2, Sun, Undo2 } from 'lucide-react'
import { BandejaImagens } from './componentes/BandejaImagens'
import { BotaoExportar } from './componentes/BotaoExportar'
import { PainelLaminas } from './componentes/PainelLaminas'
import { AreaColagem } from './componentes/AreaColagem'
import { PainelLateral } from './componentes/paineis/PainelLateral'
import { PainelInferior } from './componentes/PainelInferior'
import { useCompacto } from './lib/useCompacto'
import { Logo } from './componentes/ui/Logo'
import { laminaAtiva, useColagemStore } from './store/useColagemStore'
import { useTemaStore } from './store/useTemaStore'

export default function App() {
  const atribuirImagem = useColagemStore((s) => s.atribuirImagem)
  const trocarSlots = useColagemStore((s) => s.trocarSlots)
  const imagens = useColagemStore((s) => s.imagens)
  const desfazer = useColagemStore((s) => s.desfazer)
  const refazer = useColagemStore((s) => s.refazer)
  const limparTudo = useColagemStore((s) => s.limparTudo)
  const podeDesfazer = useColagemStore((s) => s.passado.length > 0)
  const podeRefazer = useColagemStore((s) => s.futuro.length > 0)
  const compacto = useCompacto()
  const tema = useTemaStore((s) => s.tema)
  const alternarTema = useTemaStore((s) => s.alternar)

  const [arrastando, setArrastando] = useState<string | null>(null)

  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  )

  // Ctrl/⌘+Z desfaz, Ctrl+Shift+Z (ou Ctrl+Y) refaz.
  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if (!e.ctrlKey && !e.metaKey) return
      const alvo = e.target as HTMLElement | null
      if (alvo && (alvo.tagName === 'INPUT' || alvo.tagName === 'TEXTAREA')) return

      const tecla = e.key.toLowerCase()
      if (tecla === 'z') {
        e.preventDefault()
        if (e.shiftKey) refazer()
        else desfazer()
      } else if (tecla === 'y') {
        e.preventDefault()
        refazer()
      }
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [desfazer, refazer])

  function aoIniciar(e: DragStartEvent) {
    const dados = e.active.data.current
    if (dados?.tipo === 'imagem') setArrastando(dados.imagemId as string)
    if (dados?.tipo === 'slot') {
      const slot = laminaAtiva(useColagemStore.getState()).slots.find(
        (s) => s.slotId === (dados.slotId as string),
      )
      setArrastando(slot?.imagemId ?? null)
    }
  }

  function aoFinalizar(e: DragEndEvent) {
    setArrastando(null)
    const origem = e.active.data.current
    const alvo = e.over?.data.current
    if (!origem || alvo?.tipo !== 'slot') return

    if (origem.tipo === 'imagem') {
      atribuirImagem(alvo.slotId as string, origem.imagemId as string)
    } else if (origem.tipo === 'slot' && origem.slotId !== alvo.slotId) {
      trocarSlots(origem.slotId as string, alvo.slotId as string)
    }
  }

  function recomecar() {
    if (window.confirm('Descartar a colagem e as fotos carregadas?')) limparTudo()
  }

  const imagemArrastada = imagens.find((i) => i.id === arrastando)

  return (
    <DndContext
      sensors={sensores}
      onDragStart={aoIniciar}
      onDragEnd={aoFinalizar}
      onDragCancel={() => setArrastando(null)}
    >
      <div className="flex h-full flex-col">
        {/*
          Em tela estreita os controles não cabem ao lado da marca — e esconder
          função no celular seria pior. O cabeçalho quebra em duas linhas.
        */}
        <header className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5 border-b border-borda px-3 py-2 sm:flex-nowrap sm:gap-6 sm:px-5 sm:py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <Logo size={22} className="shrink-0" />
            <span className="truncate text-[15px] font-semibold tracking-tight">Phrame</span>
            <span className="hidden text-xs text-suave lg:inline">
              · colagens locais, sem envio para a internet
            </span>
          </div>

          <div className="flex w-full items-center justify-end gap-0.5 sm:w-auto sm:gap-1">
            <BotaoIcone
              titulo="Desfazer (Ctrl+Z)"
              onClick={desfazer}
              desabilitado={!podeDesfazer}
            >
              <Undo2 size={16} />
            </BotaoIcone>
            <BotaoIcone
              titulo="Refazer (Ctrl+Shift+Z)"
              onClick={refazer}
              desabilitado={!podeRefazer}
            >
              <Redo2 size={16} />
            </BotaoIcone>
            <span className="mx-2 hidden h-5 w-px bg-elevado sm:block" />
            <BotaoIcone
              titulo={tema === 'claro' ? 'Mudar para o tema escuro' : 'Mudar para o tema claro'}
              onClick={alternarTema}
            >
              {tema === 'claro' ? <Moon size={16} /> : <Sun size={16} />}
            </BotaoIcone>
            <BotaoIcone titulo="Recomeçar do zero" onClick={recomecar}>
              <RotateCcw size={15} />
            </BotaoIcone>
            <span className="mx-2 hidden h-5 w-px bg-elevado sm:block" />
            <BotaoExportar />
          </div>
        </header>

        {compacto ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <AreaColagem />
            <PainelInferior />
          </div>
        ) : (
          <div className="flex min-h-0 flex-1">
            <BandejaImagens />
            <PainelLaminas />
            <AreaColagem />
            <PainelLateral />
          </div>
        )}
      </div>

      <DragOverlay dropAnimation={null}>
        {imagemArrastada && (
          <img
            src={imagemArrastada.url}
            alt=""
            className="h-24 w-24 rounded-lg border-2 border-violet-400 object-cover shadow-2xl"
          />
        )}
      </DragOverlay>
    </DndContext>
  )
}

function BotaoIcone({
  titulo,
  onClick,
  desabilitado,
  children,
}: {
  titulo: string
  onClick: () => void
  desabilitado?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={titulo}
      aria-label={titulo}
      onClick={onClick}
      disabled={desabilitado}
      className="shrink-0 rounded-lg p-1.5 text-texto transition-colors hover:bg-elevado hover:text-texto disabled:cursor-not-allowed disabled:text-tenue disabled:hover:bg-transparent sm:p-2"
    >
      {children}
    </button>
  )
}
