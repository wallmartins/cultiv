# Color Palette — AI Writing Engine

> Filosofia: neutrals como protagonistas, um único acento cromático, semânticas apenas onde há urgência real.
> Referências: Linear, Craft, Vercel, Raycast.

---

## Neutrals (warm stone)

Base de 90% da interface. Quase imperceptível, mas mais humano que um cinza puro.

| Token        | Light      | Dark       | Uso                        |
| ------------ | ---------- | ---------- | -------------------------- |
| `bg-page`    | `#FAFAF9`  | `#080807`  | Background da página       |
| `bg-subtle`  | `#F4F4F3`  | `#111110`  | Linhas alternadas, inativo |
| `bg-surface` | `#FFFFFF`  | `#111110`  | Cards, painéis             |
| `border`     | `#E5E5E3`  | `#1D1D1B`  | Bordas padrão              |
| `border-strong` | `#3A3A37` | `#2A2A28` | Bordas de hover/foco    |
| `text-primary`  | `#3A3A37` | `#F4F4F3` | Conteúdo principal       |
| `text-secondary`| `#6B6B67` | `#6B6B67` | Labels, descrições        |
| `text-tertiary` | `#A3A39F` | `#3A3A37` | Placeholders, desabilitado|

```typescript
neutral: {
  50:  '#FAFAF9',  // bg-page light
  100: '#F4F4F3',  // bg-subtle
  200: '#E5E5E3',  // border light
  400: '#A3A39F',  // placeholder / text-tertiary
  500: '#6B6B67',  // text-secondary
  700: '#3A3A37',  // text-primary light / border-strong
  900: '#111110',  // bg-surface dark / botão primário light
  950: '#080807',  // bg-page dark
}
```

---

## Acento único — Violet

Representa IA e voz. Aparece com intenção, nunca como decoração.

**Onde usar:**
- CTA primário da landing page
- Item ativo na sidebar
- Badge de plano "Pro"
- Elementos de voz/IA (confidence indicator, voice dashboard)

**Onde não usar:**
- Botão primário no app autenticado (usa `neutral-900` / `neutral-50`)
- Chips de modo de geração (Fast / Balanced / Strict)
- Indicadores de crédito

| Stop | Hex       | Uso                              |
| ---- | --------- | -------------------------------- |
| 50   | `#F4F2FF` | Subtle bg (light)                |
| 100  | `#E5E1FD` | Hover bg (light)                 |
| 300  | `#C4B8FB` | Border em surface violet         |
| 400  | `#A78BFA` | **Foreground dark mode** ★       |
| 600  | `#7C3AED` | **Foreground light mode** ★      |
| 700  | `#6D28D9` | Hover state (light)              |
| —    | `#1E1730` | Subtle bg (dark)                 |

```typescript
accent: {
  50:      '#F4F2FF',
  100:     '#E5E1FD',
  300:     '#C4B8FB',
  400:     '#A78BFA',  // dark foreground  ★
  600:     '#7C3AED',  // light foreground ★  ← brand
  700:     '#6D28D9',  // hover
  subtleDark: '#1E1730',
}
```

---

## Botão primário

Preto no light, branco no dark — sem cor. Elegante, sem depender do acento.

| Modo  | Background | Texto      |
| ----- | ---------- | ---------- |
| Light | `#111110`  | `#FAFAF9`  |
| Dark  | `#FAFAF9`  | `#111110`  |

O violet é usado como botão primário **apenas na landing page**, onde o objetivo é converter.

---

## Quality Modes (Fast / Balanced / Strict)

Sem cor própria. Diferenciados por borda e peso tipográfico.

| Estado      | Border         | Texto      | Font weight |
| ----------- | -------------- | ---------- | ----------- |
| Inativo     | `border`       | `text-secondary` | 400   |
| Selecionado | `border-strong`| `text-primary`   | 500   |

Cores a mais aqui seriam decoração, não informação.

---

## Semânticas

Usadas **apenas** em estados críticos: toasts de erro, saldo zerado, alertas de formulário, voice confidence.

