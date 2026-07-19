// Superfície sem Effect: o que o bootstrap do app (router.tsx / main.tsx) precisa antes de
// existir uma sessão. O barrel principal reexporta ./runtime, e runtime.ts traz ManagedRuntime —
// ou seja, importar de "." arrasta Effect + client-sdk (~59 kB gzip) pro chunk inicial mesmo
// quando o visitante só vai ser redirecionado pro Auth0.
//
// Regra: só entra aqui o que não importa `effect` nem valores de `client-sdk`. makeAppRuntime
// fica de fora de propósito — quem precisa dele carrega o barrel sob demanda.
export * from "./derive/index.js";
export * from "./stores/index.js";
export { queryKeys } from "./hooks/query-keys.js";
export { RuntimeProvider, useAppRuntime } from "./runtime/RuntimeProvider.js";
export type { AppRuntime } from "./runtime/runtime.js";
