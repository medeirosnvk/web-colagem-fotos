# Colagem de Fotos

Aplicativo web **100% local** para montar colagens prontas para Instagram e Facebook.
Não existe backend: as imagens são lidas via Object URL, a colagem é desenhada num
`HTMLCanvasElement` e o arquivo é salvo direto pelo navegador. Nenhum byte de imagem
trafega pela rede.

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
| `src/store/useColagemStore.ts` | Estado do wizard (zustand) |
| `src/lib/cover.ts` | Geometria compartilhada: retângulo do slot e retângulo da imagem (cover + escala + offset) |
| `src/lib/exportarColagem.ts` | Render no canvas na resolução exata, downscale com pica, PNG/JPG |
| `src/componentes/etapas/` | Uma etapa do wizard por arquivo |
| `src/componentes/editor/` | Tela da colagem, slot interativo e painel de ajuste |

O editor e a exportação usam **a mesma** função de geometria (`cover.ts`); o editor apenas
multiplica tudo por uma escala de preview. É isso que garante que o arquivo exportado
corresponda ao que aparece na tela.

## Estilos de layout

Os slots são retângulos livres em coordenadas relativas — não precisam ladrilhar a tela
nem ser disjuntos. Quando se sobrepõem, vale a ordem do array (o último é desenhado por
cima). São 31 layouts, agrupados em quatro estilos:

| Estilo | O que é |
| --- | --- |
| **Grades** | Fotos encostadas, preenchendo a tela inteira (1, 2, 3, 4 e 6 fotos). |
| **Moldura e respiro** | Foto flutuando na cor de fundo, com área livre para texto: polaroide, faixa central, espaço para título, tela cheia com filete. |
| **Assimétricos** | Posições desencontradas sem sobreposição: escada, revista, zigue-zague, mosaico solto, sangrado lateral/topo. |
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
| Instagram | Feed | 1:1 (1080×1080) · 4:5 (1080×1350) · 3:4 (1080×1440) · 1.91:1 (1080×566) |
| Instagram | Stories / Reels | 9:16 (1080×1920) |
| Facebook | Feed | 1:1 (1080×1080) · 4:5 (1080×1350) · 1.91:1 (1200×630) |
| Facebook | Stories / Reels | 9:16 (1080×1920) |

## Como testar

1. **Etapa 1** — solte algumas fotos (JPG/PNG/WEBP). Elas ficam na bandeja à esquerda
   durante todo o fluxo; o "X" na miniatura revoga o Object URL.
2. **Etapa 2** — troque entre Instagram e Facebook e entre Feed/Stories/Reels: a lista de
   proporções muda embaixo.
3. **Etapa 3** — escolha branco ou preto; a cor aparece nos previews de layout, no editor e
   na exportação.
4. **Etapa 4** — escolha a proporção e o layout. Em proporções altas (9:16, 3:4, 4:5) os
   layouts empilhados vêm primeiro; em paisagem, as divisões verticais. No feed do Instagram
   aparece o aviso do recorte 3:4 do grid.
5. **Etapa 5** — arraste miniaturas da bandeja para os slots. Dentro do slot: arraste a foto
   para reposicionar, role o mouse (ou use o slider) para dar zoom. A alça no canto superior
   esquerdo troca fotos entre slots. Em Stories/Reels aparecem as zonas seguras pontilhadas,
   que **não** são exportadas.
6. **Etapa 6** — baixe PNG e/ou JPG. O nome sai como
   `colagem-{destino}-{proporcao}-{timestamp}`.

Para conferir que a exportação não é print de tela: abra o PNG baixado e verifique que ele
tem exatamente as dimensões da tabela acima (ex.: 1080×1350), independentemente do tamanho
da janela do navegador.
