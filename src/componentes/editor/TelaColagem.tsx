import { useId } from 'react'
import { laminaAtiva, useColagemStore } from '../../store/useColagemStore'
import { formatoPorId, ZONA_SEGURA_PX } from '../../data/formatos'
import { layoutPorId } from '../../data/layouts'
import { layoutEfetivo } from '../../lib/layoutEfetivo'
import { quadrosDe, retanguloDoSlot } from '../../lib/cover'
import { SlotEditor } from './SlotEditor'
import { centroVisivel } from '../../lib/areaVisivel'
import type { Lamina } from '../../tipos'

/**
 * Desenha a colagem na tela usando exatamente a mesma geometria da exportação
 * (retanguloDoSlot + retanguloDaImagem), apenas multiplicada por `escala`.
 * É isso que garante que o resultado exportado bata com o editor.
 *
 * Sem `lamina`, desenha a que está em edição. Passando uma, desenha aquela —
 * é assim que o painel de lâminas mostra miniaturas de verdade, com a mesma
 * geometria da tela grande.
 *
 * Numa lâmina contínua a tela tem a largura de vários posts; as divisas entre
 * eles são desenhadas por cima, só no DOM — o arquivo é cortado ali.
 */
export function TelaColagem({
  larguraMax,
  alturaMax,
  interativo = true,
  mostrarZonaSegura = true,
  lamina,
  rotularPosts = true,
}: {
  larguraMax: number
  alturaMax: number
  interativo?: boolean
  mostrarZonaSegura?: boolean
  lamina?: Lamina
  /** Escreve "post N" junto de cada divisa (desligado nas miniaturas). */
  rotularPosts?: boolean
}) {
  // Identidade desta instância: a mesma lâmina pode estar na tela grande e
  // na miniatura do painel ao mesmo tempo, e os ids do dnd-kit precisam diferir.
  const instancia = useId()
  const formato = formatoPorId(useColagemStore((s) => s.formatoId))
  const ativa = useColagemStore(laminaAtiva)
  const corFundo = useColagemStore((s) => s.corFundo)
  const imagens = useColagemStore((s) => s.imagens)
  const destinoWizard = useColagemStore((s) => s.destino)

  const alvo = lamina ?? ativa
  const layoutBase = layoutPorId(alvo?.layoutId ?? null)

  if (!formato || !layoutBase || !alvo) return null

  const slots = alvo.slots
  const layout = layoutEfetivo(layoutBase, alvo.gap, alvo.margem)
  const quadros = quadrosDe(layout)
  const larguraTela = formato.largura * quadros
  const escala = Math.min(larguraMax / larguraTela, alturaMax / formato.altura)

  const temZonaSegura =
    mostrarZonaSegura && (destinoWizard === 'stories' || destinoWizard === 'reels')

  const retangulos = layout.slots.map((s) =>
    retanguloDoSlot(s, layout, larguraTela, formato.altura),
  )

  return (
    <div
      className="relative shadow-2xl shadow-black/60"
      style={{
        width: larguraTela * escala,
        height: formato.altura * escala,
        backgroundColor: corFundo,
      }}
    >
      {layout.slots.map((s, i) => {
        const destino = retangulos[i]
        const estado = slots.find((x) => x.slotId === s.id) ?? {
          slotId: s.id,
          escala: 1,
          offsetX: 0,
          offsetY: 0,
        }
        return (
          <SlotEditor
            key={s.id}
            slotId={s.id}
            instancia={instancia}
            numero={i + 1}
            destino={destino}
            rotulo={centroVisivel(destino, retangulos.slice(i + 1))}
            estado={estado}
            imagem={imagens.find((img) => img.id === estado.imagemId)}
            escala={escala}
            interativo={interativo}
            contorno={(layout.contorno ?? 0) * (formato.largura / 1080)}
            corFundo={corFundo}
          />
        )
      })}

      {layout.linhaInterna && (
        <div
          className="pointer-events-none absolute border-white"
          style={{
            left: layout.linhaInterna.inset * (formato.largura / 1080) * escala,
            top: layout.linhaInterna.inset * (formato.largura / 1080) * escala,
            right: layout.linhaInterna.inset * (formato.largura / 1080) * escala,
            bottom: layout.linhaInterna.inset * (formato.largura / 1080) * escala,
            borderWidth: layout.linhaInterna.largura * (formato.largura / 1080) * escala,
          }}
        />
      )}

      {/* Divisas entre posts — overlay, nunca exportado. */}
      {quadros > 1 && (
        <div className="pointer-events-none absolute inset-0">
          {Array.from({ length: quadros }, (_, i) => (
            <div
              key={i}
              className="absolute inset-y-0"
              style={{ left: i * formato.largura * escala, width: formato.largura * escala }}
            >
              {i > 0 && (
                <div className="absolute inset-y-0 left-0 border-l border-dashed border-white mix-blend-difference" />
              )}
              {rotularPosts && (
                <span className="absolute top-1.5 left-1.5 rounded bg-black/55 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  post {i + 1}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Overlay informativo — nunca é exportado. */}
      {temZonaSegura && (
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute inset-x-0 top-0 border-b border-dashed border-cyan-300/70 bg-cyan-400/10"
            style={{ height: ZONA_SEGURA_PX.topo * escala }}
          >
            <span className="absolute bottom-1 left-2 rounded bg-cyan-950/85 px-1.5 py-0.5 text-[10px] font-medium text-cyan-100">
              perfil e botões do app ficam por cima
            </span>
          </div>
          <div
            className="absolute inset-x-0 bottom-0 border-t border-dashed border-cyan-300/70 bg-cyan-400/10"
            style={{ height: ZONA_SEGURA_PX.base * escala }}
          >
            <span className="absolute top-1 left-2 rounded bg-cyan-950/85 px-1.5 py-0.5 text-[10px] font-medium text-cyan-100">
              legenda e botões do app ficam por cima
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
