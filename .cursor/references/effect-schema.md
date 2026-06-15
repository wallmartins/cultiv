# Schema e Validação — Referência

> `Schema` está unificado no pacote `effect` desde a versão 3.x.
> Importe de `"effect"`, não de `"@effect/schema"`.

```typescript
import { Schema, Effect } from "effect"
```

---

## Construindo schemas

```typescript
// Primitivos
Schema.String
Schema.Number
Schema.Boolean
Schema.BigInt
Schema.Date       // string → Date com validação
Schema.UUID       // string com formato UUID

// Literais e unions
Schema.Literal("admin", "user", "guest")
Schema.Union(Schema.String, Schema.Number)

// Structs
const UserSchema = Schema.Struct({
  id:       Schema.UUID,
  name:     Schema.String,
  email:    Schema.String.pipe(Schema.pattern(/^.+@.+\..+$/)),
  age:      Schema.Number.pipe(Schema.int(), Schema.between(0, 150)),
  role:     Schema.Literal("admin", "user"),
  tags:     Schema.Array(Schema.String),
  address:  Schema.optional(Schema.Struct({
    street: Schema.String,
    city:   Schema.String
  }))
})

// Inferindo o tipo TypeScript do schema
type User = Schema.Schema.Type<typeof UserSchema>
```

---

## Parsing (decode)

Sempre use as funções que retornam `Effect`, nunca as versões que lançam.

```typescript
// decode: string/unknown → tipo alvo (valida + transforma)
const decode = Schema.decodeUnknown(UserSchema)

const resultado = yield* decode(dadosBrutos)
// ou com opções:
const resultado = yield* Schema.decodeUnknown(UserSchema, { errors: "all" })(dadosBrutos)
// errors: "all" acumula todos os erros em vez de parar no primeiro

// Para dados já tipados (ex: vindo de DB)
const resultado = yield* Schema.decode(UserSchema)(dadosDoDb)

// Encode: tipo → representação serializada (inverso do decode)
const json = yield* Schema.encode(UserSchema)(user)
```

### Tratando erros de parsing

O erro retornado é `ParseError` com detalhes estruturados.

```typescript
pipe(
  Schema.decodeUnknown(UserSchema)(rawData),
  Effect.catchTag("ParseError", (e) =>
    Effect.fail(new ValidationError({
      message: TreeFormatter.formatErrorSync(e)  // mensagem legível
    }))
  )
)
```

---

## Transformações com `Schema.transform`

```typescript
// String de data → Date object
const DateFromString = Schema.transform(
  Schema.String,
  Schema.Date,
  {
    decode: (s) => new Date(s),     // string → Date
    encode: (d) => d.toISOString()  // Date → string
  }
)

// ID numérico do DB → UUID string
const IdFromNumber = Schema.transform(
  Schema.Number,
  Schema.UUID,
  {
    decode: (n) => toUUID(n),
    encode: (u) => fromUUID(u)
  }
)
```

---

## Schemas para DTOs de API

```typescript
// Request body — decodifica do JSON recebido
const CreateUserRequest = Schema.Struct({
  name:     Schema.String.pipe(Schema.minLength(1), Schema.maxLength(100)),
  email:    Schema.String.pipe(Schema.pattern(emailRegex)),
  password: Schema.String.pipe(Schema.minLength(8)),
})

// Response — codifica para enviar ao cliente (nunca expõe hash de senha)
const UserResponse = Schema.Struct({
  id:        Schema.UUID,
  name:      Schema.String,
  email:     Schema.String,
  createdAt: Schema.Date,
})

// Uso no handler
const criarUsuario = (body: unknown) =>
  Effect.gen(function* () {
    const request = yield* Schema.decodeUnknown(CreateUserRequest)(body)
    const user    = yield* userService.create(request)
    return yield* Schema.encode(UserResponse)(user)
  })
```

---

## `Schema.Class` — schemas como classes

Combina schema + tipo + construtor em um só:

```typescript
class User extends Schema.Class<User>("User")({
  id:    Schema.UUID,
  name:  Schema.String,
  email: Schema.String,
}) {}

// User é ao mesmo tempo:
// - construtor: new User({ id, name, email })
// - schema: Schema.decodeUnknown(User)(raw)
// - tipo: instanceOf User com igualdade estrutural (Data.Class)

class CreateUserDto extends Schema.Class<CreateUserDto>("CreateUserDto")({
  name:     Schema.String.pipe(Schema.minLength(1)),
  email:    Schema.String,
  password: Schema.String.pipe(Schema.minLength(8)),
}) {}
```

---

## Validações customizadas com `Schema.filter`

```typescript
const PositiveNumber = Schema.Number.pipe(
  Schema.filter(n => n > 0, {
    message: () => "deve ser um número positivo"
  })
)

const EmailString = Schema.String.pipe(
  Schema.filter(
    (s) => /^[^@]+@[^@]+\.[^@]+$/.test(s),
    { message: () => "email inválido" }
  )
)

// Refinamento com branded types
const UserId = Schema.UUID.pipe(
  Schema.brand("UserId")
)
type UserId = Schema.Schema.Type<typeof UserId>  // string & Brand<"UserId">
```

---

## Schemas recursivos

```typescript
interface Category {
  name:     string
  children: Category[]
}

const CategorySchema: Schema.Schema<Category> = Schema.Struct({
  name:     Schema.String,
  children: Schema.Array(Schema.suspend(() => CategorySchema))
})
```
