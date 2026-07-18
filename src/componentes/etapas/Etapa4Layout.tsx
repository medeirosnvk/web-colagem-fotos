import { Info, Star } from 'lucide-react'
import { useColagemStore } from '../../store/useColagemStore'
import { formatoPorId, formatosDe } from '../../data/formatos'
import { DESCRICAO_ESTILO, layoutsAgrupados, ROTULO_ESTILO } from '../../data/layouts'
import { layoutEfetivo } from '../../lib/layoutEfetivo'
import { PreviewLayout } from '../PreviewLayout'
import { Cartao } from '../ui/Botao'

const LADO_PREVIEW = 92

export function Etapa4Layout() {
  const plataforma = useColagemStore((s) => s.plataforma)
  const destino = useColagemStore((s) => s.destino)
  const formatoId = useColagemStore((s) => s.formatoId)
  const layoutId = useColagemStore((s) => s.layoutId)
  const corFundo = useColagemStore((s) => s.corFundo)
  const gap = useColagemStore((s) => s.gap)
  const margem = useColagemStore((s) => s.margem)
  const definirFormato = useColagemStore((s) => s.definirFormato)
  const definirLayout = useColagemStore((s) => s.definirLayout)

  if (!plataforma || !destino) return null

  const formatos = formatosDe(plataforma, destino)
  const formato = formatoPorId(formatoId)
  const grupos = formato ? layoutsAgrupados(formato.proporcao) : []
  const totalLayouts = grupos.reduce((n, g) => n + g.layouts.length, 0)

  const avisoGrid =
    plataforma === 'instagram' && destino === 'feed' && formato && formato.proporcao !== '3:4'

  return (
    <div className="mx-auto w-full max-w-5xl pb-4">
      <h1 className="text-2xl font-semibold">Proporção e layout</h1>
      <p className="mt-1 text-sm text-neutral-400">
        A proporção define os pixels exatos da exportação; o layout define os slots da colagem.
      </p>

      <h2 className="mt-8 mb-3 text-sm font-medium text-neutral-400">Proporção</h2>
      <div className="grid grid-cols-4 gap-3">
        {formatos.map((f) => (
          <Cartao key={f.id} ativo={formatoId === f.id} onClick={() => definirFormato(f.id)}>
            <div className="flex h-20 items-center justify-center">
              <div
                className="rounded border border-neutral-600 bg-neutral-800"
                style={{
                  height: 68,
                  width: (68 * f.largura) / f.altura,
                  maxWidth: 110,
                }}
              />
            </div>
            <p className="mt-2 flex items-center gap-1 text-sm font-medium">
              {f.rotulo}
              {f.recomendado && <Star size={12} className="fill-amber-400 text-amber-400" />}
            </p>
            <p className="text-xs text-neutral-500">
              {f.largura} × {f.altura} px
            </p>
          </Cartao>
        ))}
      </div>

      {formato?.observacao && (
        <p className="mt-3 flex items-start gap-2 text-xs text-neutral-400">
          <Info size={13} className="mt-0.5 shrink-0 text-violet-400" />
          {formato.observacao}
        </p>
      )}

      {avisoGrid && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
          <Info size={14} className="mt-0.5 shrink-0" />
          <p>
            No grid do perfil o Instagram recorta a publicação para <strong>3:4</strong>. Mantenha o
            conteúdo importante centralizado — ou escolha a proporção 3:4 para ver exatamente o que
            aparece na miniatura.
          </p>
        </div>
      )}

      {formato && (
        <>
          <h2 className="mt-8 text-sm font-medium text-neutral-400">
            Layout · {totalLayouts} opções para {formato.proporcao}
          </h2>

          {grupos.map(({ estilo, layouts }) => (
            <section key={estilo} className="mt-6">
              <h3 className="text-sm font-medium text-neutral-200">{ROTULO_ESTILO[estilo]}</h3>
              <p className="mt-0.5 mb-3 text-xs text-neutral-500">{DESCRICAO_ESTILO[estilo]}</p>

              <div className="grid grid-cols-5 gap-3">
                {layouts.map((l) => {
                  // O preview usa o espaçamento do próprio layout: só depois de
                  // escolhido é que os sliders da montagem passam a valer.
                  const efetivo =
                    l.id === layoutId ? layoutEfetivo(l, gap, margem) : l
                  const alturaPreview = Math.round(
                    (LADO_PREVIEW * formato.altura) / formato.largura,
                  )
                  const escala = Math.min(1, 128 / alturaPreview)

                  return (
                    <Cartao
                      key={l.id}
                      ativo={layoutId === l.id}
                      onClick={() => definirLayout(l.id)}
                      className="flex flex-col items-center"
                    >
                      <div className="flex h-32 items-center justify-center">
                        <PreviewLayout
                          layout={efetivo}
                          largura={Math.round(LADO_PREVIEW * escala)}
                          altura={Math.round(alturaPreview * escala)}
                          corFundo={corFundo}
                        />
                      </div>
                      <p className="mt-2 text-center text-xs leading-tight text-neutral-300">
                        {l.nome}
                      </p>
                    </Cartao>
                  )
                })}
              </div>
            </section>
          ))}
        </>
      )}
    </div>
  )
}
