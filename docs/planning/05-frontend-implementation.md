# Tarefa 05: Implementação do Frontend

**Status:** Pendente
**Prioridade:** Alta
**Dependências:** Tarefas 02, 03, 04

## Objetivo

Implementar o frontend do Cultiv usando o `client-sdk` como única forma de comunicação com o backend.

## Contratos disponíveis

Consultar `docs/frontend-backend-contracts.md` para a documentação completa dos contratos SDK por tela.

## Telas a implementar

### Fase 1: Core Generation Flow
- [ ] SDK bootstrap com Auth0 token provider
- [ ] Content type catalog → selector component
- [ ] Generation intent catalog → intent picker
- [ ] Briefing form (dynamic from `inputSchema`)
- [ ] Generation preview → cost/recommendation display
- [ ] Execution creation → queue status
- [ ] SSE watch → progress bar + completion
- [ ] Active execution drawer

### Fase 2: Execution History
- [ ] Paginated list with filters
- [ ] Status badges + progress bars
- [ ] Detail view with full result

### Fase 3: Voice Dashboard
- [ ] Profile view (confidence ring, reasoning prose)
- [ ] Development traits strip
- [ ] Voice examples list
- [ ] Voice Next Step card
- [ ] Detail layer (diagnostics, coverage)

### Fase 4: Voice Onboarding (Calibration Only)
- [ ] Step 0: Context setup (domain, audience, strengths)
- [ ] Steps 1-4: Writing prompts (one screen per step)
- [ ] Step 5: Review + confirm
- [ ] Step 6: Success/error screen
- [ ] Onboarding completion → backend endpoint + SDK

### Fase 5: Settings & Billing
- [ ] Account settings (locale, consent, identity)
- [ ] Billing entitlement display
- [ ] Checkout redirect flow

## Stack tecnológica

- **Framework:** TanStack Start (conforme CONTEXT.md)
- **State:** React idiomatic + Effect-TS em boundaries de service
- **Styling:** Cultiv Cartography (design system em `packages/ui`)
- **Auth:** Auth0 SPA SDK
- **SDK:** `@my-ai-orchestrator/client-sdk`

## Regras de implementação

1. **SDK only:** Nunca fazer fetch HTTP direto
2. **Effect-TS:** Usar em boundaries de service e API, React idiomático em UI
3. **Design System:** Seguir Cultiv Cartography (tokens, componentes, motion)
4. **Bilingual:** Suporte a pt-BR e en desde o dia 1
5. **Responsive:** Desktop split layout, mobile single column

## Referências

- `docs/frontend-backend-contracts.md` — Contratos completos
- `CONTEXT.md` — Regras de produto e design
- `packages/client-sdk/` — API do SDK
- `packages/contracts/` — Schemas Effect
