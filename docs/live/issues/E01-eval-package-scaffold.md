# E01 — Eval package scaffold

## What to build

Create the `packages/eval` workspace package with the foundational structure: `package.json` with the `@my-ai-orchestrator/eval` name, TypeScript config, `src/` directory with `index.ts` barrel export, and `fixtures/` directory skeleton.

The package must integrate with the existing pnpm workspace setup and follow the same conventions as `packages/text-quality` (tsconfig, build scripts, exports).

## Acceptance criteria

- [x] `packages/eval/package.json` exists with name `@my-ai-orchestrator/eval`
- [x] Package is registered in root `pnpm-workspace.yaml`
- [x] `tsconfig.json` extends root config
- [x] `src/index.ts` barrel export exists (empty initially)
- [x] `src/types.ts` placeholder exists
- [x] `src/fixtures/` directory exists with subdirs: `voice-fidelity/`, `drift-regression/`, `critic-regression/`
- [x] `pnpm install` succeeds without errors
- [x] `pnpm --filter @my-ai-orchestrator/eval build` compiles cleanly

## Blocked by

None — can start immediately.
