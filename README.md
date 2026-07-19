# Colagem de Fotos

Aplicativo web **100% local** para montar colagens prontas para Instagram e Facebook.
Não existe backend: as imagens são lidas via Object URL, a colagem é desenhada num
`HTMLCanvasElement` e o arquivo é salvo direto pelo navegador. Nenhum byte de imagem
trafega pela rede.

Tudo acontece numa **tela só**: bandeja de fotos e pilha de lâminas à esquerda, colagem no
centro, painel com abas (Formato · Layout · Ajustes) à direita e a exportação no topo. Um
documento tem **várias lâminas** — cada uma com seu layout e preenchimento, todas
compartilhando fotos, formato e cor de fundo — e você exporta uma ou todas de uma vez.
Qualquer escolha pode ser mudada a qualquer momento, e todo o histórico tem desfazer/refazer
(`Ctrl+Z` / `Ctrl+Shift+Z`).

## Rodando

```bash
npm install
npm run dev
```

## Estrutura

| Arquivo | Papel |
| --- | --- |
| `src/data/formatos.ts` | Tabela de formatos (plataforma × destino × proporção → pixels exatos) |
| `src/data/layouts.ts` | Catálogo de layouts em coordenadas relativas (0..1) + ordem por proporção |
| `src/store/useColagemStore.ts` | Estado da colagem (zustand) + histórico de desfazer/refazer |
| `src/store/useExportacaoStore.ts` | Estado da exportação (formato escolhido, progresso, resultado) |
| `src/lib/cover.ts` | Geometria compartilhada: retângulo do slot e retângulo da imagem (cover + escala + offset) |
| `src/lib/exportarColagem.ts` | Render no canvas na resolução exata, downscale com pica, PNG/JPG |
| `src/componentes/paineis/` | Uma aba do painel lateral por arquivo |
| `src/componentes/PainelLaminas.tsx` | Pilha de lâminas: miniaturas reais, duplicar/remover e o botão de adicionar |
| `src/componentes/AreaColagem.tsx` | Centro da tela: mede o espaço livre e escala a colagem para caber |
| `src/componentes/editor/` | Tela da colagem e slot interativo |

O editor e a exportação usam **a mesma** função de geometria (`cover.ts`); o editor apenas
multiplica tudo por uma escala de preview. É isso que garante que o arquivo exportado
corresponda ao que aparece na tela.

## Estilos de layout

Os slots são retângulos livres em coordenadas relativas — não precisam ladrilhar a tela
nem ser disjuntos. Quando se sobrepõem, vale a ordem do array (o último é desenhado por
cima). São 39 layouts, agrupados em quatro estilos:

| Estilo | O que é |
| --- | --- |
| **Grades** | Fotos encostadas, preenchendo a tela inteira (1, 2, 3, 4 e 6 fotos). |
| **Moldura e respiro** | Foto flutuando na cor de fundo, com área livre para texto: polaroide, faixa central, espaço para título, tela cheia com filete. |
| **Assimétricos** | Posições desencontradas sem sobreposição: escada, revista, zigue-zague, mosaico solto, sangrado lateral/topo, e oito layouts medidos a partir de templates de referência (fotos grandes, margens generosas, algumas sangrando pela borda). |
| **Sobrepostos** | Fotos se cruzando, separadas por um `contorno` na cor de fundo (recorte de revista). |

Dois recursos visuais opcionais por layout, ambos com a mesma geometria no editor e na
exportação:

- `contorno` — borda na cor de fundo em volta de cada foto. Na exportação é um `fillRect`
  pintado antes da foto (então as fotos seguintes recortam as anteriores); no editor é um
  `outline` CSS.
- `linhaInterna` — filete branco decorativo sobre a colagem inteira.

Os layouts de moldura/assimétricos/sobrepostos deixam áreas vazias **de propósito**, para
você escrever por cima no app de publicação. O app não insere texto.

## Formatos suportados

