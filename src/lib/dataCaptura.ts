/**
 * Data em que a foto foi tirada, lida direto dos bytes do arquivo (EXIF), sem
 * biblioteca e sem rede. Suporta JPEG (segmento APP1) e WebP (chunk EXIF).
 * Sem EXIF — PNG, prints, fotos de app que remove metadados — vale a data de
 * modificação do arquivo.
 */
export interface DataCaptura {
  /** Epoch em ms. */
  data: number
  origem: 'exif' | 'arquivo'
}

/** Os metadados ficam no começo do arquivo; não é preciso ler a foto inteira. */
const BYTES_LIDOS = 256 * 1024

export async function lerDataCaptura(file: File): Promise<DataCaptura> {
  try {
    const buffer = await file.slice(0, BYTES_LIDOS).arrayBuffer()
    const data = dataDoExif(new DataView(buffer))
    if (data !== null) return { data, origem: 'exif' }
  } catch {
    // arquivo curto ou EXIF malformado: cai para a data do arquivo
  }
  return { data: file.lastModified, origem: 'arquivo' }
}

const EXIF = 0x45786966 // "Exif"

function dataDoExif(v: DataView): number | null {
  // JPEG: percorre os segmentos até o APP1 com "Exif\0\0"
  if (v.byteLength > 4 && v.getUint16(0) === 0xffd8) {
    let o = 2
    while (o + 10 <= v.byteLength) {
      if (v.getUint8(o) !== 0xff) return null
      const marcador = v.getUint8(o + 1)
      const tamanho = v.getUint16(o + 2)
      if (marcador === 0xe1 && v.getUint32(o + 4) === EXIF) return lerTiff(v, o + 10)
      if (marcador === 0xda) return null // início da imagem: não há mais metadados
      o += 2 + tamanho
    }
    return null
  }

  // WebP: RIFF....WEBP seguido de chunks; o EXIF vem no chunk "EXIF"
  if (v.byteLength > 12 && v.getUint32(0) === 0x52494646 && v.getUint32(8) === 0x57454250) {
    let o = 12
    while (o + 8 <= v.byteLength) {
      const id = v.getUint32(o)
      const tamanho = v.getUint32(o + 4, true)
      if (id === 0x45584946) {
        let inicio = o + 8
        if (v.getUint32(inicio) === EXIF) inicio += 6 // alguns gravam o prefixo "Exif\0\0"
        return lerTiff(v, inicio)
      }
      o += 8 + tamanho + (tamanho % 2)
    }
  }
  return null
}

/** Lê DateTimeOriginal (0x9003) → DateTimeDigitized (0x9004) → DateTime (0x0132). */
function lerTiff(v: DataView, base: number): number | null {
  const le = v.getUint16(base) === 0x4949 // "II" = little endian; "MM" = big endian
  const u16 = (o: number) => v.getUint16(o, le)
  const u32 = (o: number) => v.getUint32(o, le)

  const entradas = (ifd: number, tags: number[]) => {
    const achadas = new Map<number, number>()
    const n = u16(ifd)
    for (let i = 0; i < n; i++) {
      const e = ifd + 2 + i * 12
      if (e + 12 > v.byteLength) break
      const tag = u16(e)
      if (tags.includes(tag)) achadas.set(tag, e)
    }
    return achadas
  }

  const texto = (entrada: number) => {
    const qtd = u32(entrada + 4)
    const inicio = qtd > 4 ? base + u32(entrada + 8) : entrada + 8
    let s = ''
    for (let i = 0; i < qtd - 1 && inicio + i < v.byteLength; i++) {
      s += String.fromCharCode(v.getUint8(inicio + i))
    }
    return s
  }

  const ifd0 = entradas(base + u32(base + 4), [0x8769, 0x0132])
  const ponteiroExif = ifd0.get(0x8769)
  if (ponteiroExif !== undefined) {
    const exif = entradas(base + u32(ponteiroExif + 8), [0x9003, 0x9004])
    const entrada = exif.get(0x9003) ?? exif.get(0x9004)
    const data = entrada !== undefined ? converter(texto(entrada)) : null
    if (data !== null) return data
  }
  const dataHora = ifd0.get(0x0132)
  return dataHora !== undefined ? converter(texto(dataHora)) : null
}

/** "AAAA:MM:DD HH:MM:SS" (hora local da câmera) → epoch ms. */
function converter(s: string): number | null {
  const m = /^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/.exec(s.trim())
  if (!m) return null
  const [, a, me, d, h, mi, se] = m.map(Number)
  if (a < 1900 || me < 1 || me > 12 || d < 1 || d > 31) return null
  const t = new Date(a, me - 1, d, h, mi, se).getTime()
  return Number.isFinite(t) ? t : null
}
