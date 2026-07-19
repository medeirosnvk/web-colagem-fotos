# CLAUDE.md

Instruções para trabalhar neste repositório.

## O que é

App web local que monta colagens de fotos prontas para Instagram e Facebook.
Roda inteiramente no navegador: **sem backend, sem upload, nenhuma imagem
trafega pela rede**. React + Vite + TypeScript, Tailwind v4, Zustand, dnd-kit,
react-dropzone, lucide-react e pica.

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
| `src/store/useColagemStore.ts` | Estado do wizard (zustand) + `maxEtapaLiberada` |
| `src/lib/cover.ts` | Geometria compartilhada (retângulo do slot e da imagem) |
| `src/lib/exportarColagem.ts` | Render no canvas, downscale com pica, PNG/JPG, download |
| `src/lib/carregarImagens.ts` | Leitura local dos arquivos e dimensões naturais |
| `src/componentes/etapas/` | Uma etapa do wizard por arquivo |
| `src/componentes/editor/` | Tela da colagem, slot interativo, painel de ajuste |

### Modelo de slots

Um slot é `{ x, y, w, h }` em 0..1. Os slots **não precisam ladrilhar a tela nem
ser disjuntos** — quando se sobrepõem, vale a ordem do array (o último é
desenhado por cima). É isso que permite os layouts sobrepostos.

`gap`, `margem`, `contorno` e `linhaInterna` são em px na **base de largura
1080** e escalados por `largura / 1080` na hora de virar pixels, para o layout
ser independente da resolução.

Estado de cada slot: `{ slotId, imagemId?, escala, offsetX, offsetY }`, com
`escala = 1` significando cover exato e os offsets em -1..1.

### Gating do wizard

O bloqueio de etapas é o seletor derivado `maxEtapaLiberada(state)`, **não** um
método do store — como método ele não dispara re-render quando o pré-requisito
muda (esse bug já aconteceu uma vez: o botão "Avançar" ficava travado).

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

- **Zonas seguras (250 px) em Stories/Reels não são corte.** Nada é cortado em
  9:16 — as faixas marcam onde o app desenha perfil, legenda e botões **por
  cima**. O aviso de recorte de verdade é outro: o grid do perfil do Instagram
  corta para 3:4, avisado na etapa 4.
- **`offsetX = 1` revela o lado esquerdo da foto**, porque o offset move a
  imagem para a direita. É manipulação direta, não é bug.
- **Ícones de marca saíram do lucide-react.** Instagram/Facebook usam `Camera` e
  `Users` como substitutos.
- O `outline` do contorno no editor sofre arredondamento sub-pixel do Chrome; o
  arquivo exportado usa a matemática exata. A diferença é só no preview.
