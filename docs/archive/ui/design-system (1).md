# Design System — AI Writing Engine

> Stack: Next.js (web) + Expo (mobile) · shadcn/ui + Tailwind v4 (web) · NativeWind (mobile)  
> Paleta: ver `color-palette.md`  
> Pacote compartilhado: `packages/ui`

---

## Princípios

**Neutro como padrão, acento com intenção.** A interface recua para que o conteúdo gerado se destaque. Cor aparece para comunicar estado, não para decorar.

**Hierarquia tipográfica, não hierarquia de cor.** Peso e tamanho de fonte fazem mais trabalho que variação cromática.

**Densidade moderada.** Produto de produtividade — não precisa de espaçamento generoso de marketing, mas também não pode ser denso como um IDE. Padding interno de cards em `16px`, gap entre seções em `24px`.

**Feedback imediato e explícito.** O fluxo de geração tem estados complexos (idle → calculating → generating → done/error). Cada transição precisa de feedback visual claro — skeleton, spinner, progress, toast.

---

## Tipografia

Font family: **Geist** (web) / **System font stack** (mobile via NativeWind)

```typescript
// tokens.ts
export const typography = {
  fontFamily: {
    sans: 'Geist, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    mono: '"Geist Mono", "Fira Code", monospace',
  },

  fontSize: {
    xs:   ['0.75rem',  { lineHeight: '1rem' }],        // 12px — captions, badges
    sm:   ['0.8125rem',{ lineHeight: '1.25rem' }],     // 13px — labels, helper text
    base: ['0.875rem', { lineHeight: '1.5rem' }],      // 14px — body padrão
    md:   ['1rem',     { lineHeight: '1.625rem' }],    // 16px — body ênfase
    lg:   ['1.125rem', { lineHeight: '1.75rem' }],     // 18px — subtítulos
    xl:   ['1.25rem',  { lineHeight: '1.875rem' }],    // 20px — títulos de seção
    '2xl':['1.5rem',   { lineHeight: '2rem' }],        // 24px — títulos de página
    '3xl':['1.875rem', { lineHeight: '2.25rem' }],     // 30px — headings grandes
    '4xl':['2.25rem',  { lineHeight: '2.5rem' }],      // 36px — hero
  },

  fontWeight: {
    regular: '400',
    medium:  '500',
    semibold:'600',
  },
} as const;
```

### Escala de uso

| Elemento                        | Size   | Weight    |
| ------------------------------- | ------ | --------- |
| Hero headline (landing)         | `4xl`  | `semibold`|
| Títulos de página (`h1`)        | `2xl`  | `semibold`|
| Títulos de seção / card (`h2`)  | `xl`   | `medium`  |
| Subtítulos / labels de grupo    | `lg`   | `medium`  |
| Body principal                  | `base` | `regular` |
| Labels de campo, helper text    | `sm`   | `regular` |
| Badges, captions, meta          | `xs`   | `medium`  |
| Código inline                   | `sm`   | `regular` (mono) |

> **Regra de ouro:** nunca usar `semibold` abaixo de `lg`. Pesos pesados em texto pequeno ficam carregados.

---

## Espaçamento

Base `4px`. Tailwind padrão.

```typescript
export const spacing = {
  // Internos de componentes
  1: '4px',   // gap mínimo (ícone + label)
  2: '8px',   // padding interno xs
  3: '12px',  // padding interno sm
  4: '16px',  // padding interno padrão (cards, inputs)
  5: '20px',  // padding interno lg
  6: '24px',  // gap entre componentes na mesma seção
  8: '32px',  // gap entre seções
  10: '40px', // padding de página mobile
  12: '48px', // padding de página desktop
  16: '64px', // seções da landing
  20: '80px', // seções grandes
} as const;
```

### Grid

| Contexto             | Colunas | Gap     | Max-width   |
| -------------------- | ------- | ------- | ----------- |
| App (sidebar layout) | 1       | —       | `100%`      |
| Landing              | 12      | `24px`  | `1280px`    |
| Cards de plano       | 3       | `16px`  | `960px`     |
| Formulário de briefing| 1      | `16px`  | `640px`     |
| Modal / onboarding   | 1       | `16px`  | `480px`     |

---

## Border Radius

```typescript
export const radii = {
  sm:   '4px',    // badges, chips pequenos
  md:   '6px',    // inputs, botões
  lg:   '10px',   // cards, modais
  xl:   '14px',   // cards grandes, painéis
  full: '9999px', // pills, avatares
} as const;
```

---

## Sombras

Minimalistas — usadas apenas para elevação real (modais, dropdowns).

