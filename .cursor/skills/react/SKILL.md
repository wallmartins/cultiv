---
name: react
description: React components, hooks, performance.
globs: **/*.tsx
---

# React Standards

## Components
- Functional only. Props typed as `interface XxxProps`
- Max 300 lines. Extract subcomponents/hooks beyond that
- Semantic HTML, accessible (`button`, `nav`, `main`, `aria-*`)

## Hooks
- Rules of Hooks: top-level, only in components/custom hooks
- `useState` for local UI; `useReducer` for complex state
- `useEffect` only for external sync (not derived state)
- Explicit dependencies. No object/array literals in deps

## Performance
- `React.memo` only for frequent re-renders with same props
- `useMemo` for expensive calculations
- `useCallback` for functions passed to memoized children

## Avoid
- Prop drilling (use composition or context)
- `useEffect` for derived state (compute during render)
- Inline objects/functions in JSX props (unless trivial)