| Papel     | Foreground light | Foreground dark | BG light   | BG dark    |
| --------- | ---------------- | --------------- | ---------- | ---------- |
| `success` | `#15803D`        | `#4ADE80`       | `#DCFCE7`  | `#052E16`  |
| `warning` | `#B45309`        | `#D97706`       | `#FEF3C7`  | `#1C1708`  |
| `danger`  | `#B91C1C`        | `#F87171`       | `#FEE2E2`  | `#2D0C0C`  |

```typescript
success: { fg: '#15803D', fgDark: '#4ADE80', bg: '#DCFCE7', bgDark: '#052E16' },
warning: { fg: '#B45309', fgDark: '#D97706', bg: '#FEF3C7', bgDark: '#1C1708' },
danger:  { fg: '#B91C1C', fgDark: '#F87171', bg: '#FEE2E2', bgDark: '#2D0C0C' },
```

Sem "info blue" separado — o acento violet já cobre elementos informativos de IA/voz.

---

## Voice Confidence

Usa as semânticas, não cores próprias.

| Nível | Cor       | Dot foreground light | Dot foreground dark |
| ----- | --------- | -------------------- | ------------------- |
| Alta  | `success` | `#15803D`            | `#4ADE80`           |
| Média | `warning` | `#B45309`            | `#D97706`           |
| Baixa | `danger`  | `#B91C1C`            | `#F87171`           |

---

## Tokens completos — `packages/ui-config/tokens.ts`

```typescript
export const colors = {
  accent: {
    50:         '#F4F2FF',
    100:        '#E5E1FD',
    300:        '#C4B8FB',
    400:        '#A78BFA',  // dark foreground
    600:        '#7C3AED',  // light foreground ← brand
    700:        '#6D28D9',  // hover
    subtleDark: '#1E1730',
  },

  neutral: {
    50:  '#FAFAF9',
    100: '#F4F4F3',
    200: '#E5E5E3',
    400: '#A3A39F',
    500: '#6B6B67',
    700: '#3A3A37',
    900: '#111110',
    950: '#080807',
  },

  success: { fg: '#15803D', fgDark: '#4ADE80', bg: '#DCFCE7', bgDark: '#052E16' },
  warning: { fg: '#B45309', fgDark: '#D97706', bg: '#FEF3C7', bgDark: '#1C1708' },
  danger:  { fg: '#B91C1C', fgDark: '#F87171', bg: '#FEE2E2', bgDark: '#2D0C0C' },
} as const;
```

---

## CSS Variables — Tailwind v4

```css
/* globals.css */
@layer base {
  :root {
    --color-bg-page:           #FAFAF9;
    --color-bg-subtle:         #F4F4F3;
    --color-bg-surface:        #FFFFFF;
    --color-border:            #E5E5E3;
    --color-border-strong:     #3A3A37;
    --color-text-primary:      #3A3A37;
    --color-text-secondary:    #6B6B67;
    --color-text-tertiary:     #A3A39F;

    --color-accent:            #7C3AED;
    --color-accent-hover:      #6D28D9;
    --color-accent-subtle:     #F4F2FF;

    --color-btn-primary-bg:    #111110;
    --color-btn-primary-text:  #FAFAF9;

    --color-success:           #15803D;
    --color-success-bg:        #DCFCE7;
    --color-warning:           #B45309;
    --color-warning-bg:        #FEF3C7;
    --color-danger:            #B91C1C;
    --color-danger-bg:         #FEE2E2;
  }

  .dark {
    --color-bg-page:           #080807;
    --color-bg-subtle:         #111110;
    --color-bg-surface:        #111110;
    --color-border:            #1D1D1B;
    --color-border-strong:     #2A2A28;
    --color-text-primary:      #F4F4F3;
    --color-text-secondary:    #6B6B67;
    --color-text-tertiary:     #3A3A37;

    --color-accent:            #A78BFA;
    --color-accent-hover:      #C4B8FB;
    --color-accent-subtle:     #1E1730;

    --color-btn-primary-bg:    #FAFAF9;
    --color-btn-primary-text:  #111110;

    --color-success:           #4ADE80;
    --color-success-bg:        #052E16;
    --color-warning:           #D97706;
    --color-warning-bg:        #1C1708;
    --color-danger:            #F87171;
    --color-danger-bg:         #2D0C0C;
  }
}
```
