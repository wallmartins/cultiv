/**
 * @vitest-environment jsdom
 */
import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { waitFor } from "@testing-library/react";
import { renderAndSettle } from "./render-with-router.js";
import React from "react";
import { describe, expect, it } from "vitest";
import { makeAppRuntime, queryKeys, RuntimeProvider } from "@my-ai-orchestrator/shared";
import { captureReturnTo, router, type AppAuth } from "~/router.js";
import {
  consentGranted,
  emptyExecutionsPage,
  entitlementFixture,
  mockAuth,
  noVoiceProfileFixture,
  onboardingCompleted,
  voiceProfileFixture
} from "./fixtures.js";

function seedGate(queryClient: QueryClient, onboardingDone: boolean) {
  queryClient.setQueryData(queryKeys.onboarding(), { completed: onboardingDone });
  queryClient.setQueryData(queryKeys.voiceConsent(), consentGranted);
  queryClient.setQueryData(queryKeys.voiceProfile(), voiceProfileFixture);
  queryClient.setQueryData(queryKeys.executionsList({ q: undefined, status: "all", period: "all" }), emptyExecutionsPage);
  queryClient.setQueryData(queryKeys.entitlement(), entitlementFixture);
}

function mountAt(initialPath: string, onboardingDone: boolean) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } });
  seedGate(queryClient, onboardingDone);
  const runtime = makeAppRuntime({ baseUrl: "http://localhost", getToken: () => null });

  router.update({
    history: createMemoryHistory({ initialEntries: [initialPath] }),
    context: { queryClient, auth: mockAuth, loadRuntime: async () => runtime }
  });

  return { queryClient, runtime };
}

describe("app router bootstrap", () => {
  it("resolves the shell gate offline (seeded cache) and renders without crashing", async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } });
    queryClient.setQueryData(queryKeys.onboarding(), onboardingCompleted);
    queryClient.setQueryData(queryKeys.voiceConsent(), consentGranted);
    queryClient.setQueryData(queryKeys.voiceProfile(), voiceProfileFixture);
    // The shell container itself reads these once mounted (rail history + credits pill).
    queryClient.setQueryData(queryKeys.executionsList({ q: undefined, status: "all", period: "all" }), emptyExecutionsPage);
    queryClient.setQueryData(queryKeys.entitlement(), entitlementFixture);

    // Never invoked for the gate (seeded cache above is fresh) — still required by RuntimeProvider,
    // whose context the shell container's hooks (useRun) read from on every render.
    const runtime = makeAppRuntime({ baseUrl: "http://localhost", getToken: () => null });

    router.update({
      history: createMemoryHistory({ initialEntries: ["/app/generate"] }),
      context: { queryClient, auth: mockAuth, loadRuntime: async () => runtime }
    });
    await router.load();

    const { container } = await renderAndSettle(
      <QueryClientProvider client={queryClient}>
        <RuntimeProvider runtime={runtime}>
          <RouterProvider router={router} />
        </RuntimeProvider>
      </QueryClientProvider>
    );

    // A redirect to /calibrate would mean deriveAppMode didn't resolve to "normal".
    // (location.pathname is basepath-relative — the router strips the configured "/app".)
    expect(router.state.location.pathname).toBe("/generate");
    expect(container.querySelector('[data-surface="workspace"]')).not.toBeNull();
  });
});

