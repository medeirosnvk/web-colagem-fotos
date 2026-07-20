# CLAUDE.md

Instruções para trabalhar neste repositório.

## O que é

**Phrame** — app web local que monta colagens de fotos prontas para Instagram e
Facebook.
Roda inteiramente no navegador: **sem backend, sem upload, nenhuma imagem
trafega pela rede**. React + Vite + TypeScript, Tailwind v4, Zustand, dnd-kit,
react-dropzone, lucide-react e pica.

A interface é **uma tela só** — bandeja de fotos e pilha de lâminas à esquerda,
colagem no centro, painel com abas (Formato · Layout · Ajustes) à direita e a
exportação nos controles do topo. Não existe wizard: tudo pode ser mexido a
qualquer momento, com desfazer/refazer.

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
| `src/componentes/PainelLaminas.tsx` | Pilha de lâminas, com miniaturas reais e o botão de adicionar |
| `src/componentes/AreaColagem.tsx` | Centro: mede o espaço livre e escala a colagem para caber |
| `src/componentes/editor/` | Tela da colagem e slot interativo |

### Lâminas

O documento tem **uma lista de lâminas** (`Lamina[]`), não uma colagem só. Cada
lâmina é `{ id, layoutId, slots, gap, margem }` — layout e preenchimento são
dela. O que é do documento inteiro e vale para todas: **fotos, formato,
plataforma/destino e cor de fundo**. É o que faz sentido para um carrossel: as
lâminas variam de layout, não de proporção.

Consequências ao mexer aqui:

- Componentes não leem mais `s.slots`/`s.layoutId`; usam o seletor
  `laminaAtiva(s)`. Mutações passam por `naLaminaAtiva()`.
- `trocarFormato` migra **todas** as lâminas cujo layout não serve para a nova
  proporção, não só a ativa. `removerImagem` limpa a foto de todas.
- `preencherAutomaticamente` só usa fotos que não estão em **nenhuma** lâmina.
  É o que permite "adiciona lâmina, preenche, repete" distribuir um álbum sem
  repetir foto.
- `laminaAtivaId` é estado de tela e fica fora do `Documento` — mas o desfazer
  precisa reposicionar o foco quando a lâmina ativa deixa de existir no
  documento restaurado, e é isso que `ajustarFoco` faz.
- Sempre existe pelo menos uma lâmina: `removerLamina` não deixa esvaziar.

### Tema claro e escuro

As cores da interface são tokens semânticos (`fundo`, `painel`, `superficie`,
`elevado`, `borda`, `texto`, `suave`, `tenue`, `realce`…) definidos em
`index.css`. Cada um aponta para uma variável que troca de valor em `:root` e
`:root.claro`, então o tema inteiro muda com uma classe no `<html>` — não há
nenhum `dark:` espalhado pelos componentes. Sem preferência salva, o app segue
o `prefers-color-scheme` do sistema.

**A colagem não acompanha o tema.** `TelaColagem`, `SlotEditor` e
`PreviewLayout` desenham sobre a `corFundo` que o usuário escolheu para
exportar (branco ou preto) e por isso mantêm cores **literais**. Um placeholder
em `text-suave` sobre uma colagem preta no tema claro sairia ilegível — e, pior,
o que se vê deixaria de corresponder ao arquivo. Se for mexer em cor por lá,
pergunte primeiro: isso é moldura do app ou conteúdo da colagem?

Não use a variante `dark:` do Tailwind: no v4 ela segue `prefers-color-scheme`,
não a nossa classe, e ficaria fora de sincronia com o botão de tema.

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

- **Os ids do dnd-kit precisam ser únicos por instância na tela, não por
  slot.** Os ids de slot (`s1`, `s2`…) vêm do layout e se repetem entre
  lâminas — e a mesma lâmina aparece duas vezes de uma vez: na colagem grande
  e na miniatura do painel. Com id repetido o dnd-kit não acha droppable
  nenhum e o `over` volta `null`: o arrasto simplesmente não faz nada, **sem
  erro no console**. Por isso `TelaColagem` gera um `useId()` e o repassa como
  `instancia` para os ids de `SlotEditor`. `disabled: true` nas miniaturas não
  basta — o id continua registrado.
- **As faixas de cabeçalho das quatro colunas vêm de `ui/faixa.ts`.** Elas
  formam uma linha só de ponta a ponta; se uma usar padding próprio em vez da
  altura fixa, o alinhamento quebra.
- **A exportação não é uma etapa nem uma aba** — é o seletor de formato mais o
  botão, no topo, disponíveis o tempo todo. O estado dela (`tipo`, `ocupado`,
  `erro`, `gerados`) mora num store próprio porque seletor e botão são
  componentes irmãos: com `useState` num deles, o outro não enxergaria. Como
  não há mais painel de exportação, o retorno (arquivo gerado, tamanho, slots
  vazios, erro) aparece no próprio botão e no seu tooltip — se você acrescentar
  algo ao resultado da exportação, é lá que precisa aparecer.
- **O padrão do feed do Instagram é 3:4** (`recomendado` em `formatos.ts`), não
  4:5. É a única proporção que casa com a miniatura do grid do perfil, então
  nada é recortado. Mudar o padrão é mudar a flag `recomendado` — o estado
  inicial e a troca de plataforma/destino leem dela, não de um id fixo.
- **Zonas seguras (250 px) em Stories/Reels não são corte.** Nada é cortado em
  9:16 — as faixas marcam onde o app desenha perfil, legenda e botões **por
  cima**. O aviso de recorte de verdade é outro: o grid do perfil do Instagram
  corta para 3:4, avisado na aba Formato.
- **O arrasto de uma foto faz duas coisas, separadas pela seleção.** Foto não
  selecionada: o arrasto a leva para outro slot (troca). Foto selecionada
  (depois de um clique): o mesmo gesto reposiciona a imagem dentro do slot.
  Um clique curto — ponteiro desce e sobe a menos de 4 px — é o que seleciona.
  Em `SlotEditor` isso é o `disabled` do `useDraggable` (`podeMudarDeSlot`), e
  o `onPointerDown` do dnd-kit tem que ser **composto** com o nosso: como o
  spread de `listeners` vem antes no JSX, um `onPointerDown` declarado depois
  substituiria o do sensor e o arrasto pararia de funcionar em silêncio.
  A alça continua movendo a foto mesmo com o slot selecionado, e por isso é um
  segundo `useDraggable` com id próprio.
  Clicar **fora da imagem** desseleciona: o fundo da `AreaColagem` chama
  `selecionarSlot(null)` no pointerdown, e `SlotEditor` só interrompe a
  propagação quando o slot tem foto — em slot vazio e nos vãos da colagem o
  evento sobe e desseleciona, que é o esperado. O desselecionar é escopado à
  área da colagem de propósito: mexer nos sliders do painel não pode tirar a
  seleção da foto que se está ajustando.
- **`offsetX = 1` revela o lado esquerdo da foto**, porque o offset move a
  imagem para a direita. É manipulação direta, não é bug.
- **Ícones de marca saíram do lucide-react.** Instagram/Facebook usam `Camera` e
  `Users` como substitutos.
- O `outline` do contorno no editor sofre arredondamento sub-pixel do Chrome; o
  arquivo exportado usa a matemática exata. A diferença é só no preview.
