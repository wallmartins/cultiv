/**
 * @vitest-environment jsdom
 */
import { createMemoryHistory, createRootRouteWithContext, createRoute, createRouter, Outlet, RouterProvider } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { VoiceCalibrationSessionView } from "@my-ai-orchestrator/contracts";
import { makeAppRuntime, queryKeys, RuntimeProvider, useShellStore, useUiLanguage } from "@my-ai-orchestrator/shared";
import { CalibrationWizard, type Step1ContextProps, type WizardStepContent } from "@my-ai-orchestrator/ui/app/onboarding";
import { LockedCenter, LockedCompanionEmpty } from "@my-ai-orchestrator/ui/app/locked";
import { DEFAULT_LOCALE, messagesFor } from "@my-ai-orchestrator/ui/app/i18n";
import { CalibrateContainer } from "~/routes/calibrate.js";
import {
  buildProgress,
  clearStoredSessionId,
  describeCalibrationError,
  formatCalibrationTrialLine,
  readPostResetContext,
  clearPostResetContext,
  storeSessionId,
  weakestWritingStep,
  wordTargetsFor
} from "~/routes/calibrate-view.js";
import { WizardOverlay } from "~/routes/-wizard-overlay.js";
import type { AppAuth } from "~/router.js";
import { entitlementFixture, mockAuth, noVoiceProfileFixture, voiceProfileFixture } from "./fixtures.js";
import { renderWithRouter } from "./render-with-router.js";

// jsdom's localStorage is undefined in this suite's Node/vitest combo (confirmed empirically —
// same "best-effort" constraint calibrate-view.ts's own comments already document for session
// resume) — readPostResetContext/clearPostResetContext are mocked so CalibrateContainer's wiring
// is testable without depending on real persistence. importOriginal keeps every other export
// (buildProgress, wordTargetsFor, …) real.
vi.mock("~/routes/calibrate-view.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("~/routes/calibrate-view.js")>();
  return {
    ...actual,
    readPostResetContext: vi.fn(actual.readPostResetContext),
    clearPostResetContext: vi.fn(actual.clearPostResetContext)
  };
});

function sessionAt(currentStepId: string, overrides: Partial<VoiceCalibrationSessionView> = {}): VoiceCalibrationSessionView {
  return {
    sessionId: "voice-calibration:test-1",
    userId: "test-user",
    status: "in_progress",
    context: { subject: "produto", vantagePoint: "fundador técnico", audiences: ["fundadores"] },
    currentStepId,
    steps: [
      { stepId: "context_setup", prompt: "" },
      { stepId: "micro_opinion", theme: "trabalho remoto", prompt: "Qual é a sua opinião sobre trabalho remoto?", text: "opinião curta", wordCount: 60, submittedAt: "2026-07-17T00:00:00Z" },
      { stepId: "reasoning_reflection", prompt: "Conte sobre algo que você aprendeu.", text: "texto médio", wordCount: 150, submittedAt: "2026-07-17T00:00:00Z" },
      { stepId: "argument_development", prompt: "Defenda uma posição.", text: "texto longo", wordCount: 250, submittedAt: "2026-07-17T00:00:00Z" },
      { stepId: "format_adaptation", prompt: "Explique algo bem.", text: "texto final", wordCount: 20, submittedAt: "2026-07-17T00:00:00Z" },
      { stepId: "review_confirm", prompt: "" }
    ],
    completedStepCount: 4,
    createdAt: "2026-07-17T00:00:00Z",
    updatedAt: "2026-07-17T00:00:00Z",
    ...overrides
  };
}

type MockHandler = (call: { readonly body: unknown }) => { readonly status?: number; readonly body: unknown };

function installFetchMock(handlers: readonly { readonly method: string; readonly test: RegExp; readonly handle: MockHandler }[]) {
  const original = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(typeof input === "string" ? input : input.toString());
    const method = (init?.method ?? "GET").toUpperCase();
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    const match = handlers.find((candidate) => candidate.method === method && candidate.test.test(url.pathname));
    if (!match) throw new Error(`unhandled fetch ${method} ${url.pathname}`);
    const result = match.handle({ body });
    return new Response(JSON.stringify(result.body), { status: result.status ?? 200, headers: { "content-type": "application/json" } });
  }) as typeof fetch;
  return () => {
    globalThis.fetch = original;
  };
}

function newQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } });
}

describe("calibrate-view (pure)", () => {
  const t = messagesFor(DEFAULT_LOCALE);

  it("buildProgress marks steps before currentStepId done, the displayed one active, the rest upcoming", () => {
    const progress = buildProgress(t, sessionAt("review_confirm"), "format_adaptation");
    expect(progress.map((step) => step.status)).toEqual(["done", "done", "done", "done", "active", "upcoming"]);
  });

  it("wordTargetsFor returns the Ficha-5 fallback range for known writing steps, a wide-open range otherwise", () => {
    expect(wordTargetsFor("micro_opinion")).toEqual({ min: 60, target: 60, max: 100 });
    expect(wordTargetsFor("argument_development")).toEqual({ min: 250, target: 250, max: 400 });
    expect(wordTargetsFor("context_setup").max).toBeGreaterThan(1000);
  });

  it("weakestWritingStep points at the writing step with the fewest words", () => {
    const weakest = weakestWritingStep(t, sessionAt("review_confirm"));
    expect(weakest).toEqual({ stepId: "format_adaptation", label: "Versatilidade" });
  });

  it("formatCalibrationTrialLine is only informative while trialing, degrades without trialEndsAt", () => {
    const now = new Date("2026-07-17T00:00:00Z");
    expect(formatCalibrationTrialLine(t, { ...entitlementFixture, status: "active" }, now)).toBeUndefined();
    expect(
      formatCalibrationTrialLine(t, { ...entitlementFixture, status: "trialing", trialEndsAt: "2026-07-20T00:00:00Z" }, now)
    ).toBe("seu teste · ~6 textos · 3 dias restantes");
  });

  it("describeCalibrationError maps known error classes to localized copy and never leaks the raw technical message (C-8)", () => {
    // The raw backend message never reaches the user (it goes to the console) — an unmapped error
    // shows the generic fallback, not "quota excedida"/"network down".
    expect(describeCalibrationError(t, { responseMessage: "quota excedida" })).toBe(t.onboarding.errorFallback);
    expect(describeCalibrationError(t, { message: "network down" })).toBe(t.onboarding.errorFallback);
    expect(describeCalibrationError(t, {})).toBe(t.onboarding.errorFallback);

    // Known classes map to localized copy; responseMessage takes precedence over message when matching.
    expect(describeCalibrationError(t, { message: "Text must contain at least 60 words" })).toBe(t.onboarding.errors.tooShort(60));
    expect(describeCalibrationError(t, { responseMessage: "Text must contain at least 80 words", message: "ignored" })).toBe(
      t.onboarding.errors.tooShort(80)
    );
    expect(describeCalibrationError(t, { message: "boom", code: "service_unavailable" })).toBe(t.onboarding.errors.derivationFailed);
    expect(describeCalibrationError(t, { message: "boom", status: 500 })).toBe(t.onboarding.errors.derivationFailed);
  });
});

