# Texto para o LinkedIn — aba Projetos

Copie o bloco que preferir. As duas versões dizem a mesma coisa; muda o tamanho.

---

## Nome do projeto

```
Phrame — editor de colagens para redes sociais
```

## URL

```
https://github.com/medeirosnvk/web-colagem-fotos
```

---

## Descrição — versão principal (~1.400 caracteres)

```
Editor de colagens de fotos para Instagram e Facebook que roda inteiramente no navegador — sem backend, sem upload, nenhuma imagem trafega pela rede. Privacidade por arquitetura, não por política.

O diferencial técnico está na exportação: em vez de capturar a tela, o app redesenha a colagem num <canvas> na resolução exata do formato de destino (1080×1440, 1080×1920, etc.), com redimensionamento de alta qualidade via pica. Editor e exportação compartilham as mesmas funções de geometria — o editor apenas multiplica tudo por uma escala de preview —, o que garante que o arquivo baixado corresponda pixel a pixel ao que o usuário vê.

Principais recursos:
• 39 layouts definidos como dados (coordenadas relativas 0–1), incluindo grades, molduras, assimétricos e sobrepostos
• Múltiplas lâminas por documento, para montar carrosséis; exportação individual ou em lote
• Desfazer/refazer completo, com fusão de edições contínuas em um único passo
• Formatos por plataforma e destino (feed, stories, reels), com aviso do recorte 3:4 do grid do Instagram e das zonas seguras de Stories
• Temas claro e escuro via tokens semânticos em CSS

Stack: React 19, TypeScript, Vite, Tailwind CSS v4, Zustand, dnd-kit, pica.

Interface e código em português do Brasil.
```

---

## Descrição — versão curta (~400 caracteres)

```
Editor de colagens para Instagram e Facebook que roda 100% no navegador — sem backend e sem upload. A exportação não é print de tela: a colagem é redesenhada num canvas na resolução exata do formato, compartilhando a mesma geometria do editor. 39 layouts, múltiplas lâminas para carrossel, desfazer/refazer e temas claro/escuro. React, TypeScript, Vite, Tailwind v4, Zustand, dnd-kit.
```

---

## Skills para associar ao projeto

```
React · TypeScript · Tailwind CSS · HTML5 Canvas · Zustand · Vite · Front-end · UI/UX
```

---

## Notas

- Não há métricas no texto (usuários, downloads, performance) porque o projeto
  ainda não tem nenhuma. Inventar número é o tipo de coisa que alguém pergunta
  numa entrevista.
- O texto evita chamar o projeto de "open source": o repositório é público, mas
  não há `LICENSE` declarada. Para posicionar assim, adicione uma licença antes.
- Se for anexar imagem no LinkedIn, `docs/phrame.png` serve.
