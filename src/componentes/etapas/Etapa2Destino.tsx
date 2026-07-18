import { Camera, Clapperboard, LayoutGrid, Sparkles, Users } from 'lucide-react'
import { useColagemStore } from '../../store/useColagemStore'
import { Cartao } from '../ui/Botao'
import { FORMATOS } from '../../data/formatos'
import type { Destino, Plataforma } from '../../tipos'

const PLATAFORMAS: { id: Plataforma; nome: string; Icone: typeof Camera }[] = [
  { id: 'instagram', nome: 'Instagram', Icone: Camera },
  { id: 'facebook', nome: 'Facebook', Icone: Users },
]

const DESTINOS: { id: Destino; nome: string; descricao: string; Icone: typeof LayoutGrid }[] = [
  { id: 'feed', nome: 'Feed', descricao: 'Publicação no perfil', Icone: LayoutGrid },
  { id: 'stories', nome: 'Stories', descricao: 'Tela cheia, 24 h', Icone: Sparkles },
  { id: 'reels', nome: 'Reels', descricao: 'Capa vertical', Icone: Clapperboard },
]

export function Etapa2Destino() {
  const plataforma = useColagemStore((s) => s.plataforma)
  const destino = useColagemStore((s) => s.destino)
  const definir = useColagemStore((s) => s.definirPlataformaDestino)

  return (
    <div className="mx-auto w-full max-w-3xl">
      <h1 className="text-2xl font-semibold">Onde essa colagem vai ser publicada?</h1>
      <p className="mt-1 text-sm text-neutral-400">
        As proporções disponíveis na próxima etapa mudam conforme a plataforma e o destino.
      </p>

      <h2 className="mt-8 mb-3 text-sm font-medium text-neutral-400">Plataforma</h2>
      <div className="grid grid-cols-2 gap-3">
        {PLATAFORMAS.map(({ id, nome, Icone }) => (
          <Cartao
            key={id}
            ativo={plataforma === id}
            onClick={() => definir(id, destino ?? 'feed')}
            className="flex items-center gap-3"
          >
            <Icone size={20} className="text-violet-400" />
            <span className="font-medium">{nome}</span>
          </Cartao>
        ))}
      </div>

      <h2 className="mt-8 mb-3 text-sm font-medium text-neutral-400">Destino</h2>
      <div className="grid grid-cols-3 gap-3">
        {DESTINOS.map(({ id, nome, descricao, Icone }) => (
          <Cartao
            key={id}
            ativo={destino === id}
            onClick={() => definir(plataforma ?? 'instagram', id)}
          >
            <Icone size={18} className="mb-2 text-violet-400" />
            <p className="font-medium">{nome}</p>
            <p className="mt-0.5 text-xs text-neutral-500">{descricao}</p>
          </Cartao>
        ))}
      </div>

      {plataforma && destino && (
        <p className="mt-6 text-sm text-neutral-400">
          Proporções disponíveis:{' '}
          <span className="text-neutral-200">
            {FORMATOS.filter((f) => f.plataforma === plataforma && f.destino === destino)
              .map((f) => `${f.proporcao} (${f.largura}×${f.altura})`)
              .join(' · ')}
          </span>
        </p>
      )}
    </div>
  )
}
