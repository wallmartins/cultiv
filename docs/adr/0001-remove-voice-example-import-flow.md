# 0001 — Remove Voice Example Import Flow

The old voice example import flow (user pastes existing texts with metadata) is being replaced by the Voice Calibration Wizard as the sole entry point for voice profile creation. The import code is dead — no HTTP routes expose create/update, and the SDK never had write methods for examples.

## Context

The backend originally supported two paths for creating voice examples:
1. **Import flow:** User pastes authored texts via `VoiceExampleComposer`, with optional metadata (language, channel, content type, anti-patterns). Supports single create, update, and batch operations.
2. **Calibration flow:** User completes a 5-step wizard (context setup + 4 writing prompts + review). Each step produces a calibrated `VoiceExample`.

The calibration flow is now the only user-facing path. The import flow's service methods (`createExample`, `updateExample`) are not exposed via HTTP routes, and the `client-sdk` never implemented write methods for voice examples.

## Decision

Remove all code related to the old voice example import flow:
- Contract schemas: `VoiceExampleCreateInput`, `VoiceExampleUpdateInput`, all `VoiceExampleBatch*` schemas and decoders
- Domain types: `VoiceExampleBatchItem`, `VoiceExampleBatch`, `createVoiceExampleBatch()`
- Backend service: `voice-lifecycle-mutations.ts` (entire file), `createExample`/`updateExample` from service interface
- Backend helpers: `validateVoiceExampleInput`, `toVoiceExampleDraft`, batch mappers
- Database: `VoiceExampleBatchRepository` (interface + in-memory + postgres implementations), batch converters, batch errors
- Infrastructure: `VoiceExampleBatchesTable` type, postgres client wiring for batch repo
- Safety: `protectVoiceExampleBatch`, `unprotectVoiceExampleBatch`, batch rotation logic
- Tests: All tests using `services.voice.createExample()` / `updateExample()` as helpers — rewritten to use calibration flow or JSON fixtures

**Keep:**
- `VoiceExampleListItemView` and `VoiceExamplesPageView` (read-only list for Voice Dashboard)
- `wizard-voice-examples.ts` (`isWizardVoiceExample`, `resolveWizardStepId`, `resolveWizardTopicTag`)
- The `voice_example_batches` table in existing migrations (migrations are immutable)
- The `GET /me/voice-profile/examples` route (read-only list)

## Consequences

- Tests that used `createExample()` as a helper must be rewritten. Adopt a hybrid approach: calibration-flow tests exercise the real wizard; other module tests use JSON fixtures with pre-built `VoiceExample` objects.
- The `VoiceExample` domain entity and its database table (`voice_examples`) remain — they are still produced by the calibration wizard.
- The `VoiceExampleBatch*` database table type and postgres repository are removed, but the table creation in migration `0001` stays (migrations are append-only).
- Future import capabilities (e.g., bulk upload from external sources) would need to be designed from scratch, not resurrected from this code.

---

## Emendada pela ADR 0010 — Practice Profile (2026-07-21)

Ver `docs/adr/0010-practice-profile.md` → Consequências. Esta ADR continua válida; a 0010 emenda pontos específicos (calibração gerada do Practice Profile / intent muda de momento e representação / `/voice` vira identidade de escrita, conforme o caso). Consulte a 0010 antes de tratar esta como intocada.
