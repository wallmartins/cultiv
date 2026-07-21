/**
 * @vitest-environment jsdom
 */
import { createMemoryHistory, createRootRoute, createRoute, createRouter, Outlet, RouterProvider } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it } from "vitest";
import type { GenerationPreviewResponse } from "@my-ai-orchestrator/contracts";
import { makeAppRuntime, queryKeys, RuntimeProvider, useWizardSessionStore } from "@my-ai-orchestrator/shared";
import { messagesFor } from "@my-ai-orchestrator/ui/app/i18n";
import { GenerateContainer } from "~/routes/generate.js";
import {
  buildBriefing,
  buildGuidedSteps,
  countRunning,
  fallbackQuestionPlan,
  formatQueueEta,
  isLastTrialGeneration,
  looksLikeMarkdown,
  parsePastedTheme
} from "~/routes/generate-view.js";
import { entitlementFixture, executionFixture, executionsPageWith } from "./fixtures.js";

// Mirrors detail.test.tsx's renderDetail — minimal router (router.tsx's real gate/context is
// S1's, untouched here); the real route still points at the S3 placeholder until re-wired.
function renderGenerate(queryClient: QueryClient) {
  const rootRoute = createRootRoute();
  const shellRoute = createRoute({ getParentRoute: () => rootRoute, id: "_shell", component: () => <Outlet /> });
  const generateRoute = createRoute({ getParentRoute: () => shellRoute, path: "/generate", component: GenerateContainer });
  const routeTree = rootRoute.addChildren([shellRoute.addChildren([generateRoute])]);
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: ["/generate"] }) });
  const runtime = makeAppRuntime({ baseUrl: "http://localhost", getToken: () => null });

  return render(
    <QueryClientProvider client={queryClient}>
      <RuntimeProvider runtime={runtime}>
        <RouterProvider router={router} />
      </RuntimeProvider>
    </QueryClientProvider>
  );
}

function newQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } });
}

// GenerateContainer falls back to pt-BR (DEFAULT_LOCALE) when rendered outside <I18nProvider>
// (see renderGenerate above) — this mirrors that fallback for the pure generate-view.ts helpers
// called directly in these tests.
const t = messagesFor("pt-BR");

const previewFixture: GenerationPreviewResponse = {
  pricingSnapshot: { quoteId: "quote-1", policyVersion: "v1", contentType: "linkedin-post", qualityMode: "balanced", creditPrice: 2 },
  currentBalance: 12,
  projectedBalanceAfterGeneration: 10,
  quotaRemaining: 12,
  quotaLimit: 20,
  quotaCost: 2,
  options: { qualityModes: [] }
};

const SCOPE = { lengthTier: "short" as const };

