## Effect Package Checklist

- [ ] fallible public APIs return `Effect.Effect`
- [ ] error channel uses tagged errors, not generic `Error`
- [ ] runtime code does not use `Schema.decodeUnknownSync`
- [ ] IO uses `Effect.try` / `Effect.tryPromise`
- [ ] `Effect.runSync` / `Effect.runPromise` only appear in entrypoints or tests
- [ ] no new `Promise` contracts were introduced in Effect packages
- [ ] tests assert `_tag` for expected failures
