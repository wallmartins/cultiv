# DESIGN SYSTEM — Cores, Tipografia e Opacidade

## 1. PALETA DE CORES (OKLCH)

**Personalidade:** precise · modern · electric

### LIGHT MODE

| Função | Cor (OKLCH) | Uso |
| :--- | :--- | :--- |
| **bg (Fundo)** | `oklch(0.99 0 0)` | Off-white. Base da coluna esquerda e fundo geral. |
| **ink (Texto)** | `oklch(0.19 0 0)` | Graphite-black. Corpo do texto principal. |
| **primary** | `oklch(0.24 0 0)` | Near-black. Títulos, cards, elementos de UI. |
| **accent** | `oklch(0.83 0.19 128)` | Acid Chartreuse. CTAs, focos, segmento da logo, badges. |

### DARK MODE

| Função | Cor (OKLCH) | Uso |
| :--- | :--- | :--- |
| **bg (Fundo)** | `oklch(0.16 0 0)` | Graphite. Base da coluna esquerda e fundo geral. |
| **ink (Texto)** | `oklch(0.93 0 0)` | Warm White. Corpo do texto principal. |
| **primary** | `oklch(0.93 0 0)` | White. Títulos e UI (no dark, primary = ink). |
| **accent** | `oklch(0.86 0.20 128)` | Acid Glows. CTAs, focos, glows da logo. |

### REGRA 60-30-10

- **60% (Fundo):** `oklch(0.99 0 0)` / `oklch(0.16 0 0)` — Domina a interface.
- **30% (UI/Textos):** `oklch(0.19 0 0)` / `oklch(0.93 0 0)` — Cards, títulos e parágrafos.
- **10% (Acento):** `oklch(0.83 0.19 128)` / `oklch(0.86 0.20 128)` — Apenas para ações, destaques e micro-interações. **Nunca** use Chartreuse em blocos grandes.

---

## 2. TIPOGRAFIA

| Função | Fonte | Pesos | Tamanho | Observação |
| :--- | :--- | :--- | :--- | :--- |
| **H1 (Títulos das Seções)** | Instrument Serif | 400 (peso único) | `2.8rem` | Títulos principais, wordmark "Cultiv", slogan e headers de cards/páginas. |
| **Tagline (Lado Esquerdo)** | Fraunces | 600 (Itálico) | `1.4rem` | Frase curta abaixo da logo. |
| **H2 (Subtítulos)** | Mona Sans | 600 | `1.1rem` | Subtítulos das seções. |
| **H3 (Títulos Internos)** | Fraunces | 600 | `1.2rem` | "Do que ele é feito?", "Passo 1", etc. |
| **Body (Textos Longos)** | Mona Sans | 400 / 450 | `1rem` | Parágrafos, descrições, leads. |
| **UI/Números/Badges** | Fraunces | 700 / 800 | variável | Preços, números de métricas, contagens. |

---

## 3. SISTEMA DE OPACIDADE (Hierarquia Visual)

| Nível | Opacidade | Uso |
| :--- | :--- | :--- |
| **1. Máxima** | `100%` | Logo, H1, CTAs primários, preços, nav ativo. |
| **2. Alta** | `85% - 90%` | H2, slogans, leads, nav (hover). |
| **3. Média** | `70% - 75%` | Corpo do texto, descrições dos passos, benefícios. |
| **4. Suporte** | `50% - 60%` | Labels de métricas, notas de rodapé, textos secundários. |
| **5. Ambiente** | `5% - 15%` | Texturas de fundo, grids, elementos decorativos. |

**Acessibilidade:** Textos com opacidade inferior a 70% devem ser usados apenas para informações complementares. O contraste de cores sempre deve respeitar WCAG 2.1 AA (ratio > 4.5:1). Se a opacidade comprometer a leitura do conteúdo principal, aumente para o próximo nível.

---

## 4. DUALIDADE CLARO/ESCURO (`--x*`)

A identidade (coluna da marca) vive **sempre no tema inverso** do campo de produto —
alternar tema é um recurso de marca, não só acessibilidade. Os tokens `--xbg`, `--xsurface`,
`--xink`, `--xmuted`, `--xline` resolvem, no modo claro (padrão), para os valores **escuros**;
`[data-theme="dark"]` os inverte automaticamente. São fonte única da verdade em
`packages/ui/src/tokens.css` — nenhum consumidor redeclara literais.