describe("CalibrationWizard (presentational)", () => {
  function step1Content(overrides: Partial<Step1ContextProps> = {}): WizardStepContent {
    return {
      kind: "context",
      props: {
        subject: "",
        onSubjectChange: () => {},
        vantagePoint: "",
        onVantagePointChange: () => {},
        audiences: [],
        audienceDraft: "",
        onAudienceDraftChange: () => {},
        onAudienceAdd: () => {},
        onAudienceRemove: () => {},
        onContinue: () => {},
        ...overrides
      }
    };
  }

  it("Step1Context — Continuar disabled while subject/vantagePoint/audiences are empty", async () => {
    await renderWithRouter(<CalibrationWizard variant="full" progress={[]} content={step1Content()} />);
    expect(screen.getByText("Continuar").closest("button")).toBeDisabled();
  });

  it("Step1Context — Continuar enables once subject, vantagePoint and at least one audience are filled", async () => {
    await renderWithRouter(
      <CalibrationWizard
        variant="full"
        progress={[]}
        content={step1Content({ subject: "produto", vantagePoint: "fundador técnico", audiences: ["fundadores"] })}
      />
    );
    expect(screen.getByText("Continuar").closest("button")).not.toBeDisabled();
  });

  function writingContent(value: string): WizardStepContent {
    return {
      kind: "writing",
      props: { eyebrow: "amostra 1 de 4", prompt: "Qual é a sua opinião?", value, onChange: () => {}, minWords: 3, targetWords: 4, maxWords: 6, onContinue: () => {}, onBack: () => {} }
    };
  }

  it("WritingStep — empty text blocks Continuar and shows a zero counter", async () => {
    await renderWithRouter(<CalibrationWizard variant="full" progress={[]} content={writingContent("")} />);
    expect(screen.getByText("Continuar").closest("button")).toBeDisabled();
    expect(screen.getByText(/0 \/ 3–6 palavras/)).toBeInTheDocument();
  });

  it("WritingStep — below-minimum text is dim but still lets Continuar through", async () => {
    await renderWithRouter(<CalibrationWizard variant="full" progress={[]} content={writingContent("uma duas")} />);
    expect(screen.getByText("Continuar").closest("button")).not.toBeDisabled();
    expect(document.querySelector(".wizard-word-counter.is-below")).toBeInTheDocument();
  });

  it("WritingStep — in-range text gets the accent counter state", async () => {
    await renderWithRouter(<CalibrationWizard variant="full" progress={[]} content={writingContent("uma duas tres quatro")} />);
    expect(document.querySelector(".wizard-word-counter.is-in-range")).toBeInTheDocument();
  });

  it("WritingStep — over-maximum text never blocks Continuar", async () => {
    await renderWithRouter(<CalibrationWizard variant="full" progress={[]} content={writingContent("uma duas tres quatro cinco seis sete")} />);
    expect(document.querySelector(".wizard-word-counter.is-over")).toBeInTheDocument();
    expect(screen.getByText("Continuar").closest("button")).not.toBeDisabled();
  });

  // Consent moved to step 1 (before the first sample) — the gate now lives on Step1Context, and
  // the review step only builds the voice.
  it("Step1Context — with consent required, Continuar stays disabled until consent is granted", async () => {
    const onToggle = vi.fn();
    const filled = { subject: "produto", vantagePoint: "fundador técnico", audiences: ["fundadores"] };
    const { unmount } = await renderWithRouter(
      <CalibrationWizard variant="full" progress={[]} content={step1Content({ ...filled, consent: { granted: false, onToggle } })} />
    );
    expect(screen.getByText("Continuar").closest("button")).toBeDisabled();
    fireEvent.click(screen.getByText("autorizo o uso das minhas amostras"));
    expect(onToggle).toHaveBeenCalledWith(true);
    unmount();

    await renderWithRouter(
      <CalibrationWizard variant="full" progress={[]} content={step1Content({ ...filled, consent: { granted: true, onToggle } })} />
    );
    expect(screen.getByText("Continuar").closest("button")).not.toBeDisabled();
  });

  it("ReviewStep — confirm state runs onCreateVoice on click; pending disables the button", async () => {
    const onCreateVoice = vi.fn();
    const { unmount } = await renderWithRouter(
      <CalibrationWizard variant="full" progress={[]} content={{ kind: "review", props: { state: { kind: "confirm", confirm: { onCreateVoice } } } }} />
    );
    const createButton = screen.getByText("Criar minha voz").closest("button")!;
    expect(createButton).not.toBeDisabled();
    fireEvent.click(createButton);
    expect(onCreateVoice).toHaveBeenCalledTimes(1);
    unmount();

    await renderWithRouter(
      <CalibrationWizard
        variant="full"
        progress={[]}
        content={{ kind: "review", props: { state: { kind: "confirm", confirm: { onCreateVoice: () => {}, pending: true } } } }}
      />
    );
    expect(screen.getByText("Criar minha voz").closest("button")).toBeDisabled();
  });

  it("ReviewStep — building state shows the collapse-in-place spinner copy", async () => {
    await renderWithRouter(
      <CalibrationWizard variant="full" progress={[]} content={{ kind: "review", props: { state: { kind: "building" } } }} />
    );
    expect(screen.getByText("construindo sua voz…")).toBeInTheDocument();
  });

  it("ResultStep — low-confidence success points at the weak sample instead of just the ring", async () => {
    const onViewSample = vi.fn();
    await renderWithRouter(
      <CalibrationWizard
        variant="full"
        progress={[]}
        content={{
          kind: "result",
          props: {
            state: {
              kind: "success",
              preview: { ringValue: 0.35, ringCaption: "Baixa", headline: "Voz emergente", proseCore: "", descriptorChips: [] },
              lowConfidence: { weakStepLabel: "Versatilidade", onViewSample },
              onContinue: () => {}
            }
          }
        }}
      />
    );
    expect(screen.getByText(/Versatilidade/)).toBeInTheDocument();
    fireEvent.click(screen.getByText("Ver esta amostra"));
    expect(onViewSample).toHaveBeenCalledTimes(1);
  });

  it("ResultStep — error state renders Refazer and calls onRetry", async () => {
    const onRetry = vi.fn();
    await renderWithRouter(
      <CalibrationWizard variant="full" progress={[]} content={{ kind: "result", props: { state: { kind: "error", message: "falha na rede", onRetry } } }} />
    );
    expect(screen.getByText("falha na rede")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Refazer"));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("WelcomeBridge — both actions continue to the workspace", async () => {
    const onContinue = vi.fn();
    await renderWithRouter(
      <CalibrationWizard variant="full" progress={[]} content={{ kind: "bridge", props: { onContinue, onSkipTour: onContinue } }} />
    );
    expect(screen.getByText("sua voz está pronta")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Pular tour"));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it("variant='light' renders the overlay chrome with a × close; variant='full' does not", async () => {
    const content: WizardStepContent = { kind: "bridge", props: { onContinue: () => {}, onSkipTour: () => {} } };
    const onClose = vi.fn();

    const { unmount } = await renderWithRouter(<CalibrationWizard variant="light" progress={[]} content={content} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText("fechar"));
    expect(onClose).toHaveBeenCalledTimes(1);
    unmount();

    await renderWithRouter(<CalibrationWizard variant="full" progress={[]} content={content} />);
    expect(screen.queryByLabelText("fechar")).not.toBeInTheDocument();
  });
});

describe("locked workspace (presentational)", () => {
  it("LockedCenter renders the fake demo + persistent CTA wired to onCalibrate", async () => {
    const onCalibrate = vi.fn();
    await renderWithRouter(<LockedCenter onCalibrate={onCalibrate} />);
    expect(screen.getByText("exemplo")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Calibrar minha voz →"));
    expect(onCalibrate).toHaveBeenCalledTimes(1);
  });

  it("LockedCompanionEmpty matches the shell's existing empty-companion copy", async () => {
    await renderWithRouter(<LockedCompanionEmpty onCalibrate={() => {}} />);
    expect(screen.getByText("sua voz aparece aqui depois da calibração")).toBeInTheDocument();
  });
});

// Standalone router mirroring generate.test.tsx/voice.test.tsx's convention — router.tsx's real
// /calibrate + /generate routes are R4's, untouched here.
function renderCalibrate(queryClient: QueryClient, auth: AppAuth = mockAuth) {
  const rootRoute = createRootRouteWithContext<{ auth: AppAuth }>()();
  const calibrateRoute = createRoute({ getParentRoute: () => rootRoute, path: "/calibrate", component: CalibrateContainer });
  const generateRoute = createRoute({ getParentRoute: () => rootRoute, path: "/generate", component: () => <div>tela de geração</div> });
  const routeTree = rootRoute.addChildren([calibrateRoute, generateRoute]);
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ["/calibrate"] }),
    context: { auth }
  });
  // getToken must resolve truthy — the transport requires a token once one is configured
  // (packages/client-sdk/src/transport.ts resolveTokenEffect), unlike the read-only tests
  // elsewhere in this suite that never exercise a real fetch.
  const runtime = makeAppRuntime({ baseUrl: "http://localhost", getToken: () => mockAuth.getAccessTokenSilently() });

  return render(
    <QueryClientProvider client={queryClient}>
      <RuntimeProvider runtime={runtime}>
        <RouterProvider router={router} />
      </RuntimeProvider>
    </QueryClientProvider>
  );
}

