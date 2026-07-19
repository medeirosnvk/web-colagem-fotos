import { useState } from 'react'
import { laminaAtiva, useColagemStore } from '../../store/useColagemStore'
import { formatoPorId } from '../../data/formatos'
import { DESCRICAO_ESTILO, layoutsAgrupados, ROTULO_ESTILO } from '../../data/layouts'
import { layoutEfetivo } from '../../lib/layoutEfetivo'
import { PreviewLayout } from '../PreviewLayout'

const LARGURA_PREVIEW = 100
const ALTURA_MAX_PREVIEW = 112

/** Filtro por quantidade de fotos — `null` mostra tudo. */
type Filtro = number | null

export function AbaLayout() {
  const formatoId = useColagemStore((s) => s.formatoId)
  const lamina = useColagemStore(laminaAtiva)
  const corFundo = useColagemStore((s) => s.corFundo)
  const definirLayout = useColagemStore((s) => s.definirLayout)

  const { layoutId, gap, margem } = lamina

  const [filtro, setFiltro] = useState<Filtro>(null)

  const formato = formatoPorId(formatoId)
  if (!formato) return null

  const grupos = layoutsAgrupados(formato.proporcao)
  const quantidades = [...new Set(grupos.flatMap((g) => g.layouts.map((l) => l.qtdFotos)))].sort(
    (a, b) => a - b,
  )

  const visiveis = grupos
    .map((g) => ({ ...g, layouts: g.layouts.filter((l) => filtro === null || l.qtdFotos === filtro) }))
    .filter((g) => g.layouts.length > 0)

  const total = visiveis.reduce((n, g) => n + g.layouts.length, 0)

  return (
    <div className="space-y-5">
      <div>
        <div className="flex flex-wrap gap-1.5">
          {[null, ...quantidades].map((q) => (
            <button
              key={q ?? 'todos'}
              type="button"
              onClick={() => setFiltro(q)}
              className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                filtro === q
                  ? 'border-violet-500 bg-violet-500/15 text-violet-200'
                  : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-600'
              }`}
            >
              {q === null ? 'Todos' : `${q} ${q === 1 ? 'foto' : 'fotos'}`}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-neutral-600">
          {total} {total === 1 ? 'opção' : 'opções'} para {formato.proporcao}. Trocar de layout
          mantém as fotos já posicionadas.
        </p>
      </div>

      {visiveis.map(({ estilo, layouts }) => (
        <section key={estilo}>
          <h3 className="text-xs font-medium text-neutral-200">{ROTULO_ESTILO[estilo]}</h3>
          <p className="mt-0.5 mb-2 text-[11px] leading-snug text-neutral-600">
            {DESCRICAO_ESTILO[estilo]}
          </p>

          <div className="grid grid-cols-2 gap-2">
            {layouts.map((l) => {
              // O preview do layout escolhido acompanha os sliders de espaçamento.
              const efetivo = l.id === layoutId ? layoutEfetivo(l, gap, margem) : l
              const alturaBase = (LARGURA_PREVIEW * formato.altura) / formato.largura
              const escala = Math.min(1, ALTURA_MAX_PREVIEW / alturaBase)

              return (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => definirLayout(l.id)}
                  title={l.nome}
                  className={`flex flex-col items-center gap-1.5 rounded-lg border p-2 transition-colors ${
                    layoutId === l.id
                      ? 'border-violet-500 bg-violet-500/10'
                      : 'border-neutral-800 bg-neutral-900 hover:border-neutral-600'
                  }`}
                >
                  <span
                    className="flex items-center justify-center"
                    style={{ height: ALTURA_MAX_PREVIEW }}
                  >
                    <PreviewLayout
                      layout={efetivo}
                      largura={Math.round(LARGURA_PREVIEW * escala)}
                      altura={Math.round(alturaBase * escala)}
                      corFundo={corFundo}
                    />
                  </span>
                  <span className="text-center text-[10px] leading-tight text-neutral-400">
                    {l.nome}
                  </span>
                </button>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
