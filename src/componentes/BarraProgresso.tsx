import { Check } from 'lucide-react'
import {
  maxEtapaLiberada,
  TOTAL_ETAPAS,
  useColagemStore,
  type Etapa,
} from '../store/useColagemStore'

const TITULOS: Record<Etapa, string> = {
  1: 'Imagens',
  2: 'Destino',
  3: 'Fundo',
  4: 'Layout',
  5: 'Montagem',
  6: 'Exportar',
}

export function BarraProgresso() {
  const etapa = useColagemStore((s) => s.etapa)
  const irPara = useColagemStore((s) => s.irPara)
  const maxLiberada = useColagemStore(maxEtapaLiberada)

  return (
    <nav aria-label="Etapas" className="flex items-center gap-1">
      {(Array.from({ length: TOTAL_ETAPAS }, (_, i) => i + 1) as Etapa[]).map((n, i) => {
        const atual = n === etapa
        const concluida = n < etapa
        const liberada = n <= maxLiberada

        return (
          <div key={n} className="flex items-center gap-1">
            {i > 0 && (
              <span
                className={`h-px w-6 ${concluida || atual ? 'bg-violet-500' : 'bg-neutral-800'}`}
              />
            )}
            <button
              type="button"
              disabled={!liberada}
              onClick={() => irPara(n)}
              aria-current={atual ? 'step' : undefined}
              title={liberada ? `Ir para ${TITULOS[n]}` : 'Conclua as etapas anteriores'}
              className={`flex items-center gap-2 rounded-full py-1.5 pr-3 pl-1.5 text-sm transition-colors ${
                atual
                  ? 'bg-violet-600 text-white'
                  : liberada
                    ? 'text-neutral-300 hover:bg-neutral-800'
                    : 'cursor-not-allowed text-neutral-600'
              }`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                  atual
                    ? 'bg-white/20'
                    : concluida
                      ? 'bg-violet-500/20 text-violet-300'
                      : 'bg-neutral-800'
                }`}
              >
                {concluida ? <Check size={13} /> : n}
              </span>
              {TITULOS[n]}
            </button>
          </div>
        )
      })}
    </nav>
  )
}
