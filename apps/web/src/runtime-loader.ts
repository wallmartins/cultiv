import type { AppRuntime } from "@my-ai-orchestrator/shared/light";

// O runtime arrasta Effect + client-sdk (~59 kB gzip, o maior item do bundle) e nada disso serve
// até o app falar com o backend. Quem chega da landing sem sessão é mandado pro Auth0 antes de
// qualquer chamada — então o import fica atrás desta função, fora do chunk inicial.
//
// Uma promessa só, memoizada: beforeLoad, loader e o provider disputam o mesmo runtime, e criar
// dois significaria dois caches de SDK.
let pending: Promise<AppRuntime> | undefined;

export function loadRuntime(getToken: () => Promise<string>): Promise<AppRuntime> {
  pending ??= import("@my-ai-orchestrator/shared").then((shared) =>
    shared.makeAppRuntime({ baseUrl: import.meta.env.VITE_API_URL, getToken })
  );
  return pending;
}
