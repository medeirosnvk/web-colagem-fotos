import { Pica } from 'pica'
import type { CorFundo, EstadoSlot, Formato, Imagem, Layout } from '../tipos'
import { retanguloDaImagem, retanguloDoSlot } from './cover'

const pica = new Pica()

export interface ParametrosRender {
  formato: Formato
  layout: Layout
  corFundo: CorFundo
  slots: EstadoSlot[]
  imagens: Imagem[]
}

/** A partir de que fator vale a pena reduzir com pica antes de desenhar. */
const LIMIAR_DOWNSCALE = 2

/**
 * Desenha a colagem num canvas na resolução exata do formato.
 * Nenhum pixel vem da tela — tudo é redesenhado a partir das imagens originais.
 */
export async function renderizarColagem({
  formato,
  layout,
  corFundo,
  slots,
  imagens,
}: ParametrosRender): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas')
  canvas.width = formato.largura
  canvas.height = formato.altura

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Não foi possível criar o contexto 2D do canvas.')

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  ctx.fillStyle = corFundo
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const escalaBase = canvas.width / 1080

  for (const slotLayout of layout.slots) {
    const estado = slots.find((s) => s.slotId === slotLayout.id)
    if (!estado?.imagemId) continue

    const imagem = imagens.find((i) => i.id === estado.imagemId)
    if (!imagem) continue

    const destino = retanguloDoSlot(slotLayout, layout, canvas.width, canvas.height)
    if (destino.w <= 0 || destino.h <= 0) continue

    // Contorno na cor de fundo: pintado antes da foto, então as fotos
    // desenhadas depois recortam as anteriores (efeito recorte de revista).
    if (layout.contorno) {
      const c = layout.contorno * escalaBase
      ctx.fillStyle = corFundo
      ctx.fillRect(destino.x - c, destino.y - c, destino.w + c * 2, destino.h + c * 2)
    }

    const desenho = retanguloDaImagem(destino, imagem.largura, imagem.altura, estado)

    // Origem: a imagem original ou uma versão reduzida com pica quando a
    // diferença de tamanho é grande o bastante para o resample do canvas
    // perder qualidade.
    const origem = await prepararOrigem(imagem, desenho.w, desenho.h)

    ctx.save()
    ctx.beginPath()
    ctx.rect(destino.x, destino.y, destino.w, destino.h)
    ctx.clip()
    ctx.drawImage(origem, desenho.x, desenho.y, desenho.w, desenho.h)
    ctx.restore()
  }

  if (layout.linhaInterna) {
    const { inset, largura } = layout.linhaInterna
    const i = inset * escalaBase
    const l = largura * escalaBase
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = l
    // strokeRect centra o traço no caminho: recua metade da espessura para o
    // filete ficar exatamente dentro do retângulo do inset.
    ctx.strokeRect(i + l / 2, i + l / 2, canvas.width - i * 2 - l, canvas.height - i * 2 - l)
  }

  return canvas
}

async function prepararOrigem(
  imagem: Imagem,
  larguraDesenho: number,
  alturaDesenho: number,
): Promise<CanvasImageSource> {
  const precisaReduzir =
    imagem.largura > larguraDesenho * LIMIAR_DOWNSCALE &&
    imagem.altura > alturaDesenho * LIMIAR_DOWNSCALE

  if (!precisaReduzir || larguraDesenho < 1 || alturaDesenho < 1) return imagem.el

  const alvo = document.createElement('canvas')
  alvo.width = Math.max(1, Math.round(larguraDesenho))
  alvo.height = Math.max(1, Math.round(alturaDesenho))

  try {
    await pica.resize(imagem.el, alvo, { filter: 'mks2013' })
    return alvo
  } catch {
    // Se o pica falhar por qualquer motivo, o canvas nativo dá conta.
    return imagem.el
  }
}

export type TipoArquivo = 'png' | 'jpg'

export function carimboAgora(): string {
  return new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)
}

/**
 * Com várias lâminas, o índice entra no nome e o carimbo é o mesmo para todas —
 * é o que mantém o lote junto na pasta de downloads.
 */
export function nomeArquivo(
  formato: Formato,
  tipo: TipoArquivo,
  opcoes: { carimbo?: string; indice?: number } = {},
): string {
  const proporcao = formato.proporcao.replace(/[:.]/g, '-')
  const carimbo = opcoes.carimbo ?? carimboAgora()
  const sufixo = opcoes.indice ? `-lamina${opcoes.indice}` : ''
  return `colagem-${formato.destino}-${proporcao}-${carimbo}${sufixo}.${tipo}`
}

export function canvasParaBlob(canvas: HTMLCanvasElement, tipo: TipoArquivo): Promise<Blob> {
  const mime = tipo === 'png' ? 'image/png' : 'image/jpeg'
  const qualidade = tipo === 'png' ? undefined : 0.95

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Falha ao gerar o arquivo.'))),
      mime,
      qualidade,
    )
  })
}

export function baixarBlob(blob: Blob, nome: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nome
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Revoga depois do clique para não cancelar o download em curso.
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

/**
 * Renderiza e baixa uma lâmina por item, no tipo pedido. Cada lâmina vira um
 * canvas próprio na resolução exata do formato — nada é reaproveitado da tela.
 */
export async function exportarColagens(
  itens: ParametrosRender[],
  tipo: TipoArquivo,
): Promise<{ tipo: TipoArquivo; nome: string; bytes: number }[]> {
  const carimbo = carimboAgora()
  const varias = itens.length > 1
  const resultados = []

  for (const [i, params] of itens.entries()) {
    const canvas = await renderizarColagem(params)
    const blob = await canvasParaBlob(canvas, tipo)
    const nome = nomeArquivo(params.formato, tipo, {
      carimbo,
      indice: varias ? i + 1 : undefined,
    })
    baixarBlob(blob, nome)
    resultados.push({ tipo, nome, bytes: blob.size })

    // Downloads em rajada disparam o bloqueio de "vários arquivos" do Chrome;
    // um respiro entre eles resolve.
    if (varias && i < itens.length - 1) {
      await new Promise((r) => setTimeout(r, 350))
    }
  }

  return resultados
}
