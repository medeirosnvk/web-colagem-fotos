import { Camera, Clapperboard, Info, LayoutGrid, Sparkles, Star, Users } from 'lucide-react'
import { useColagemStore } from '../../store/useColagemStore'
import { formatoPorId, formatosDe } from '../../data/formatos'
import type { CorFundo, Destino, Plataforma } from '../../tipos'
import { Secao } from './PainelLateral'

const PLATAFORMAS: { id: Plataforma; nome: string; Icone: typeof Camera }[] = [
  { id: 'instagram', nome: 'Instagram', Icone: Camera },
  { id: 'facebook', nome: 'Facebook', Icone: Users },
]

const DESTINOS: { id: Destino; nome: string; Icone: typeof LayoutGrid }[] = [
  { id: 'feed', nome: 'Feed', Icone: LayoutGrid },
  { id: 'stories', nome: 'Stories', Icone: Sparkles },
  { id: 'reels', nome: 'Reels', Icone: Clapperboard },
]

const CORES: { valor: CorFundo; nome: string }[] = [
  { valor: '#FFFFFF', nome: 'Branco' },
  { valor: '#000000', nome: 'Preto' },
]

function Chip({
  ativo,
  onClick,
  children,
}: {
  ativo: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${
        ativo
          ? 'border-violet-500 bg-violet-500/15 text-violet-200'
          : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-600 hover:text-neutral-200'
      }`}
    >
      {children}
    </button>
  )
}

export function AbaFormato() {
  const plataforma = useColagemStore((s) => s.plataforma)
  const destino = useColagemStore((s) => s.destino)
  const formatoId = useColagemStore((s) => s.formatoId)
  const corFundo = useColagemStore((s) => s.corFundo)
  const definirPlataforma = useColagemStore((s) => s.definirPlataforma)
  const definirDestino = useColagemStore((s) => s.definirDestino)
  const definirFormato = useColagemStore((s) => s.definirFormato)
  const definirCorFundo = useColagemStore((s) => s.definirCorFundo)

  const formatos = formatosDe(plataforma, destino)
  const formato = formatoPorId(formatoId)

  const avisoGrid =
    plataforma === 'instagram' && destino === 'feed' && formato && formato.proporcao !== '3:4'

  return (
    <div className="space-y-6">
      <Secao titulo="Plataforma">
        <div className="grid grid-cols-2 gap-2">
          {PLATAFORMAS.map(({ id, nome, Icone }) => (
            <Chip key={id} ativo={plataforma === id} onClick={() => definirPlataforma(id)}>
              <Icone size={14} /> {nome}
            </Chip>
          ))}
        </div>
      </Secao>

      <Secao titulo="Destino">
        <div className="grid grid-cols-3 gap-2">
          {DESTINOS.map(({ id, nome, Icone }) => (
            <Chip key={id} ativo={destino === id} onClick={() => definirDestino(id)}>
              <Icone size={14} /> {nome}
            </Chip>
          ))}
        </div>
      </Secao>

      <Secao titulo="Proporção">
        <div className="grid grid-cols-2 gap-2">
          {formatos.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => definirFormato(f.id)}
              className={`flex flex-col items-center gap-2 rounded-lg border p-2.5 transition-colors ${
                formatoId === f.id
                  ? 'border-violet-500 bg-violet-500/10'
                  : 'border-neutral-800 bg-neutral-900 hover:border-neutral-600'
              }`}
            >
              <span className="flex h-12 items-center justify-center">
                <span
                  className="block rounded-sm border border-neutral-600 bg-neutral-800"
                  style={{ height: 44, width: Math.min(72, (44 * f.largura) / f.altura) }}
                />
              </span>
              <span className="flex items-center gap-1 text-xs font-medium text-neutral-200">
                {f.proporcao}
                {f.recomendado && <Star size={10} className="fill-amber-400 text-amber-400" />}
              </span>
              <span className="text-[10px] text-neutral-500">
                {f.largura}×{f.altura}
              </span>
            </button>
          ))}
        </div>

        {formato?.observacao && (
          <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed text-neutral-500">
            <Info size={12} className="mt-0.5 shrink-0 text-violet-400" />
            {formato.observacao}
          </p>
        )}

        {avisoGrid && (
          <p className="mt-2 flex items-start gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-[11px] leading-relaxed text-amber-200">
            <Info size={12} className="mt-0.5 shrink-0" />
            <span>
              No grid do perfil o Instagram recorta para <strong>3:4</strong>. Centralize o que
              importa — ou escolha 3:4 para ver exatamente a miniatura.
            </span>
          </p>
        )}
      </Secao>

      <Secao titulo="Cor de fundo">
        <div className="grid grid-cols-2 gap-2">
          {CORES.map(({ valor, nome }) => (
            <button
              key={valor}
              type="button"
              onClick={() => definirCorFundo(valor)}
              className={`flex items-center gap-2 rounded-lg border p-2.5 text-xs transition-colors ${
                corFundo === valor
                  ? 'border-violet-500 bg-violet-500/10 text-neutral-100'
                  : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-600'
              }`}
            >
              <span
                className="h-5 w-5 shrink-0 rounded border border-neutral-600"
                style={{ backgroundColor: valor }}
              />
              {nome}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-neutral-600">
          Preenche margens e vãos entre as fotos — no editor e no arquivo exportado.
        </p>
      </Secao>
    </div>
  )
}
