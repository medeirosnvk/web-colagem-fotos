import { ChevronDown } from 'lucide-react'
import { useColagemStore } from '../store/useColagemStore'
import { useExportacaoStore, type Escopo } from '../store/useExportacaoStore'
import type { TipoArquivo } from '../lib/exportarColagem'

const OPCOES: { tipo: TipoArquivo; rotulo: string; detalhe: string }[] = [
  { tipo: 'png', rotulo: 'PNG', detalhe: 'sem perdas' },
  { tipo: 'jpg', rotulo: 'JPG', detalhe: 'qualidade 95%' },
]

const ESTILO_SELECT =
  'appearance-none rounded-lg border border-borda-forte bg-superficie py-2 pr-7 pl-2 text-xs text-texto transition-colors hover:border-borda-forte focus:border-violet-500 focus:outline-none disabled:text-tenue sm:pr-8 sm:pl-3 sm:text-sm'

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
    <div className="relative inline-flex">
      <select
        value={escopo}
        disabled={ocupado}
        onChange={(e) => definirEscopo(e.target.value as Escopo)}
        aria-label="O que exportar"
        className={`${ESTILO_SELECT} ${comDetalhe ? 'w-full' : ''}`}
      >
        <option value="atual">{comDetalhe ? 'Só a lâmina atual' : 'Esta lâmina'}</option>
        <option value="todas">
          {comDetalhe ? `Todas as ${total} lâminas` : `Todas (${total})`}
        </option>
      </select>
      <ChevronDown
        size={14}
        className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-suave"
      />
    </div>
  )
}

/**
 * Escolha do formato do arquivo. Vive no store, então o seletor do topo e o da
 * aba Exportar são o mesmo controle — mudar num lugar muda no outro.
 */
export function SeletorTipoArquivo({ comDetalhe = false }: { comDetalhe?: boolean }) {
  const tipo = useExportacaoStore((s) => s.tipo)
  const definirTipo = useExportacaoStore((s) => s.definirTipo)
  const ocupado = useExportacaoStore((s) => s.ocupado)

  return (
    <div className="relative inline-flex">
      <select
        value={tipo}
        disabled={ocupado}
        onChange={(e) => definirTipo(e.target.value as TipoArquivo)}
        aria-label="Formato do arquivo"
        className={`${ESTILO_SELECT} ${comDetalhe ? 'w-full' : ''}`}
      >
        {OPCOES.map(({ tipo: t, rotulo, detalhe }) => (
          <option key={t} value={t}>
            {comDetalhe ? `${rotulo} — ${detalhe}` : rotulo}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-suave"
      />
    </div>
  )
}
