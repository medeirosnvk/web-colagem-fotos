import { useState, type ReactNode } from 'react'
import { Crop, LayoutGrid, SlidersHorizontal } from 'lucide-react'
import { AbaFormato } from './AbaFormato'
import { AbaLayout } from './AbaLayout'
import { AbaAjuste } from './AbaAjuste'
import { ALTURA_FAIXA } from '../ui/faixa'

// A exportação não é uma aba: mora nos controles do topo, disponível o tempo
// todo, sem tirar o usuário de onde ele está.
type Aba = 'formato' | 'layout' | 'ajuste'

const ABAS: { id: Aba; rotulo: string; Icone: typeof Crop }[] = [
  { id: 'formato', rotulo: 'Formato', Icone: Crop },
  { id: 'layout', rotulo: 'Layout', Icone: LayoutGrid },
  { id: 'ajuste', rotulo: 'Ajustes', Icone: SlidersHorizontal },
]

/** Cabeçalho de bloco dentro de uma aba. */
export function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-[11px] font-semibold tracking-wide text-neutral-500 uppercase">
        {titulo}
      </h3>
      {children}
    </section>
  )
}

export function PainelLateral() {
  const [aba, setAba] = useState<Aba>('formato')

  return (
    <aside className="flex w-80 shrink-0 flex-col border-l border-neutral-800 bg-neutral-950">
      <nav className={`grid ${ALTURA_FAIXA} shrink-0 grid-cols-3 border-b border-neutral-800`}>
        {ABAS.map(({ id, rotulo, Icone }) => (
          <button
            key={id}
            type="button"
            onClick={() => setAba(id)}
            aria-current={aba === id ? 'page' : undefined}
            className={`flex h-full items-center justify-center gap-1.5 border-b-2 px-1 text-[11px] transition-colors ${
              aba === id
                ? 'border-violet-500 text-violet-300'
                : 'border-transparent text-neutral-500 hover:bg-neutral-900 hover:text-neutral-300'
            }`}
          >
            <Icone size={16} />
            {rotulo}
          </button>
        ))}
      </nav>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {aba === 'formato' && <AbaFormato />}
        {aba === 'layout' && <AbaLayout />}
        {aba === 'ajuste' && <AbaAjuste />}
      </div>
    </aside>
  )
}
