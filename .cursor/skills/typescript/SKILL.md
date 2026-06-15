---
name: typescript
description: TypeScript type safety and naming.
globs: **/*.{ts,tsx}
---

# TypeScript Standards

## Types
- `interface` for objects/classes; `type` for unions/mapped types
- Never `any`. Use `unknown` + type guard
- Enable `strict`, `noUncheckedIndexedAccess`
- `readonly` for non-mutated parameters

## Naming & Structure
- PascalCase: types/interfaces/enums
- camelCase: variables/functions/parameters
- Prefix unused callback params with `_`: `arr.map((_, i) => ...)`
- Order: imports → types → constants → pure functions → side-effects → exports

## Avoid
- `as` assertions (prefer type guard)
- `export default` (named exports only)
- Deep nesting (use early returns or optional chaining)