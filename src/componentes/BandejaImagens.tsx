import { useCallback, useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { useDropzone } from 'react-dropzone'
import { ImagePlus, Images, Loader2, ShieldCheck, X } from 'lucide-react'
import { useColagemStore } from '../store/useColagemStore'
import { FAIXA } from './ui/faixa'
import { carregarImagens, TIPOS_ACEITOS } from '../lib/carregarImagens'
import type { Imagem } from '../tipos'

function Miniatura({ imagem, usada }: { imagem: Imagem; usada: boolean }) {
  const removerImagem = useColagemStore((s) => s.removerImagem)
  const usarImagem = useColagemStore((s) => s.usarImagem)
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `imagem:${imagem.id}`,
    data: { tipo: 'imagem', imagemId: imagem.id },
  })

  return (
    <div
      ref={setNodeRef}
      className={`group relative aspect-square overflow-hidden rounded-lg border bg-neutral-900 ${
        isDragging ? 'opacity-30' : ''
      } ${usada ? 'border-violet-500/60' : 'border-neutral-800'}`}
    >
      <img
        {...attributes}
        {...listeners}
        src={imagem.url}
        alt={imagem.nome}
        draggable={false}
        onClick={() => usarImagem(imagem.id)}
        title="Clique para pôr no slot selecionado · ou arraste até um slot"
        className="h-full w-full cursor-grab object-cover active:cursor-grabbing"
      />
      {usada && (
        <span className="pointer-events-none absolute top-1 left-1 rounded bg-violet-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
          em uso
        </span>
      )}
      <button
        type="button"
        onClick={() => removerImagem(imagem.id)}
        title="Remover imagem"
        className="absolute top-1 right-1 rounded-full bg-black/70 p-1 text-neutral-300 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-400"
      >
        <X size={13} />
      </button>
      <span className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/85 to-transparent px-1.5 pt-4 pb-1 text-[10px] text-neutral-300">
        {imagem.largura}×{imagem.altura}
      </span>
    </div>
  )
}

export function BandejaImagens() {
  const imagens = useColagemStore((s) => s.imagens)
  const laminas = useColagemStore((s) => s.laminas)
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

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: TIPOS_ACEITOS,
    noClick: true,
  })

  // "em uso" vale para o documento todo: a foto pode estar em qualquer lâmina.
  const usadas = new Set(laminas.flatMap((l) => l.slots.map((s) => s.imagemId)).filter(Boolean))

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-neutral-800 bg-neutral-950">
      <header className={`${FAIXA} gap-2 px-4`}>
        <Images size={15} className="text-violet-400" />
        <h2 className="text-sm font-semibold text-neutral-200">Suas fotos</h2>
        <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-[11px] text-neutral-400">
          {imagens.length}
        </span>
      </header>

      <div
        {...getRootProps()}
        className={`flex min-h-0 flex-1 flex-col ${isDragActive ? 'bg-violet-500/10' : ''}`}
      >
        <input {...getInputProps()} />

        <div className="px-3 pt-3">
          <button
            type="button"
            onClick={open}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-neutral-700 bg-neutral-900/50 px-3 py-3 text-xs text-neutral-300 transition-colors hover:border-violet-500 hover:text-violet-200"
          >
            {carregando ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Lendo arquivos…
              </>
            ) : (
              <>
                <ImagePlus size={14} /> {isDragActive ? 'Pode soltar!' : 'Adicionar fotos'}
              </>
            )}
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {imagens.length === 0 ? (
            <p className="mt-6 px-2 text-center text-[11px] leading-relaxed text-neutral-500">
              Nenhuma foto ainda. Solte arquivos aqui ou use o botão acima. Aceita JPG, PNG e WEBP.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {imagens.map((imagem) => (
                <Miniatura key={imagem.id} imagem={imagem} usada={usadas.has(imagem.id)} />
              ))}
            </div>
          )}
        </div>
      </div>

      <footer className="flex items-start gap-2 border-t border-neutral-800 px-4 py-3 text-[11px] leading-relaxed text-neutral-500">
        <ShieldCheck size={13} className="mt-0.5 shrink-0 text-emerald-500" />
        Tudo roda no seu computador. Nenhuma imagem é enviada para a internet.
      </footer>
    </aside>
  )
}