describe("generate surface (S3)", () => {
  beforeEach(() => {
    useWizardSessionStore.getState().reset();
  });

  it("hero — theme field is the only input, eyebrow/h1 fixed, trial line from real entitlement", async () => {
    const queryClient = newQueryClient();
    queryClient.setQueryData(queryKeys.entitlement(), {
      ...entitlementFixture,
      status: "trialing",
      trialEndsAt: new Date(Date.now() + 4 * 86_400_000).toISOString()
    });

    renderGenerate(queryClient);

    expect(await screen.findByText("escreve como você pensa")).toBeInTheDocument();
    expect(screen.getByText(/Sobre o que você quer/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Cole uma ideia, uma inquietação, um tema…")).toBeInTheDocument();
    expect(screen.getByText(/período de teste/)).toBeInTheDocument();
  });

  it("thread — echoes the theme, asks the first backbone question numbered, shows the cost band", async () => {
    const theme = "aprender mais rápido com IA";
    const steps = buildGuidedSteps(t, fallbackQuestionPlan(t, theme));
    const briefing = buildBriefing(theme, steps, []);

    const queryClient = newQueryClient();
    queryClient.setQueryData(queryKeys.entitlement(), entitlementFixture);
    queryClient.setQueryData(
      queryKeys.preview({ rhetoricalMode: "expound", scope: SCOPE, briefing, includeRecommendation: true }),
      previewFixture
    );

    useWizardSessionStore.setState({
      phase: "thread",
      theme,
      prefill: { rhetoricalMode: "expound", scope: SCOPE },
      questionPlan: fallbackQuestionPlan(t, theme),
      answers: [],
      qIndex: 0
    });

    renderGenerate(queryClient);

    expect(await screen.findByText(theme)).toBeInTheDocument();
    expect(screen.getByText(`Qual é a tese ou hipótese central que você quer defender sobre "${theme}"?`)).toBeInTheDocument();
    expect(screen.getByText("pergunta 1 de 4 · pulável")).toBeInTheDocument();
    expect(await screen.findByText("custo: 2 créditos · saldo depois: 10 · modo: equilibrado")).toBeInTheDocument();
  });

  it("answering a question echoes a user bubble and advances the composer to the next question", async () => {
    const theme = "hábitos de escrita";
    const steps = buildGuidedSteps(t, fallbackQuestionPlan(t, theme));
    const answeredBriefing = buildBriefing(theme, steps, [{ questionId: "thesis", text: "escrever todo dia", skipped: false }]);

    const queryClient = newQueryClient();
    queryClient.setQueryData(queryKeys.entitlement(), entitlementFixture);
    queryClient.setQueryData(
      queryKeys.preview({ rhetoricalMode: "expound", scope: SCOPE, briefing: buildBriefing(theme, steps, []), includeRecommendation: true }),
      previewFixture
    );
    queryClient.setQueryData(
      queryKeys.preview({ rhetoricalMode: "expound", scope: SCOPE, briefing: answeredBriefing, includeRecommendation: true }),
      previewFixture
    );

    useWizardSessionStore.setState({
      phase: "thread",
      theme,
      prefill: { rhetoricalMode: "expound", scope: SCOPE },
      questionPlan: fallbackQuestionPlan(t, theme),
      answers: [],
      qIndex: 0
    });

    renderGenerate(queryClient);

    const textarea = await screen.findByPlaceholderText("Responda com uma ou duas frases…");
    fireEvent.change(textarea, { target: { value: "escrever todo dia" } });
    fireEvent.click(screen.getByText("Responder →"));

    expect(await screen.findByText("escrever todo dia")).toBeInTheDocument();
    expect(screen.getByText("Que experiência concreta sua seria o melhor exemplo aqui?")).toBeInTheDocument();
    expect(screen.getByText("pergunta 2 de 4 · pulável")).toBeInTheDocument();
  });

  it("session done — shows the session-done card once every step is answered/skipped", async () => {
    const theme = "voz autêntica";
    const steps = buildGuidedSteps(t, fallbackQuestionPlan(t, theme));
    const answers = steps
      .filter((step) => step.kind !== "channel")
      .map((step) => ({ questionId: step.id, text: "", skipped: true }));
    const briefing = buildBriefing(theme, steps, answers);

    const queryClient = newQueryClient();
    queryClient.setQueryData(queryKeys.entitlement(), entitlementFixture);
    queryClient.setQueryData(
      queryKeys.preview({ rhetoricalMode: "expound", scope: SCOPE, briefing, includeRecommendation: true }),
      previewFixture
    );

    useWizardSessionStore.setState({
      phase: "thread",
      theme,
      prefill: { rhetoricalMode: "expound", scope: SCOPE },
      questionPlan: fallbackQuestionPlan(t, theme),
      answers,
      qIndex: steps.length // past the channel step too — session done
    });

    renderGenerate(queryClient);

    expect(await screen.findByText("Tudo pronto. É só gerar.")).toBeInTheDocument();
  });

  it("session done — last trial generation with 2+ already running shows the queue gate instead", async () => {
    const theme = "voz autêntica";
    const steps = buildGuidedSteps(t, fallbackQuestionPlan(t, theme));
    const answers = steps
      .filter((step) => step.kind !== "channel")
      .map((step) => ({ questionId: step.id, text: "", skipped: true }));
    const briefing = buildBriefing(theme, steps, answers);

    const queryClient = newQueryClient();
    queryClient.setQueryData(queryKeys.entitlement(), { ...entitlementFixture, status: "trialing", quotaRemaining: 1 });
    queryClient.setQueryData(
      queryKeys.preview({ rhetoricalMode: "expound", scope: SCOPE, briefing, includeRecommendation: true }),
      previewFixture
    );
    queryClient.setQueryData(
      queryKeys.executionsList({ status: "all", limit: 20 }),
      executionsPageWith([
        executionFixture({ jobId: "r1", status: "running" }),
        executionFixture({ jobId: "r2", status: "queued" })
      ])
    );

    useWizardSessionStore.setState({
      phase: "thread",
      theme,
      prefill: { rhetoricalMode: "expound", scope: SCOPE },
      questionPlan: fallbackQuestionPlan(t, theme),
      answers,
      qIndex: steps.length
    });

    renderGenerate(queryClient);

    expect(await screen.findByText("Esta é a sua última geração do teste.")).toBeInTheDocument();
    expect(screen.getByText(/2 gerações rodando agora/)).toBeInTheDocument();
    expect(screen.queryByText("Tudo pronto. É só gerar.")).not.toBeInTheDocument();
  });

  it("hero — pasting markdown detours into the confirm card; confirming submits the cleaned title", async () => {
    const queryClient = newQueryClient();
    queryClient.setQueryData(queryKeys.entitlement(), entitlementFixture);
    const briefing = buildBriefing(
      "Por que abandonei o roadmap trimestral",
      buildGuidedSteps(t, fallbackQuestionPlan(t, "")),
      []
    );
    queryClient.setQueryData(
      queryKeys.preview({ rhetoricalMode: "expound", scope: SCOPE, briefing, includeRecommendation: true }),
      previewFixture
    );

    renderGenerate(queryClient);

    const textarea = await screen.findByPlaceholderText("Cole uma ideia, uma inquietação, um tema…");
    const pasted = "# Por que abandonei o roadmap trimestral\n\n- times pequenos decidem mais rápido\n";
    fireEvent.paste(textarea, { clipboardData: { getData: () => pasted } });

    expect(await screen.findByText("entendi assim — confirma?")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Confirmar e seguir →"));

    expect(await screen.findByText("Por que abandonei o roadmap trimestral")).toBeInTheDocument();
  });

  it("gate.past_due (dunning + zero credits) blocks the whole flow behind the paywall card", async () => {
    const queryClient = newQueryClient();
    queryClient.setQueryData(queryKeys.entitlement(), {
      ...entitlementFixture,
      status: "past_due",
      gate: "past_due",
      availableCredits: 0,
      monthlyCreditsRemaining: 0
    });

    renderGenerate(queryClient);

    expect(await screen.findByText("Seus créditos acabaram — e a renovação não passou.")).toBeInTheDocument();
    expect(screen.queryByText("Sobre o que você quer")).not.toBeInTheDocument();
  });
});

describe("generate-view: trial/queue/paste pure helpers", () => {
  it("isLastTrialGeneration true only while trialing with 1 or 0 generations left in quota", () => {
    expect(isLastTrialGeneration({ ...entitlementFixture, status: "trialing", quotaRemaining: 1 })).toBe(true);
    expect(isLastTrialGeneration({ ...entitlementFixture, status: "trialing", quotaRemaining: 0 })).toBe(true);
    expect(isLastTrialGeneration({ ...entitlementFixture, status: "trialing", quotaRemaining: 2 })).toBe(false);
    expect(isLastTrialGeneration({ ...entitlementFixture, status: "active" })).toBe(false);
  });

  it("countRunning counts only queued|running items", () => {
    const page = executionsPageWith([
      executionFixture({ jobId: "a", status: "running" }),
      executionFixture({ jobId: "b", status: "queued" }),
      executionFixture({ jobId: "c", status: "done" })
    ]);
    expect(countRunning(page)).toBe(2);
    expect(countRunning(undefined)).toBe(0);
  });

  it("formatQueueEta floors at ~1 min, scales with running count", () => {
    expect(formatQueueEta(t, 0)).toBe("~1 min");
    expect(formatQueueEta(t, 2)).toBe("~4 min");
  });

  it("looksLikeMarkdown flags headings/bullets/links/bold, not plain prose", () => {
    expect(looksLikeMarkdown("# um título")).toBe(true);
    expect(looksLikeMarkdown("- um item")).toBe(true);
    expect(looksLikeMarkdown("[link](https://example.com)")).toBe(true);
    expect(looksLikeMarkdown("**forte**")).toBe(true);
    expect(looksLikeMarkdown("um tema qualquer, sem formatação nenhuma")).toBe(false);
  });

  it("parsePastedTheme extracts the heading as title, bullets as angles, and counts links", () => {
    const pasted = [
      "# Por que abandonei o roadmap trimestral",
      "",
      "- times pequenos decidem mais rápido",
      "- métricas de vaidade escondem o que importa",
      "",
      "fonte: https://example.com/post"
    ].join("\n");

    const parsed = parsePastedTheme(t, pasted);
    expect(parsed.title).toBe("Por que abandonei o roadmap trimestral");
    expect(parsed.angles).toEqual(["times pequenos decidem mais rápido", "métricas de vaidade escondem o que importa"]);
    expect(parsed.linkCount).toBe(1);
  });
});
