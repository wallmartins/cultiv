# Cultiv — assets web (Selo de Voz)

## Estrutura

```
svg/
  icon.svg                    símbolo, currentColor (arco = var(--accent) no inline)
  icon-light-bg.svg           tinta #141414 fixa (usar sobre fundo claro)
  icon-dark-bg.svg            tinta #e8e8e8 fixa (usar sobre fundo escuro)
  logo-horizontal[...].svg    selo + Cultiv, wordmark Instrument Serif em outline
  logo-vertical[...].svg      selo sobre Cultiv, mesmas 3 variantes
favicon/
  favicon.svg                 auto light/dark via prefers-color-scheme
  build-icons.mjs             regenera os PNGs/ico a partir dos SVGs (offline)
  favicon.ico                 16+32+48 embutidos (fallback legado)
  favicon-{16,32,48}.png      tinta escura, fundo transparente
  apple-touch-icon.png        180x180, fundo #121212 solido
  icon-{192,512}.png          PWA, fundo solido
  icon-maskable-512.png       selo na zona segura de 52%
og/
  og-image.png                1200x630 — card social (gerado, nao editar a mao)
  og-image.svg                fonte do card (gerada por build-og.mjs)
  build-og.mjs                gera o card a partir dos tokens (offline, deterministico)
  InstrumentSerif-Regular.ttf fonte OFL local p/ render sem rede
site.webmanifest
```

## OG image

Fonte da verdade unica: os **tokens** (`../src/tokens.css`) e o **wordmark em
Instrument Serif** (`--font-headline`). O `build-og.mjs` le as cores do bloco
`[data-theme="dark"]`, recolore o selo de `svg/icon-dark-bg.svg` e renderiza o
wordmark com o TTF local — nada de rede, nada de fallback (o PNG antigo caia em
Poppins justamente porque puxava a fonte do Google Fonts num container sem rede).

```bash
node og/build-og.mjs        # rodar da raiz de packages/ui/assets
```

Gera `og-image.svg` + `og-image.png` (1200x630). Requer o binario `resvg` no
PATH. Para trocar a linha, edite `SLOGAN` no proprio script e regenere; comite
o PNG. O `apps/landing` copia esse PNG para `public/` via `sync-brand.mjs`.

## Wiring no <head>

Icones e manifest (caminhos fixos que browsers e o `site.webmanifest` esperam):

```html
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
```

As tags `og:*` / `twitter:*` (titulo, descricao, url, `og:image`) sao emitidas
pelos layouts do app — `apps/landing/src/layouts/{LandingLayout,Layout}.astro`,
que leem a copy de `data/site.ts`. Nao duplicar aqui: um so lugar por tag.

## Tokens

Fonte da verdade = `../src/tokens.css` (oklch). Os hex abaixo são derivados dele
(claro = `:root`, escuro = `[data-theme="dark"]`) — se divergirem do token, o
token vence. Não usar valores fora desta tabela nos assets.

| Token | Claro | Escuro |
|---|---|---|
| Acento | oklch(0.83 0.19 128) = #a3dd42 | oklch(0.86 0.20 128) = #abe841 |
| Tinta | oklch(0.19 0 0) = #141414 | oklch(0.93 0 0) = #e8e8e8 |
| Fundo | oklch(0.99 0 0) = #fcfcfc | oklch(0.16 0 0) = #0d0d0d |

## Regras

1. Acento so no arco do anel — as aspas sao sempre grafite/papel.
2. O arco fica a 128 graus (o hue do chartreuse em OKLCH). Nao mover.
3. `favicon.svg` e os PNGs pequenos usam optica reforcada: traco 7 e aspas
   em escala 0.68 (contra 5 e 0.62 no tamanho pleno). Manter essa distincao
   ao exportar novos tamanhos <= 48px.
4. Wordmark nos logos = "Cultiv" em **Instrument Serif** (`--font-headline`),
   já em **outline** (paths, sem dependência de fonte — renderiza igual em
   e-mail/PDF/inline). Para regerar após mudar o texto/tamanho, use opentype.js
   sobre `og/InstrumentSerif-Regular.ttf` (mesma fonte do og-image).
5. Area de respiro: 1/4 da altura do selo em todos os lados.