describe("CalibrateContainer (S6 — full wizard, container-level)", () => {
  afterEach(() => {
    clearStoredSessionId();
  });

  it("review step — Criar minha voz is live (consent already granted on step 1), building shows the ready voice", async () => {
    storeSessionId("voice-calibration:test-1");
    const queryClient = newQueryClient();
    queryClient.setQueryData(queryKeys.calibrationSession("voice-calibration:test-1"), sessionAt("review_confirm"));
    queryClient.setQueryData(queryKeys.voiceProfile(), noVoiceProfileFixture);
    queryClient.setQueryData(queryKeys.entitlement(), entitlementFixture);

    const restore = installFetchMock([
      // Belt-and-suspenders: readStoredSessionId is best-effort (jsdom's localStorage can be a
      // no-op) — if the container falls back to starting fresh, it still lands on this session.
      { method: "POST", test: /\/me\/voice-calibration\/sessions$/, handle: () => ({ body: sessionAt("review_confirm") }) },
      { method: "POST", test: /\/voice-calibration\/sessions\/[^/]+\/complete$/, handle: () => ({ body: sessionAt("review_confirm", { status: "completed" }) }) },
      { method: "GET", test: /\/me\/voice-profile$/, handle: () => ({ body: voiceProfileFixture }) }
    ]);

    try {
      renderCalibrate(queryClient);

      // Consent is captured on step 1, before the first sample — the review action no longer gates
      // on it, so Criar minha voz is enabled the moment the review step renders.
      const createButton = (await screen.findByText("Criar minha voz")).closest("button")!;
      expect(createButton).not.toBeDisabled();
      fireEvent.click(createButton);

      expect(await screen.findByText("sua voz está pronta")).toBeInTheDocument();
      expect(screen.getByText("Voz sólida")).toBeInTheDocument();
    } finally {
      restore();
    }
  });

  it('"Calibrar depois" completes onboarding and falls through to /generate (locked, not the wizard)', async () => {
    storeSessionId("voice-calibration:test-2");
    const queryClient = newQueryClient();
    queryClient.setQueryData(
      queryKeys.calibrationSession("voice-calibration:test-2"),
      sessionAt("context_setup", { sessionId: "voice-calibration:test-2", context: undefined })
    );
    queryClient.setQueryData(queryKeys.voiceProfile(), noVoiceProfileFixture);
    queryClient.setQueryData(queryKeys.entitlement(), entitlementFixture);

    const restore = installFetchMock([
      // Same belt-and-suspenders fallback as the test above.
      {
        method: "POST",
        test: /\/me\/voice-calibration\/sessions$/,
        handle: () => ({ body: sessionAt("context_setup", { sessionId: "voice-calibration:test-2", context: undefined }) })
      },
      { method: "POST", test: /\/me\/onboarding\/complete$/, handle: () => ({ body: { completed: true, completedAt: "2026-07-17T00:00:00Z" } }) }
    ]);

    try {
      renderCalibrate(queryClient);

      fireEvent.click(await screen.findByText("Calibrar depois →"));

      expect(await screen.findByText("tela de geração")).toBeInTheDocument();
    } finally {
      restore();
    }
  });

  it("1e — a stored post-reset breadcrumb renders PostResetReturn first; onResume prefills audience", async () => {
    vi.mocked(readPostResetContext).mockReturnValue({
      resetDate: "2026-07-10T00:00:00Z",
      topic: "engenharia de software e times",
      audience: "quem te lê no LinkedIn"
    });
    const queryClient = newQueryClient();
    queryClient.setQueryData(queryKeys.voiceProfile(), noVoiceProfileFixture);
    queryClient.setQueryData(queryKeys.entitlement(), entitlementFixture);
    // useCalibrationSession is its own query — the start mutation only hands back a sessionId,
    // same as the "consent gate" test above needs this seeded too.
    queryClient.setQueryData(
      queryKeys.calibrationSession("voice-calibration:test-1"),
      sessionAt("context_setup", { context: undefined })
    );

    const restore = installFetchMock([
      {
        method: "POST",
        test: /\/me\/voice-calibration\/sessions$/,
        handle: () => ({ body: sessionAt("context_setup", { context: undefined }) })
      }
    ]);

    try {
      renderCalibrate(queryClient);

      expect(await screen.findByText("De volta ao começo, Rita.")).toBeInTheDocument();
      expect(screen.getByText("engenharia de software e times")).toBeInTheDocument();

      fireEvent.click(screen.getByText("Recalibrar com esse contexto →"));

      expect(await screen.findByText("vamos te conhecer")).toBeInTheDocument();
      // onResume seeds audiences[] (not the single audience field it used to) — the prior context
      // renders as a removable chip, not a prefilled input value.
      expect(screen.getByText("quem te lê no LinkedIn ×")).toBeInTheDocument();
      expect(clearPostResetContext).toHaveBeenCalledTimes(1);
    } finally {
      restore();
      vi.mocked(readPostResetContext).mockReset();
      vi.mocked(clearPostResetContext).mockReset();
    }
  });

  it("1e — onFresh dismisses the breadcrumb and starts the wizard with empty fields", async () => {
    vi.mocked(readPostResetContext).mockReturnValue({
      resetDate: "2026-07-10T00:00:00Z",
      topic: "tema anterior",
      audience: "quem te lê no LinkedIn"
    });
    const queryClient = newQueryClient();
    queryClient.setQueryData(queryKeys.voiceProfile(), noVoiceProfileFixture);
    queryClient.setQueryData(queryKeys.entitlement(), entitlementFixture);
    // useCalibrationSession is its own query — the start mutation only hands back a sessionId,
    // same as the "consent gate" test above needs this seeded too.
    queryClient.setQueryData(
      queryKeys.calibrationSession("voice-calibration:test-1"),
      sessionAt("context_setup", { context: undefined })
    );

    const restore = installFetchMock([
      {
        method: "POST",
        test: /\/me\/voice-calibration\/sessions$/,
        handle: () => ({ body: sessionAt("context_setup", { context: undefined }) })
      }
    ]);

    try {
      renderCalibrate(queryClient);
      fireEvent.click(await screen.findByText("Começar do zero"));

      expect(await screen.findByText("vamos te conhecer")).toBeInTheDocument();
      expect(screen.getByLabelText("pra quem você escreve?")).toHaveValue("");
      expect(clearPostResetContext).toHaveBeenCalledTimes(1);
    } finally {
      restore();
      vi.mocked(readPostResetContext).mockReset();
      vi.mocked(clearPostResetContext).mockReset();
    }
  });

  // F3 — setContext now derives a seed practice profile server-side (LLM in the loop): slower,
  // and it can fail. These three cover the floor: locale rides the request, a terminal failure
  // blocks step 1→2 with a retry (no continue-anyway), and a transient one recovers invisibly.
  function fillStep1AndContinue() {
    fireEvent.change(screen.getByLabelText("sobre o que você mais escreve?"), { target: { value: "produto" } });
    fireEvent.change(screen.getByLabelText("de onde você fala sobre isso?"), { target: { value: "fundador técnico" } });
    fireEvent.change(screen.getByLabelText("pra quem você escreve?"), { target: { value: "fundadores" } });
    fireEvent.keyDown(screen.getByLabelText("pra quem você escreve?"), { key: "Enter" });
    // Consent is now collected here, before the first sample — Continuar stays disabled until it's checked.
    fireEvent.click(screen.getByText("autorizo o uso das minhas amostras"));
    fireEvent.click(screen.getByText("Continuar").closest("button")!);
  }

  it("setContext — sends the UI locale in the request body (F3-3)", async () => {
    storeSessionId("voice-calibration:test-1");
    useUiLanguage.setState({ language: "pt-BR" });
    const queryClient = newQueryClient();
    queryClient.setQueryData(queryKeys.calibrationSession("voice-calibration:test-1"), sessionAt("context_setup", { context: undefined }));
    queryClient.setQueryData(queryKeys.voiceProfile(), noVoiceProfileFixture);
    queryClient.setQueryData(queryKeys.entitlement(), entitlementFixture);

    let contextBody: unknown;
    const restore = installFetchMock([
      { method: "POST", test: /\/me\/voice-calibration\/sessions$/, handle: () => ({ body: sessionAt("context_setup", { context: undefined }) }) },
      // Continuar grants consent first, then sets context; the grant's onSuccess invalidates the
      // voice-profile/entitlement queries the container already observes, so answer those refetches too.
      { method: "POST", test: /\/me\/voice-training-consent$/, handle: () => ({ body: { granted: true, grantedAt: "2026-07-17T00:00:00Z" } }) },
      { method: "GET", test: /\/me\/voice-profile$/, handle: () => ({ body: noVoiceProfileFixture }) },
      { method: "GET", test: /\/me\/billing\/entitlement$/, handle: () => ({ body: entitlementFixture }) },
      {
        method: "POST",
        test: /\/voice-calibration\/sessions\/[^/]+\/context$/,
        handle: ({ body }) => {
          contextBody = body;
          return { body: sessionAt("micro_opinion") };
        }
      }
    ]);

    try {
      renderCalibrate(queryClient);
      await screen.findByLabelText("sobre o que você mais escreve?");
      fillStep1AndContinue();

      expect(await screen.findByText("Qual é a sua opinião sobre trabalho remoto?")).toBeInTheDocument();
      expect(contextBody).toMatchObject({ subject: "produto", vantagePoint: "fundador técnico", audiences: ["fundadores"], locale: "pt-BR" });
    } finally {
      restore();
      useUiLanguage.setState({ language: "en" });
    }
  });

  it("setContext — a terminal failure blocks the step 1→2 transition and offers retry, with no continue-anyway escape", async () => {
    storeSessionId("voice-calibration:test-1");
    const queryClient = newQueryClient();
    queryClient.setQueryData(queryKeys.calibrationSession("voice-calibration:test-1"), sessionAt("context_setup", { context: undefined }));
    queryClient.setQueryData(queryKeys.voiceProfile(), noVoiceProfileFixture);
    queryClient.setQueryData(queryKeys.entitlement(), entitlementFixture);

    let contextCalls = 0;
    const restore = installFetchMock([
      { method: "POST", test: /\/me\/voice-calibration\/sessions$/, handle: () => ({ body: sessionAt("context_setup", { context: undefined }) }) },
      // Consent is granted before setContext runs — keep it (and its invalidation refetches) green so
      // every failure counted below is exclusively setContext's, not a blocked grant.
      { method: "POST", test: /\/me\/voice-training-consent$/, handle: () => ({ body: { granted: true, grantedAt: "2026-07-17T00:00:00Z" } }) },
      { method: "GET", test: /\/me\/voice-profile$/, handle: () => ({ body: noVoiceProfileFixture }) },
      { method: "GET", test: /\/me\/billing\/entitlement$/, handle: () => ({ body: entitlementFixture }) },
      {
        method: "POST",
        test: /\/voice-calibration\/sessions\/[^/]+\/context$/,
        handle: () => {
          contextCalls += 1;
          // 500, not 503/429/504 — keeps this outside the transport's own retry set, so every
          // count here is exclusively the mutation-level retry under test.
          return { status: 500, body: { code: "internal_error", message: "provider chain exhausted" } };
        }
      }
    ]);

    try {
      renderCalibrate(queryClient);
      await screen.findByLabelText("sobre o que você mais escreve?");
      fillStep1AndContinue();

      expect(await screen.findByText("Refazer", undefined, { timeout: 3000 })).toBeInTheDocument();
      expect(screen.queryByText("vamos te conhecer")).not.toBeInTheDocument();
      expect(screen.queryByText("Qual é a sua opinião sobre trabalho remoto?")).not.toBeInTheDocument();
      expect(screen.queryByText("Continuar assim mesmo")).not.toBeInTheDocument();
      const callsAfterFirstFailure = contextCalls;
      expect(callsAfterFirstFailure).toBeGreaterThan(1); // the 2 invisible retries already ran

      fireEvent.click(screen.getByText("Refazer"));
      expect(await screen.findByText("construindo sua voz…")).toBeInTheDocument();
      expect(await screen.findByText("Refazer", undefined, { timeout: 3000 })).toBeInTheDocument();
      expect(contextCalls).toBeGreaterThan(callsAfterFirstFailure);
    } finally {
      restore();
    }
  });

  it("setContext — a transient failure recovers through the invisible retry, no error UI shown", async () => {
    storeSessionId("voice-calibration:test-1");
    const queryClient = newQueryClient();
    queryClient.setQueryData(queryKeys.calibrationSession("voice-calibration:test-1"), sessionAt("context_setup", { context: undefined }));
    queryClient.setQueryData(queryKeys.voiceProfile(), noVoiceProfileFixture);
    queryClient.setQueryData(queryKeys.entitlement(), entitlementFixture);

    let attempts = 0;
    const restore = installFetchMock([
      { method: "POST", test: /\/me\/voice-calibration\/sessions$/, handle: () => ({ body: sessionAt("context_setup", { context: undefined }) }) },
      // Consent is granted before setContext; keep the grant and its invalidation refetches green so
      // only setContext's own attempts are counted below.
      { method: "POST", test: /\/me\/voice-training-consent$/, handle: () => ({ body: { granted: true, grantedAt: "2026-07-17T00:00:00Z" } }) },
      { method: "GET", test: /\/me\/voice-profile$/, handle: () => ({ body: noVoiceProfileFixture }) },
      { method: "GET", test: /\/me\/billing\/entitlement$/, handle: () => ({ body: entitlementFixture }) },
      {
        method: "POST",
        test: /\/voice-calibration\/sessions\/[^/]+\/context$/,
        handle: () => {
          attempts += 1;
          if (attempts === 1) return { status: 500, body: { code: "internal_error", message: "temporary" } };
          return { body: sessionAt("micro_opinion") };
        }
      }
    ]);

    try {
      renderCalibrate(queryClient);
      await screen.findByLabelText("sobre o que você mais escreve?");
      fillStep1AndContinue();

      expect(await screen.findByText("Qual é a sua opinião sobre trabalho remoto?", undefined, { timeout: 3000 })).toBeInTheDocument();
      expect(screen.queryByText("Refazer")).not.toBeInTheDocument();
      expect(attempts).toBe(2);
    } finally {
      restore();
    }
  });
});