// Entrada vinda da landing: os CTAs apontam direto pra /app/calibrate e /app/plans, e o Auth0
// entra pelos beforeLoad. Estes três casos são o caminho inteiro.
describe("landing entry flow", () => {
  it("restores the original destination (pathname + search) after the Auth0 callback", async () => {
    const { queryClient, runtime } = mountAt("/app/callback", true);
    // O que o beforeLoad grava em appState.returnTo: location.href, já sem o basepath.
    captureReturnTo("/plans?plan=criador&period=annual");
    await router.load();

    await renderAndSettle(
      <QueryClientProvider client={queryClient}>
        <RuntimeProvider runtime={runtime}>
          <RouterProvider router={router} />
        </RuntimeProvider>
      </QueryClientProvider>
    );

    await waitFor(() => expect(router.state.location.pathname).toBe("/plans"));
    expect(router.state.location.search).toEqual({ plan: "criador", period: "annual" });
  });

  it("falls back to /generate when there is no captured destination", async () => {
    const { queryClient, runtime } = mountAt("/app/callback", true);
    captureReturnTo(undefined);
    await router.load();

    await renderAndSettle(
      <QueryClientProvider client={queryClient}>
        <RuntimeProvider runtime={runtime}>
          <RouterProvider router={router} />
        </RuntimeProvider>
      </QueryClientProvider>
    );

    await waitFor(() => expect(router.state.location.pathname).toBe("/generate"));
  });

  // O que torna seguro adiar o runtime (runtime-loader.ts): visitante sem sessão é redirecionado
  // pro Auth0 sem nunca tocar em Effect/client-sdk. Se alguém acoplar o runtime a esse caminho,
  // o carregamento inicial volta a pagar ~59 kB gzip — e este teste quebra antes disso.
  it.each(["/app/calibrate", "/app/plans"])(
    "redirects %s to Auth0 without ever loading the runtime",
    async (path) => {
      const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } });
      let logins = 0;
      const anonymous: AppAuth = {
        ...mockAuth,
        isAuthenticated: false,
        loginWithRedirect: async () => {
          logins += 1;
        }
      };

      router.update({
        history: createMemoryHistory({ initialEntries: [path] }),
        context: {
          queryClient,
          auth: anonymous,
          loadRuntime: () => {
            throw new Error("runtime carregado antes do login");
          }
        }
      });
      await router.load();

      expect(logins).toBeGreaterThan(0);
    }
  );

  it("lets an uncalibrated author reach /plans, but still gates every other route", async () => {
    const { queryClient, runtime } = mountAt("/app/plans", false);
    await router.load();
    expect(router.state.location.pathname).toBe("/plans");

    // O container lê appMode do contexto do shell — num modo que antes nunca chegava aqui.
    const { container } = await renderAndSettle(
      <QueryClientProvider client={queryClient}>
        <RuntimeProvider runtime={runtime}>
          <RouterProvider router={router} />
        </RuntimeProvider>
      </QueryClientProvider>
    );
    expect(container.querySelector('[data-surface="workspace"]')).not.toBeNull();

    mountAt("/app/generate", false);
    await router.load();
    expect(router.state.location.pathname).toBe("/calibrate");
  });
});

// Recalibrar é só pelo botão de /voice (overlay leve). A URL /calibrate não pode reabrir o wizard
// cheio pra quem já tem voz — além de confundir, isso queima uma das tentativas do plano.
describe("gate de /calibrate", () => {
  it("desvia pra /voice quem já tem voz calibrada", async () => {
    mountAt("/app/calibrate", true);
    await router.load();

    expect(router.state.location.pathname).toBe("/voice");
  });

  it("deixa calibrar quem concluiu o onboarding mas ainda não tem voz", async () => {
    const { queryClient } = mountAt("/app/calibrate", true);
    queryClient.setQueryData(queryKeys.voiceProfile(), noVoiceProfileFixture);
    await router.load();

    expect(router.state.location.pathname).toBe("/calibrate");
  });

  // O gate do shell manda pra /calibrate enquanto appMode === "calibrate". Se o gate de /calibrate
  // desviasse por perfil existente sem olhar o appMode, os dois se redirecionariam pra sempre —
  // foi exatamente o que travou esta suíte durante a implementação.
  it("não faz ping-pong com o gate do shell quando o onboarding ainda está aberto", async () => {
    mountAt("/app/calibrate", false);
    await router.load();

    expect(router.state.location.pathname).toBe("/calibrate");
  });

  it("manda pro /generate quem volta do login com returnTo de /calibrate (CTA da landing)", async () => {
    const { queryClient, runtime } = mountAt("/app/callback", true);
    captureReturnTo("/calibrate");
    await router.load();

    await renderAndSettle(
      <QueryClientProvider client={queryClient}>
        <RuntimeProvider runtime={runtime}>
          <RouterProvider router={router} />
        </RuntimeProvider>
      </QueryClientProvider>
    );

    await waitFor(() => expect(router.state.location.pathname).toBe("/generate"));
  });
});
