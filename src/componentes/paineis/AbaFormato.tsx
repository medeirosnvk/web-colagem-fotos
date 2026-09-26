import { Camera, Clapperboard, Info, LayoutGrid, Sparkles, Star, Users } from 'lucide-react'
import { useColagemStore } from '../../store/useColagemStore'
import { formatoPorId, formatosDe } from '../../data/formatos'
import type { CorFundo, Destino, Plataforma } from '../../tipos'
import { Secao } from './PainelLateral'
import { CartaoOpcao } from '../ui/CartaoOpcao'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Alert, AlertDescription } from '@/components/ui/alert'

const PLATAFORMAS: { id: Plataforma; nome: string; Icone: typeof Camera }[] = [
  { id: 'instagram', nome: 'Instagram', Icone: Camera },
  { id: 'facebook', nome: 'Facebook', Icone: Users },
]

const DESTINOS: { id: Destino; nome: string; Icone: typeof LayoutGrid }[] = [
  { id: 'feed', nome: 'Feed', Icone: LayoutGrid },
  { id: 'stories', nome: 'Stories', Icone: Sparkles },
  { id: 'reels', nome: 'Reels', Icone: Clapperboard },
]

const CORES: { valor: CorFundo; nome: string }[] = [
  { valor: '#FFFFFF', nome: 'Branco' },
  { valor: '#000000', nome: 'Preto' },
]

export function AbaFormato() {
  const plataforma = useColagemStore((s) => s.plataforma)
  const destino = useColagemStore((s) => s.destino)
  const formatoId = useColagemStore((s) => s.formatoId)
  const corFundo = useColagemStore((s) => s.corFundo)
  const definirPlataforma = useColagemStore((s) => s.definirPlataforma)
  const definirDestino = useColagemStore((s) => s.definirDestino)
  const definirFormato = useColagemStore((s) => s.definirFormato)
  const definirCorFundo = useColagemStore((s) => s.definirCorFundo)

  const formatos = formatosDe(plataforma, destino)
  const formato = formatoPorId(formatoId)

  const avisoGrid =
    plataforma === 'instagram' && destino === 'feed' && formato && formato.proporcao !== '3:4'

  return (
    <div className="space-y-6">
      <Secao titulo="Plataforma">
        <ToggleGroup
          type="single"
          variant="outline"
          value={plataforma}
          // Radix deixa desmarcar tudo; aqui sempre há uma plataforma.
          onValueChange={(v) => v && definirPlataforma(v as Plataforma)}
          className="grid w-full grid-cols-2"
        >
          {PLATAFORMAS.map(({ id, nome, Icone }) => (
            <ToggleGroupItem key={id} value={id} className="w-full text-xs">
              <Icone /> {nome}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Secao>

      <Secao titulo="Destino">
        <ToggleGroup
          type="single"
          variant="outline"
          value={destino}
          onValueChange={(v) => v && definirDestino(v as Destino)}
          className="grid w-full grid-cols-3"
        >
          {DESTINOS.map(({ id, nome, Icone }) => (
            <ToggleGroupItem key={id} value={id} className="w-full text-xs">
              <Icone /> {nome}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Secao>

      <Secao titulo="Proporção">
        <div className="grid grid-cols-2 gap-2">
          {formatos.map((f) => (
            <CartaoOpcao
              key={f.id}
              ativo={formatoId === f.id}
              onClick={() => definirFormato(f.id)}
              className="gap-2 p-2.5"
            >
              <span className="flex h-12 items-center justify-center">
                <span
                  className="block rounded-sm border border-muted-foreground/40 bg-muted"
                  style={{ height: 44, width: Math.min(72, (44 * f.largura) / f.altura) }}
                />
              </span>
              <span className="flex items-center gap-1 text-xs font-medium">
                {f.proporcao}
                {f.recomendado && <Star className="size-2.5 fill-amber-400 text-amber-400" />}
              </span>
              <span className="text-[10px] text-muted-foreground tabular-nums">
                {f.largura}×{f.altura}
              </span>
            </CartaoOpcao>
          ))}
        </div>

        {formato?.observacao && (
          <p className="mt-2.5 flex items-start gap-1.5 text-xs leading-relaxed text-muted-foreground">
            <Info className="mt-0.5 size-3 shrink-0 text-primary" />
            {formato.observacao}
          </p>
        )}

        {avisoGrid && (
          <Alert className="mt-2.5 border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-200">
            <Info />
            <AlertDescription className="text-xs text-inherit">
              <span>
                No grid do perfil o Instagram recorta para <strong>3:4</strong>. Centralize o que
                importa — ou escolha 3:4 para ver exatamente a miniatura.
              </span>
            </AlertDescription>
          </Alert>
        )}
      </Secao>

      <Secao titulo="Cor de fundo">
        <ToggleGroup
          type="single"
          variant="outline"
          value={corFundo}
          onValueChange={(v) => v && definirCorFundo(v as CorFundo)}
          className="grid w-full grid-cols-2"
        >
          {CORES.map(({ valor, nome }) => (
            <ToggleGroupItem key={valor} value={valor} className="w-full justify-start text-xs">
              <span
                className="size-4 shrink-0 rounded-sm border border-muted-foreground/40"
                style={{ backgroundColor: valor }}
              />
              {nome}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">
          Preenche margens e vãos entre as fotos — no editor e no arquivo exportado.
        </p>
      </Secao>
    </div>
  )
}
