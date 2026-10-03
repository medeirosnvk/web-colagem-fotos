import { useCallback, useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { useDropzone } from 'react-dropzone'
import {
  ArrowDownUp,
  ImagePlus,
  Images,
  Loader2,
  RotateCw,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react'
import { useColagemStore } from '../store/useColagemStore'
import { FAIXA } from './ui/faixa'
import { BotaoIcone } from './ui/BotaoIcone'
import { carregarImagens, TIPOS_ACEITOS } from '../lib/carregarImagens'
import type { Imagem, OrdemFotos } from '../tipos'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

function Miniatura({ imagem, usada }: { imagem: Imagem; usada: boolean }) {
  const removerImagem = useColagemStore((s) => s.removerImagem)
  const usarImagem = useColagemStore((s) => s.usarImagem)
  const girarImagem = useColagemStore((s) => s.girarImagem)
  const [girando, setGirando] = useState(false)
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `imagem:${imagem.id}`,
    data: { tipo: 'imagem', imagemId: imagem.id },
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'group relative aspect-square overflow-hidden rounded-md border bg-muted shadow-xs',
        isDragging && 'opacity-30',
        usada && 'border-primary/70 ring-1 ring-primary/40',
      )}
    >
      <img
        {...attributes}
        {...listeners}
        src={imagem.url}
        alt={imagem.nome}
        draggable={false}
        onClick={() => usarImagem(imagem.id)}
        title={`${imagem.nome} · ${rotuloData(imagem)}\nClique para pôr no slot selecionado · ou arraste até um slot`}
        className="h-full w-full cursor-grab object-cover active:cursor-grabbing"
      />
      {usada && (
        <Badge className="pointer-events-none absolute top-1 left-1 h-4 px-1.5 text-[10px]">
          em uso
        </Badge>
      )}
      <button
        type="button"
        disabled={girando}
        onClick={async () => {
          setGirando(true)
          try {
            await girarImagem(imagem.id, 1)
          } finally {
            setGirando(false)
          }
        }}
        title="Girar 90° (sentido horário)"
        aria-label="Girar foto"
        className={cn(
          'absolute top-1 right-7 cursor-pointer rounded-full bg-black/70 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:text-primary focus-visible:opacity-100',
          girando && 'opacity-100',
        )}
      >
        {girando ? <Loader2 className="size-3 animate-spin" /> : <RotateCw className="size-3" />}
      </button>
      <button
        type="button"
        onClick={() => removerImagem(imagem.id)}
        title="Remover imagem"
        aria-label="Remover imagem"
        className="absolute top-1 right-1 cursor-pointer rounded-full bg-black/70 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-400 focus-visible:opacity-100"
      >
        <X className="size-3" />
      </button>
      <span className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/80 to-transparent px-1.5 pt-4 pb-1 text-[10px] text-white tabular-nums">
        {imagem.largura}×{imagem.altura}
      </span>
    </div>
  )
}

const ROTULO_ORDEM: Record<OrdemFotos, string> = {
  adicao: 'Ordem de adição',
  'data-antigas': 'Mais antigas primeiro',
  'data-recentes': 'Mais recentes primeiro',
}

function rotuloData(imagem: Imagem): string {
  const data = new Date(imagem.dataCaptura).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
  return imagem.dataOrigem === 'exif' ? `tirada em ${data}` : `arquivo de ${data} (sem data da câmera)`
}

/** Ordenação da bandeja e "Limpar" — só aparecem quando há fotos. */
function BarraFotos() {
  const qtd = useColagemStore((s) => s.imagens.length)
  const ordem = useColagemStore((s) => s.ordemFotos)
  const ordenarImagens = useColagemStore((s) => s.ordenarImagens)
  const removerTodasImagens = useColagemStore((s) => s.removerTodasImagens)
  const [confirmar, setConfirmar] = useState(false)

  if (qtd === 0) return null
  return (
    <div className="flex items-center gap-1.5 px-3 pt-3">
      <Select value={ordem} onValueChange={(v) => ordenarImagens(v as OrdemFotos)}>
        <SelectTrigger
          size="sm"
          aria-label="Ordenar fotos"
          title="Ordenar pela data em que a foto foi tirada"
          className="min-w-0 flex-1 text-xs"
        >
          <ArrowDownUp />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(ROTULO_ORDEM) as OrdemFotos[]).map((o) => (
            <SelectItem key={o} value={o} className="text-xs">
              {ROTULO_ORDEM[o]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <BotaoIcone
        dica="Remover todas as fotos"
        onClick={() => setConfirmar(true)}
        className="text-muted-foreground hover:text-destructive"
      >
        <Trash2 />
      </BotaoIcone>

      <AlertDialog open={confirmar} onOpenChange={setConfirmar}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover todas as fotos?</AlertDialogTitle>
            <AlertDialogDescription>
              {qtd === 1 ? 'A foto sai' : `As ${qtd} fotos saem`} da bandeja e de todas as lâminas.
              Lâminas, layouts e formato continuam. Dá para desfazer com Ctrl+Z.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={removerTodasImagens}>
              Remover fotos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

/**
 * Miolo da bandeja: soltar arquivos, adicionar e a grade de miniaturas. Vive
 * separado da coluna para o layout compacto poder usá-lo dentro da gaveta.
 */
export function ConteudoFotos({ colunas = 'grid-cols-2' }: { colunas?: string }) {
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
    <div
      {...getRootProps()}
      className={cn('flex min-h-0 flex-1 flex-col', isDragActive && 'bg-primary/5')}
    >
      <input {...getInputProps()} />

      <div className="px-3 pt-3">
        <Button
          variant="outline"
          onClick={open}
          className={cn(
            'h-auto w-full flex-col gap-1 border-dashed py-4 text-xs',
            isDragActive && 'border-primary text-primary',
          )}
        >
          {carregando ? (
            <>
              <Loader2 className="animate-spin" /> Lendo arquivos…
            </>
          ) : (
            <>
              <ImagePlus />
              {isDragActive ? 'Pode soltar!' : 'Adicionar fotos'}
              <span className="font-normal text-muted-foreground">
                ou arraste para cá · JPG, PNG, WEBP
              </span>
            </>
          )}
        </Button>
      </div>

      <BarraFotos />

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {imagens.length === 0 ? (
          <p className="mt-4 px-2 text-center text-xs leading-relaxed text-muted-foreground">
            Nenhuma foto ainda.
          </p>
        ) : (
          <div className={`grid gap-2 ${colunas}`}>
            {imagens.map((imagem) => (
              <Miniatura key={imagem.id} imagem={imagem} usada={usadas.has(imagem.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function BandejaImagens() {
  const imagens = useColagemStore((s) => s.imagens)

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r bg-sidebar">
      <header className={`${FAIXA} gap-2 px-4`}>
        <Images className="size-4 text-muted-foreground" />
        <h2 className="text-sm font-medium">Suas fotos</h2>
        <Badge variant="secondary" className="ml-auto tabular-nums">
          {imagens.length}
        </Badge>
      </header>

      <ConteudoFotos />

      <footer className="flex items-start gap-2 border-t px-4 py-3 text-xs leading-relaxed text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />
        Tudo roda no seu computador. Nenhuma imagem é enviada para a internet.
      </footer>
    </aside>
  )
}
