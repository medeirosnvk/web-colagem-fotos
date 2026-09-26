import type { ReactNode } from 'react'
import { Crop, LayoutGrid, SlidersHorizontal } from 'lucide-react'
import { AbaFormato } from './AbaFormato'
import { AbaLayout } from './AbaLayout'
import { AbaAjuste } from './AbaAjuste'
import { FAIXA } from '../ui/faixa'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// A exportação não é uma aba: mora nos controles do topo, disponível o tempo
// todo, sem tirar o usuário de onde ele está.
const ABAS = [
  { id: 'formato', rotulo: 'Formato', Icone: Crop, Conteudo: AbaFormato },
  { id: 'layout', rotulo: 'Layout', Icone: LayoutGrid, Conteudo: AbaLayout },
  { id: 'ajuste', rotulo: 'Ajustes', Icone: SlidersHorizontal, Conteudo: AbaAjuste },
]

/** Cabeçalho de bloco dentro de uma aba. */
export function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-2.5 text-xs font-medium text-muted-foreground">{titulo}</h3>
      {children}
    </section>
  )
}

export function PainelLateral() {
  return (
    <Tabs defaultValue="formato" className="flex w-80 shrink-0 flex-col gap-0 border-l bg-sidebar">
      <div className={`${FAIXA} px-3`}>
        <TabsList className="grid h-8! w-full grid-cols-3">
          {ABAS.map(({ id, rotulo, Icone }) => (
            <TabsTrigger key={id} value={id} className="text-xs">
              <Icone className="size-3.5" />
              {rotulo}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {ABAS.map(({ id, Conteudo }) => (
        <TabsContent key={id} value={id} className="min-h-0 overflow-y-auto p-4">
          <Conteudo />
        </TabsContent>
      ))}
    </Tabs>
  )
}
