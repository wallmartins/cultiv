# i18n conventions (authenticated app)

## Where things live

- Runtime: `packages/ui/app/i18n/` — react-only. `packages/ui` is a zero-workspace-dep leaf
  (`tests/governance/monorepo-governance.test.ts` asserts `ui: new Set([])`). **Never** add an
  import from another `@my-ai-orchestrator/*` package to `packages/ui`.
- Dictionaries: `packages/ui/app/i18n/messages/{pt,en}/<slice>.ts`, composed in `{pt,en}/index.ts`.
- `pt` is the reference dictionary. `AppMessages = typeof pt`. Each `en` slice is annotated
  `AppMessages["<slice>"]`, so a key added to pt and missing from en is a **compile error**.
- Locale preference is owned by `packages/shared` (`useUiLanguage`, zustand + localStorage);
  `apps/web/src/app.tsx` reads it and pushes it into `<I18nProvider locale={...}>`.

## Consuming

**React components (`packages/ui/app/**`)** — use the hook:
```tsx
import { useMessages, useFormat } from "../i18n/index.js";
const t = useMessages();
const format = useFormat();
```

**Pure functions (`apps/web/src/**/*-view.ts`)** — take the dictionary as a parameter; do NOT call
hooks. The container calls `useMessages()` / `useFormat()` and passes them in:
```ts
export function buildX(t: AppMessages, format: AppFormatters, data: Foo) { ... }
```
Import the types from `@my-ai-orchestrator/ui/app/i18n`.

## Writing messages

- **Interpolation → function-valued leaves.** Never `"...{token}..."` + `.replace()`:
  ```ts
  sampleCounter: (index: number, total: number) => `amostra ${index} de ${total}`,
  ```
- **Pluralization → handle it.** Both languages are one/other, so a ternary is honest:
  ```ts
  days: (n: number) => `${n} ${n === 1 ? "dia" : "dias"}`,
  ```
  Several existing sites are missing this ("1 dias", "1 palavras", "1 amostras") — fix them as you
  extract; that is in scope.
- **Reuse `t.common.*`** for shared vocabulary (retry/cancel/close/back/continue/loading, length +
  channel label maps, and the `credits`/`texts`/`samples`/`days`/`words`/`generations` pluralizers).
  `LENGTH_LABEL` / `CHANNEL_LABEL` were duplicated in three files — use `t.common.length` /
  `t.common.channel` instead of re-declaring them.
- **Capitalize labels the way they should render.** Sentence case for labels and chips
  ("Primeira pessoa", "First person"). Match the surrounding screen's existing voice; lowercase
  is correct only where the design clearly uses it (e.g. mono eyebrows like "carregando…").
- Keep the product's tone: pt-BR copy here is deliberately lowercase-casual in places. The en
  translation should read as natural English written by the same person — not a literal gloss.

## Dates, numbers, money

Use `useFormat()` / the passed-in `AppFormatters`. **Delete** hand-rolled implementations:
- `format.relativeTime(iso, now?)` replaces the three copies of `formatRelativeTime` /
  `formatElapsed` (`detail-view.ts`, `history-view.ts`).
- `format.date(iso)` replaces the four `formatFullDate` / `formatDayMonth` / `formatResetDate`
  copies (`billing-view.ts`, `calibrate-view.ts`, `settings-view.ts`, `voice-mappers.ts`).
- `format.currency(value, "BRL")` replaces `formatCents`'s hand-rolled comma swap
  (`plans-view.ts`).
- `format.number(n)` for any count that can get large.

## Out of scope — do not do

UI language must NOT drive generated-CONTENT language. `useUiLanguage` is app chrome only. The
generation request's `language` field and `voiceProfile.primaryLanguage` are a different concept
(the language the text is written in). Do not wire them together.

## Tests

Update the tests in your domain to assert the **correct** rendered copy — including capitalization.
Tests must reflect how the UI should look, not the other way round. Where a test renders a
component outside `I18nProvider`, it falls back to pt-BR (`DEFAULT_LOCALE`), which is fine.
To test English, wrap in `<I18nProvider locale="en">`.

## Verify before you finish

```
pnpm --filter @my-ai-orchestrator/ui lint
pnpm --filter @my-ai-orchestrator/web lint
npx vitest run tests/web/<your-test-files>
```
Do not run the full `pnpm test` — it hits the real Groq API.
