import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { ArrowLeft, ArrowRight, Scissors } from 'lucide-react'
import { BarraProgresso } from './componentes/BarraProgresso'
import { BandejaImagens } from './componentes/BandejaImagens'
import { Etapa1Imagens } from './componentes/etapas/Etapa1Imagens'
import { Etapa2Destino } from './componentes/etapas/Etapa2Destino'
import { Etapa3Fundo } from './componentes/etapas/Etapa3Fundo'
import { Etapa4Layout } from './componentes/etapas/Etapa4Layout'
import { Etapa5Montagem } from './componentes/etapas/Etapa5Montagem'
import { Etapa6Exportar } from './componentes/etapas/Etapa6Exportar'
import { Botao } from './componentes/ui/Botao'
import {
  maxEtapaLiberada,
  TOTAL_ETAPAS,
  useColagemStore,
  type Etapa,
} from './store/useColagemStore'

const ROTULO_AVANCAR: Record<Etapa, string> = {
  1: 'Escolher destino',
  2: 'Escolher fundo',
  3: 'Escolher layout',
  4: 'Montar colagem',
  5: 'Ir para exportação',
  6: '',
}

export default function App() {
  const etapa = useColagemStore((s) => s.etapa)
  const proxima = useColagemStore((s) => s.proxima)
  const anterior = useColagemStore((s) => s.anterior)
  const maxLiberada = useColagemStore(maxEtapaLiberada)
  const atribuirImagem = useColagemStore((s) => s.atribuirImagem)
  const trocarSlots = useColagemStore((s) => s.trocarSlots)
  const imagens = useColagemStore((s) => s.imagens)

  const [arrastando, setArrastando] = useState<string | null>(null)

  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  )

  function aoIniciar(e: DragStartEvent) {
    const dados = e.active.data.current
    if (dados?.tipo === 'imagem') setArrastando(dados.imagemId as string)
    if (dados?.tipo === 'slot') {
      const slot = useColagemStore
        .getState()
        .slots.find((s) => s.slotId === (dados.slotId as string))
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

  const imagemArrastada = imagens.find((i) => i.id === arrastando)
  const podeAvancar = etapa < TOTAL_ETAPAS && etapa + 1 <= maxLiberada
  const semRolagem = etapa === 5

  return (
    <DndContext
      sensors={sensores}
      onDragStart={aoIniciar}
      onDragEnd={aoFinalizar}
      onDragCancel={() => setArrastando(null)}
    >
      <div className="flex h-full flex-col">
        <header className="flex items-center justify-between gap-6 border-b border-neutral-800 px-5 py-3">
          <div className="flex items-center gap-2">
            <Scissors size={18} className="text-violet-400" />
            <span className="font-semibold">Colagem de Fotos</span>
            <span className="hidden text-xs text-neutral-500 lg:inline">
              · local, sem envio para a internet
            </span>
          </div>
          <BarraProgresso />
        </header>

        <div className="flex min-h-0 flex-1">
          <BandejaImagens />

          <main className={`min-w-0 flex-1 ${semRolagem ? 'overflow-hidden' : 'overflow-y-auto'}`}>
            {etapa === 5 ? (
              <Etapa5Montagem />
            ) : (
              <div className="p-8">
                {etapa === 1 && <Etapa1Imagens />}
                {etapa === 2 && <Etapa2Destino />}
                {etapa === 3 && <Etapa3Fundo />}
                {etapa === 4 && <Etapa4Layout />}
                {etapa === 6 && <Etapa6Exportar />}
              </div>
            )}
          </main>
        </div>

        <footer className="flex items-center justify-between border-t border-neutral-800 px-5 py-3">
          <Botao variante="fantasma" onClick={anterior} disabled={etapa === 1}>
            <ArrowLeft size={15} /> Voltar
          </Botao>

          <span className="text-xs text-neutral-500">
            Etapa {etapa} de {TOTAL_ETAPAS}
          </span>

          {etapa < TOTAL_ETAPAS ? (
            <Botao variante="primario" onClick={proxima} disabled={!podeAvancar}>
              {ROTULO_AVANCAR[etapa]} <ArrowRight size={15} />
            </Botao>
          ) : (
            <span className="w-32" />
          )}
        </footer>
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
