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
import { formatElapsed, isLongRunning } from "~/routes/detail-view.js";
import { executionFixture } from "./fixtures.js";

// Mirrors router.tsx's shell/detail route ids ("/_shell" + "/g/$executionId") so
// getRouteApi("/_shell/g/$executionId") inside the container resolves at runtime — the real
// route (router.tsx) still points its component at the S1 placeholder until the lead re-wires it.
function renderDetail(executionId: string, queryClient: QueryClient) {
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
        <RouterProvider router={router} />
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
    expect(screen.getByText("parte da tensão concreta")).toBeInTheDocument();
    expect(screen.getByText("Ver perfil de voz completo →")).toBeInTheDocument();

    // Reaction fixture is already "up" — the confirmation note reflects it without a click.
    expect(screen.getByText("Confere").closest("button")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("obrigado — isso afina a sua voz")).toBeInTheDocument();
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
        briefingTopic: "Por que abandonei o roadmap trimestral"
      })
    );

    renderDetail("exec-4", queryClient);

    expect(await screen.findByText(/Por que abandonei o roadmap trimestral · há 3 min/)).toBeInTheDocument();
    expect(screen.getByText("Continuar esperando →")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Continuar esperando →"));
    expect(await screen.findByText("escrevendo com a sua voz…")).toBeInTheDocument();
    expect(screen.queryByText("Continuar esperando →")).not.toBeInTheDocument();
  });
});

describe("detail-view: isLongRunning/formatElapsed (pure)", () => {
  it("isLongRunning flips at the 2 minute mark", () => {
    const now = new Date("2026-07-17T12:05:00Z");
    expect(isLongRunning(new Date("2026-07-17T12:02:50Z").toISOString(), now)).toBe(true);
    expect(isLongRunning(new Date("2026-07-17T12:03:10Z").toISOString(), now)).toBe(false);
  });

  it("formatElapsed reads minutes, then hours, never a fabricated precision", () => {
    const now = new Date("2026-07-17T12:05:00Z");
    expect(formatElapsed(new Date("2026-07-17T12:04:40Z").toISOString(), now)).toBe("agora");
    expect(formatElapsed(new Date("2026-07-17T12:00:00Z").toISOString(), now)).toBe("há 5 min");
    expect(formatElapsed(new Date("2026-07-17T09:00:00Z").toISOString(), now)).toBe("há 3 h");
  });
});
