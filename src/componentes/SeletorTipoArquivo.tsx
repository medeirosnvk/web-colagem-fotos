import { ChevronDown } from 'lucide-react'
import { useExportacaoStore } from '../store/useExportacaoStore'
import type { TipoArquivo } from '../lib/exportarColagem'

const OPCOES: { tipo: TipoArquivo; rotulo: string; detalhe: string }[] = [
  { tipo: 'png', rotulo: 'PNG', detalhe: 'sem perdas' },
  { tipo: 'jpg', rotulo: 'JPG', detalhe: 'qualidade 95%' },
]

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
        className={`appearance-none rounded-lg border border-neutral-700 bg-neutral-900 py-2 pr-8 pl-3 text-sm text-neutral-200 transition-colors hover:border-neutral-500 focus:border-violet-500 focus:outline-none disabled:text-neutral-600 ${
          comDetalhe ? 'w-full' : ''
        }`}
      >
        {OPCOES.map(({ tipo: t, rotulo, detalhe }) => (
          <option key={t} value={t}>
            {comDetalhe ? `${rotulo} — ${detalhe}` : rotulo}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-neutral-500"
      />
    </div>
  )
}
