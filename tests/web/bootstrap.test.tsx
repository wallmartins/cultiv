/**
 * @vitest-environment jsdom
 */
import { createMemoryHistory } from "@tanstack/react-router";
import { act, render, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { makeAppRuntime, queryKeys, type AppRuntime } from "@my-ai-orchestrator/shared";
import { router, type RouterContext } from "~/router.js";
import { queryClient } from "~/query-client.js";
import { App } from "~/app.js";
import {
  consentGranted,
  emptyExecutionsPage,
  entitlementFixture,
  onboardingCompleted,
  voiceProfileFixture
} from "./fixtures.js";

// O App lê o Auth0 por hook; estes campos são o que ele consome.
let auth0State = {
  isLoading: true,
  isAuthenticated: false,
  user: undefined as { name?: string } | undefined,
  getAccessTokenSilently: async () => "test-token",
  loginWithRedirect: async () => {},
  logout: async () => {}
};

vi.mock("@auth0/auth0-react", () => ({ useAuth0: () => auth0State }));

// O runtime desce por import dinâmico em produção; aqui a resolução é manual, para poder parar o
// app exatamente no intervalo "sessão já resolvida, runtime ainda descendo" — onde o bug vivia.
let releaseRuntime: (runtime: AppRuntime) => void;
const runtimePromise = new Promise<AppRuntime>((resolve) => {
  releaseRuntime = resolve;
});

vi.mock("~/runtime-loader.js", () => ({ loadRuntime: () => runtimePromise }));

function seedGate(): void {
  queryClient.setQueryData(queryKeys.onboarding(), onboardingCompleted);
  queryClient.setQueryData(queryKeys.voiceConsent(), consentGranted);
  queryClient.setQueryData(queryKeys.voiceProfile(), voiceProfileFixture);
  queryClient.setQueryData(queryKeys.executionsList({ q: undefined, status: "all", period: "all" }), emptyExecutionsPage);
  queryClient.setQueryData(queryKeys.entitlement(), entitlementFixture);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("app bootstrap", () => {
  // Regressão: o efeito que reavalia o gate de auth disparava assim que isLoading virava false,
  // mas o RouterProvider (quem injeta o context de verdade, no render) só monta depois que o
  // runtime desce. No intervalo entre os dois, o router rodava beforeLoad com o context
  // placeholder do createRouter — "can't access property isAuthenticated, auth is undefined",
  // que derrubava todo autor com sessão em cache.
  it("never invalidates the router while the context is still the createRouter placeholder", async () => {
    seedGate();
    const placeholder = { queryClient, auth: undefined!, loadRuntime: undefined! } as RouterContext;
    router.update({
      history: createMemoryHistory({ initialEntries: ["/app/generate"] }),
      context: placeholder
    });

    const contextsAtInvalidate: Array<RouterContext["auth"] | undefined> = [];
    const invalidate = router.invalidate.bind(router);
    vi.spyOn(router, "invalidate").mockImplementation((opts) => {
      contextsAtInvalidate.push(router.options.context?.auth);
      return invalidate(opts);
    });

    const { rerender } = render(<App />);
    expect(document.body.textContent).toContain("Carregando");

    // Sessão em cache resolve — mas o runtime ainda não chegou.
    auth0State = { ...auth0State, isLoading: false, isAuthenticated: true, user: { name: "Rita Costa" } };
    await act(async () => {
      rerender(<App />);
    });

    expect(contextsAtInvalidate.every((auth) => auth !== undefined)).toBe(true);
    expect(router.options.context.auth).toBeUndefined();
    expect(document.body.textContent).toContain("Carregando");

    // Runtime chega: agora o RouterProvider monta, injeta o context real e a superfície pinta.
    await act(async () => {
      releaseRuntime(makeAppRuntime({ baseUrl: "http://localhost", getToken: () => null }));
      await runtimePromise;
    });

    await waitFor(() => {
      expect(document.querySelector('[data-surface="workspace"]')).not.toBeNull();
    });
    expect(contextsAtInvalidate.every((auth) => auth !== undefined)).toBe(true);
    expect(router.state.location.pathname).toBe("/generate");
  });
});
