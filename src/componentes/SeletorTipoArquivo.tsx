import { useColagemStore } from '../store/useColagemStore'
import { useExportacaoStore, type Escopo } from '../store/useExportacaoStore'
import type { TipoArquivo } from '../lib/exportarColagem'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

const OPCOES: { tipo: TipoArquivo; rotulo: string; detalhe: string }[] = [
  { tipo: 'png', rotulo: 'PNG', detalhe: 'sem perdas' },
  { tipo: 'jpg', rotulo: 'JPG', detalhe: 'qualidade 95%' },
]

/**
 * Escopo da exportação. Só aparece quando há mais de uma lâmina — com uma só,
 * "esta" e "todas" são a mesma coisa.
 */
export function SeletorEscopo({ comDetalhe = false }: { comDetalhe?: boolean }) {
  const total = useColagemStore((s) => s.laminas.length)
  const escopo = useExportacaoStore((s) => s.escopo)
  const definirEscopo = useExportacaoStore((s) => s.definirEscopo)
  const ocupado = useExportacaoStore((s) => s.ocupado)

  if (total < 2) return null

  return (
    <Select value={escopo} onValueChange={(v) => definirEscopo(v as Escopo)} disabled={ocupado}>
      <SelectTrigger size="sm" aria-label="O que exportar" className={cn(comDetalhe && 'w-full')}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="atual">{comDetalhe ? 'Só a lâmina atual' : 'Esta lâmina'}</SelectItem>
        <SelectItem value="todas">
          {comDetalhe ? `Todas as ${total} lâminas` : `Todas (${total})`}
        </SelectItem>
      </SelectContent>
    </Select>
  )
}

/**
 * Escolha do formato do arquivo. Vive no store, então qualquer seletor que
 * aparecer na tela é o mesmo controle — mudar num lugar muda no outro.
 */
export function SeletorTipoArquivo({ comDetalhe = false }: { comDetalhe?: boolean }) {
  const tipo = useExportacaoStore((s) => s.tipo)
  const definirTipo = useExportacaoStore((s) => s.definirTipo)
  const ocupado = useExportacaoStore((s) => s.ocupado)

  return (
    <Select value={tipo} onValueChange={(v) => definirTipo(v as TipoArquivo)} disabled={ocupado}>
      <SelectTrigger
        size="sm"
        aria-label="Formato do arquivo"
        className={cn(comDetalhe && 'w-full')}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {OPCOES.map(({ tipo: t, rotulo, detalhe }) => (
          <SelectItem key={t} value={t}>
            {comDetalhe ? `${rotulo} — ${detalhe}` : rotulo}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
