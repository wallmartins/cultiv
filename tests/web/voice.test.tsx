/**
 * @vitest-environment jsdom
 */
import { createMemoryHistory, createRootRoute, createRoute, createRouter, Outlet, RouterProvider } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { TRAIT_KEYS, type VoiceProfileScreenView } from "@my-ai-orchestrator/contracts";
import { makeAppRuntime, queryKeys, RuntimeProvider, useShellStore } from "@my-ai-orchestrator/shared";
import { VoiceContainer } from "~/routes/voice.js";
import { router } from "~/router.js";
import {
  consentGranted,
  consentNotGranted,
  emptyExecutionsPage,
  entitlementFixture,
  executionFixture,
  executionsPageWith,
  mockAuth,
  onboardingCompleted,
  voiceProfileFixture
} from "./fixtures.js";

// Extends the shared fixture (read-only) with the reasoning/diagnostics fields a "ready" screen
// needs — fixtures.ts's base voiceProfileFixture deliberately keeps those empty for the app-mode
// governance tests, so a full ready-state render needs its own local fixture.
const readyProfile: VoiceProfileScreenView = {
  ...voiceProfileFixture,
  profile: {
    ...voiceProfileFixture.profile,
    styleMarkers: ["fala de igual pra igual", "autoridade vem da prática", "cético construtivo", "abre com cena concreta"]
  },
  diagnostics: {
    ...voiceProfileFixture.diagnostics,
    bestCoveredContentTypes: [{ contentType: "linkedin-post", coverage: "high", reasonCodes: [] }],
    underrepresentedContentTypes: [{ contentType: "long-form-blog", coverage: "low", reasonCodes: [] }],
    traitConfirmations: { openingMode: { response: "confirmed", recordedAt: "2026-07-02T00:00:00Z" } }
  },
  materialBase: {
    ...voiceProfileFixture.materialBase,
    samples: [
      {
        q: "Ninguém aprende a escrever lendo sobre escrita — aprende revisando o que já escreveu com olhos de leitor.",
        meta: "LinkedIn · 12 mar"
      },
      { q: "A pergunta que fica costuma valer mais que a resposta que eu daria.", meta: "Newsletter · 2 fev" }
    ]
  },
  reasoning: {
    core: {
      narrativeProse: "Você parte quase sempre de uma tensão concreta antes de generalizar.",
      certaintyLevel: "moderate",
      judgmentFrequency: "moderate",
      conclusionPace: "moderate",
      readerRelationship: "peer",
      authoritySource: "practice",
      derivedAntiPatterns: []
    },
    development: {
      developmentProse: "Você abre com uma cena ou um incômodo específico.",
      moveLabels: [],
      transitionTendencies: [],
      epistemicPosture: "exploratory",
      structuralAntiPatterns: []
    }
  }
};

function newQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } });
}

// Standalone router mirroring router.tsx's "/_shell" + "/voice" ids — router.tsx already wires
// VoiceRoute at the real VoiceContainer; this local router just keeps the test independent of the
// shared route tree (same pattern as detail.test.tsx).
function renderVoice(queryClient: QueryClient) {
  const rootRoute = createRootRoute();
  const shellRoute = createRoute({ getParentRoute: () => rootRoute, id: "_shell", component: () => <Outlet /> });
  const voiceRoute = createRoute({ getParentRoute: () => shellRoute, path: "/voice", component: VoiceContainer });
  const calibrateRoute = createRoute({ getParentRoute: () => rootRoute, path: "/calibrate", component: () => null });
  const routeTree = rootRoute.addChildren([calibrateRoute, shellRoute.addChildren([voiceRoute])]);
  const testRouter = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: ["/voice"] }) });
  const runtime = makeAppRuntime({ baseUrl: "http://localhost", getToken: () => null });

  return render(
    <QueryClientProvider client={queryClient}>
      <RuntimeProvider runtime={runtime}>
        <RouterProvider router={testRouter} />
      </RuntimeProvider>
    </QueryClientProvider>
  );
}

// VoiceCompanion isn't in the shell's public barrel (packages/ui/app/shell/index.ts keeps
// subcomponents internal) — mounting it means going through the real WorkspaceShellContainer,
// same as tests/web/shell.test.tsx.
function renderShellAt(initialPath: string) {
  const queryClient = newQueryClient();
  const runtime = makeAppRuntime({ baseUrl: "http://localhost", getToken: () => null });

  router.update({
    history: createMemoryHistory({ initialEntries: [initialPath] }),
    context: { queryClient, auth: mockAuth, runtime }
  });

  return { queryClient, runtime };
}