| Token | Light (campo claro) | Dark (campo escuro) |
| :--- | :--- | :--- |
| `--xbg` | `oklch(0.16 0 0)` | `oklch(0.99 0 0)` |
| `--xsurface` | `oklch(0.205 0 0)` | `oklch(0.965 0 0)` |
| `--xink` | `oklch(0.93 0 0)` | `oklch(0.19 0 0)` |
| `--xmuted` | `oklch(0.7 0 0)` | `oklch(0.44 0 0)` |
| `--xline` | `oklch(0.285 0 0)` | `oklch(0.885 0 0)` |

---

## 5. GLOW E ELEVAÇÃO

**O glow acid é a assinatura de interação da marca.** Hover / estado ativo / ignição =
`--glow` (box-shadow acid), **nunca** troca de cor de fundo. Foco/seleção = `--glow-ring`.

| Token | Light → Dark | Uso |
| :--- | :--- | :--- |
| `--glow` / `--glow-signal` | `0 0 32px acid/.45` → `0 0 36px acid/.5` | Ignição do Voice Transform, hover do CTA acid. |
| `--glow-soft` | `0 0 16px acid/.4` | Glow discreto em nós/pontos. |
| `--glow-ring` | anel `6px acid/.14` + glow | Foco/seleção destacada. |
| `--shadow-lift` | `0 6px 20px 0/.14` → `/.5` | State-lift em grafite interativo (hover de botão), com `-2px`. Nunca card em repouso. |
| `--shadow-panel` | `0 18px 50px 0/.2` → `/.35` | Superfícies flutuantes. |
| `--shadow-sheet` | `0 -18px 50px 0/.25` → `/.4` | Bottom sheet. |

Glow e `--shadow-lift` são **material de movimento**, não elevação em repouso: sob
`prefers-reduced-motion` até o glow do painel ignitado é removido. Cards estáticos usam
borda + (no destaque) troca da borda por `--accent`, nunca sombra.

---

## 6. MOVIMENTO

| Token | Curva / duração | Uso |
| :--- | :--- | :--- |
| `--ease-out` (`--ease-decel`) | `cubic-bezier(0.22,1,0.36,1)` | Estados: hover, toggles, flip de tema. |
| `--ease-out-expo` (`--ease-draw`) | `cubic-bezier(0.16,1,0.3,1)` | Entradas: herói, reveals, cascata do Transform, traço da logo. |
| `--ease-standard` | `cubic-bezier(0.25,0.1,0.25,1)` | Transições gerais / fades. |
| `--ease-spring` | `cubic-bezier(0.34,1.56,0.64,1)` | popIn de painéis e cards. |
| `--t-fast` (`--dur-fast`) | `160ms` | Botões, hovers, chips. |
| `--t-med` (`--dur-med`) | `260ms` | Sombras, tags, fundo da nav. |
| `--t-slow` (`--dur-slow`) | `600ms` | Reveals escalonados (70ms por `--i`), crossfade do Transform. |

**Sinal único por fold** e alternativa completa de `prefers-reduced-motion` para cada
animação (a página é motion-forward — isto é load-bearing).

---

## 7. ESPAÇAMENTO E RAIOS

- **Escala de espaçamento:** `--sp-xs` 4 · `--sp-sm` 8 · `--sp-md` 16 · `--sp-lg` 24 ·
  `--sp-xl` 40 · `--sp-2xl` 64 · `--sp-3xl` 96.
- **Raios (visual rhyming):** pill `--r-pill` 100px (botões/badges/toggles/pontos) ·
  card `--r-card` 24px · input/moldura `--r-input` 16px · painel `--r-lg` 12px ·
  controle `--r-md` 8px · bottom sheet `--radius-sheet` 18px. Mapa semântico:
  `--radius-control|panel|input|card|sheet|pill`.
- **Bordas hairline 1px `--line`**; no hover migram para `--accent`. Sem underline em links.

---

## 8. ICONOGRAFIA

**Não há biblioteca de ícones.** A marca usa a logo Cultiv, pontos/círculos
(`border-radius: var(--r-pill)`) como marcadores e legendas, e unicode `→` (CTA), `×`
(fechar), `·` (separador). Prefira pontos, anéis e unicode antes de importar biblioteca
externa; se inevitável, traço fino 1–1.5px e sinalize. **Sem emoji, sem SVG ilustrativo à
mão, sem fotografia** — a "imagem" da marca é geometria generativa desenhada com os tokens.

> Doutrina visual completa (regras nomeadas, contraste medido, componentes):
> [`apps/landing/DESIGN.md`](../../apps/landing/DESIGN.md) e
> [`apps/landing/.impeccable/design.json`](../../apps/landing/.impeccable/design.json).
