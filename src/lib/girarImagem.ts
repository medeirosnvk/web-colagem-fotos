import type { Imagem } from '../tipos'

let contador = 0

/**
 * Gira a foto 90° (1 = horário, -1 = anti-horário) e devolve uma **nova** imagem,
 * com outro id e outro Object URL. Tudo local: o canvas desenha a foto girada e
 * o resultado vira um Blob no próprio navegador.
 *
 * Gerar uma imagem nova (em vez de guardar um ângulo) mantém editor e exportação
 * intocados — continuam lendo só largura, altura e o elemento da foto — e deixa o
 * desfazer trivial: a versão anterior segue no histórico até ser coletada.
 */
export async function girarImagem(imagem: Imagem, sentido: 1 | -1): Promise<Imagem> {
  const { largura, altura } = imagem
  const canvas = document.createElement('canvas')
  canvas.width = altura
  canvas.height = largura
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas indisponível')
  ctx.translate(altura / 2, largura / 2)
  ctx.rotate((sentido * Math.PI) / 2)
  ctx.drawImage(imagem.el, -largura / 2, -altura / 2, largura, altura)

  const tipo = /\.png$/i.test(imagem.nome)
    ? 'image/png'
    : /\.webp$/i.test(imagem.nome)
      ? 'image/webp'
      : 'image/jpeg'
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Falha ao girar a foto'))), tipo, 0.95),
  )

  const url = URL.createObjectURL(blob)
  const el = new Image()
  el.src = url
  try {
    await el.decode()
  } catch (erro) {
    URL.revokeObjectURL(url)
    throw erro
  }

  return {
    ...imagem,
    id: `${imagem.id}-g${contador++}`,
    url,
    el,
    largura: el.naturalWidth,
    altura: el.naturalHeight,
  }
}