describe("WizardOverlay (S6 — recalibrate, light chrome)", () => {
  afterEach(() => {
    useShellStore.setState({ recalOpen: false });
  });

  it("recalOpen mounts the overlay, starts a fresh session and reuses the same Step1Context — no bridge, × closes", async () => {
    const queryClient = newQueryClient();
    queryClient.setQueryData(queryKeys.voiceProfile(), voiceProfileFixture);
    queryClient.setQueryData(queryKeys.entitlement(), entitlementFixture);
    queryClient.setQueryData(
      queryKeys.calibrationSession("voice-calibration:overlay-1"),
      sessionAt("context_setup", { sessionId: "voice-calibration:overlay-1", context: undefined })
    );

    const restore = installFetchMock([
      {
        method: "POST",
        test: /\/me\/voice-calibration\/sessions$/,
        handle: () => ({ body: sessionAt("context_setup", { sessionId: "voice-calibration:overlay-1", context: undefined }) })
      }
    ]);

    const runtime = makeAppRuntime({ baseUrl: "http://localhost", getToken: () => mockAuth.getAccessTokenSilently() });

    try {
      render(
        <QueryClientProvider client={queryClient}>
          <RuntimeProvider runtime={runtime}>
            <WizardOverlay />
          </RuntimeProvider>
        </QueryClientProvider>
      );

      expect(document.querySelector(".wizard-overlay-backdrop")).not.toBeInTheDocument();

      useShellStore.setState({ recalOpen: true });

      expect(await screen.findByLabelText("fechar")).toBeInTheDocument();
      expect(screen.getByText("vamos te conhecer")).toBeInTheDocument();
      // Light variant has no "calibrar depois" escape — × is the only exit (breakdown-11 §1.2).
      expect(screen.queryByText("Calibrar depois →")).not.toBeInTheDocument();
    } finally {
      restore();
    }
  });
});
