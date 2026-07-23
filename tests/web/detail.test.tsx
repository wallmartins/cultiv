/**
 * @vitest-environment jsdom
 */
import { createMemoryHistory, createRootRoute, createRoute, createRouter, Outlet, RouterProvider } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import { makeAppRuntime, queryKeys, RuntimeProvider } from "@my-ai-orchestrator/shared";
import type { ExecutionVoiceMetadataView } from "@my-ai-orchestrator/contracts";
import { ExecutionDetailContainer } from "~/routes/g.$id.js";
import { isLongRunning } from "~/routes/detail-view.js";
import { I18nProvider, makeFormatters, type AppLocale } from "@my-ai-orchestrator/ui/app/i18n";
import { executionFixture } from "./fixtures.js";

// Mirrors router.tsx's shell/detail route ids ("/_shell" + "/g/$executionId") so
// getRouteApi("/_shell/g/$executionId") inside the container resolves at runtime — the real
// route (router.tsx) still points its component at the S1 placeholder until the lead re-wires it.
function renderDetail(executionId: string, queryClient: QueryClient, locale: AppLocale = "pt-BR") {
  const rootRoute = createRootRoute();
  const shellRoute = createRoute({ getParentRoute: () => rootRoute, id: "_shell", component: () => <Outlet /> });
  const detailRoute = createRoute({
    getParentRoute: () => shellRoute,
    path: "/g/$executionId",
    component: ExecutionDetailContainer
  });
  const routeTree = rootRoute.addChildren([shellRoute.addChildren([detailRoute])]);
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [`/g/${executionId}`] })
  });
  const runtime = makeAppRuntime({ baseUrl: "http://localhost", getToken: () => null });

  return render(
    <QueryClientProvider client={queryClient}>
      <RuntimeProvider runtime={runtime}>
        <I18nProvider locale={locale}>
          <RouterProvider router={router} />
        </I18nProvider>
      </RuntimeProvider>
    </QueryClientProvider>
  );
}

const voiceFixture: ExecutionVoiceMetadataView = {
  voiceProfileConfidence: "high",
  voiceAdaptationMode: "standard",
  voiceProfileVersionUsed: 3,
  voiceProfileSnapshotId: "snapshot-1",
  usedFallbackVoiceProfile: false,
  appliedSignals: {
    styleMarkers: ["parte da tensão concreta", "admite dúvida"],
    rules: ["frases curtas nas aberturas", "primeira pessoa sem cerimônia"],
    antiPatterns: ["tom de palestra", "fechos motivacionais genéricos"]
  },
  pendingProfileRebuild: { status: "idle", nextActionCodes: [] }
};

function newQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } });
}