```typescript
export const shadows = {
  none: 'none',
  sm:   '0 1px 2px rgba(0,0,0,0.06)',               // cards no dark mode
  md:   '0 4px 12px rgba(0,0,0,0.08)',              // dropdowns, popovers
  lg:   '0 8px 24px rgba(0,0,0,0.12)',              // modais
} as const;
```

> No light mode, cards se diferenciam do fundo pela borda (`border: 0.5px solid #E5E5E3`), não por sombra. Sombra aparece apenas no dark mode como substituto de borda de baixo contraste.

---

## Componentes

### 1. Button

```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent';
  size:    'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;       // ícone à esquerda
  iconRight?: ReactNode;  // ícone à direita
  fullWidth?: boolean;
  children: ReactNode;
  onClick: () => void;
}
```

| Variant     | Uso                                               | Light bg   | Dark bg    |
| ----------- | ------------------------------------------------- | ---------- | ---------- |
| `primary`   | Ação principal no app (Gerar, Salvar, Confirmar)  | `#111110`  | `#FAFAF9`  |
| `secondary` | Ação secundária (Cancelar, Voltar)                | `transparent` + border `#E5E5E3` | idem |
| `ghost`     | Ações terciárias, nav inline (Pular, Ver detalhes)| `transparent`, sem border | idem |
| `danger`    | Ações destrutivas (Excluir conta, Remover exemplo)| `#B91C1C` texto | `#F87171` texto |
| `accent`    | Apenas landing/CTA de upgrade para Pro            | `#7C3AED`  | `#7C3AED`  |

| Size | Height | Padding H | Font size |
| ---- | ------ | --------- | --------- |
| `sm` | `32px` | `12px`    | `13px`    |
| `md` | `40px` | `16px`    | `14px`    |
| `lg` | `48px` | `20px`    | `15px`    |

**Loading state:** substitui o conteúdo por `<Spinner size="sm" />` + mantém o width fixo (evitar layout shift).

**Regras:**
- `primary` e `accent` nunca na mesma tela ao mesmo tempo.
- `danger` só em modais de confirmação — nunca exposto diretamente na UI principal.
- Ícone sem label só em `ghost sm` com tooltip obrigatório.

---

### 2. Input / Textarea

```typescript
interface InputProps {
  label:       string;
  placeholder?: string;
  error?:       string;
  helper?:      string;
  required?:    boolean;
  disabled?:    boolean;
  prefix?:      ReactNode;  // ícone ou texto à esquerda
  suffix?:      ReactNode;  // ícone ou texto à direita
  size?:        'sm' | 'md';
}
```

**Anatomia:**

```
[Label]  [* obrigatório]
┌──────────────────────────────┐
│  [prefix]  valor  [suffix]   │  ← border: neutral-200, radius: md
└──────────────────────────────┘
[Helper text ou mensagem de erro]
```

**Estados:**

| Estado     | Border                  | Bg               |
| ---------- | ----------------------- | ---------------- |
| Default    | `neutral-200`           | `bg-surface`     |
| Hover      | `neutral-400`           | `bg-surface`     |
| Focus      | `accent-600` (2px)      | `bg-surface`     |
| Error      | `danger` (2px)          | `danger-bg` 30%  |
| Disabled   | `neutral-200` dashed    | `bg-subtle`      |

**Textarea específico:**
- Briefing field: `min-height: 120px`, `resize: vertical`
- Voice example text: `min-height: 200px`, counter de caracteres no canto inferior direito

---

### 3. Select

Baseado no `<select>` nativo com estilo customizado (shadcn/ui `Select` no web, `Picker` no mobile).

```typescript
interface SelectProps {
  label?:    string;
  options:   { value: string; label: string; disabled?: boolean }[];
  value:     string;
  onChange:  (value: string) => void;
  error?:    string;
  placeholder?: string;
  disabled?: boolean;
}
```

Usado em: Content Type, Tom, Idioma, Canal, Formato (tela de voice example).

---

### 4. Badge

```typescript
interface BadgeProps {
  variant: 'success' | 'warning' | 'danger' | 'neutral' | 'accent';
  size?:   'sm' | 'md';
  dot?:    boolean;   // dot colorido antes do label
  children: ReactNode;
}
```

| Variant   | Fg light     | Bg light   | Uso                                        |
| --------- | ------------ | ---------- | ------------------------------------------ |
| `success` | `#15803D`    | `#DCFCE7`  | Status ✅, voice alta, geração ok          |
| `warning` | `#B45309`    | `#FEF3C7`  | Voice média, saldo baixo                   |
| `danger`  | `#B91C1C`    | `#FEE2E2`  | Status ❌, voice baixa, erro               |
| `neutral` | `neutral-500`| `neutral-100` | Content type, modo, meta info           |
| `accent`  | `accent-700` | `accent-50`| Plano Pro, feature premium                 |

