# Cultiv Web — Decisions

Referência rápida das decisões tomadas no planejamento. Termos de domínio completos em [`CONTEXT.md`](../../../CONTEXT.md).

## Produto

| Decisão | Valor |
|---------|-------|
| Nome público | **Cultiv** |
| Brand tone | Crescimento orgânico e pessoal |
| Fase 1 | **Marketing Surface** — validar demanda |
| Fase 2 / Web v2 | **Authenticated Workspace** (`/app/*`) |

## Fase 1 — Marketing

| Tópico | Decisão |
|--------|---------|
| Página principal | Scroll editorial único (âncoras) |
| Showcase (v1 inicial) | 3 **Showcase Samples**: blog, LinkedIn, thread |
| Formato do sample | Comparativo genérico vs. com voz |

## Fase 1.2 — Reestruturação Product Showcase

> Plano: [product-showcase-restructure-implementation-plan.md](./product-showcase-restructure-implementation-plan.md)

| Tópico | Decisão |
|--------|---------|
| Narrativa | Problema → Solution Breath → Diferenciais → Casos → Fluxo → Prova social → Waitlist → FAQ |
| Hero | H1 *Textos que soam como você.* + sub fixa |
| i18n | PT + EN na mesma entrega |
| Deploy | Vercel |

## Fase 2 — Authenticated Workspace (Web v2)

> PRD: [cultiv-authenticated-workspace-web-v2.md](../prd/cultiv-authenticated-workspace-web-v2.md)  
> Plano: [phase-2-implementation-plan.md](./phase-2-implementation-plan.md)  
> Specs: [web-v2-screen-specs.md](./web-v2-screen-specs.md)

| Tópico | Decisão |
|--------|---------|
| Escopo | Só `/app/*`; marketing estável |
| Auth | **Auth0** (ADR 0021) |
| Backend access | `@my-ai-orchestrator/client-sdk` apenas |
| Server state | TanStack Query |
| Effect-TS | Layers completos (Runtime Model B) |
| Geração | **Async Run** padrão; usuário livre após disparar |
| Resultado async | **Active Execution List** + drawer + **Completion Notification** |
| Sync | `/app/generate/$executionId` — ops/debug, não End User |
| Nav | Gerar · Histórico · Voz; Settings no avatar |
| Billing v2 | **Fora**; créditos no header via preview cache |
| Billing pós-v2 | Wallet + histórico + compra (opção C) |
| Onboarding | 2 passos: **Voice Example Composer** + welcome |
| Voz | Composer compartilhado; 1 slot → create, 2+ → batch |
| Briefing | Dinâmico por **Content Type** `inputSchema` |
| Imported context | Colapsado, paste only (≤8k) |
| Quality modes | pt: Direto/Equilibrado/Afinado · en: Light/Balanced/Polished |
| Content types | Todos visíveis e selecionáveis com assinatura ativa; **não** bloqueados por plano (ADR 0002) |
| Quality mode gating | Por **tier**: free → Direto; starter → Direto+Equilibrado; pro/enterprise → todos (ADR 0002) |
| Assinatura default | Todo **Application User** recebe plano `free` no JIT; pode ficar sem créditos, não sem assinatura (ADR 0002) |
| i18n app | Bilíngue dia 1; **App Locale** sem `/en` em `/app/*` |
| Histórico | Lista + página detalhe; drawer é atalho rápido |

## Segurança (Auth0 SPA)

| Tópico | Decisão |
|--------|---------|
| Token cache | **`memory`** — tokens não persistem em `localStorage`; reduz superfície XSS para billing/voice |
| Refresh | `useRefreshTokens` ativo; sessão mantida na aba via silent refresh |
| Reload completo | Hard refresh pode exigir novo login (tradeoff aceito vs. exfiltração de tokens) |
| Issue | [95-auth0-session-cache-security.md](../issues/95-auth0-session-cache-security.md) |

## Voz — tipos canônicos

| Tópico | Decisão |
|--------|---------|
| Fonte canônica pipeline | `TextQualityVoiceProfile` em `packages/contracts` |
| domain | `DerivedVoiceProfile` + mappers `toVoiceProfileView` / `toTextQualityVoiceProfile` |
| text-quality | `VoiceProfile` = alias de `TextQualityVoiceProfile` |
| Issue | [105-voice-profile-type-consolidation.md](../issues/105-voice-profile-type-consolidation.md) |

## Governança

- Frontend **não** chama rotas do backend diretamente (`tests/governance/frontend-client-boundary.test.ts`)
- Waitlist fica **fora** da Public API Surface
- Auth (signup/signin) é Auth0, **não** client-sdk (ADR 0028)

## Pendências

- [x] Copy final do hero (H1 + sub + CTAs) — ver Fase 1.2
- [x] PRD Web v2 — [cultiv-authenticated-workspace-web-v2.md](../prd/cultiv-authenticated-workspace-web-v2.md)
- [x] Quebrar Web v2 em issues 27–34 — ver [issues README](../issues/README.md#authenticated-workspace--web-v2)
- [ ] Tenant Auth0 produção
- [ ] Backend: onboarding flag, billing wallet, consent revoke API
- [ ] PRD Billing Surface (pós-v2)
