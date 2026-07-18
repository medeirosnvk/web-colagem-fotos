import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { ShieldCheck, UploadCloud } from 'lucide-react'
import { useColagemStore } from '../../store/useColagemStore'
import { carregarImagens, TIPOS_ACEITOS } from '../../lib/carregarImagens'

export function Etapa1Imagens() {
  const imagens = useColagemStore((s) => s.imagens)
  const adicionarImagens = useColagemStore((s) => s.adicionarImagens)
  const [carregando, setCarregando] = useState(false)

  const onDrop = useCallback(
    async (files: File[]) => {
      setCarregando(true)
      try {
        adicionarImagens(await carregarImagens(files))
      } finally {
        setCarregando(false)
      }
    },
    [adicionarImagens],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: TIPOS_ACEITOS,
  })

  return (
    <div className="mx-auto w-full max-w-3xl">
      <h1 className="text-2xl font-semibold">Carregue suas fotos</h1>
      <p className="mt-1 text-sm text-neutral-400">
        Aceita JPG, PNG e WEBP. As fotos ficam na bandeja à esquerda durante todo o processo.
      </p>

      <div
        {...getRootProps()}
        className={`mt-6 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-8 py-16 text-center transition-colors ${
          isDragActive
            ? 'border-violet-400 bg-violet-500/10'
            : 'border-neutral-700 bg-neutral-900/50 hover:border-neutral-500'
        }`}
      >
        <input {...getInputProps()} />
        <UploadCloud size={40} className="text-violet-400" />
        <p className="mt-4 font-medium">
          {isDragActive ? 'Pode soltar!' : 'Arraste as fotos aqui'}
        </p>
        <p className="mt-1 text-sm text-neutral-500">ou clique para escolher no computador</p>
        {carregando && <p className="mt-3 text-sm text-violet-300">Lendo arquivos…</p>}
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 text-sm text-neutral-400">
        <ShieldCheck size={16} className="mt-0.5 shrink-0 text-emerald-400" />
        <p>
          <strong className="text-neutral-200">Nada sai do seu computador.</strong> As imagens são
          lidas localmente pelo navegador e a colagem é gerada no seu próprio dispositivo — não
          existe servidor nem upload.
        </p>
      </div>

      {imagens.length > 0 && (
        <p className="mt-4 text-sm text-emerald-400">
          {imagens.length} {imagens.length === 1 ? 'foto carregada' : 'fotos carregadas'}. Pode
          avançar.
        </p>
      )}
    </div>
  )
}
