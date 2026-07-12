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
