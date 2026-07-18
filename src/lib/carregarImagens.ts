import type { Imagem } from '../tipos'

export const TIPOS_ACEITOS = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
}

let contador = 0

/**
 * Cria um Object URL local para cada arquivo e lê as dimensões reais.
 * Nada é enviado para a rede — o arquivo nunca sai do navegador.
 */
export function carregarImagem(file: File): Promise<Imagem> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const el = new Image()

    el.onload = () =>
      resolve({
        id: `img-${Date.now()}-${contador++}`,
        nome: file.name,
        url,
        largura: el.naturalWidth,
        altura: el.naturalHeight,
        el,
      })

    el.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error(`Não foi possível ler "${file.name}".`))
    }

    el.src = url
  })
}

export async function carregarImagens(files: File[]): Promise<Imagem[]> {
  const resultados = await Promise.allSettled(files.map(carregarImagem))
  return resultados
    .filter((r): r is PromiseFulfilledResult<Imagem> => r.status === 'fulfilled')
    .map((r) => r.value)
}
