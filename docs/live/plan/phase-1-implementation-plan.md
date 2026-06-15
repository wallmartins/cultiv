# Fase 1 — Marketing Surface (Implementação Detalhada)

**Objetivo:** Lançar a **Marketing Surface** do Cultiv para validar demanda — Product Showcase editorial + Waitlist — sem autenticação nem integração com o backend de produto.

**Duração estimada:** 2–3 semanas (1 dev)

**Pré-requisitos:**

- Node ≥ 18, pnpm workspaces funcionando
- Conta Vercel
- Conta Loops (API key + audience/list)
- Fontes Fraunces e Plus Jakarta Sans (Google Fonts ou self-hosted)

---

## 1. Critérios de aceite (Definition of Done)

A fase 1 está completa quando:

- [ ] `/` e `/en` renderizam a Product Showcase completa (7 seções)
- [ ] 3 Showcase Samples visíveis com comparativo genérico vs. voz em pt e en
- [ ] Toggle de locale navega entre rotas equivalentes com `hreflang` correto
- [ ] Formulário de waitlist submete com sucesso para Loops em ambos locales
- [ ] `/privacy`, `/terms` (+ variantes `/en/*`) publicados
- [ ] `prefers-reduced-motion` desativa Lenis e GSAP
- [ ] Lighthouse Performance + Accessibility ≥ 90 (target 95)
- [ ] Deploy production na Vercel com env vars configuradas
- [ ] Nenhum `fetch` direto ao backend de produto em `apps/web`
- [ ] `packages/ui` exporta tokens e primitivos consumidos por `apps/web`

**Fora de escopo:**

- Auth0, `/app`, `client-sdk`, dark mode UI, geração real, planos/pricing interativos

---

## 2. Estrutura de pacotes

### 2.1 `packages/ui`

```
packages/ui/
├── package.json              # @my-ai-orchestrator/ui
├── tsconfig.json
├── tailwind-preset/
│   └── index.ts              # theme.extend com tokens semânticos
├── src/
│   ├── tokens/
│   │   ├── colors.css        # CSS variables :root (+ .dark preparado)
│   │   ├── typography.css    # font-face ou imports
│   │   ├── spacing.ts
│   │   └── motion.ts
│   ├── primitives/
│   │   ├── Button.tsx
│   │   ├── Text.tsx          # variantes: display, h1-h3, body, caption
│   │   ├── Container.tsx     # max-width editorial + gutters
│   │   ├── Input.tsx
│   │   ├── Grid.tsx
│   │   └── index.ts
│   ├── patterns/
│   │   ├── SectionHeader.tsx
│   │   ├── ComparisonCard.tsx   # Showcase Sample card
│   │   ├── Label.tsx            # "01 / Blog post" metadata style
│   │   ├── Accordion.tsx        # FAQ
│   │   └── index.ts
│   └── index.ts
└── README.md
```

**Tokens de cor (v1 light):**

| Token | Valor | Uso |
|-------|-------|-----|
| `surface` | `#FAFAF8` | Background |
| `foreground` | `#1C1C1A` | Texto principal |
| `muted` | `#78716C` | Texto secundário |
| `accent` | `#292524` | CTAs, ênfase |
| `border` | `#E7E5E4` | Divisores |

**Escala tipográfica:**

| Variante | Font | Tamanho | Notas |
|----------|------|---------|-------|
| display | Fraunces | `clamp(3rem, 8vw, 6rem)` | Hero |
| h1 | Fraunces | `clamp(2rem, 5vw, 3.5rem)` | Seções |
| h2 | Fraunces | `1.75rem` | Subseções |
| h3 | Plus Jakarta | `1.25rem` | Cards |
| body-lg | Plus Jakarta | `1.125rem` / lh 1.7 | Lead paragraphs |
| body | Plus Jakarta | `1rem` / lh 1.6 | Showcase outputs |
| caption | Plus Jakarta | `0.75rem` uppercase tracking-widest | Labels "01 /" |

### 2.2 `apps/web`

