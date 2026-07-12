# Issue 06-08: Expor revogação de consentimento de voz

**Status:** Pendente  
**Prioridade:** Alta  
**Dependências:** Nenhuma  

## Contexto

O backend já implementa a revogação de consentimento de voz (`apps/backend/src/safety/voice-consent-revocation.ts`). Ela remove exemplos, profile, diagnostics e snapshots do usuário e grava audit trail.

Porém:
- A rota `POST /me/voice-training-consent` em `apps/backend/src/routes/voice-routes.ts` chama **apenas** `grantConsent`.
- O SDK `packages/client-sdk/src/voice.ts` expõe **apenas** `grantConsent`.

A tela de configurações (`/app/settings`) precisa permitir que o usuário revogue o consentimento, conforme previsto no `CONTEXT.md`.

## Objetivo

Expor a revogação de consentimento via API pública e SDK.

## Escopo

### 1. Backend — rota

Escolha uma das opções:

**Opção A (recomendada):** body discriminator na rota existente
- `POST /me/voice-training-consent` aceita body `{ action: "grant" | "revoke" }`.
- Se `action === "grant"`, chama `grantConsent`.
- Se `action === "revoke"`, chama `revokeConsent`.
- Mantém compatibilidade com chamadas antigas sem body (default `grant`).

**Opção B:** rota separada
- `POST /me/voice-training-consent/revoke` chama `revokeConsent`.
- `POST /me/voice-training-consent` continua apenas grant.

Recomenda-se **Opção A** para manter um único endpoint semântico.

### 2. Backend — schema

Criar/atualizar schema no contrato para validar o body:
```ts
{
  action: Schema.optional(Schema.Literal("grant", "revoke"))
}
```

### 3. SDK

Adicionar em `packages/client-sdk/src/voice.ts`:
```ts
revokeConsent(input?: VoiceConsentInput): Effect.Effect<VoiceTrainingConsentStatusView, ClientSdkError>
```

Atualizar `packages/client-sdk/src/index.ts`.

### 4. Contratos

Atualizar `packages/contracts/src/voice.ts` se necessário para incluir schema de input de consentimento.

### 5. Testes

- Testar que `revokeConsent` remove exemplos e profile.
- Testar que `getConsentStatus` retorna `granted: false` e `revokedAt` preenchido após revogação.
- Testar que geração falha com `voice_training_consent_required` após revogação.

## Arquivos afetados

| Arquivo | Ação |
|---------|------|
| `apps/backend/src/routes/voice-routes.ts` | Adicionar lógica de revoke |
| `apps/backend/src/app/route-definitions.ts` | Manter ou ajustar rota |
| `packages/contracts/src/voice.ts` | Adicionar schema de input se necessário |
| `packages/contracts/src/index.ts` | Ajustar exports |
| `packages/client-sdk/src/voice.ts` | Adicionar `revokeConsent` |
| `packages/client-sdk/src/index.ts` | Exportar |

## Verificação

1. `pnpm build` passa.
2. Type-check do backend passa.
3. `pnpm test` passa.
4. `sdk.voice.revokeConsent()` funciona.
5. Após revogação, `sdk.voice.getProfile()` retorna vazio e geração é bloqueada.

## Risco

Baixo. A lógica de revoke já existe; falta apenas expor.
