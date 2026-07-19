# DESIGN.md — Sistema visual Cultiv

> Doutrina visual única para a marca **Cultiv** — *"Sua autenticidade, em escala."*
> Fonte da verdade dos tokens: [`packages/ui/src/tokens.css`](../../packages/ui/src/tokens.css)
> (consumido como `@my-ai-orchestrator/ui/tokens.css`).
> Lê ao lado de [`PRODUCT.md`](./PRODUCT.md) (estratégia) e [`BRIEF.md`](./BRIEF.md) (tarefa).
> Especificações de componentes prontas para copiar vivem em
> [`.impeccable/design.json`](./.impeccable/design.json).

**Personalidade:** precise · modern · electric — *distinct · crafted · unmistakably-yours.*
Grafite premium e silencioso onde uma única linha da voz do autor acende em acid.
Antirreferência número um: qualquer template de AI-SaaS (gradiente violeta, Inter-on-white,
ícones de varinha/robô). O anti-tell secundário: o reflexo editorial-serifado saturado —
tomamos a *seriedade* do mundo editorial, nunca o seu template.

---

## 1. Cor

Neutros grafite de croma 0 (sem matiz) + **um único** sinal acid-chartreuse.
**Regra 60-30-10:** o fundo domina (60%), ink/primary estruturam (30%), o accent é
**sempre** detalhe (≤10% de qualquer tela) — nunca preenche blocos grandes.

### Light (padrão) · Dark (espelho co-igual)

| Papel | Light | Dark | Uso |
| :-- | :-- | :-- | :-- |
| `--bg` | `oklch(0.99 0 0)` | `oklch(0.16 0 0)` | Fundo geral. Off-white / grafite. |
| `--surface` | `oklch(0.965 0 0)` | `oklch(0.205 0 0)` | Painéis, cards elevados. |
| `--ink` | `oklch(0.19 0 0)` | `oklch(0.93 0 0)` | Corpo de texto. |
| `--primary` | `oklch(0.24 0 0)` | `oklch(0.93 0 0)` | Títulos, UI, botão estrutural. |
| `--accent` | `oklch(0.83 0.19 128)` | `oklch(0.86 0.20 128)` | CTAs, focos, ignição, badges. |
| `--on-accent` | `oklch(0.19 0 0)` | `oklch(0.19 0 0)` | Tinta sobre acid — **invariante ao tema**. |
| `--muted` | `oklch(0.44 0 0)` | `oklch(0.7 0 0)` | Labels, notas, texto de suporte. |
| `--line` | `oklch(0.885 0 0)` | `oklch(0.285 0 0)` | Hairlines 1px. |
| `--frame` | `oklch(1 0 0)` | `oklch(0.08 0 0)` | Moldura atrás da superfície flutuante. |

- **`--on-accent` é invariante ao tema** de propósito: o acid permanece claro nos dois
  modos, então sua tinta permanece escura nos dois.
- **Foco (`--focus-ring`):** ink no light, accent no dark. O acid falha o contraste
  não-textual 3:1 sobre o bg claro (≈1.4:1), então o anel usa ink no claro; no escuro
  o acid passa com folga e volta a ser o anel.
- **Sem gradientes coloridos.** A única "cor" além do grafite é o acid, e mesmo ele
  aparece como halo/glow radial do próprio token — nunca um gradiente decorativo.

### Dualidade — a "outra metade" (`--x*`)

A identidade (coluna da marca) vive **sempre no tema inverso** do campo de produto.
Alternar tema é um recurso de marca, não só acessibilidade. Os tokens `--xbg`, `--xsurface`,
`--xink`, `--xmuted`, `--xline` resolvem, no modo claro, para os valores escuros — e o bloco
`[data-theme="dark"]` os inverte automaticamente. **São SSOT em `packages/ui`**; nenhum
consumidor precisa redeclarar literais.

---

## 2. Tipografia

Três famílias self-hosted (sem CDN de terceiros — ver
[`src/styles/fonts.css`](./src/styles/fonts.css)):