```
apps/web/
├── package.json              # @my-ai-orchestrator/web
├── app.config.ts             # TanStack Start
├── tailwind.config.ts        # preset: @my-ai-orchestrator/ui
├── tsconfig.json
├── public/
│   ├── fonts/                # opcional se self-hosted
│   └── og/                   # fase 1.1
└── src/
    ├── routes/
    │   ├── __root.tsx
    │   ├── index.tsx
    │   ├── en/
    │   │   └── index.tsx
    │   ├── privacy.tsx
    │   ├── terms.tsx
    │   ├── en/
    │   │   ├── privacy.tsx
    │   │   └── terms.tsx
    │   └── api/
    │       └── waitlist.ts
    ├── layouts/
    │   └── MarketingLayout.tsx
    ├── sections/
    │   ├── HeroSection.tsx
    │   ├── ProofSection.tsx
    │   ├── ShowcaseSection.tsx
    │   ├── MethodSection.tsx
    │   ├── FaqSection.tsx
    │   ├── WaitlistSection.tsx
    │   └── FooterSection.tsx
    ├── components/
    │   ├── SiteHeader.tsx
    │   ├── LocaleToggle.tsx
    │   └── ScrollAnchor.tsx
    ├── animations/
    │   ├── lenis-provider.tsx
    │   ├── gsap-config.ts
    │   ├── use-scroll-reveal.ts
    │   ├── use-stagger.ts
    │   └── prefers-reduced-motion.ts
    ├── content/
    │   └── showcase/
    │       ├── types.ts
    │       ├── pt/
    │       │   ├── blog-post.ts
    │       │   ├── linkedin-post.ts
    │       │   └── thread.ts
    │       └── en/
    │           ├── blog-post.ts
    │           ├── linkedin-post.ts
    │           └── thread.ts
    ├── i18n/
    │   ├── types.ts
    │   ├── locales/
    │   │   ├── pt.ts
    │   │   └── en.ts
    │   ├── get-locale.ts
    │   └── locale-toggle.ts
    └── lib/
        └── services/
            └── waitlist/
                ├── types.ts
                ├── waitlist-service.ts
                ├── loops-adapter.ts
                └── errors.ts
```

---

## 3. Rotas e SEO

| Rota | Locale | Conteúdo |
|------|--------|----------|
| `/` | pt-BR | Product Showcase |
| `/en` | en | Product Showcase |
| `/privacy` | pt-BR | Política de privacidade |
| `/en/privacy` | en | Privacy policy |
| `/terms` | pt-BR | Termos de uso |
| `/en/terms` | en | Terms of service |
| `POST /api/waitlist` | — | Captura de email |

**`<head>` por rota:**

- `<html lang="pt-BR">` ou `lang="en"`
- `<title>` e `<meta description>` por locale
- `link rel="alternate" hreflang="pt-BR"` e `hreflang="en"`
- Open Graph: `og:title`, `og:description`, `og:locale`, `og:locale:alternate`
- `canonical` URL

---

## 4. Seções da Product Showcase

### 4.1 HeroSection

**Propósito:** Proposta de valor Cultiv + identidade visual.

**Conteúdo (placeholder até copy final):**

- Headline display
- Subtítulo body-lg
- Scroll cue (seta ou "scroll")

**Layout:**

- Desktop: headline alinhada à esquerda, largura ~70% do grid
- Mobile: headline full-width, padding generoso

**Motion:** fade-up no mount (não scroll-triggered)

### 4.2 ProofSection (opcional)

**Propósito:** Métricas de confiança (estilo "Reversiones +15" do Glyphs).

**Sugestão v1:** 2–3 números estáticos curados (ex.: "3 formatos", "Sua voz", "Preview antes de gerar") — sem claim falso de usuários.

**Motion:** stagger nos números ao entrar na viewport.

### 4.3 ShowcaseSection

**Propósito:** 3 **Showcase Samples** com comparativo.

**Layout por card (`ComparisonCard`):**

```
01 / Blog post
Briefing: "..."
┌─────────────────┬─────────────────┐
│ Genérico        │ Com sua voz     │
│ (muted border)  │ (accent border) │
│ texto...        │ texto...        │
└─────────────────┴─────────────────┘
```

**Grid:** 1 coluna mobile; 1 card por row desktop (editorial, não grid 3-col).

**Dados (`content/showcase/types.ts`):**

```typescript
type ShowcaseSample = {
  readonly id: string
  readonly contentTypeLabel: string
  readonly index: string          // "01"
  readonly briefing: string
  readonly genericOutput: string
  readonly voiceOutput: string
}
```

**Motion:** stagger entre cards (`stagger: 0.15`).

### 4.4 MethodSection

**Propósito:** Como funciona em 3 passos.

| Passo | pt-BR | en |
|-------|-------|-----|
| 01 | Ensine sua voz | Teach your voice |
| 02 | Escolha o formato | Pick a format |
| 03 | Gere com um clique | Generate in one click |

**Layout:** 3 colunas desktop → stack mobile. Numeração estilo Glyphs ("01 / Identidade").

### 4.5 FaqSection

**Propósito:** Accordion com 4–6 perguntas (produto, preço estimado, privacidade, waitlist).

**Componente:** `Accordion` em `packages/ui`.

### 4.6 WaitlistSection

