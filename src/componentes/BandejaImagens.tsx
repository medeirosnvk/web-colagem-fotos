import { useCallback } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { useDropzone } from 'react-dropzone'
import { ImagePlus, Images, Trash2, X } from 'lucide-react'
import { useColagemStore } from '../store/useColagemStore'
import { carregarImagens, TIPOS_ACEITOS } from '../lib/carregarImagens'
import type { Imagem } from '../tipos'

function Miniatura({ imagem, usada }: { imagem: Imagem; usada: boolean }) {
  const removerImagem = useColagemStore((s) => s.removerImagem)
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
  const slots = useColagemStore((s) => s.slots)
  const adicionarImagens = useColagemStore((s) => s.adicionarImagens)
  const limparTudo = useColagemStore((s) => s.limparTudo)

  const onDrop = useCallback(
    async (files: File[]) => adicionarImagens(await carregarImagens(files)),
    [adicionarImagens],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: TIPOS_ACEITOS,
    noClick: true,
  })

  const usadas = new Set(slots.map((s) => s.imagemId).filter(Boolean))

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-neutral-800 bg-neutral-950">
      <header className="flex items-center justify-between border-b border-neutral-800 px-4 py-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-neutral-200">
          <Images size={15} className="text-violet-400" />
          Suas fotos
          <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-[11px] text-neutral-400">
            {imagens.length}
          </span>
        </h2>
        {imagens.length > 0 && (
          <button
            type="button"
            onClick={limparTudo}
            title="Recomeçar do zero"
            className="text-neutral-500 transition-colors hover:text-red-400"
          >
            <Trash2 size={14} />
          </button>
        )}
      </header>

      <div
        {...getRootProps()}
        className={`flex-1 overflow-y-auto p-3 ${isDragActive ? 'bg-violet-500/10' : ''}`}
      >
        <input {...getInputProps()} />

        {imagens.length === 0 ? (
          <p className="mt-10 px-2 text-center text-xs leading-relaxed text-neutral-500">
            Nenhuma foto ainda.
            <br />
            Solte arquivos aqui ou use a área de upload da etapa&nbsp;1.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {imagens.map((imagem) => (
              <Miniatura key={imagem.id} imagem={imagem} usada={usadas.has(imagem.id)} />
            ))}
          </div>
        )}
      </div>

      <footer className="border-t border-neutral-800 px-4 py-3 text-[11px] leading-relaxed text-neutral-500">
        <ImagePlus size={13} className="mb-1 inline text-neutral-600" /> Arraste uma miniatura para
        um slot na etapa de montagem. Tudo roda no seu computador; nenhuma imagem é enviada para a
        internet.
      </footer>
    </aside>
  )
}
