/**
 * As colunas da tela (fotos, lâminas, colagem, painel) têm cada uma sua faixa
 * de cabeçalho, e elas precisam formar uma linha só de ponta a ponta. Altura e
 * borda vêm daqui para não voltarem a divergir.
 */
export const ALTURA_FAIXA = 'h-11'

/** Faixa de cabeçalho padrão: altura fixa, conteúdo centralizado na vertical. */
export const FAIXA = `flex ${ALTURA_FAIXA} shrink-0 items-center border-b border-borda`