| Papel | Fonte (token) | Peso | Tamanho | Uso |
| :-- | :-- | :-- | :-- | :-- |
| **H1 / headline** | Instrument Serif (`--font-headline`) | 400 (peso único) | `2.8rem` | Títulos de seção, wordmark "Cultiv", slogan, headers de cards. |
| **Display** | Instrument Serif (`--font-headline`) | 400 | `clamp(2.8rem, 6vw, 4.5rem)` | Herói e CTA final apenas. |
| **Tagline** | Fraunces (`--font-ui`) itálico | 600 | `1.4rem` | Frase curta abaixo da logo. |
| **H2 / subtítulo** | Mona Sans (`--font-body`) | 600 | `1.1rem` | Subtítulos de seção. |
| **H3 / título interno** | Fraunces (`--font-ui`) | 600 | `1.2rem` | "Do que ele é feito?", "Passo 1". |
| **Body** | Mona Sans (`--font-body`) | 400 / 450 | `1rem` | Parágrafos, leads, descrições (`max-width: var(--measure)` = 68ch). |
| **Label / nav** | Mona Sans (`--font-body`) | 500 | `1rem` | Nav, labels, legendas, fine print. Sentence case. |
| **UI / números / preços** | Fraunces (`--font-ui`) | 700 / 800 | variável | Preços, métricas, contagens — dentro de badges/círculos. |

- **Casing sentence case** em títulos e botões; verbos no infinitivo em CTAs.
- **Ritmo de leitura:** o modo escuro respira mais — `--lh-body` 1.6 → 1.68 e
  `--ls-body` 0 → 0.012em compensam o texto claro sobre fundo escuro.
- **Números e preços** vivem em Fraunces com `font-variant-numeric: lining-nums tabular-nums`,
  dentro de badges/círculos (visual rhyming).

### Hierarquia por opacidade

| Nível | Opacidade | Uso |
| :-- | :-- | :-- |
| Máxima | `100%` (`--op-100`) | Logo, H1, CTAs primários, preços, nav ativo. |
| Alta | `85–90%` (`--op-90`) | H2, slogans, leads, nav hover. |
| Média | `70–75%` (`--op-75`) | Corpo, descrições, benefícios. |
| Suporte | `50–60%` (`--op-60`) | Labels de métrica, rodapé, secundários. |
| Ambiente | `5–15%` (`--op-15`) | Texturas, grids, decorativos. |

Texto abaixo de 70% só para informação complementar. Contraste sempre WCAG 2.1 AA (>4.5:1
corpo, >3:1 texto grande); se a opacidade comprometer a leitura, suba um nível.

---

## 3. Glow, elevação e movimento

**O glow verde é a assinatura de interação da marca.** Hover / estado ativo / ignição =
`--glow` (box-shadow acid), **nunca** troca de cor de fundo. Foco/seleção = `--glow-ring`.

| Token | Valor (light → dark) | Uso |
| :-- | :-- | :-- |
| `--glow` / `--glow-signal` | `0 0 32px acid/.45` → `0 0 36px acid/.5` | Ignição do Voice Transform; hover do CTA acid. |
| `--glow-soft` | `0 0 16px acid/.4` | Glow discreto em nós/pontos. |
| `--glow-ring` | anel `6px acid/.14` + glow | Foco/seleção destacada. |
| `--shadow-lift` | `0 6px 20px 0/.14` → `/.5` | State-lift em grafite interativo (hover de botão primário), pareado com `-2px`. **Nunca** sombra de card em repouso. |
| `--shadow-panel` | `0 18px 50px 0/.2` → `/.35` | Superfícies flutuantes (painel, moldura). |
| `--shadow-sheet` | `0 -18px 50px 0/.25` → `/.4` | Bottom sheet (sombra para cima). |

Glow e shadow-lift são **material de movimento, não elevação em repouso** — sob
`prefers-reduced-motion` até o glow do painel ignitado é removido.

### Curvas e durações

| Token | Curva | Uso |
| :-- | :-- | :-- |
| `--ease-out` (`--ease-decel`) | `cubic-bezier(0.22,1,0.36,1)` | Mudanças de estado: hover, toggles, flip de tema. |
| `--ease-out-expo` (`--ease-draw`) | `cubic-bezier(0.16,1,0.3,1)` | Entradas: subida do herói, reveals, cascata do Transform, traço da logo. |
| `--ease-standard` | `cubic-bezier(0.25,0.1,0.25,1)` | Transições gerais / fades. |
| `--ease-spring` | `cubic-bezier(0.34,1.56,0.64,1)` | popIn de painéis e cards. |
| `--t-fast` (`--dur-fast`) | `160ms` | Botões, hovers, chips. |
| `--t-med` (`--dur-med`) | `260ms` | Sombras, tags, fundo da nav. |
| `--t-slow` (`--dur-slow`) | `600ms` | Reveals escalonados (70ms por `--i`) e crossfade do Transform. |

