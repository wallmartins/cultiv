# Workspace Visual Refresh — Plano de implementação

**Objetivo:** Elevar o **Authenticated Workspace** (`/app/*`) a um visual premium contemporâneo (**Jardim de Vidro**), mantendo o **Marketing Surface** intocado.

**Origem:** Sessão grill-with-docs (2026-06-14) + [ADR 0003](../../adr/0003-workspace-visual-refresh.md)

**Duração estimada:** 2–3 semanas (1 dev)

**Governança:**

- PRD: [`workspace-visual-refresh.md`](../prd/workspace-visual-refresh.md)
- Parent issue: [`issue-workspace-visual-refresh.md`](../prd/issue-workspace-visual-refresh.md)
- ADR: [`0003-workspace-visual-refresh.md`](../../adr/0003-workspace-visual-refresh.md)
- Glossary: [`CONTEXT.md`](../../../CONTEXT.md)
- Issues: [`39`–`47`](../issues/README.md#workspace-visual-refresh)

**Pré-requisitos:**

- Web v2 funcional (issues 27–38) — telas reais para aplicar o refresh
- `packages/ui` estável para primitivos base (`Button`, `Text`, `Input`)
- App Shell, Generation Screen, Drawer, Voice Dashboard já existem em `apps/web`

---

## 1. Definition of Done (programa completo)

- [ ] `data-surface="workspace"` (ou equivalente) no **App Shell** com tokens locais em `apps/web`
- [ ] Tipografia sans-only em `/app/*`; zero Playfair/Caveat no workspace
- [ ] Acentos cromáticos limitados a moss + golden
- [ ] Primitivos app (`AppCard`, `AppField`, `AppSegmentedControl`, `AppSkeleton`) adotados nas telas piloto
- [ ] **App Shell** com glass refinado (header, dock, bottom nav, créditos)
- [ ] **Generation Screen**: split desktop + preview sticky; coluna única mobile
- [ ] **Active Execution Drawer**: ~520px slide-over desktop; full-screen mobile; tipografia de leitura
- [ ] **Voice Dashboard**: anel de crescimento para **Voice Confidence**
- [ ] **Execution History** + **Execution Result View** com polish de leitura
- [ ] **Onboarding** + **Account Settings** alinhados ao sistema visual
- [ ] Motion contido + `prefers-reduced-motion` em hooks/utilitários compartilhados
- [ ] Marketing (`/`, `/en`, legal) visualmente inalterado
- [ ] Issue 47 (QA gate) aprovada

**Fora do DoD:** dark mode, violet accent, marketing motion changes, novos endpoints.

---

## 2. Arquitetura visual

```
┌─────────────────────────────────────────────────────────────┐
│  Marketing Surface (/)                                       │
│  packages/ui theme.css — editorial tokens (inalterado)       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Authenticated Workspace (/app/*)                            │
│  apps/web/src/styles/app.css — workspace overrides           │
│    data-surface="workspace"                                  │
│    sans display · radius · warm shadows · organic-glow-app   │
├─────────────────────────────────────────────────────────────┤
│  apps/web/src/components/ui/                                 │
│    AppCard · AppField · AppSegmentedControl · AppSkeleton    │
├─────────────────────────────────────────────────────────────┤
│  apps/web/src/animations/ (workspace motion)                 │
│    route fade · mount stagger · drawer spring                │
├─────────────────────────────────────────────────────────────┤
│  Screen compositions (existing routes)                       │
│    GenerationScreen · AppShell · Drawer · VoiceDashboard …   │
└─────────────────────────────────────────────────────────────┘
```

### Princípios de implementação

| Princípio | Regra |
|-----------|--------|
| **Isolamento** | Overrides escopados a workspace root; não alterar classes globais usadas pelo marketing |
| **Formulários legíveis** | Campos com fundo sólido; glass só em chrome e cards |
| **Motion contido** | 180–320ms; sem bounce/elastic; reduced motion → opacity only |
| **Piloto primeiro** | Generation Screen valida primitives antes de espalhar |
| **Incremental** | Cada issue 39–46 entrega algo verificável em browser |

---

## 3. Tokens workspace (issue 39)

Variáveis alvo (implementação em `app.css`):

| Token | Valor alvo | Uso |
|-------|------------|-----|
| `--font-display` (workspace) | `var(--font-body)` | Títulos de tela sans |
| `--radius-sm` | `0.5rem` | chips, inputs |
| `--radius-md` | `0.75rem` | cards |
| `--radius-lg` | `1rem` | drawer, panels |
| `--shadow-card` | warm diffuse | cards glass |
| `--motion-duration-fast` | `180ms` | hover |
| `--motion-duration-normal` | `200ms` | route |
| `--motion-duration-slow` | `320ms` | drawer |
| `--motion-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` | padrão |

Utilitários:

- `.organic-glow-workspace` — versão mais sutil que marketing hero
- `@media (prefers-reduced-motion: reduce)` — colapsar transições

---

## 4. Mapa de telas

| Tela | Issue | Mudanças principais |
|------|-------|---------------------|
| **App Shell** | 41 | Header glass, credit chip, dock polish |
| **Generation Screen** | 42 | Split layout, preview sticky, segmented quality |
| **Active Execution Drawer** | 43 | Largura, full-screen mobile, reading type |
| **Voice Dashboard** | 44 | Growth ring, card grid |
| **Execution History** | 45 | Row hover, status dots |
| **Execution History Detail / Result** | 45 | Relaxed typography, toolbar |
| **Onboarding** | 46 | Progress stem simplificado, glass cards |
| **Account Settings** | 46 | Seções em cards |

---

## 5. Fases e issues

### Fase A — Fundação (semana 1)

| Issue | Entrega |
|-------|---------|
| **39** | Workspace root attribute + tokens + motion CSS vars + reduced motion |
| **40** | `AppCard`, `AppField`, `AppSegmentedControl`, `AppSkeleton` |
| **41** | App Shell chrome (paralelo após 39) |

### Fase B — Piloto e fluxos core (semana 1–2)

| Issue | Entrega |
|-------|---------|
| **42** | Generation Screen visual (depende de 40) |
| **43** | Active Execution Drawer reading surface |
| **44** | Voice Dashboard confidence ring |

### Fase C — Polish e QA (semana 2–3)

| Issue | Entrega |
|-------|---------|
| **45** | History + result reading polish |
| **46** | Onboarding + settings |
| **47** | QA gate (HITL) |

**Ordem sugerida:** `39 → (40 ∥ 41) → (42, 43, 44, 45 em paralelo) → 46 → 47`

---

## 6. Riscos e mitigações

| Risco | Mitigação |
|-------|-----------|
| Overrides vazam para marketing | Escopo estrito com `data-surface="workspace"`; smoke test em `/` e `/app/generate` |
| Glass reduz legibilidade em forms | Fundo sólido em `AppField`; glass só em chrome |
| Motion excessivo cansa | ADR motion contido; QA com reduced motion |
| Split layout quebra mobile | Mobile-first fallback em 42; testar 375px |
| Duplicação de componentes | Primitives em `apps/web/components/ui`; promover a `packages/ui` só se mobile app precisar depois |

---

## 7. Verificação manual (pré-QA 47)

1. Abrir `/` — confirmar hero/editorial inalterado
2. Abrir `/app/generate` — sans titles, split desktop, preview sticky
3. Disparar geração — drawer slide-over / mobile full-screen
4. Abrir `/app/voice` — growth ring anima uma vez
5. Toggle `prefers-reduced-motion` no OS — sem stagger/slide
6. Inspecionar computed styles — `--font-display` sans no workspace only

---

## 8. Referências

- [ADR 0003](../../adr/0003-workspace-visual-refresh.md)
- [Web v2 screen specs](./web-v2-screen-specs.md) — comportamento funcional (inalterado)
- [Design system](../web-structure/design-system.md) — pacote compartilhado
- [System animation](../web-structure/system-animation.md) — padrões marketing (não replicar scroll chapters no app)
