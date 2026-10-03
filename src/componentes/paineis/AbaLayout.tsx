import { useMemo, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { laminaAtiva, useColagemStore } from '../../store/useColagemStore'
import { formatoPorId } from '../../data/formatos'
import { DESCRICAO_ESTILO, layoutsAgrupados, ROTULO_ESTILO } from '../../data/layouts'
import { layoutEfetivo } from '../../lib/layoutEfetivo'
import { sugerirLayouts } from '../../lib/sugerirLayouts'
import { PreviewLayout } from '../PreviewLayout'
import { CartaoOpcao } from '../ui/CartaoOpcao'
import { Badge } from '@/components/ui/badge'
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
  const aplicarSugestao = useColagemStore((s) => s.aplicarSugestao)
  const imagens = useColagemStore((s) => s.imagens)
  const laminas = useColagemStore((s) => s.laminas)
  const fotosSelecionadas = useColagemStore((s) => s.fotosSelecionadas)

  const { layoutId, gap, margem } = lamina

  const [filtro, setFiltro] = useState<Filtro>(null)

  // Fotos que guiam a sugestão: as selecionadas na bandeja; senão as da lâmina em
  // edição; senão as ainda não usadas; senão todas — sempre na ordem da bandeja.
  const { fotosBase, origem } = useMemo(() => {
    const marcadas = new Set(fotosSelecionadas)
    const selecionadas = imagens.filter((i) => marcadas.has(i.id))
    if (selecionadas.length) return { fotosBase: selecionadas, origem: 'selecionadas' }
    const naLamina = new Set(lamina.slots.map((x) => x.imagemId).filter(Boolean))
    const daLamina = imagens.filter((i) => naLamina.has(i.id))
    if (daLamina.length) return { fotosBase: daLamina, origem: 'desta lâmina' }
    const usadas = new Set(laminas.flatMap((l) => l.slots.map((x) => x.imagemId)).filter(Boolean))
    const livres = imagens.filter((i) => !usadas.has(i.id))
    if (livres.length) return { fotosBase: livres, origem: 'ainda não usadas' }
    return { fotosBase: imagens, origem: 'da bandeja' }
  }, [imagens, laminas, lamina, fotosSelecionadas])

  const formatoAtual = formatoPorId(formatoId)
  const sugestoes = useMemo(
    () =>
      formatoAtual
        ? sugerirLayouts(
            layoutsAgrupados(formatoAtual.proporcao).flatMap((g) => g.layouts),
            fotosBase,
            formatoAtual.largura,
            formatoAtual.altura,
          )
        : [],
    [formatoAtual, fotosBase],
  )

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

      {sugestoes.length > 0 && (
        <section className="rounded-xl border border-primary/25 bg-primary/5 p-3">
          <h3 className="flex items-center gap-1.5 text-sm font-medium">
            <Sparkles className="size-3.5 text-primary" /> Sugeridos para suas fotos
          </h3>
          <p className="mt-0.5 mb-2.5 text-xs leading-snug text-muted-foreground">
            Pela proporção {fotosBase.length === 1 ? 'da foto' : 'das fotos'} {origem}
            {fotosBase.length > 9 ? ' (as 9 primeiras)' : ''}. Ao escolher, cada foto vai para o
            espaço que melhor combina com ela.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {sugestoes.map((sug) => {
              const l = sug.layout
              const efetivo = l.id === layoutId ? layoutEfetivo(l, gap, margem) : l
              const alturaBase = (LARGURA_PREVIEW * formato.altura) / formato.largura
              const escala = Math.min(1, ALTURA_MAX_PREVIEW / alturaBase)
              const pct = Math.round(sug.aproveitamento * 100)
              const aviso = sug.slotsVazios
                ? `${sug.slotsVazios} ${sug.slotsVazios === 1 ? 'espaço vazio' : 'espaços vazios'}`
                : sug.fotosDeFora
                  ? `${sug.fotosDeFora} ${sug.fotosDeFora === 1 ? 'foto fica' : 'fotos ficam'} de fora`
                  : ''

              return (
                <CartaoOpcao
                  key={l.id}
                  ativo={layoutId === l.id}
                  onClick={() => aplicarSugestao(l.id, sug.atribuicoes)}
                  title={`${l.nome} — ${pct}% de cada foto aparece, em média${aviso ? ` · ${aviso}` : ''}`}
                  className="relative gap-1.5"
                >
                  <Badge
                    variant={pct >= 90 ? 'default' : 'secondary'}
                    className="absolute top-1.5 right-1.5 z-10 h-4 px-1.5 text-[10px] tabular-nums"
                  >
                    {pct}%
                  </Badge>
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
                    {aviso && <span className="block text-[10px]">{aviso}</span>}
                  </span>
                </CartaoOpcao>
              )
            })}
          </div>
        </section>
      )}

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