**Regra:** badges de status (`success`/`danger`) nunca com ícone emoji inline — usar apenas o dot ou ícone do sistema.

---

### 5. Card

```typescript
interface CardProps {
  variant?: 'default' | 'elevated' | 'bordered' | 'subtle';
  padding?: 'sm' | 'md' | 'lg';
  title?:   string;
  action?:  ReactNode;  // botão/link no canto superior direito
  children: ReactNode;
}
```

| Variant    | Border              | Bg            | Shadow         | Uso                              |
| ---------- | ------------------- | ------------- | -------------- | -------------------------------- |
| `default`  | `neutral-200` 0.5px | `bg-surface`  | none           | Cards padrão (briefing, settings)|
| `elevated` | none                | `bg-surface`  | `shadow-md`    | Modais, dropdowns                |
| `bordered` | `neutral-700` 0.5px | `bg-surface`  | none           | Card de seleção ativa (plano)    |
| `subtle`   | none                | `bg-subtle`   | none           | Seções internas, métricas        |

---

### 6. Spinner / Loading

```typescript
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';  // 16 / 24 / 36px
  label?: string;              // acessibilidade (aria-label)
}
```

Único componente de loading — sem skeleton por padrão, exceto nos casos abaixo.

**Quando usar Skeleton em vez de Spinner:**
- Preview panel (aguardando `/api/generation-preview`) — skeleton de 1 linha com "Calculando preço..."
- Lista do histórico na primeira carga
- Resultado de geração enquanto processa async

---

### 7. Toast

```typescript
interface ToastProps {
  variant: 'success' | 'warning' | 'danger' | 'neutral';
  title:   string;
  description?: string;
  action?: { label: string; onClick: () => void };
  duration?: number;  // ms, default 4000
}
```

**Posição:** canto inferior direito (web), topo (mobile — não conflita com tab bar).

**Regra de prioridade:** `danger` interrompe qualquer toast ativo. Toasts de `success` se acumulam em fila, não se sobrepõem.

---

### 8. ReminderBanner

Componente específico do produto. Aparece em `/app/generate` enquanto o usuário não completa os passos de onboarding.

```typescript
interface ReminderBannerProps {
  step:    'voice' | 'preferences' | 'plan';
  onAction: () => void;   // navega para o passo correspondente
  onDismiss?: () => void; // oculta até próxima sessão (nunca permanente)
}
```

**Visual:** `bg-warning-bg`, borda `warning` 0.5px, ícone ⚠, texto + botão ghost "Adicionar agora".

**Regra:** um banner por vez. Se múltiplos passos pendentes, exibe o de maior prioridade (`voice` > `preferences` > `plan`).

---

### 9. QualityModeSelector

Componente específico do produto. Seleciona Fast / Balanced / Strict.

```typescript
interface QualityModeSelectorProps {
  value:    'fast' | 'balanced' | 'strict';
  onChange: (mode: 'fast' | 'balanced' | 'strict') => void;
  disabled?: boolean;
  disabledModes?: ('fast' | 'balanced' | 'strict')[];  // ex: strict só no Pro
}
```

**Visual:** grupo de 3 chips lado a lado.

| Estado        | Border          | Texto           | Weight |
| ------------- | --------------- | --------------- | ------ |
| Inativo       | `neutral-200`   | `text-secondary`| 400    |
| Hover         | `neutral-400`   | `text-primary`  | 400    |
| Selecionado   | `neutral-700`   | `text-primary`  | 500    |
| Desabilitado  | `neutral-200` dashed | `text-tertiary` | 400 |

O chip desabilitado exibe um badge `accent` "Pro" inline.

---

### 10. CreditIndicator

```typescript
interface CreditIndicatorProps {
  balance:  number;
  reserved?: number;
  variant?: 'header' | 'preview' | 'full';
}
```

| Variant   | Aparece em                          | Visual                                      |
| --------- | ----------------------------------- | ------------------------------------------- |
| `header`  | Header global                       | `◎ 120` — pill `bg-subtle`                 |
| `preview` | PreviewPanel antes de gerar         | "Saldo: 120 → 115" em `text-secondary`     |
| `full`    | `/app/billing`                      | Barra de progresso + números detalhados     |

**Thresholds de cor do indicador `header`:**
- `balance >= 20%` do plano → `neutral` (sem destaque)
- `balance < 20%` → `warning`
- `balance === 0` → `danger`

