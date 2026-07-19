# CLAUDE.md

Instruções para trabalhar neste repositório.

## O que é

App web local que monta colagens de fotos prontas para Instagram e Facebook.
Roda inteiramente no navegador: **sem backend, sem upload, nenhuma imagem
trafega pela rede**. React + Vite + TypeScript, Tailwind v4, Zustand, dnd-kit,
react-dropzone, lucide-react e pica.

A interface é **uma tela só** — bandeja de fotos à esquerda, colagem no centro,
painel com abas (Formato · Layout · Ajustes · Exportar) à direita. Não existe
wizard: tudo pode ser mexido a qualquer momento, com desfazer/refazer.

Interface em **português do Brasil** — nomes de arquivos, variáveis, tipos e
componentes também são em português. Mantenha esse padrão.

## Fluxo de trabalho

- **Commit e push direto na `main`, sempre.** Ao terminar uma alteração, subir
  como parte da mesma tarefa, sem perguntar. Não abrir branch nem PR.
- Antes de commitar: `npx tsc -b` e, para mudanças com efeito visual, exercitar
  o app de verdade no navegador (veja "Como verificar").
- Não commitar artefatos de teste. `.testes-locais/` e `.playwright-mcp/` já
  estão no `.gitignore`.

## Invariantes que não podem ser quebrados

1. **Nada vai para a rede.** Sem `fetch` de imagem, sem CDN, sem telemetria. As
   fotos entram por Object URL e são revogadas ao remover.
2. **A exportação não é print de tela.** Nada de html2canvas. O arquivo final é
   desenhado com `ctx.drawImage` num canvas criado na largura/altura exatas do
   formato.
3. **Editor e exportação compartilham a geometria.** As duas telas chamam as
   mesmas funções de `src/lib/cover.ts`; o editor só multiplica tudo por uma
   escala de preview. Se você mudar como uma delas posiciona algo, mude a
   outra na mesma edição — senão o arquivo deixa de bater com o que o usuário
   vê. Esse é o requisito central do projeto.
4. **Formatos e layouts são dados, não código.** Novos formatos entram em
   `src/data/formatos.ts`; novos layouts em `src/data/layouts.ts`. Não codifique
   dimensões nem posições dentro de componentes.
5. **Overlays do editor não são exportados.** Zonas seguras, anel de seleção e
   placeholders vivem só no DOM.

## Arquitetura

| Arquivo | Papel |
| --- | --- |
| `src/data/formatos.ts` | Formatos: plataforma × destino × proporção → pixels exatos |
| `src/data/layouts.ts` | Catálogo de layouts em coordenadas relativas (0..1), agrupados por estilo |
| `src/store/useColagemStore.ts` | Estado da colagem (zustand) + histórico de desfazer/refazer |
| `src/store/useExportacaoStore.ts` | Estado da exportação — fora do documento, fora do desfazer |
| `src/lib/cover.ts` | Geometria compartilhada (retângulo do slot e da imagem) |
| `src/lib/exportarColagem.ts` | Render no canvas, downscale com pica, PNG/JPG, download |
| `src/lib/carregarImagens.ts` | Leitura local dos arquivos e dimensões naturais |
| `src/componentes/paineis/` | Uma aba do painel lateral por arquivo |
| `src/componentes/AreaColagem.tsx` | Centro: mede o espaço livre e escala a colagem para caber |
| `src/componentes/editor/` | Tela da colagem e slot interativo |

### Modelo de slots

Um slot é `{ x, y, w, h }` em 0..1. Os slots **não precisam ladrilhar a tela nem
ser disjuntos** — quando se sobrepõem, vale a ordem do array (o último é
desenhado por cima). É isso que permite os layouts sobrepostos.

`gap`, `margem`, `contorno` e `linhaInterna` são em px na **base de largura
1080** e escalados por `largura / 1080` na hora de virar pixels, para o layout
ser independente da resolução.

Estado de cada slot: `{ slotId, imagemId?, escala, offsetX, offsetY }`, com
`escala = 1` significando cover exato e os offsets em -1..1.

### Histórico (desfazer/refazer)

Toda mutação da colagem passa por `editar()` no store, que empilha o
`Documento` anterior em `passado` e limpa `futuro`. O `Documento` é só o que a
colagem é — imagens, plataforma, destino, formato, layout, slots, espaçamento.
`slotSelecionado` fica de fora: é estado de tela, não de documento.

Duas coisas exigem cuidado ao mexer nisso:

- **Fusão de passos.** `editar()` aceita uma `tag`; edições seguidas com a mesma
  tag dentro de `JANELA_FUSAO_MS` viram um passo só. Sem isso, arrastar uma foto
  gravaria um passo por pixel. Ações contínuas (arrastar, sliders) precisam de
  tag; ações discretas, não.
- **Object URL vs. histórico.** `removerImagem` **não** revoga o URL na hora —
  se revogasse, desfazer traria de volta uma imagem quebrada. As imagens vivem
  num `registro` module-level e `coletarLixo()` revoga só as que nenhum ponto do
  histórico (presente, passado ou futuro) alcança mais. `limparTudo` zera o
  histórico, e é aí que tudo é revogado de fato.

O estado inicial já vem com plataforma, destino, formato e layout válidos —
nada é `null`. É isso que permite a tela única funcionar sem gating.

## Como verificar

Typecheck não basta para mudanças visuais ou de geometria. O que funciona bem
aqui é dirigir o app com Playwright e conferir os **pixels do arquivo
exportado**, não a aparência da tela:

1. Interceptar o download trocando `HTMLAnchorElement.prototype.click` e
   guardando o `href` do blob (fetch nele expira em 10 s por causa do
   `revokeObjectURL`).
2. `createImageBitmap` no blob, desenhar num canvas e ler pixels com
   `getImageData`.
3. Para checar paridade: medir a geometria do slot no DOM do editor
   (`getBoundingClientRect` do slot e da `<img>`), mapear um ponto do canvas
   exportado de volta para a foto original com essa geometria e comparar o RGB.
   Se bater, editor e exportação concordam.

Checagens que já pegaram problema real: dimensões exatas do PNG, cor pura do
fundo nos vãos, banda de contorno entre fotos sobrepostas, posição do filete.

## Detalhes que costumam confundir

- **A exportação é disparada de dois lugares** — o botão "Exportar PNG" do topo
  e a aba Exportar — e por isso o estado dela (`ocupado`, `erro`, `gerados`)
  mora num store próprio, não em `useState` de componente. Se voltasse para
  dentro de um componente, um lugar não veria o que o outro fez.
- **O padrão do feed do Instagram é 3:4** (`recomendado` em `formatos.ts`), não
  4:5. É a única proporção que casa com a miniatura do grid do perfil, então
  nada é recortado. Mudar o padrão é mudar a flag `recomendado` — o estado
  inicial e a troca de plataforma/destino leem dela, não de um id fixo.
- **Zonas seguras (250 px) em Stories/Reels não são corte.** Nada é cortado em
  9:16 — as faixas marcam onde o app desenha perfil, legenda e botões **por
  cima**. O aviso de recorte de verdade é outro: o grid do perfil do Instagram
  corta para 3:4, avisado na aba Formato.
- **`offsetX = 1` revela o lado esquerdo da foto**, porque o offset move a
  imagem para a direita. É manipulação direta, não é bug.
- **Ícones de marca saíram do lucide-react.** Instagram/Facebook usam `Camera` e
  `Users` como substitutos.
- O `outline` do contorno no editor sofre arredondamento sub-pixel do Chrome; o
  arquivo exportado usa a matemática exata. A diferença é só no preview.
