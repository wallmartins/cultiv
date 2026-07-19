/**
 * @vitest-environment jsdom
 */
import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import { makeAppRuntime, queryKeys, RuntimeProvider } from "@my-ai-orchestrator/shared";
import { router } from "~/router.js";
import {
  consentGranted,
  emptyExecutionsPage,
  entitlementFixture,
  mockAuth,
  onboardingCompleted,
  voiceProfileFixture
} from "./fixtures.js";

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
      context: { queryClient, auth: mockAuth, runtime }
    });
    await router.load();

    const { container } = render(
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