---

### 11. VoiceConfidenceIndicator

```typescript
interface VoiceConfidenceIndicatorProps {
  level:   'high' | 'medium' | 'low' | 'none';
  variant: 'dot' | 'badge' | 'full';
}
```

| Variant | Visual                                    | Uso                              |
| ------- | ----------------------------------------- | -------------------------------- |
| `dot`   | Dot colorido + texto simples              | Tela de geração (compacto)       |
| `badge` | Badge com dot e label                     | Cards do histórico               |
| `full`  | Card com nível + diagnóstico + barra      | Voice Dashboard                  |

---

### 12. ProgressTracker

Dois usos distintos no produto:

**Onboarding steps:**
```typescript
interface OnboardingProgressProps {
  steps:   { label: string }[];
  current: number;
}
```
Visual: linha horizontal com dots. Dot preenchido = completo, dot contornado = pendente, dot accent = ativo.

**Geração async (SSE):**
```typescript
interface GenerationProgressProps {
  steps: {
    label:  string;
    status: 'done' | 'active' | 'pending' | 'error';
  }[];
  percent: number;
}
```
Visual: lista vertical + barra de progresso linear no topo. Steps concluídos com `✓` em `success`. Step ativo com spinner animado.

---

### 13. DataTable

Usado em Histórico e Billing Ledger.

```typescript
interface DataTableProps<T> {
  columns: {
    key:       keyof T;
    label:     string;
    width?:    string;
    render?:   (value: T[keyof T], row: T) => ReactNode;
    sortable?: boolean;
  }[];
  data:       T[];
  loading?:   boolean;
  emptyState: ReactNode;
  onRowClick?: (row: T) => void;
}
```

**Regras:**
- Linhas alternadas com `bg-subtle` (não zebra pesada — apenas 30% de opacidade).
- Hover na linha com `bg-subtle` + cursor pointer se `onRowClick` definido.
- Colunas de status sempre com `Badge`, nunca texto puro.
- Coluna de data sempre no formato `dd/MM` (dentro do mês atual) ou `dd/MM/yy` (histórico antigo).

---

### 14. EmptyState

```typescript
interface EmptyStateProps {
  icon?:        ReactNode;
  title:        string;
  description?: string;
  action?:      { label: string; onClick: () => void };
}
```

Usado em: histórico vazio, nenhum voice example, sem resultados de filtro.

**Visual:** centralizado verticalmente, ícone em `neutral-200`, título em `text-primary`, descrição em `text-secondary`.

---

### 15. PlanCard

```typescript
interface PlanCardProps {
  name:       string;
  price:      string;
  credits:    string;
  features:   string[];
  isCurrent?: boolean;
  isPopular?: boolean;
  onSelect:   () => void;
}
```

**Visual:** card padrão. `isPopular` usa borda `accent` 1.5px e badge `accent` "Mais popular" no topo. `isCurrent` desabilita o botão e exibe label "Plano atual".

---

## Composição de formulário

Padrão para todos os formulários do produto:

```
FormSection            ← agrupa campos relacionados com título
  FieldGroup           ← row com 2 campos (ex: Tom + Idioma)
    FormField          ← label + input/select + error/helper
  FormField (full)     ← textarea (briefing)
  FormActions          ← botões alinhados à direita
    Button ghost       ← ação secundária (Pular, Cancelar)
    Button primary     ← ação principal (Continuar, Salvar)
```

**Espaçamento:**
- Entre `FormSection` e `FormSection`: `32px`
- Entre `FormField` e `FormField`: `16px`
- Entre `FormActions` e último campo: `24px`

---

## Estados de loading por contexto

| Contexto                       | Pattern           | Duração estimada  |
| ------------------------------ | ----------------- | ----------------- |
| Preview de preço (debounce)    | Skeleton 1 linha  | < 1s              |
| Geração Fast                   | Spinner no botão  | < 10s             |
| Geração Balanced               | ProgressTracker SSE | ~30s            |
| Geração Strict                 | ProgressTracker SSE | ~2min           |
| Carregamento de histórico      | Skeleton de tabela | < 2s            |
| Voice examples list            | Spinner centralizado | < 1s           |

---

## Padrões de erro por contexto

| Contexto              | Pattern                                                      |
| --------------------- | ------------------------------------------------------------ |
| Campo inválido        | Inline abaixo do input, `text-danger`, `font-sm`            |
| Saldo insuficiente    | PreviewPanel desabilita botão + mensagem inline              |
| Geração falhou        | Tela de resultado com StatusBar `danger` + ações de recovery |
| Rede offline          | Toast `danger` + retry automático em background              |
| Sessão expirada       | Full-screen redirect — não toast                             |
| 500 / erro de servidor| Full-screen com botão "Tentar novamente"                     |

