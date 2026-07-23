/**
 * @vitest-environment jsdom
 */
import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { renderAndSettle } from "./render-with-router.js";
import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { makeAppRuntime, queryKeys, RuntimeProvider, useShellStore, useToastStore } from "@my-ai-orchestrator/shared";
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

function renderShell(initialPath: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } });
  const runtime = makeAppRuntime({ baseUrl: "http://localhost", getToken: () => null });

  router.update({
    history: createMemoryHistory({ initialEntries: [initialPath] }),
    context: { queryClient, auth: mockAuth, loadRuntime: async () => runtime }
  });

  return { queryClient, runtime };
}

async function mountShell(queryClient: QueryClient, runtime: ReturnType<typeof makeAppRuntime>) {
  await router.load();
  return renderAndSettle(
    <QueryClientProvider client={queryClient}>
      <RuntimeProvider runtime={runtime}>
        <RouterProvider router={router} />
      </RuntimeProvider>
    </QueryClientProvider>
  );
}

describe("workspace shell (S2)", () => {
  // companionOpen defaults to false (packages/shared/src/stores/shell.ts) — the companion cards
  // only exist in the DOM once it's open, same as a real "Sua voz" click would trigger.
  afterEach(() => {
    useShellStore.setState({ companionOpen: false });
  });

  it("renders the normal populated state — history rail + credits pill + voice companion", async () => {
    useShellStore.setState({ companionOpen: true });
    const { queryClient, runtime } = renderShell("/app/generate");
    queryClient.setQueryData(queryKeys.onboarding(), onboardingCompleted);
    queryClient.setQueryData(queryKeys.voiceConsent(), consentGranted);
    queryClient.setQueryData(queryKeys.voiceProfile(), voiceProfileFixture);
    queryClient.setQueryData(
      queryKeys.executionsList({ q: undefined, status: "all", period: "all" }),
      executionsPageWith([executionFixture()])
    );
    queryClient.setQueryData(queryKeys.entitlement(), entitlementFixture);

    await mountShell(queryClient, runtime);

    expect(screen.getByText("A falácia de delegar o pensamento à IA")).toBeInTheDocument();
    expect(screen.getByText("12 créditos · ~6 textos")).toBeInTheDocument();
    expect(screen.getByText("Voz sólida")).toBeInTheDocument();
    expect(screen.getByText("＋ Nova geração").closest("button")).not.toBeDisabled();
  });

  it("renders the never-generated empty rail state", async () => {
    const { queryClient, runtime } = renderShell("/app/generate");
    queryClient.setQueryData(queryKeys.onboarding(), onboardingCompleted);
    queryClient.setQueryData(queryKeys.voiceConsent(), consentGranted);
    queryClient.setQueryData(queryKeys.voiceProfile(), voiceProfileFixture);
    queryClient.setQueryData(queryKeys.executionsList({ q: undefined, status: "all", period: "all" }), emptyExecutionsPage);
    queryClient.setQueryData(queryKeys.entitlement(), entitlementFixture);

    await mountShell(queryClient, runtime);

    expect(screen.getByText(/nenhuma geração ainda/)).toBeInTheDocument();
  });

  it("renders the locked state — rail inert, new-generation disabled, companion empty", async () => {
    useShellStore.setState({ companionOpen: true });
    const { queryClient, runtime } = renderShell("/app/generate");
    queryClient.setQueryData(queryKeys.onboarding(), onboardingCompleted);
    // No consent → deriveAppMode resolves "locked" (packages/shared/src/derive/app-mode.ts).
    queryClient.setQueryData(queryKeys.voiceConsent(), consentNotGranted);
    queryClient.setQueryData(queryKeys.voiceProfile(), voiceProfileFixture);
    queryClient.setQueryData(queryKeys.executionsList({ q: undefined, status: "all", period: "all" }), emptyExecutionsPage);
    queryClient.setQueryData(queryKeys.entitlement(), entitlementFixture);

    await mountShell(queryClient, runtime);

    expect(screen.getByText("＋ Nova geração").closest("button")).toBeDisabled();
    expect(screen.getByText("sua voz aparece aqui depois da calibração")).toBeInTheDocument();
  });
});

