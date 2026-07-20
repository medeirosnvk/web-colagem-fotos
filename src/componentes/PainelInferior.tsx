import { useState } from 'react'
import { ChevronDown, Crop, Images, Layers, LayoutGrid, SlidersHorizontal } from 'lucide-react'
import { ConteudoFotos } from './BandejaImagens'
import { ConteudoLaminas } from './PainelLaminas'
import { AbaFormato } from './paineis/AbaFormato'
import { AbaLayout } from './paineis/AbaLayout'
import { AbaAjuste } from './paineis/AbaAjuste'
import { useColagemStore } from '../store/useColagemStore'

type Aba = 'fotos' | 'laminas' | 'formato' | 'layout' | 'ajuste'

const ABAS: { id: Aba; rotulo: string; Icone: typeof Crop }[] = [
  { id: 'fotos', rotulo: 'Fotos', Icone: Images },
  { id: 'laminas', rotulo: 'Lâminas', Icone: Layers },
  { id: 'formato', rotulo: 'Formato', Icone: Crop },
  { id: 'layout', rotulo: 'Layout', Icone: LayoutGrid },
  { id: 'ajuste', rotulo: 'Ajustes', Icone: SlidersHorizontal },
]

/**
 * Gaveta do layout compacto: as quatro colunas do layout amplo viram abas aqui
 * embaixo, e a colagem fica com o resto da tela. Recolhível, porque em celular
 * ver a colagem inteira importa mais do que ver os controles.
 */
export function PainelInferior() {
  const [aba, setAba] = useState<Aba>('fotos')
  const [aberta, setAberta] = useState(true)
  const totalFotos = useColagemStore((s) => s.imagens.length)
  const totalLaminas = useColagemStore((s) => s.laminas.length)

  const contador: Partial<Record<Aba, number>> = { fotos: totalFotos, laminas: totalLaminas }

  function aoTocar(id: Aba) {
    // Tocar na aba já aberta recolhe a gaveta e devolve a tela à colagem.
    if (id === aba && aberta) setAberta(false)
    else {
      setAba(id)
      setAberta(true)
    }
  }

  return (
    <div className="flex shrink-0 flex-col border-t border-borda bg-painel">
      <nav className="flex">
        {ABAS.map(({ id, rotulo, Icone }) => {
          const ativa = aba === id && aberta
          return (
            <button
              key={id}
              type="button"
              onClick={() => aoTocar(id)}
              aria-current={ativa ? 'page' : undefined}
              className={`flex flex-1 flex-col items-center gap-0.5 border-t-2 px-1 py-2 text-[10px] transition-colors ${
                ativa
                  ? 'border-violet-500 text-realce-forte'
                  : 'border-transparent text-suave hover:text-texto'
              }`}
            >
              <span className="relative">
                <Icone size={17} />
                {contador[id] ? (
                  <span className="absolute -top-1.5 -right-2 rounded-full bg-elevado px-1 text-[9px] text-suave">
                    {contador[id]}
                  </span>
                ) : null}
              </span>
              {rotulo}
            </button>
          )
        })}

        <button
          type="button"
          onClick={() => setAberta((v) => !v)}
          title={aberta ? 'Recolher painel' : 'Abrir painel'}
          aria-label={aberta ? 'Recolher painel' : 'Abrir painel'}
          aria-expanded={aberta}
          className="flex w-10 shrink-0 items-center justify-center border-t-2 border-transparent text-suave"
        >
          <ChevronDown
            size={16}
            className={`transition-transform ${aberta ? '' : 'rotate-180'}`}
          />
        </button>
      </nav>

      {aberta && (
        <div className="max-h-[46svh] min-h-0 overflow-y-auto">
          {aba === 'fotos' && <ConteudoFotos colunas="grid-cols-4 sm:grid-cols-6" />}
          {aba === 'laminas' && <ConteudoLaminas horizontal />}
          {aba === 'formato' && (
            <div className="p-4">
              <AbaFormato />
            </div>
          )}
          {aba === 'layout' && (
            <div className="p-4">
              <AbaLayout />
            </div>
          )}
          {aba === 'ajuste' && (
            <div className="p-4">
              <AbaAjuste />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