**Regra:** erros recuperáveis → inline ou toast. Erros que bloqueiam toda a sessão → full-screen.

---

## Navegação

### Web — Sidebar

```typescript
interface SidebarItem {
  icon:    ReactNode;
  label:   string;
  href:    string;
  badge?:  ReactNode;  // ex: badge de saldo baixo em Billing
}
```

**Estado ativo:** borda esquerda `2px accent`, texto `text-primary`, bg `accent-subtle`.  
**Collapsed (768–1023px):** apenas ícones com tooltip no hover.  
**< 768px:** bottom navigation com os mesmos itens.

### Mobile — Tab Bar

4 tabs: Gerar, Histórico, Voz, Conta. Ícone + label. Tab ativa: ícone `accent`, label `accent`.

---

## Acessibilidade

- Todos os ícones decorativos com `aria-hidden="true"`.
- Ícones funcionais (sem label) com `aria-label` descritivo.
- Focus ring: `outline: 2px solid accent-600; outline-offset: 2px` — nunca remover `outline`.
- Contraste mínimo 4.5:1 para texto (body) e 3:1 para UI (bordas, ícones).
- `QualityModeSelector` e `OnboardingProgress` com `role="radiogroup"` e `role="radio"`.
- Toasts com `role="status"` (neutro/sucesso) ou `role="alert"` (erro).
- `DataTable` com `<th scope="col">` e `aria-sort` nas colunas ordenáveis.

---

## Platform split — `packages/ui`

```
packages/ui/
├── src/
│   ├── types.ts              ← interfaces compartilhadas (ButtonProps, etc.)
│   ├── tokens.ts             ← cores, tipografia, espaçamento, radii
│   ├── web/
│   │   ├── primitives/
│   │   │   ├── Button.tsx         ← shadcn/ui base + variantes
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Spinner.tsx
│   │   │   └── Toast.tsx          ← sonner
│   │   └── product/
│   │       ├── QualityModeSelector.tsx
│   │       ├── CreditIndicator.tsx
│   │       ├── VoiceConfidenceIndicator.tsx
│   │       ├── ReminderBanner.tsx
│   │       ├── ProgressTracker.tsx
│   │       ├── PlanCard.tsx
│   │       └── EmptyState.tsx
│   └── mobile/
│       ├── primitives/
│       │   ├── Button.tsx         ← Pressable + NativeWind
│       │   ├── Input.tsx
│       │   ├── Select.tsx         ← Picker wrapper
│       │   ├── Badge.tsx
│       │   ├── Card.tsx
│       │   └── Toast.tsx          ← react-native-toast-message
│       └── product/
│           ├── QualityModeSelector.tsx
│           ├── CreditIndicator.tsx
│           ├── VoiceConfidenceIndicator.tsx
│           └── ProgressTracker.tsx
```

Componentes complexos que diferem demais entre plataformas ficam em `apps/web/components/` e `apps/mobile/components/` respectivamente: `BriefingForm`, `ResultViewer`, `PreviewPanel`, `GenerationProgress`.

---

## Dependências recomendadas

### Web

| Pacote                | Uso                                           |
| --------------------- | --------------------------------------------- |
| `shadcn/ui`           | Base para Button, Input, Select, Dialog, Toast|
| `sonner`              | Toast notifications                           |
| `@radix-ui/react-*`   | Primitivos acessíveis (via shadcn)            |
| `lucide-react`        | Ícones                                        |
| `tailwind-variants`   | Variantes de componente type-safe             |
| `class-variance-authority` | CVA para variantes (usado pelo shadcn)   |

### Mobile

| Pacote                       | Uso                                |
| ---------------------------- | ---------------------------------- |
| `nativewind`                 | Tailwind no React Native           |
| `react-native-toast-message` | Toast notifications                |
| `@expo/vector-icons`         | Ícones (Feather ou MaterialIcons)  |
| `react-native-reanimated`    | Animações do ProgressTracker       |

---

## Checklist de novo componente

Antes de publicar um componente em `packages/ui`:

- [ ] Interface TypeScript documentada em `types.ts`
- [ ] Variantes cobertas (estados: default, hover, focus, disabled, loading, error)
- [ ] Dark mode testado (todas as cores via CSS variable / token)
- [ ] `aria-*` aplicados corretamente
- [ ] Focus ring visível
- [ ] Implementação web e mobile (ou justificativa para ser platform-only)
- [ ] Sem magic numbers — todos os valores vindos de `tokens.ts`
