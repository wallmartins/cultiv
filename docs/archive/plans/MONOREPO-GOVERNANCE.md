# Monorepo Governance

This document defines the rules that keep the monorepo stable while the migration
continues. The goal is to make package creation predictable and prevent drift in
names, imports and entrypoints.

## Dependency Policy

- dependencies always point inward
- `contracts` is the most stable shared surface
- `domain` can depend on `contracts`
- `core` can depend on `contracts`
- `orchestrator` can depend on `contracts`, `domain`, `core`, `skills`
- `skills` can depend on `contracts` and `core`
- infrastructure packages such as `database`, `ai-adapters`, `payments` and
  `feature-flags` must not be imported by `domain`
- apps may depend on packages, but packages must not depend on apps
- internal files of another package must not be imported directly; only public
  `src/index.ts` exports are allowed

## Naming Conventions

### Packages

- package names use the scope `@my-ai-orchestrator/*`
- package folder names must match the package name suffix
- package entrypoints must be exposed from `src/index.ts`

### Apps

- app folders use short, explicit names: `backend`, `web`, `mobile`
- app entrypoints should be obvious from the runtime surface

### Jobs

- job identifiers use lower snake or lower kebab style depending on transport
- job status values must remain stable and serializable
- job-related events must use semantic names such as `progress`, `done`, `error`

### Schemas And Contracts

- schemas use `Effect.Schema`
- contract names should describe the payload, not the transport
- DTO names should reflect intent and direction, such as `Request`, `Response`,
  `Result` or `Event`

### Layers And Services

- service tags must be explicit and stable
- layer constructors should follow `create*Layer` naming
- service factories should follow `create*` naming

## Smoke Test Standard

The minimum smoke test must prove that:

- workspace packages resolve correctly
- public package entrypoints can be imported
- the core layer can be composed
- orchestration planning can build a plan from contracts and domain data
- declarative skill registration and execution still work in the new layout

Smoke tests are not a replacement for unit tests. They are the smallest proof that
the monorepo still boots as a coherent system.