describe("ambient toast (S10b — system kit)", () => {
  afterEach(() => {
    useToastStore.setState({ toasts: [] });
  });

  it("renders the most recently pushed toast; clicking it navigates to the execution and clears the toast", async () => {
    const { queryClient, runtime } = renderShell("/app/generate");
    queryClient.setQueryData(queryKeys.onboarding(), onboardingCompleted);
    queryClient.setQueryData(queryKeys.voiceConsent(), consentGranted);
    queryClient.setQueryData(queryKeys.voiceProfile(), voiceProfileFixture);
    queryClient.setQueryData(queryKeys.executionsList({ q: undefined, status: "all", period: "all" }), emptyExecutionsPage);
    queryClient.setQueryData(queryKeys.entitlement(), entitlementFixture);
    queryClient.setQueryData(queryKeys.execution("exec-9"), executionFixture({ jobId: "exec-9", briefingTopic: "tema do toast" }));

    await mountShell(queryClient, runtime);
    useToastStore.getState().push({ id: "exec-9", executionId: "exec-9", kind: "success", topic: "tema do toast" });

    const toast = await screen.findByText('"tema do toast" ficou pronto');
    fireEvent.click(toast);

    expect(await screen.findByRole("heading", { level: 1, name: "tema do toast" })).toBeInTheDocument();
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it("a failed generation renders the error wording, not the success one", async () => {
    const { queryClient, runtime } = renderShell("/app/generate");
    queryClient.setQueryData(queryKeys.onboarding(), onboardingCompleted);
    queryClient.setQueryData(queryKeys.voiceConsent(), consentGranted);
    queryClient.setQueryData(queryKeys.voiceProfile(), voiceProfileFixture);
    queryClient.setQueryData(queryKeys.executionsList({ q: undefined, status: "all", period: "all" }), emptyExecutionsPage);
    queryClient.setQueryData(queryKeys.entitlement(), entitlementFixture);

    await mountShell(queryClient, runtime);
    useToastStore.getState().push({ id: "exec-8", kind: "error", topic: "tema que falhou" });

    expect(await screen.findByText('"tema que falhou" não deu certo')).toBeInTheDocument();
  });

  // Regression: toast ids that are not execution ids (dispatch-error, export-*, calibrate-*) used
  // to be routed to /g/<id> anyway, landing the user on a resource_not_found screen.
  it("a toast without an execution is inert — no navigation, no open affordance", async () => {
    const { queryClient, runtime } = renderShell("/app/generate");
    queryClient.setQueryData(queryKeys.onboarding(), onboardingCompleted);
    queryClient.setQueryData(queryKeys.voiceConsent(), consentGranted);
    queryClient.setQueryData(queryKeys.voiceProfile(), voiceProfileFixture);
    queryClient.setQueryData(queryKeys.executionsList({ q: undefined, status: "all", period: "all" }), emptyExecutionsPage);
    queryClient.setQueryData(queryKeys.entitlement(), entitlementFixture);

    await mountShell(queryClient, runtime);
    useToastStore.getState().push({
      id: "dispatch-error",
      kind: "error",
      topic: "tema do dispatch",
      message: "créditos não cobrados — tente de novo"
    });

    const toast = await screen.findByText(/"tema do dispatch" não deu certo/);
    expect(screen.queryByText("abrir →")).not.toBeInTheDocument();

    fireEvent.click(toast);

    expect(screen.queryByRole("heading", { level: 1, name: "tema do dispatch" })).not.toBeInTheDocument();
  });
});

describe("rail pagination + cross-status empty variant (2f — LongHistoryRail dedup)", () => {
  it('"mostrar mais antigos" bumps the page using the server-echoed limit', async () => {
    const { queryClient, runtime } = renderShell("/app/generate");
    queryClient.setQueryData(queryKeys.onboarding(), onboardingCompleted);
    queryClient.setQueryData(queryKeys.voiceConsent(), consentGranted);
    queryClient.setQueryData(queryKeys.voiceProfile(), voiceProfileFixture);
    queryClient.setQueryData(queryKeys.entitlement(), entitlementFixture);
    queryClient.setQueryData(queryKeys.executionsList({ q: undefined, status: "all", period: "all" }), {
      items: [executionFixture({ jobId: "e1", briefingTopic: "tema recente" })],
      total: 3,
      limit: 20,
      offset: 0
    });
    queryClient.setQueryData(queryKeys.executionsList({ q: undefined, status: "all", period: "all", limit: 40 }), {
      items: [
        executionFixture({ jobId: "e1", briefingTopic: "tema recente" }),
        executionFixture({ jobId: "e2", briefingTopic: "tema antigo um" }),
        executionFixture({ jobId: "e3", briefingTopic: "tema antigo dois" })
      ],
      total: 3,
      limit: 40,
      offset: 0
    });

    await mountShell(queryClient, runtime);

    fireEvent.click(await screen.findByText("mostrar mais antigos · 2"));

    expect(await screen.findByText("tema antigo um")).toBeInTheDocument();
    expect(screen.queryByText(/mostrar mais antigos/)).not.toBeInTheDocument();
  });

  it("an empty rail under a status filter offers a cross-status count instead of a dead end", async () => {
    const { queryClient, runtime } = renderShell("/app/generate");
    queryClient.setQueryData(queryKeys.onboarding(), onboardingCompleted);
    queryClient.setQueryData(queryKeys.voiceConsent(), consentGranted);
    queryClient.setQueryData(queryKeys.voiceProfile(), voiceProfileFixture);
    queryClient.setQueryData(queryKeys.entitlement(), entitlementFixture);
    queryClient.setQueryData(queryKeys.executionsList({ q: undefined, status: "all", period: "all" }), executionsPageWith([executionFixture()]));
    queryClient.setQueryData(queryKeys.executionsList({ q: undefined, status: "failed", period: "all" }), emptyExecutionsPage);

    await mountShell(queryClient, runtime);

    fireEvent.click(await screen.findByText("FALHAS"));

    expect(await screen.findByText(/1 resultado em outros status/)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Limpar filtro e mostrar/));
    expect(screen.queryByText(/resultado em outros status/)).not.toBeInTheDocument();
  });
});
