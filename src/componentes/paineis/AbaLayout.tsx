import { useState } from 'react'
import { laminaAtiva, useColagemStore } from '../../store/useColagemStore'
import { formatoPorId } from '../../data/formatos'
import { DESCRICAO_ESTILO, layoutsAgrupados, ROTULO_ESTILO } from '../../data/layouts'
import { layoutEfetivo } from '../../lib/layoutEfetivo'
import { PreviewLayout } from '../PreviewLayout'
import { CartaoOpcao } from '../ui/CartaoOpcao'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

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
    <div className="space-y-6">
      <div>
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          spacing={1}
          value={filtro === null ? 'todos' : String(filtro)}
          onValueChange={(v) => v && setFiltro(v === 'todos' ? null : Number(v))}
          className="flex-wrap"
        >
          {[null, ...quantidades].map((q) => (
            <ToggleGroupItem
              key={q ?? 'todos'}
              value={q === null ? 'todos' : String(q)}
              className="h-7 rounded-full! px-2.5 text-xs"
            >
              {q === null ? 'Todos' : `${q} ${q === 1 ? 'foto' : 'fotos'}`}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <p className="mt-2.5 text-xs text-muted-foreground">
          {total} {total === 1 ? 'opção' : 'opções'} para {formato.proporcao}. Trocar de layout
          mantém as fotos já posicionadas.
        </p>
      </div>

      {visiveis.map(({ estilo, layouts }) => (
        <section key={estilo}>
          <h3 className="text-sm font-medium">{ROTULO_ESTILO[estilo]}</h3>
          <p className="mt-0.5 mb-2.5 text-xs leading-snug text-muted-foreground">
            {DESCRICAO_ESTILO[estilo]}
          </p>

          <div className="grid grid-cols-2 gap-2">
            {layouts.map((l) => {
              // O preview do layout escolhido acompanha os sliders de espaçamento.
              const efetivo = l.id === layoutId ? layoutEfetivo(l, gap, margem) : l
              const alturaBase = (LARGURA_PREVIEW * formato.altura) / formato.largura
              const escala = Math.min(1, ALTURA_MAX_PREVIEW / alturaBase)

              return (
                <CartaoOpcao
                  key={l.id}
                  ativo={layoutId === l.id}
                  onClick={() => definirLayout(l.id)}
                  title={l.nome}
                  className="gap-1.5"
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
                  <span className="text-center text-[11px] leading-tight text-muted-foreground">
                    {l.nome}
                  </span>
                </CartaoOpcao>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
