# Testes — Referência

## Setup com `@effect/vitest`

```bash
npm install -D @effect/vitest vitest
```

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    globals: true,
  }
})
```

```typescript
// meu-use-case.test.ts
import { it, expect } from "@effect/vitest"
import { Effect, Layer } from "effect"
```

---

## `it.effect` — o padrão principal

Elimina o boilerplate de `Effect.runPromise` em cada teste.

```typescript
import { it, expect } from "@effect/vitest"
import { Effect }     from "effect"

it.effect("deve criar usuário com sucesso", () =>
  Effect.gen(function* () {
    const result = yield* criarUsuario({ name: "João", email: "joao@email.com" })

    expect(result.id).toBeDefined()
    expect(result.name).toBe("João")
  }).pipe(Effect.provide(TestLayer))
)

it.effect("deve falhar com email duplicado", () =>
  Effect.gen(function* () {
    yield* criarUsuario({ name: "João", email: "joao@email.com" })

    const result = yield* Effect.exit(
      criarUsuario({ name: "Maria", email: "joao@email.com" })
    )

    expect(Exit.isFailure(result)).toBe(true)
    // verificar a tag do erro
    if (Exit.isFailure(result)) {
      const cause = Cause.failureOption(result.cause)
      expect(Option.isSome(cause) && cause.value._tag).toBe("DuplicateEmail")
    }
  }).pipe(Effect.provide(TestLayer))
)
```

---

## Layers de teste

### Substituindo serviços reais por fakes

```typescript
// services/DatabaseTest.ts
import { Layer, Effect } from "effect"
import { Database }      from "./Database"

// In-memory fake
const makeInMemoryDb = () => {
  const store = new Map<string, unknown>()

  return {
    query: (sql: string) => Effect.succeed([...store.values()]),
    exec:  (sql: string) => Effect.succeed(undefined),
    // helpers de teste
    _seed:  (key: string, val: unknown) => { store.set(key, val) },
    _clear: () => { store.clear() },
  }
}

export const DatabaseTest = Layer.sync(Database, makeInMemoryDb)
```

### Compondo o TestLayer

```typescript
// test/layers.ts
export const TestLayer = Layer.mergeAll(
  DatabaseTest,
  Layer.succeed(Logger.Logger, silentLogger),   // sem ruído nos testes
  HttpClientTest,                                // client mockado
  ConfigTest,                                    // config fixa
)
```

---

## `TestClock` — controlando o tempo

```typescript
import { TestClock, Effect } from "effect"
import { it }                from "@effect/vitest"

it.effect("deve expirar cache após 5 minutos", () =>
  Effect.gen(function* () {
    const cache = yield* Cache.make({ ttl: "5 minutes" })

    yield* cache.set("key", "value")

    // avança o clock virtual em 4 minutos
    yield* TestClock.adjust("4 minutes")
    const v1 = yield* cache.get("key")
    expect(Option.isSome(v1)).toBe(true)

    // avança mais 2 minutos (total 6 > TTL)
    yield* TestClock.adjust("2 minutes")
    const v2 = yield* cache.get("key")
    expect(Option.isNone(v2)).toBe(true)
  })
)
```

---

## Testando erros específicos

```typescript
import { Exit, Cause, Option } from "effect"

it.effect("deve falhar com UserNotFound para id inválido", () =>
  Effect.gen(function* () {
    const exit = yield* Effect.exit(buscarUsuario("id-inexistente"))

    // helper limpo para verificar falha tipada
    const failure = Exit.isFailure(exit)
      ? Cause.failureOption(exit.cause)
      : Option.none()

    expect(Option.isSome(failure)).toBe(true)
    expect(failure.pipe(Option.map(e => e._tag), Option.getOrNull)).toBe("UserNotFound")
  }).pipe(Effect.provide(TestLayer))
)

// Ou usando o helper Effect.flip
it.effect("deve expor o erro no canal de sucesso para asserção", () =>
  Effect.gen(function* () {
    const err = yield* Effect.flip(buscarUsuario("id-inexistente"))
    expect(err._tag).toBe("UserNotFound")
    expect(err.userId).toBe("id-inexistente")
  }).pipe(Effect.provide(TestLayer))
)
```

---

## Property-based testing com `Schema`

```typescript
import { Schema, FastCheck } from "effect"

const arb = Schema.to(UserSchema)  // Arbitrary<User> gerado do schema

it("deve serializar e deserializar sem perda", () => {
  FastCheck.assert(
    FastCheck.property(arb, (user) => {
      const encoded = Schema.encodeSync(UserSchema)(user)
      const decoded = Schema.decodeSync(UserSchema)(encoded)
      return Equal.equals(user, decoded)
    })
  )
})
```

---

## Estrutura de diretórios de testes

```
src/
├── usecases/
│   ├── CreateUser.ts
│   └── CreateUser.test.ts      # co-located, preferido para unit
tests/
├── integration/
│   └── UserFlow.test.ts        # testes de ponta a ponta com DB real
└── layers/
    └── index.ts                # TestLayer compartilhado
```

---

## Boas práticas

- Prefira `it.effect` a `it` + `Effect.runPromise` — evita esquecimento de `await`
- Cada teste fornece seu próprio `Layer.provide` — sem estado global entre testes
- Use `Layer.fresh(MyLayer)` se um Layer não pode ser compartilhado entre testes
- `TestClock` é automático em `it.effect` — não precisa ativar manualmente
- Nunca use `Effect.runSync` em testes assíncronos — use `it.effect` ou `await Effect.runPromise`
- Teste o **canal de erro** (`Effect.flip`, `Effect.exit`) com a mesma rigorosidade do canal de sucesso
