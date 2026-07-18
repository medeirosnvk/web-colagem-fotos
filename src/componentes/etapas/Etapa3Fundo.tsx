import { useColagemStore } from '../../store/useColagemStore'
import type { CorFundo } from '../../tipos'

const CORES: { valor: CorFundo; nome: string; descricao: string }[] = [
  {
    valor: '#FFFFFF',
    nome: 'Branco',
    descricao: 'Leve e limpo. Combina com fotos claras e feeds minimalistas.',
  },
  {
    valor: '#000000',
    nome: 'Preto',
    descricao: 'Some com as bordas no modo escuro e valoriza fotos contrastadas.',
  },
]

export function Etapa3Fundo() {
  const corFundo = useColagemStore((s) => s.corFundo)
  const definirCorFundo = useColagemStore((s) => s.definirCorFundo)

  return (
    <div className="mx-auto w-full max-w-3xl">
      <h1 className="text-2xl font-semibold">Cor de fundo</h1>
      <p className="mt-1 text-sm text-neutral-400">
        A cor preenche as margens e os vãos entre as fotos — no editor e na exportação.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-4">
        {CORES.map(({ valor, nome, descricao }) => (
          <button
            key={valor}
            type="button"
            onClick={() => definirCorFundo(valor)}
            className={`overflow-hidden rounded-2xl border text-left transition-all ${
              corFundo === valor
                ? 'border-violet-500 ring-1 ring-violet-500/40'
                : 'border-neutral-800 hover:border-neutral-600'
            }`}
          >
            <div
              className="grid h-40 grid-cols-2 gap-2 p-3"
              style={{ backgroundColor: valor }}
              aria-hidden
            >
              <div className="rounded bg-neutral-400/70" />
              <div className="rounded bg-neutral-500/70" />
              <div className="rounded bg-neutral-500/70" />
              <div className="rounded bg-neutral-400/70" />
            </div>
            <div className="bg-neutral-900 p-4">
              <p className="font-medium">
                {nome} <span className="text-xs text-neutral-500">{valor}</span>
              </p>
              <p className="mt-1 text-xs text-neutral-500">{descricao}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