**Propósito:** CTA final + captura de email.

**Campos:**

| Campo | Obrigatório | Validação |
|-------|-------------|-----------|
| email | sim | RFC 5322 simplificado |
| name | não | max 100 chars |
| consent | sim | checkbox LGPD |

**Estados UI:**

- idle → submitting → success | error
- success: mensagem "Você está na lista" / "You're on the list"
- error: mensagem tipada (validation, provider, network)

**Motion:** fade-up na seção; sem animação no formulário (a11y).

### 4.7 FooterSection

**Links:** privacy, terms, locale toggle, email de contato.

**Estilo:** linha única estilo Glyphs footer (MAIL | INSTAGRAM | etc.) — adaptar para Cultiv.

---

## 5. i18n

**Estratégia:** arquivos de mensagens tipados, sem biblioteca pesada na fase 1.

```typescript
// i18n/locales/pt.ts
export const pt = {
  hero: { title: "...", subtitle: "..." },
  waitlist: { title: "...", cta: "...", consent: "..." },
  // ...
} as const
```

**LocaleToggle:**

- Em `/` → link para `/en` (mesma hash/âncora se aplicável)
- Em `/en` → link para `/`
- Persistir preferência em `localStorage` opcional para redirect automático em visitas futuras (fase 1.1)

**Showcase content:** curadoria manual em `content/showcase/pt/` e `en/` — não auto-traduzir.

---

## 6. Waitlist — Effect service + Loops

### 6.1 Fluxo

```
WaitlistSection
  → fetch POST /api/waitlist { email, name?, locale }
  → waitlist.ts (API route)
  → Effect.runPromise(submitWaitlist(input))
  → loops-adapter.ts
  → Loops POST /api/v1/contacts/create
```

### 6.2 Tipos

```typescript
type WaitlistInput = {
  readonly email: string
  readonly name?: string
  readonly locale: "pt" | "en"
  readonly consentAt: string   // ISO timestamp
}

type WaitlistSuccess = { readonly ok: true }
type WaitlistError =
  | { readonly code: "validation_error"; readonly field: string }
  | { readonly code: "provider_error" }
  | { readonly code: "rate_limited" }
```

### 6.3 Effect program

```typescript
export const submitWaitlist = (input: WaitlistInput) =>
  Effect.gen(function* () {
    yield* validateInput(input)
    yield* callLoops(input)
    return { ok: true } as const
  })
```

### 6.4 Env vars (Vercel, server-only)

| Variável | Descrição |
|----------|-----------|
| `LOOPS_API_KEY` | API key Loops |
| `LOOPS_MAILING_LIST_ID` | Audience/list ID (se aplicável) |

### 6.5 Rate limiting (mínimo)

- Validar na API route: max 5 requests/IP/minuto (in-memory ou Vercel KV na fase 1.1)

---

## 7. Animações

### 7.1 Stack

- **Lenis** — smooth scroll global
- **GSAP + ScrollTrigger** — reveals on scroll
- **CSS transitions** — hovers

### 7.2 Defaults (`gsap-config.ts`)

```typescript
export const MOTION = {
  reveal: { duration: 0.8, y: 40, ease: "power2.out" },
  hover: { duration: 0.2, y: -2, ease: "power2.out" },
  stagger: 0.15,
} as const
```

### 7.3 Regras

- ❌ bounce, elastic, parallax agressivo
- ✅ `prefers-reduced-motion: reduce` → desliga Lenis, mata tweens ativos
- ✅ `ScrollTrigger.refresh()` após load de fontes

### 7.4 Escopo fase 1

| Animação | Incluída |
|----------|----------|
| Lenis smooth scroll | ✅ |
| Section fade-up | ✅ |
| Stagger showcase cards | ✅ |
| Hover links/buttons | ✅ |
| Hero text split reveal | ⏳ fase 1.1 |
| Image clip-path reveal | ⏳ fase 1.1 |

---

## 8. Milestones e tarefas

### M1 — Fundação (2–3 dias)

| # | Tarefa | Entregável |
|---|--------|------------|
| M1-01 | Criar `packages/ui` com package.json, tsconfig, tailwind preset | pacote buildável |
| M1-02 | Implementar tokens (colors, typography, spacing, motion) | CSS + preset |
| M1-03 | Implementar primitivos: Text, Button, Container, Input, Grid | exports em index |
| M1-04 | Implementar patterns: SectionHeader, Label, ComparisonCard, Accordion | exports |
| M1-05 | Scaffold `apps/web` com TanStack Start | `pnpm dev` funciona |
| M1-06 | Configurar Tailwind com preset de `packages/ui` | estilos aplicados |
| M1-07 | Adicionar dependências: gsap, lenis, effect, tailwind | package.json |

