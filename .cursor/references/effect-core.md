# Effect Core — Referência

## Criando Effects

```typescript
import { Effect, pipe, Data } from "effect"

// Valor puro
Effect.succeed(42)
Effect.fail(new MyError())

// Sync que pode lançar
Effect.try({
  try: () => JSON.parse(raw),
  catch: (e) => new ParseError({ cause: String(e) })
})

// Async (Promise)
Effect.tryPromise({
  try: (signal) => fetch(url, { signal }),   // AbortSignal integrado
  catch: (e)    => new HttpError({ cause: e })
})

// Lazy sync puro
Effect.sync(() => Date.now())

// Suspend — para recursão ou inicialização lazy
Effect.suspend(() => minhaFuncao())
```

---

## `Effect.gen` — estilo async/await

`Effect.gen` é a forma principal de escrever lógica sequencial. O `yield*` extrai o
valor do canal de sucesso e propaga falhas automaticamente pelo canal `E`.

```typescript
const criarPedido = (dados: DadosPedido) =>
  Effect.gen(function* () {
    // yield* extrai A de Effect<A, E, R>
    const usuario  = yield* buscarUsuario(dados.usuarioId)
    const produto  = yield* buscarProduto(dados.produtoId)
    const pedido   = yield* salvarPedido({ usuario, produto, dados })

    yield* notificarUsuario(usuario.email, pedido.id)

    return pedido
  })
```

### Acessando serviços dentro de gen

```typescript
const programa = Effect.gen(function* () {
  const db     = yield* Database       // extrai a implementação do serviço
  const logger = yield* Logger.Logger  // Logger built-in

  yield* logger.info("iniciando busca")
  const rows = yield* db.query("SELECT * FROM users")
  return rows
})
```

---

## `pipe` e combinadores essenciais

```typescript
// Transformações no canal de sucesso
pipe(effect, Effect.map(a => a * 2))
pipe(effect, Effect.flatMap(a => Effect.succeed(a + 1)))
pipe(effect, Effect.tap(a => log(a)))           // side-effect, preserva valor
pipe(effect, Effect.tapError(e => log(e)))      // tap no canal de erro

// Sequenciamento quando não precisa do valor anterior
pipe(effect1, Effect.zipRight(effect2))          // retorna effect2
pipe(effect1, Effect.zipLeft(effect2))           // retorna effect1 (ex: salvar + log)

// Transformar o canal de erro
pipe(effect, Effect.mapError(e => new WrapError({ cause: e })))

// Fornecer um valor de fallback em caso de falha
pipe(effect, Effect.orElseSucceed(() => valorPadrao))

// Garantir execução (como finally)
pipe(effect, Effect.ensuring(limpeza))
```

---

## Tratamento de erros — visão geral

Detalhes completos em `errors.md`. Sumário rápido:

```typescript
// Captura por tag (mais comum)
pipe(
  effect,
  Effect.catchTag("UserNotFound", (e) => Effect.succeed(null))
)

// Captura por múltiplas tags
pipe(
  effect,
  Effect.catchTags({
    UserNotFound:  (_) => fallbackUser,
    NetworkError:  (e) => Effect.fail(new ServiceUnavailable()),
  })
)

// Captura tudo (use com parcimônia — perde especificidade)
pipe(effect, Effect.catchAll((e) => recuperar(e)))

// Defects (erros não tipados, bugs): não capture a menos que seja boundary
pipe(effect, Effect.catchAllDefect((d) => Effect.logError("BUG", d)))
```

---

## Executando Effects

Execute **somente** no entry point da aplicação ou em testes explícitos.

```typescript
import { NodeRuntime } from "@effect/platform-node"

// Aplicação Node.js — entry point
NodeRuntime.runMain(
  programa.pipe(Effect.provide(AppLayer))
)

// Ou manualmente
Effect.runPromise(programa.pipe(Effect.provide(AppLayer)))
  .then(console.log)
  .catch(console.error)

// Sync (somente se R = never e sem efeitos assíncronos)
Effect.runSync(pureSyncEffect)

// Com resultado tipado (não lança)
const exit = await Effect.runPromiseExit(programa)
// Exit.isSuccess(exit) / Exit.isFailure(exit)
```

---

## `Option` e `Either` dentro do Effect

```typescript
import { Option, Either } from "effect"

// Option → Effect (falha se None)
pipe(
  Effect.succeed(Option.some(42)),
  Effect.flatMap(Effect.getOrFail)           // falha com NoSuchElementException
)

// Ou com erro customizado
pipe(
  Effect.succeed(Option.none()),
  Effect.flatMap(opt =>
    Option.match(opt, {
      onNone: () => Effect.fail(new NaoEncontrado()),
      onSome: (v) => Effect.succeed(v)
    })
  )
)

// Either → Effect
Effect.fromEither(Either.right(42))    // succeed(42)
Effect.fromEither(Either.left("erro")) // fail("erro")
```

---

## Logging nativo

Effect tem Logger built-in que se integra com o runtime. Prefira ao `console.log`.

```typescript
import { Effect } from "effect"

const programa = Effect.gen(function* () {
  yield* Effect.logInfo("Usuário criado", { userId })
  yield* Effect.logWarning("Retry attempt", { attempt })
  yield* Effect.logError("Falha crítica", { error })
  yield* Effect.logDebug("Estado interno", { state })
})
```

---

## Valores imutáveis com `Data`

```typescript
import { Data, Equal } from "effect"

// Struct com igualdade estrutural
class Point extends Data.Class<{ x: number; y: number }> {}

const a = new Point({ x: 1, y: 2 })
const b = new Point({ x: 1, y: 2 })
Equal.equals(a, b) // true (por valor, não por referência)

// Tagged union
type Shape =
  | Data.TaggedEnum.Value<"Circle",    { radius: number }>
  | Data.TaggedEnum.Value<"Rectangle", { width: number; height: number }>

const { Circle, Rectangle } = Data.taggedEnum<Shape>()
```