| Plataforma | Destino | Proporções |
| --- | --- | --- |
| Instagram | Feed | **3:4 (1080×1440, padrão)** · 1:1 (1080×1080) · 4:5 (1080×1350) · 1.91:1 (1080×566) |
| Instagram | Stories / Reels | 9:16 (1080×1920) |
| Facebook | Feed | 1:1 (1080×1080) · 4:5 (1080×1350) · 1.91:1 (1200×630) |
| Facebook | Stories / Reels | 9:16 (1080×1920) |

## Como testar

1. **Fotos** — solte arquivos (JPG/PNG/WEBP) em qualquer lugar da bandeja, ou use
   "Adicionar fotos". Dá para carregar mais fotos a qualquer momento, sem sair de onde
   você está.
2. **Aba Formato** — troque entre Instagram/Facebook e Feed/Stories/Reels: as proporções
   mudam junto e a colagem se reajusta na hora. No feed do Instagram aparece o aviso do
   recorte 3:4 do grid. A cor de fundo (branco/preto) também mora aqui.
3. **Aba Layout** — filtre por quantidade de fotos e escolha entre os 39 layouts. Trocar de
   layout **mantém as fotos já posicionadas**, na ordem, e vale só para a lâmina em edição.
4. **Montagem** — arraste miniaturas da bandeja para os slots, ou clique numa miniatura para
   pôr no slot selecionado. Dentro do slot: arraste a foto para reposicionar, role o mouse
   (ou use o slider da aba Ajustes) para dar zoom. A alça no canto superior esquerdo troca
   fotos entre slots. Em Stories/Reels aparecem as zonas seguras pontilhadas, que **não**
   são exportadas.

   > As faixas pontilhadas **não indicam corte**. Em 9:16 nada é cortado: elas marcam os
   > ~250 px onde o Instagram/Facebook desenha perfil, horário e botões (topo) e legenda,
   > campo de mensagem e ações (base) **por cima** da sua colagem. Evite rostos e texto ali.
   > O único recorte real avisado pelo app é o do grid do perfil do Instagram, que corta a
   > publicação do feed para 3:4 — esse aviso aparece na aba Formato.
5. **Lâminas** — o botão **+ Lâmina** na coluna da esquerda cria outra colagem no mesmo
   documento, com layout e preenchimento próprios; formato, cor de fundo e bandeja são
   compartilhados. As miniaturas são renderizadas com a mesma geometria da tela grande, então
   mostram a colagem de verdade. Cada lâmina tem três ações sempre à vista embaixo da miniatura —
   **esvaziar** (tira as fotos, mantém a montagem), **duplicar** e **remover** — desabilitadas
   quando não se aplicam, em vez de escondidas (a última lâmina não sai). **Preencher slots vazios** só usa fotos que ainda não estão em nenhuma lâmina — é
   assim que se distribui um álbum inteiro: adiciona lâmina, preenche, repete.
6. **Desfazer/refazer** — `Ctrl+Z` e `Ctrl+Shift+Z` (ou os botões no topo) voltam qualquer
   coisa: trocar layout, mudar formato, mexer numa foto, adicionar ou remover uma lâmina, até
   remover uma foto da bandeja. Arrastar uma foto ou mexer num slider conta como **um** passo,
   não um por pixel.
7. **Exportar** — escolha **PNG** ou **JPG** no seletor e clique em **Exportar**, no topo, a
   qualquer momento. Com mais de uma lâmina aparece um segundo seletor: **esta lâmina** ou
   **todas**. Não há etapa nem aba de exportação. Cada lâmina vira um arquivo próprio,
   renderizado no seu próprio canvas; em lote todos saem com o mesmo carimbo de tempo e o
   índice no nome (`…-lamina1.png`, `…-lamina2.png`), para o conjunto ficar junto na pasta de
   downloads. O tooltip do botão lista o que foi gerado, com tamanho.

Para conferir que a exportação não é print de tela: abra o PNG baixado e verifique que ele
tem exatamente as dimensões da tabela acima (ex.: 1080×1350), independentemente do tamanho
da janela do navegador.
