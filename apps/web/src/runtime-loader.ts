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
    shared.makeAppRuntime({ baseUrl: resolveBaseUrl(), getToken })
  );
  return pending;
}

// Vite inlina `undefined` quando a var não existe no build, e o erro só aparece muito depois, como
// "URL constructor: /me/... is not a valid URL" dentro de um fiber. ImportMetaEnv tem index
// signature `any`, então o tsc não pega o nome errado — a checagem precisa ser em runtime.
function resolveBaseUrl(): string {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  if (!baseUrl) {
    throw new Error("VITE_API_BASE_URL ausente no build do app — nenhuma chamada ao backend funciona sem ela.");
  }
  return baseUrl;
}
