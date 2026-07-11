# Cultiv — assets web (Selo de Voz)

## Estrutura

```
svg/
  icon.svg                    símbolo, currentColor (herda o tema no inline)
  icon-light-bg.svg           tinta #1A1A1A fixa (usar sobre fundo claro)
  icon-dark-bg.svg            tinta #F2F2F2 fixa (usar sobre fundo escuro)
  logo-horizontal[...].svg    selo + CULTIV, mesmas 3 variantes
  logo-vertical[...].svg      selo sobre CULTIV, mesmas 3 variantes
favicon/
  favicon.svg                 auto light/dark via prefers-color-scheme
  favicon.ico                 16+32+48 embutidos (fallback legado)
  favicon-{16,32,48}.png      tinta escura, fundo transparente
  apple-touch-icon.png        180x180, fundo #121212 solido
  icon-{192,512}.png          PWA, fundo solido
  icon-maskable-512.png       selo na zona segura de 52%
og/
  og-image.png                1200x630 — wordmark em Poppins (PLACEHOLDER, ver abaixo)
  og-image.html               template com a Bricolage real
site.webmanifest
```

## OG image definitivo

O container nao tem acesso a rede, entao o `og-image.png` atual usa Poppins no
wordmark. Para gerar a versao final com Bricolage Grotesque:

```bash
npx playwright screenshot --viewport-size "1200,630" og/og-image.html og/og-image.png
```

(ou abra o HTML no navegador em janela 1200x630 e capture). Edite a tagline no
proprio HTML se quiser outro texto.

## Snippet para o <head>

```html
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="#121212">

<meta property="og:title" content="Cultiv">
<meta property="og:description" content="Engine de escrita com IA que aprende e replica a sua voz autoral.">
<meta property="og:image" content="https://cultiv.app/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:type" content="website">
<meta property="og:url" content="https://cultiv.app">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="https://cultiv.app/og-image.png">
```

## Tokens

| Token | Valor |
|---|---|
| Acento | oklch(0.830 0.190 128) = #A3DD42 |
| Tinta claro / escuro | #1A1A1A / #F2F2F2 |
| Fundo claro / escuro | #F5F5F5 / #121212 |

## Regras

1. Acento so no arco do anel — as aspas sao sempre grafite/papel.
2. O arco fica a 128 graus (o hue do chartreuse em OKLCH). Nao mover.
3. `favicon.svg` e os PNGs pequenos usam optica reforcada: traco 7 e aspas
   em escala 0.68 (contra 5 e 0.62 no tamanho pleno). Manter essa distincao
   ao exportar novos tamanhos <= 48px.
4. Wordmark nos SVGs usa `<text>` + Bricolage. Para contextos sem a fonte
   (e-mail, PDF), converter para outlines: `inkscape --export-text-to-path`.
5. Area de respiro: 1/4 da altura do selo em todos os lados.