**Sinal único por fold:** o CTA do herói drena de acid para grafite conforme a marca do
Transform acende — no máximo um elemento acid a cada instante do fold.
`prefers-reduced-motion` tem alternativa completa para cada animação (a página é
motion-forward — isto é load-bearing).

---

## 4. Espaçamento, raios e bordas

- **Bordas hairline 1px `--line`.** No hover, bordas migram de `--line` para `--accent`
  (chips, close, toggle) — sem underline em links; a cor accent carrega o hover.
- **Raios (visual rhyming):** botões/badges pill (`--r-pill` 100px), cards `--r-card` 24px,
  inputs/moldura `--r-input` 16px, painéis `--r-lg` 12px, controles `--r-md` 8px,
  bottom sheet `--radius-sheet` 18px. Vocabulário semântico: `--radius-control|panel|input|card|sheet|pill`.
- **Escala de espaçamento:** `--sp-xs` 4 · `--sp-sm` 8 · `--sp-md` 16 · `--sp-lg` 24 ·
  `--sp-xl` 40 · `--sp-2xl` 64 · `--sp-3xl` 96.
- **Sombras só em superfícies flutuantes.** Cards estáticos usam borda + (quando em destaque)
  troca de borda por `--accent` + `--glow`, nunca sombra em repouso.

---

## 5. Iconografia

**Não há biblioteca de ícones.** A marca usa:

- a logo Cultiv (assets em `@my-ai-orchestrator/ui/assets/svg/`, sincronizados para
  `public/` por `scripts/sync-brand.mjs`);
- pontos/círculos (`border-radius: var(--r-pill)`) como marcadores, bullets e legendas;
- caracteres unicode: `→` (CTA), `×` (fechar), `·` (separador).

Se um ícone for indispensável, prefira pontos, anéis e unicode antes de importar uma
biblioteca externa; se inevitável, use traço fino 1–1.5px e sinalize a adição.
**Sem emoji, sem SVG ilustrativo desenhado à mão.** A landing não usa fotografia — a
"imagem" da marca é geometria generativa (constelação, linhas de ritmo) desenhada com os
próprios tokens.

---

## 6. Conteúdo e voz

- **Idioma:** bilíngue **pt-BR (primário) + en**, com toggle persistido. Moeda segue o
  locale (R$ / $). Português corre ~15–20% mais longo — títulos não podem transbordar em
  nenhum breakpoint (proibição rígida).
- **Tom:** confiante, caloroso e literário sem ser rebuscado. Frases curtas e afirmativas.
  Respeita a inteligência de quem se importa com frases. Sem hype, sem clichê de growth-hack.
- **Segunda pessoa direta** ("você"); a marca fala na terceira ("a Cultiv aprende você").
- **Labels técnicos** em mono/uppercase com tracking largo quando usados; separador `·`
  para pares rótulo·explicação.
- **Sem emoji.** A única decoração textual é a seta `→` em CTAs e o `·` separador.

---

## 7. Acessibilidade

Alvo **WCAG 2.1 AA**. Corpo ≥4.5:1, texto grande ≥3:1 — verificado nos dois temas
(ink ≥7:1). Alternativa completa de `prefers-reduced-motion` para cada animação. CTAs
navegáveis por teclado com `:focus-visible` (anel `--focus-ring`). Nunca depender só da cor
para carregar significado. Página totalmente legível com JS desligado (CTAs são links reais).

---

## 8. Anti-referências (o que recusar)

1. **AI-SaaS genérico** — sem gradiente violeta, sem Inter-on-white, sem ícone de
   varinha/robô/sparkle, sem grid idêntico de feature-cards. Se lê como "mais uma AI tool",
   falhou na única coisa que vende.
2. **Reflexo editorial-magazine saturado** — herói serifado-itálico + labels mono minúsculos
   tracked + réguas de três colunas + zero imagem é hoje o seu próprio tell. Emprestamos o
   respeito editorial pelas palavras, não o template.
3. **Minimalismo tímido** — "contido para parecer premium" que aterrissa bege e esquecível.
   Craft aqui é comprometido e específico, não seguro.