async function mountShellAt(queryClient: QueryClient, runtime: ReturnType<typeof makeAppRuntime>) {
  await router.load();
  return render(
    <QueryClientProvider client={queryClient}>
      <RuntimeProvider runtime={runtime}>
        <RouterProvider router={router} />
      </RuntimeProvider>
    </QueryClientProvider>
  );
}

describe("voice route (S5)", () => {
  it("renders the loading skeleton before the profile/consent queries settle", async () => {
    // Unseeded queries would otherwise race a real (failing) fetch to localhost — stub it to hang
    // so the pending state is deterministic instead of timing-dependent.
    const originalFetch = globalThis.fetch;
    globalThis.fetch = () => new Promise(() => {});
    try {
      const queryClient = newQueryClient();
      renderVoice(queryClient);
      expect(await screen.findByRole("status", { name: "carregando perfil de voz" })).toBeInTheDocument();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("renders the empty state with a calibrate CTA when there's no profile yet", async () => {
    const queryClient = newQueryClient();
    queryClient.setQueryData(queryKeys.voiceProfile(), { ...readyProfile, profile: { ...readyProfile.profile, version: 0 } });
    queryClient.setQueryData(queryKeys.voiceConsent(), consentNotGranted);

    renderVoice(queryClient);

    expect(await screen.findByText("sua voz aparece aqui depois da calibração")).toBeInTheDocument();
    expect(screen.getByText("calibrar agora →")).toBeInTheDocument();
  });

  it("renders the ready screen with zero enum/traitKey/raw-id leakage into the DOM", async () => {
    const queryClient = newQueryClient();
    queryClient.setQueryData(queryKeys.voiceProfile(), readyProfile);
    queryClient.setQueryData(queryKeys.voiceConsent(), consentGranted);

    const { container } = renderVoice(queryClient);

    expect(await screen.findByText("Voz sólida")).toBeInTheDocument();
    expect(screen.getByText("Você parte quase sempre de uma tensão concreta antes de generalizar.")).toBeInTheDocument();
    expect(screen.getByText("fala de igual pra igual")).toBeInTheDocument();
    expect(screen.getByText("Consentimento de treino concedido")).toBeInTheDocument();

    const text = container.textContent ?? "";
    for (const traitKey of TRAIT_KEYS) expect(text).not.toContain(traitKey);
    expect(text).not.toContain("linkedin-post");
    expect(text).not.toContain("long-form-blog");
    expect(text).not.toContain("confirmed");
  });

  it("renders real calibration sample quotes in material-base instead of count tiles (GAP #13)", async () => {
    const queryClient = newQueryClient();
    queryClient.setQueryData(queryKeys.voiceProfile(), readyProfile);
    queryClient.setQueryData(queryKeys.voiceConsent(), consentGranted);

    const { container } = renderVoice(queryClient);

    expect(await screen.findByText("Voz sólida")).toBeInTheDocument();
    expect(
      screen.getByText(/Ninguém aprende a escrever lendo sobre escrita/)
    ).toBeInTheDocument();
    expect(screen.getByText("LinkedIn · 12 mar")).toBeInTheDocument();
    expect(screen.getByText("Newsletter · 2 fev")).toBeInTheDocument();

    // No internal jargon (raw ids/enums) leaks through the sample metadata either.
    const text = container.textContent ?? "";
    expect(text).not.toContain("linkedin-post");
    expect(text).not.toContain("explicitContentType");
  });

  it("falls back to the count tiles when there are no calibration samples to quote yet", async () => {
    const queryClient = newQueryClient();
    const profileWithoutSamples = {
      ...readyProfile,
      materialBase: {
        ...readyProfile.materialBase,
        totalExamples: 12,
        activeExamples: 10,
        excludedExamples: 2,
        pinnedExamples: 1,
        samples: undefined
      }
    };
    queryClient.setQueryData(queryKeys.voiceProfile(), profileWithoutSamples);
    queryClient.setQueryData(queryKeys.voiceConsent(), consentGranted);

    renderVoice(queryClient);

    expect(await screen.findByText("Voz sólida")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("total")).toBeInTheDocument();
    expect(screen.getByText("ativos")).toBeInTheDocument();
  });

  it("gates Revogar behind a confirm dialog — the dialog copy only appears after the click", async () => {
    const queryClient = newQueryClient();
    queryClient.setQueryData(queryKeys.voiceProfile(), readyProfile);
    queryClient.setQueryData(queryKeys.voiceConsent(), consentGranted);

    renderVoice(queryClient);
    await screen.findByText("Consentimento de treino concedido");

    expect(screen.queryByText("Revogar o consentimento apaga a sua voz")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("Revogar"));
    expect(await screen.findByText("Revogar o consentimento apaga a sua voz")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Manter minha voz"));
    expect(screen.queryByText("Revogar o consentimento apaga a sua voz")).not.toBeInTheDocument();
  });
});

describe("voice route (2d) — recalibrate confirms first when generations are running", () => {
  afterEach(() => {
    useShellStore.setState({ recalOpen: false });
  });

  it("no running jobs — Recalibrar opens the wizard overlay directly, no confirm dialog", async () => {
    const queryClient = newQueryClient();
    queryClient.setQueryData(queryKeys.voiceProfile(), readyProfile);
    queryClient.setQueryData(queryKeys.voiceConsent(), consentGranted);
    queryClient.setQueryData(queryKeys.executionsList({ status: "all", limit: 20 }), emptyExecutionsPage);

    renderVoice(queryClient);
    fireEvent.click(await screen.findByText("Recalibrar →"));

    expect(screen.queryByText(/texto.*sendo escrito/)).not.toBeInTheDocument();
    expect(useShellStore.getState().recalOpen).toBe(true);
  });

  it("running jobs — Recalibrar shows the confirm dialog; proceeding opens the overlay, waiting cancels", async () => {
    const queryClient = newQueryClient();
    queryClient.setQueryData(queryKeys.voiceProfile(), readyProfile);
    queryClient.setQueryData(queryKeys.voiceConsent(), consentGranted);
    queryClient.setQueryData(
      queryKeys.executionsList({ status: "all", limit: 20 }),
      executionsPageWith([executionFixture({ jobId: "r1", status: "running", briefingTopic: "tema em andamento" })])
    );

    renderVoice(queryClient);
    fireEvent.click(await screen.findByText("Recalibrar →"));

    expect(await screen.findByText(/Você tem 1 texto sendo escrito agora\./)).toBeInTheDocument();
    expect(useShellStore.getState().recalOpen).toBe(false);

    fireEvent.click(screen.getByText("Esperar terminarem"));
    expect(screen.queryByText(/sendo escrito agora/)).not.toBeInTheDocument();
    expect(useShellStore.getState().recalOpen).toBe(false);
  });
});

describe("voice companion — one source, two surfaces (S5)", () => {
  afterEach(() => {
    useShellStore.setState({ companionOpen: false });
  });

  it("renders the same prose the route reads, from the same profile object", async () => {
    useShellStore.setState({ companionOpen: true });
    const { queryClient, runtime } = renderShellAt("/app/generate");
    queryClient.setQueryData(queryKeys.onboarding(), onboardingCompleted);
    queryClient.setQueryData(queryKeys.voiceConsent(), consentGranted);
    queryClient.setQueryData(queryKeys.voiceProfile(), readyProfile);
    queryClient.setQueryData(queryKeys.executionsList({ q: undefined, status: "all", period: "all" }), emptyExecutionsPage);
    queryClient.setQueryData(queryKeys.entitlement(), entitlementFixture);

    await mountShellAt(queryClient, runtime);

    expect(screen.getByText("Voz sólida")).toBeInTheDocument();
    expect(screen.getByText("Você parte quase sempre de uma tensão concreta antes de generalizar.")).toBeInTheDocument();
    // Companion slices to 3 chips — the 4th from the fixture stays route-only.
    expect(screen.getByText("fala de igual pra igual")).toBeInTheDocument();
    expect(screen.queryByText("abre com cena concreta")).not.toBeInTheDocument();
  });

  it("falls back to the shared empty state when there's no profile", async () => {
    useShellStore.setState({ companionOpen: true });
    const { queryClient, runtime } = renderShellAt("/app/generate");
    queryClient.setQueryData(queryKeys.onboarding(), onboardingCompleted);
    queryClient.setQueryData(queryKeys.voiceConsent(), consentNotGranted);
    queryClient.setQueryData(
      queryKeys.voiceProfile(),
      { ...readyProfile, profile: { ...readyProfile.profile, version: 0 } }
    );
    queryClient.setQueryData(queryKeys.executionsList({ q: undefined, status: "all", period: "all" }), emptyExecutionsPage);
    queryClient.setQueryData(queryKeys.entitlement(), entitlementFixture);

    await mountShellAt(queryClient, runtime);

    expect(screen.getByText("sua voz aparece aqui depois da calibração")).toBeInTheDocument();
  });
});