describe("execution detail (S4)", () => {
  it("renders the writing center while running — ring % + theme, never the format", async () => {
    const queryClient = newQueryClient();
    queryClient.setQueryData(
      queryKeys.execution("exec-1"),
      executionFixture({
        jobId: "exec-1",
        status: "running",
        progress: { currentStep: "draft", stepIndex: 1, totalSteps: 4, percent: 42 },
        briefingTopic: "A falácia de delegar o pensamento à IA"
      })
    );

    renderDetail("exec-1", queryClient);

    expect(await screen.findByText("escrevendo com a sua voz…")).toBeInTheDocument();
    expect(screen.getByText("42%")).toBeInTheDocument();
    expect(screen.getByText("A falácia de delegar o pensamento à IA")).toBeInTheDocument();
    expect(screen.queryByText("linkedin-post")).not.toBeInTheDocument();
  });

  it("renders the failed state — credits-not-charged + refazer", async () => {
    const queryClient = newQueryClient();
    queryClient.setQueryData(
      queryKeys.execution("exec-2"),
      executionFixture({ jobId: "exec-2", status: "failed", error: { message: "o modelo recusou o pedido", step: "draft" } })
    );

    renderDetail("exec-2", queryClient);

    expect(await screen.findByText("Esta geração falhou")).toBeInTheDocument();
    expect(screen.getByText("o modelo recusou o pedido")).toBeInTheDocument();
    expect(screen.getByText("seus créditos não foram cobrados")).toBeInTheDocument();
    expect(screen.getByText("Refazer geração →")).toBeInTheDocument();
  });

  it("renders the done reader — topic as h1, alignment band closed by default, reaction row", async () => {
    const queryClient = newQueryClient();
    queryClient.setQueryData(
      queryKeys.execution("exec-3"),
      executionFixture({
        jobId: "exec-3",
        status: "done",
        result: { content: "Parágrafo um.\n\nParágrafo dois.", metadata: {} },
        voice: voiceFixture,
        reaction: { value: "up", reactedAt: new Date().toISOString() }
      })
    );

    renderDetail("exec-3", queryClient);

    const heading = await screen.findByRole("heading", { level: 1, name: "A falácia de delegar o pensamento à IA" });
    expect(heading).toBeInTheDocument();
    expect(screen.getByText("Parágrafo um.")).toBeInTheDocument();
    expect(screen.getByText("Parágrafo dois.")).toBeInTheDocument();
    expect(screen.getByText(/voz v3/)).toBeInTheDocument();

    // Band starts closed — its contents aren't in the DOM yet.
    expect(screen.queryByText("Traços aplicados")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Alinhamento de voz"));
    expect(await screen.findByText("Traços aplicados")).toBeInTheDocument();
    expect(screen.getByText("Parte da tensão concreta")).toBeInTheDocument();
    expect(screen.getByText("Ver perfil de voz completo →")).toBeInTheDocument();

    // Reaction fixture is already "up" — the confirmation note reflects it without a click.
    expect(screen.getByText("Confere").closest("button")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("obrigado — isso afina a sua voz")).toBeInTheDocument();
  });

  // The fixture above predates the bug: it fabricated already-humanized pt-BR signals, so nothing
  // caught the backend shipping raw slugs. This one feeds the slugs the resolvers actually emit.
  it("translates the raw voice-signal slugs the backend really emits, leaking none of them", async () => {
    const queryClient = newQueryClient();
    queryClient.setQueryData(
      queryKeys.execution("exec-3b"),
      executionFixture({
        jobId: "exec-3b",
        status: "done",
        result: { content: "Parágrafo um.", metadata: {} },
        voice: {
          ...voiceFixture,
          appliedSignals: {
            styleMarkers: ["first-person", "short-paragraphs"],
            rules: ["prefer_first_person_when_relevant", "preserve_target_language"],
            antiPatterns: ["language drift", "tom de palestra"]
          }
        }
      })
    );

    const { container } = renderDetail("exec-3b", queryClient);

    fireEvent.click(await screen.findByText("Alinhamento de voz"));
    expect(await screen.findByText("Primeira pessoa")).toBeInTheDocument();
    expect(screen.getByText(/Manter o idioma do texto/)).toBeInTheDocument();
    expect(screen.getByText(/Deriva de idioma/)).toBeInTheDocument();
    // Free text authored by the user keeps its own words, capitalized like the rest.
    expect(screen.getByText(/Tom de palestra/)).toBeInTheDocument();

    const text = container.textContent ?? "";
    for (const slug of ["first-person", "short-paragraphs", "prefer_first_person_when_relevant", "preserve_target_language"]) {
      expect(text).not.toContain(slug);
    }
  });

  it("renders the same execution in English when the locale is en", async () => {
    const queryClient = newQueryClient();
    queryClient.setQueryData(
      queryKeys.execution("exec-3c"),
      executionFixture({
        jobId: "exec-3c",
        status: "done",
        result: { content: "Paragraph one.", metadata: {} },
        voice: {
          ...voiceFixture,
          appliedSignals: {
            styleMarkers: ["first-person"],
            rules: ["preserve_target_language"],
            antiPatterns: []
          }
        }
      })
    );

    renderDetail("exec-3c", queryClient, "en");

    // Chrome owned by packages/ui…
    fireEvent.click(await screen.findByText("Voice alignment"));
    expect(await screen.findByText("Applied traits")).toBeInTheDocument();
    expect(screen.getByText("See full voice profile →")).toBeInTheDocument();
    // …and the backend slugs, translated through the same dictionary.
    expect(screen.getByText("First person")).toBeInTheDocument();
    expect(screen.getByText(/Keep the target language/)).toBeInTheDocument();
    expect(screen.queryByText("Alinhamento de voz")).not.toBeInTheDocument();
  });

  it("1b — a still-running execution past 2 min swaps the writing center for LongTimeoutWatch", async () => {
    const queryClient = newQueryClient();
    const createdAt = new Date(Date.now() - 3 * 60_000).toISOString();
    queryClient.setQueryData(
      queryKeys.execution("exec-4"),
      executionFixture({
        jobId: "exec-4",
        status: "running",
        createdAt,
        progress: { currentStep: "draft", stepIndex: 1, totalSteps: 4, percent: 55 },
        briefingTopic: "Por que abandonei o roadmap trimestral",
        reservedCredits: 3
      })
    );

    renderDetail("exec-4", queryClient);

    expect(await screen.findByText(/Por que abandonei o roadmap trimestral · há 3 min/)).toBeInTheDocument();
    expect(screen.getByText("Continuar esperando →")).toBeInTheDocument();
    expect(screen.getByText("Cancelar e estornar 3 créditos")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Continuar esperando →"));
    expect(await screen.findByText("escrevendo com a sua voz…")).toBeInTheDocument();
    expect(screen.queryByText("Continuar esperando →")).not.toBeInTheDocument();
  });
});

describe("detail-view: isLongRunning (pure)", () => {
  it("isLongRunning flips at the 2 minute mark", () => {
    const now = new Date("2026-07-17T12:05:00Z");
    expect(isLongRunning(new Date("2026-07-17T12:02:50Z").toISOString(), now)).toBe(true);
    expect(isLongRunning(new Date("2026-07-17T12:03:10Z").toISOString(), now)).toBe(false);
  });
});

// Replaces the old hand-rolled formatElapsed (and the two other copies of the same logic) —
// now one Intl-backed formatter, so it has to read correctly in BOTH locales.
describe("relative time formatting", () => {
  const now = new Date("2026-07-17T12:05:00Z");
  const at = (iso: string) => new Date(iso).toISOString();

  it("reads minutes, then hours, in pt-BR", () => {
    const format = makeFormatters("pt-BR", "agora");
    expect(format.relativeTime(at("2026-07-17T12:04:40Z"), now)).toBe("agora");
    expect(format.relativeTime(at("2026-07-17T12:00:00Z"), now)).toBe("há 5 min.");
    expect(format.relativeTime(at("2026-07-17T09:00:00Z"), now)).toBe("há 3 h");
    expect(format.relativeTime(at("2026-07-16T12:00:00Z"), now)).toBe("ontem");
  });

  it("reads the same instants in English", () => {
    const format = makeFormatters("en", "now");
    expect(format.relativeTime(at("2026-07-17T12:04:40Z"), now)).toBe("now");
    expect(format.relativeTime(at("2026-07-17T12:00:00Z"), now)).toBe("5 min. ago");
    expect(format.relativeTime(at("2026-07-17T09:00:00Z"), now)).toBe("3 hr. ago");
    expect(format.relativeTime(at("2026-07-16T12:00:00Z"), now)).toBe("yesterday");
  });
});
