# Serviços e Layers — Referência

## Anatomia de um serviço

Um serviço Effect tem três partes: **interface**, **tag** e **implementação (Layer)**.

```typescript
import { Context, Effect, Layer } from "effect"

// 1. Interface — o contrato (puro TypeScript)
interface DatabaseService {
  readonly query:  (sql: string, params?: unknown[]) => Effect.Effect<Row[], DbError>
  readonly exec:   (sql: string, params?: unknown[]) => Effect.Effect<void, DbError>
}

// 2. Tag — identificador no Context
class Database extends Context.Tag("app/Database")<
  Database,
  DatabaseService
>() {}

// 3. Layer — implementação real
const DatabaseLive = Layer.scoped(
  Database,
  Effect.gen(function* () {
    const config = yield* Config          // depende de outro serviço
    const pool   = yield* Effect.acquireRelease(
      Effect.tryPromise(() => createPool(config.dbUrl)),
      (p) => Effect.promise(() => p.end())
    )

    return {
      query:  (sql, params) => Effect.tryPromise({
        try:  () => pool.query(sql, params).then(r => r.rows),
        catch: (e) => new DbError({ cause: e })
      }),
      exec: (sql, params) => Effect.tryPromise({
        try:  () => pool.query(sql, params).then(() => undefined),
        catch: (e) => new DbError({ cause: e })
      })
    }
  })
)
```

---

## Acessando serviços

Dentro de `Effect.gen`, use `yield*` na Tag. O tipo `R` do Effect resultante
inclui o serviço automaticamente.

```typescript
// R = Database | Logger (inferido automaticamente)
const buscarUsuario = (id: string) =>
  Effect.gen(function* () {
    const db  = yield* Database
    const log = yield* Logger.Logger

    yield* log.debug("buscando usuário", { id })
    return yield* db.query("SELECT * FROM users WHERE id = $1", [id])
  })
```

---

## Composição de Layers

`Layer` é um grafo de dependências resolvido em compile-time.

```typescript
// Layer.provide — fornece dep para outro layer
const AppDatabase = DatabaseLive.pipe(
  Layer.provide(ConfigLive)   // DatabaseLive precisa de Config
)

// Layer.merge — combina layers independentes
const InfraLayer = Layer.merge(AppDatabase, LoggerLive)

// Composição completa da aplicação
const AppLayer = Layer.mergeAll(
  AppDatabase,
  LoggerLive,
  HttpClientLive,
  EmailServiceLive
)

// Executando com layers
Effect.runPromise(
  programa.pipe(Effect.provide(AppLayer))
)
```

### Diagrama de dependências

```
AppLayer
├── DatabaseLive  → precisa de → ConfigLive
├── LoggerLive    → (sem deps externas)
├── HttpClientLive → precisa de → ConfigLive
└── EmailServiceLive → precisa de → ConfigLive + HttpClientLive
```

Effect resolve o grafo automaticamente — sem order de inicialização manual.

---

## Tipos de Layer

```typescript
// Layer simples (síncrono, sem recursos)
const ConfigLive = Layer.succeed(
  Config,
  { dbUrl: process.env.DATABASE_URL!, port: 3000 }
)

// Layer baseado em Effect (pode ser assíncrono)
const LoggerLive = Layer.effect(
  Logger.Logger,
  Effect.gen(function* () => {
    // setup...
    return myLoggerImpl
  })
)

// Layer com recurso gerenciado (acquireRelease automático)
const DatabaseLive = Layer.scoped(
  Database,
  Effect.gen(function* () {
    const pool = yield* Effect.acquireRelease(
      Effect.tryPromise(() => Pool.create()),
      (p) => Effect.promise(() => p.destroy())
    )
    return makeDbService(pool)
  })
)

// Layer "memoizado" — instanciado uma vez por runtime
// (comportamento padrão; use Layer.fresh() para forçar nova instância)
```

---

## Layer para testes

A principal vantagem do sistema de Layer é poder trocar implementações em testes:

```typescript
// Implementação fake para testes
const DatabaseTest = Layer.succeed(Database, {
  query: (_sql, _params) => Effect.succeed([{ id: "1", name: "Test User" }]),
  exec:  (_sql, _params) => Effect.succeed(undefined)
})

// No teste (Vitest)
import { it } from "@effect/vitest"

it.effect("deve buscar usuário", () =>
  Effect.gen(function* () {
    const result = yield* buscarUsuario("1")
    expect(result).toHaveLength(1)
  }).pipe(Effect.provide(DatabaseTest))
)
```

---

## Configuração com `Config`

Effect tem um sistema de configuração tipado que integra com serviços:

```typescript
import { Config, ConfigError, Effect } from "effect"

// Schema de configuração
const AppConfig = Config.all({
  port:    Config.number("PORT").pipe(Config.withDefault(3000)),
  dbUrl:   Config.string("DATABASE_URL"),
  apiKey:  Config.secret("API_KEY"),        // valor ofuscado nos logs
  debug:   Config.boolean("DEBUG").pipe(Config.withDefault(false))
})

// Usando no Layer
const AppConfigLive = Layer.effect(
  AppConfigTag,
  Effect.gen(function* () {
    return yield* AppConfig  // lê do process.env automaticamente
  })
)
```

---

## Serviços opcionais com `Layer.optionallyProvide`

Quando uma dependência pode não estar presente:

```typescript
const programa = Effect.gen(function* () {
  const cache = yield* Effect.serviceOption(RedisCache)

  if (Option.isSome(cache)) {
    return yield* cache.value.get(key)
  }
  return yield* dbFallback(key)
})
```
