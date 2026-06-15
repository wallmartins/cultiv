---
name: testing
description: Testing standards (Vitest/Jest + RTL).
globs: **/*.{test,spec}.{ts,tsx}
---

# Testing Standards

## Structure
- Arrange → Act → Assert (AAA)
- Each test independent. No shared state
- Describe blocks by behavior/component

## Naming
- 3rd person verbs: `it('returns the sum')` (not "should")

## What to Test
- Happy path + edge cases + error path
- Test behavior, not implementation
- Write test for each bug fixed

## Mocking
- `vi.mock` / `jest.mock` at top level
- Prefer real implementations for utilities
- Mock only network/IO boundaries

## React Testing
- RTL: `render`, `screen`, `userEvent`
- Query by role: `getByRole('button')`
- `waitFor` for async updates

## Effect-ts Testing
- `Effect.runPromise` or `Effect.runPromiseExit`
- Assert on `Exit.isSuccess` / `Exit.isFailure`

## Coverage
- 80% on business logic. Don't chase %