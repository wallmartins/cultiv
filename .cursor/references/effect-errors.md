# Gerenciamento de Erros — Referência

## Modelando erros tipados

Use `Data.TaggedError` para todos os erros de domínio e infraestrutura.
O campo `_tag` é o discriminador que permite `catchTag`.

```typescript
import { Data } from "effect"

// Erro simples
class UserNotFound extends Data.TaggedError("UserNotFound")<{
  readonly userId: string
}> {}

// Erro com causa (wrapping)
class DbError extends Data.TaggedError("DbError")<{
  readonly cause: unknown
  readonly sql?:  string
}> {}

// Erro com mensagem custom (útil para exibir ao usuário)
class ValidationError extends Data.TaggedError("ValidationError")<{
  readonly field:   string
  readonly message: string
}> {}
```

### Union de erros em um use case

```typescript
type CriarPedidoError =
  | UserNotFound
  | ProductOutOfStock
  | PaymentFailed
  | DbError

const criarPedido = (dados: DadosPedido): Effect.Effect<
  Pedido,
  CriarPedidoError,
  Database | PaymentGateway
> =>
  Effect.gen(function* () { ... })
```

---

## `catchTag` — captura específica (padrão)

```typescript
pipe(
  criarPedido(dados),
  Effect.catchTag("ProductOutOfStock", (_e) =>
    Effect.fail(new ServiceUnavailable({ message: "Produto indisponível" }))
  ),
  Effect.catchTag("UserNotFound", (e) =>
    Effect.fail(new Unauthorized({ userId: e.userId }))
  )
  // PaymentFailed e DbError permanecem no canal E do resultado
)
```

### `catchTags` — múltiplas tags em um bloco

```typescript
pipe(
  effect,
  Effect.catchTags({
    UserNotFound:     (_) => Effect.succeed(null),
    ValidationError:  (e) => Effect.fail(new BadRequest(e.message)),
    DbError:          (e) => { yield* Effect.logError("DB failure", e); return Effect.fail(e) }
  })
)
```

---

## Distinção: Failures vs Defects

| Tipo | Descrição | Como criar | Como capturar |
|---|---|---|---|
| **Failure** | Erro esperado, tipado no canal `E` | `Effect.fail(new MyError())` | `catchTag`, `catchAll` |
| **Defect** | Bug inesperado (ex: null deref, throw solto) | `Effect.die(new Error())` ou `throw` | `catchAllDefect` (boundary) |
| **Interruption** | Fiber cancelada | Automático em `race`, `timeout` | `onInterrupt`, `uninterruptible` |

Só capture Defects em boundaries (handler de requisição HTTP, main). Nunca
silencie defects com `catchAllDefect` em lógica de negócio.

---

## Retry e scheduling

```typescript
import { Schedule, Effect } from "effect"

// Retry 3x com backoff exponencial
pipe(
  effect,
  Effect.retry(
    Schedule.exponential("100 millis").pipe(
      Schedule.jittered,
      Schedule.upTo("30 seconds"),
      Schedule.compose(Schedule.recurs(3))
    )
  )
)

// Retry apenas em erros específicos
pipe(
  effect,
  Effect.retryWhile(e => e._tag === "NetworkError")
)

// Timeout
pipe(
  effect,
  Effect.timeout("5 seconds"),
  Effect.catchTag("TimeoutException", () => Effect.fail(new RequestTimeout()))
)
```

---

## Mapeando erros para boundaries (HTTP, etc.)

```typescript
import { HttpApp, HttpServerResponse } from "@effect/platform"

const toHttpResponse = (e: AppError): HttpServerResponse.HttpServerResponse => {
  switch (e._tag) {
    case "UserNotFound":    return HttpServerResponse.json({ error: "not found" }, { status: 404 })
    case "ValidationError": return HttpServerResponse.json({ error: e.message },  { status: 400 })
    case "Unauthorized":    return HttpServerResponse.json({ error: "forbidden" }, { status: 403 })
    default:                return HttpServerResponse.json({ error: "internal" },  { status: 500 })
  }
}

const handler = pipe(
  meuUseCase(params),
  Effect.mapError(toHttpResponse),
  Effect.merge  // colapsa sucesso e erro em um único canal
)
```

---

## `Either` para erros que não devem interromper o fluxo

Quando você precisa continuar o fluxo independente de falha:

```typescript
import { Either } from "effect"

const resultados = yield* Effect.forEach(ids, (id) =>
  pipe(
    buscarItem(id),
    Effect.either   // Effect<Either<Item, NotFound>, never, Deps>
  )
)

const [erros, itens] = resultados.reduce(
  ([e, i], r) =>
    Either.isLeft(r)
      ? [[...e, r.left], i]
      : [e, [...i, r.right]],
  [[], []] as [NotFound[], Item[]]
)
```

---

## Combinando erros de múltiplos effects

```typescript
// Falha imediatamente se qualquer um falhar
const [a, b, c] = yield* Effect.all([effectA, effectB, effectC])

// Coleta todos os resultados (falha ou sucesso)
const results = yield* Effect.allSettled([effectA, effectB, effectC])

// Valida acumulando TODOS os erros (não para no primeiro)
import { Schema } from "effect"

const validar = Schema.decodeUnknown(MeuSchema, { errors: "all" })
// retorna array de erros de validação, não apenas o primeiro
```