### M2 — Layout e seções estáticas (3–4 dias)

| # | Tarefa | Entregável |
|---|--------|------------|
| M2-01 | `MarketingLayout` + `SiteHeader` + `FooterSection` | shell navegável |
| M2-02 | `LocaleToggle` + rotas `/` e `/en` | toggle funcional |
| M2-03 | `HeroSection` | seção renderizada |
| M2-04 | `ShowcaseSection` + content types pt/en | 3 samples visíveis |
| M2-05 | `MethodSection` | 3 passos |
| M2-06 | `FaqSection` | accordion funcional |
| M2-07 | `WaitlistSection` (UI only, sem API) | formulário com estados |
| M2-08 | Páginas legal: privacy + terms (pt/en) | 4 rotas legais |

### M3 — i18n e conteúdo (2 dias)

| # | Tarefa | Entregável |
|---|--------|------------|
| M3-01 | Estrutura i18n tipada (pt.ts, en.ts) | todas strings extraídas |
| M3-02 | Curar 3 Showcase Samples em pt | copy de qualidade |
| M3-03 | Curar 3 Showcase Samples em en | copy de qualidade |
| M3-04 | SEO meta tags + hreflang por rota | head correto |

### M4 — Waitlist e API (1–2 dias)

| # | Tarefa | Entregável |
|---|--------|------------|
| M4-01 | Effect waitlist service + errors tipados | lib/services |
| M4-02 | Loops adapter | integração testável |
| M4-03 | API route `POST /api/waitlist` | endpoint funcional |
| M4-04 | Conectar WaitlistSection à API | fluxo E2E |
| M4-05 | Checkbox consent + link /privacy | LGPD mínimo |

### M5 — Motion (2 dias)

| # | Tarefa | Entregável |
|---|--------|------------|
| M5-01 | LenisProvider + integração com ScrollTrigger | smooth scroll |
| M5-02 | `use-scroll-reveal` hook | reveals funcionais |
| M5-03 | `use-stagger` no ShowcaseSection | stagger cards |
| M5-04 | `prefers-reduced-motion` guard | a11y |
| M5-05 | Hover states em Button e links | microinterações |

### M6 — Qualidade e deploy (2 dias)

| # | Tarefa | Entregável |
|---|--------|------------|
| M6-01 | Lighthouse audit + fixes | ≥ 90 em perf/a11y |
| M6-02 | Teste manual mobile (375px, 768px, 1280px) | responsivo |
| M6-03 | Configurar Vercel project + env vars | preview deploy |
| M6-04 | Deploy production + domínio | URL pública |
| M6-05 | Smoke test waitlist em production | email no Loops |

---

## 9. Testes

| Tipo | Escopo |
|------|--------|
| Unit | `waitlist-service` validation, i18n helpers |
| Integration | API route com Loops mockado |
| E2E (opcional fase 1.1) | Playwright: submit waitlist, locale toggle |
| Visual | Review manual das 3 breakpoints |
| Governance | `pnpm test tests/governance/frontend-client-boundary.test.ts` passa |

**Nota:** `client-sdk` **não** entra no `package.json` da fase 1 — governance só exige quando o pacote existir.

---

## 10. Checklist de deploy (Vercel)

- [ ] Root directory: `apps/web`
- [ ] Build command: conforme TanStack Start docs
- [ ] `LOOPS_API_KEY` em Production + Preview (encrypted)
- [ ] `LOOPS_MAILING_LIST_ID` se necessário
- [ ] Domínio custom configurado
- [ ] Redirect `www` → apex (ou vice-versa)
- [ ] Verificar `/api/waitlist` em production com curl

---

## 11. Fase 1.1 — Polish (pós-lançamento)

Não bloqueia o lançamento; executar após primeiros signups.

- [ ] Hero text split reveal (GSAP SplitText ou manual)
- [ ] OG images por locale (`public/og/`)
- [ ] `localStorage` locale preference + redirect
- [ ] Rate limiting com Vercel KV
- [ ] Playwright E2E suite
- [ ] Lighthouse target 95+
- [ ] Analytics (Plausible/Fathom — privacy-friendly)

---

## 12. Riscos

| Risco | Mitigação |
|-------|-----------|
| TanStack Start API em evolução | Fixar versão; seguir changelog |
| Copy dos samples em baixa qualidade | Curadoria manual; revisar com domain expert |
| Loops downtime | Mensagem de erro amigável; retry manual |
| Fontes bloqueiam render | `font-display: swap`; preload |
| GSAP + Lenis conflitam | `ScrollTrigger.scrollerProxy` com Lenis |
