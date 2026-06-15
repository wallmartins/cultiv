# Concorrência e Fibers — Referência

## `Effect.all` — paralelismo estruturado

```typescript
import { Effect } from "effect"

// Sequencial (padrão)
const [a, b] = yield* Effect.all([effectA, effectB])

// Paralelo — executa ao mesmo tempo
const [a, b] = yield* Effect.all([effectA, effectB], { concurrency: "unbounded" })

// Paralelo com limite
const results = yield* Effect.all(arrayDeEffects, { concurrency: 5 })

// Paralelo, não falha no primeiro erro
const results = yield* Effect.all(arrayDeEffects, {
  concurrency: "unbounded",
  mode: "either"   // resulta em Array<Either<A, E>>
})

// Com objeto (mantém tipos por chave)
const { user, config, permissions } = yield* Effect.all(
  { user: buscarUser(id), config: carregarConfig(), permissions: buscarPermissoes(id) },
  { concurrency: "unbounded" }
)
```

---

## `Effect.race` — corrida entre effects

O primeiro a completar vence; os outros são interrompidos.

```typescript
// Cache vs DB — quem responder primeiro
const resultado = yield* Effect.race(
  cache.get(key),
  db.query(key)
)

// Com timeout explícito via race
const comTimeout = yield* Effect.race(
  meuEffect,
  pipe(Effect.sleep("5 seconds"), Effect.flatMap(() => Effect.fail(new Timeout())))
)
```

---

## Fibers — concorrência baixo nível

Use fibers quando precisar de controle granular (background tasks, cancelamento manual).

```typescript
import { Effect, Fiber } from "effect"

const programa = Effect.gen(function* () {
  // fork — inicia em background, não bloqueia
  const fiber = yield* Effect.fork(processamentoLongo())

  // continue fazendo outras coisas...
  yield* outroTrabalho()

  // aguarda o resultado da fiber
  const resultado = yield* Fiber.join(fiber)

  return resultado
})

// forkScoped — fiber é cancelada quando o Scope fecha
const comScope = Effect.gen(function* () {
  yield* Effect.forkScoped(monitoramento())  // cancela automaticamente
  return yield* trabalho()
})

// Cancelar fiber manualmente
const fiber = yield* Effect.fork(tarefa)
yield* Fiber.interrupt(fiber)
```

---

## `Schedule` — agendamento e repetição

```typescript
import { Schedule, Effect } from "effect"

// Schedules básicos
Schedule.once                           // executa 1x
Schedule.recurs(5)                      // repete 5x
Schedule.spaced("1 second")            // intervalo fixo
Schedule.exponential("100 millis")     // backoff exponencial
Schedule.fixed("5 seconds")            // intervalo exato

// Composição de schedules
const meuSchedule = Schedule.exponential("50 millis").pipe(
  Schedule.jittered,                    // adiciona jitter para evitar thundering herd
  Schedule.upTo("30 seconds"),          // limite de duração total
  Schedule.whileInput((e: AppError) => e._tag === "NetworkError")  // só em erros específicos
)

// Repetir effect
yield* Effect.repeat(
  salvarMetrica(),
  Schedule.fixed("10 seconds")
)

// Retry com schedule customizado
yield* Effect.retry(effect, meuSchedule)
```

---

## Streams — processamento de dados em fluxo

```typescript
import { Stream, Effect } from "effect"

// Criar stream
const s1 = Stream.fromArray([1, 2, 3, 4, 5])
const s2 = Stream.fromEffect(buscarPagina(1))
const s3 = Stream.paginate(1, (page) =>   // paginação automática
  buscarPagina(page).pipe(
    Effect.map(r => [r.items, r.hasNext ? Option.some(page + 1) : Option.none()])
  )
)

// Transformações
pipe(
  s1,
  Stream.map(n => n * 2),
  Stream.filter(n => n > 4),
  Stream.flatMap(n => Stream.fromEffect(processarItem(n))),
  Stream.buffer({ capacity: 16 }),          // buffer para suavizar picos
  Stream.mapConcurrently(4, processarItem)  // 4 em paralelo
)

// Consumir
const resultado = yield* pipe(
  stream,
  Stream.runCollect    // Array
)

yield* pipe(
  stream,
  Stream.runForEach(item => persistir(item))
)

// Sink personalizado
yield* Stream.run(stream, Sink.sum)
```

---

## Interrupção e cancelamento

```typescript
// Tornar um bloco não-interrompível
const critico = Effect.uninterruptible(
  Effect.gen(function* () {
    yield* iniciarTransacao()
    yield* salvarDados()
    yield* confirmarTransacao()
  })
)

// Responder à interrupção com cleanup
const comCleanup = pipe(
  meuEffect,
  Effect.onInterrupt(() => liberarRecursos())
)

// Timeout que vira interrupção
pipe(
  effect,
  Effect.timeoutFail({
    onTimeout: () => new RequestTimeout(),
    duration: "5 seconds"
  })
)
```

---

## Ref — estado mutável seguro em concorrência

```typescript
import { Ref, Effect } from "effect"

const programa = Effect.gen(function* () {
  const counter = yield* Ref.make(0)

  // Múltiplas fibers atualizando — sem race condition
  yield* Effect.all(
    Array.from({ length: 100 }, () => Ref.update(counter, n => n + 1)),
    { concurrency: "unbounded" }
  )

  const total = yield* Ref.get(counter)
  return total  // 100 garantido
})

// SynchronizedRef — update assíncrono atômico
const syncRef = yield* SynchronizedRef.make(estadoInicial)
yield* SynchronizedRef.updateEffect(syncRef, estado =>
  buscarDadosAtualizados(estado)
)
```
