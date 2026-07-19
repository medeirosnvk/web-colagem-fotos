import { CheckCircle2, Download, Loader2, ShieldCheck } from 'lucide-react'
import { useColagemStore } from '../../store/useColagemStore'
import { useExportacaoStore } from '../../store/useExportacaoStore'
import { formatoPorId, ROTULO_DESTINO, ROTULO_PLATAFORMA } from '../../data/formatos'
import { layoutPorId } from '../../data/layouts'
import { Botao } from '../ui/Botao'
import { SeletorTipoArquivo } from '../SeletorTipoArquivo'
import { Secao } from './PainelLateral'

function formatarBytes(bytes: number) {
  return bytes > 1_048_576
    ? `${(bytes / 1_048_576).toFixed(1)} MB`
    : `${Math.round(bytes / 1024)} KB`
}

export function AbaExportar() {
  const formato = formatoPorId(useColagemStore((s) => s.formatoId))
  const layoutBase = layoutPorId(useColagemStore((s) => s.layoutId))
  const corFundo = useColagemStore((s) => s.corFundo)
  const slots = useColagemStore((s) => s.slots)
  const plataforma = useColagemStore((s) => s.plataforma)
  const destino = useColagemStore((s) => s.destino)

  const exportar = useExportacaoStore((s) => s.exportar)
  const ocupado = useExportacaoStore((s) => s.ocupado)
  const tipo = useExportacaoStore((s) => s.tipo)
  const erro = useExportacaoStore((s) => s.erro)
  const gerados = useExportacaoStore((s) => s.gerados)

  if (!formato || !layoutBase) return null

  const vazios = slots.filter((s) => !s.imagemId).length

  return (
    <div className="space-y-5">
      <Secao titulo="Resumo">
        <dl className="space-y-1.5 rounded-lg border border-neutral-800 bg-neutral-900/50 p-3 text-xs">
          {[
            ['Destino', `${ROTULO_PLATAFORMA[plataforma]} · ${ROTULO_DESTINO[destino]}`],
            ['Resolução', `${formato.largura} × ${formato.altura} px`],
            ['Fundo', corFundo === '#FFFFFF' ? 'Branco' : 'Preto'],
            ['Layout', layoutBase.nome],
          ].map(([rotulo, valor]) => (
            <div key={rotulo} className="flex justify-between gap-3">
              <dt className="shrink-0 text-neutral-500">{rotulo}</dt>
              <dd className="text-right text-neutral-200">{valor}</dd>
            </div>
          ))}
        </dl>

        {vazios > 0 && (
          <p className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-[11px] leading-relaxed text-amber-200">
            {vazios} {vazios === 1 ? 'slot está vazio' : 'slots estão vazios'} e vão sair com a cor
            de fundo.
          </p>
        )}
      </Secao>

      <Secao titulo="Baixar">
        <div className="space-y-2">
          <label className="block">
            <span className="mb-1.5 block text-xs text-neutral-400">Formato do arquivo</span>
            <SeletorTipoArquivo comDetalhe />
          </label>

          <Botao variante="primario" className="w-full" disabled={ocupado} onClick={exportar}>
            {ocupado ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Download size={15} />
            )}
            Baixar {tipo.toUpperCase()}
          </Botao>
        </div>

        {erro && <p className="mt-3 text-xs text-red-400">{erro}</p>}

        {gerados.length > 0 && !ocupado && (
          <div className="mt-3 space-y-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-[11px] text-emerald-200">
            {gerados.map((g) => (
              <p key={g.nome} className="flex items-start gap-1.5">
                <CheckCircle2 size={12} className="mt-0.5 shrink-0" />
                <span className="break-all">
                  {g.nome} · {formatarBytes(g.bytes)}
                </span>
              </p>
            ))}
          </div>
        )}
      </Secao>

      <p className="flex items-start gap-2 text-[11px] leading-relaxed text-neutral-500">
        <ShieldCheck size={13} className="mt-0.5 shrink-0 text-emerald-500" />O arquivo é redesenhado
        num canvas na resolução exata do formato — não é captura de tela — e salvo direto na sua
        pasta de downloads. Nenhuma imagem trafega pela rede.
      </p>
    </div>
  )
}
