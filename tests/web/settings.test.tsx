/**
 * @vitest-environment jsdom
 */
import { createMemoryHistory, createRootRouteWithContext, createRoute, createRouter, Outlet, RouterProvider } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import type { VoiceTrainingConsentStatusView } from "@my-ai-orchestrator/contracts";
import { makeAppRuntime, queryKeys, RuntimeProvider } from "@my-ai-orchestrator/shared";
import { DEFAULT_LOCALE, makeFormatters, messagesFor } from "@my-ai-orchestrator/ui/app/i18n";
import { DeleteDialog, ResetDialog, SettingsScreen, type SettingsScreenProps } from "@my-ai-orchestrator/ui/app/settings";
import type { AppAuth } from "~/router.js";
import { SettingsContainer } from "~/routes/settings.js";
import { storePostResetContext } from "~/routes/calibrate-view.js";
import { audienceFromChannel, consentMirrorSinceLabel, initialsFrom } from "~/routes/settings-view.js";
import { entitlementFixture, executionFixture, executionsPageWith, mockAuth } from "./fixtures.js";

// Components render outside I18nProvider in this file (falls back to pt-BR, per CONVENTIONS.md);
// pure view functions take the dictionary as a parameter, so tests construct the same pt-BR
// instance to keep both sides consistent.
const t = messagesFor(DEFAULT_LOCALE);
const format = makeFormatters(DEFAULT_LOCALE);

// jsdom's localStorage is undefined in this suite's Node/vitest combo (confirmed empirically) —
// storePostResetContext is mocked so the reset-confirm wiring is testable without depending on
// real persistence. importOriginal keeps every other calibrate-view export real.
vi.mock("~/routes/calibrate-view.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("~/routes/calibrate-view.js")>();
  return { ...actual, storePostResetContext: vi.fn(actual.storePostResetContext) };
});

function newQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } });
}

function baseProps(): SettingsScreenProps {
  return {
    account: { name: "Rafael Costa", email: "rafael.costa@gmail.com", avatarInitials: "RC", onLogout: () => {} },
    preferences: {
      language: { value: "pt-BR", onChange: () => {} },
      notifications: { enabled: false, permission: "default", onToggle: () => {} }
    },
    privacy: {
      consent: { granted: true, sinceLabel: "em 02/07/2026", onGoVoice: () => {} },
      exportData: { pending: false, onExport: () => {} },
      reset: { onOpenReset: () => {} },
      delete: { onOpenDelete: () => {} }
    },
    plan: { planName: "Teste grátis", credits: 12, onGoBilling: () => {} },
    resetDialog: { open: false, pending: false, onCancel: () => {}, onConfirm: () => {} },
    deleteDialog: { open: false, confirmText: "", onConfirmTextChange: () => {}, pending: false, onCancel: () => {}, onConfirm: () => {} }
  };
}

describe("settings-view (pure)", () => {
  it("initialsFrom prefers a two-word name, falls back to email, then '?'", () => {
    expect(initialsFrom("Rafael Costa", undefined)).toBe("RC");
    expect(initialsFrom(undefined, "rita@example.com")).toBe("RI");
    expect(initialsFrom(undefined, undefined)).toBe("?");
  });

  it("consentMirrorSinceLabel reads grantedAt when granted, revokedAt when not", () => {
    const granted: VoiceTrainingConsentStatusView = { granted: true, grantedAt: "2026-07-02T12:00:00Z" };
    const revoked: VoiceTrainingConsentStatusView = { granted: false, revokedAt: "2026-07-10T12:00:00Z" };
    // Noon UTC keeps the calendar day stable regardless of the runner's local timezone.
    expect(consentMirrorSinceLabel(t, format, granted)).toBe("em 02 de jul. de 2026");
    expect(consentMirrorSinceLabel(t, format, revoked)).toBe("em 10 de jul. de 2026");
  });

  it("audienceFromChannel (1e, GAP #7) maps the real channel field, falls back generically", () => {
    expect(audienceFromChannel(t, "professional-network")).toBe("quem te lê no LinkedIn");
    expect(audienceFromChannel(t, null)).toBe("quem te acompanha");
    expect(audienceFromChannel(t, undefined)).toBe("quem te acompanha");
  });
});

describe("SettingsScreen render (S9)", () => {
  it("renders identity, preferences, and the privacy ladder in one pass", () => {
    render(<SettingsScreen {...baseProps()} />);

    expect(screen.getByText("Rafael Costa")).toBeInTheDocument();
    expect(screen.getByText("rafael.costa@gmail.com · via Auth0")).toBeInTheDocument();
    expect(screen.getByText("Idioma da interface")).toBeInTheDocument();
    expect(screen.getByText("o tema claro/escuro mora no topo do app — não é uma configuração")).toBeInTheDocument();
    expect(screen.getByText("concedido em 02/07/2026 — o controle mora no perfil de voz")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Excluir conta" })).toBeInTheDocument();
    // The credits number sits in its own Fraunces span (fidelity rule) — the full label is split
    // across nodes, so match against the row's own concatenated textContent.
    expect(screen.getByText((_, node) => node?.textContent === "Teste grátis · 12 créditos")).toBeInTheDocument();
  });

  it("mirrors a revoked consent in danger tone, without exposing a revoke action here", () => {
    const props = baseProps();
    props.privacy = {
      ...props.privacy,
      consent: { granted: false, sinceLabel: "", onGoVoice: () => {} }
    };
    render(<SettingsScreen {...props} />);

    expect(screen.getByText("revogado — a geração está desligada")).toBeInTheDocument();
    expect(screen.queryByText("Revogar")).not.toBeInTheDocument();
  });

  it("shows a loading placeholder for the consent row instead of a fabricated state", () => {
    const props = baseProps();
    props.privacy = { ...props.privacy, consent: undefined };
    render(<SettingsScreen {...props} />);

    expect(screen.getByText("carregando…")).toBeInTheDocument();
  });

  it("renders the notifications toggle inert when the browser permission is denied", () => {
    const props = baseProps();
    props.preferences = {
      ...props.preferences,
      notifications: { enabled: false, permission: "denied", onToggle: () => {} }
    };
    render(<SettingsScreen {...props} />);

    expect(screen.getByText("ative nas configurações do navegador")).toBeInTheDocument();
    expect(screen.getByRole("switch")).toBeDisabled();
  });

  it("skips the plan section while entitlement is still loading", () => {
    const props = baseProps();
    props.plan = undefined;
    render(<SettingsScreen {...props} />);

    expect(screen.queryByText("gerenciar no billing →")).not.toBeInTheDocument();
  });
});

describe("ResetDialog / DeleteDialog (S9 — escada destrutiva)", () => {
  it("ResetDialog has no type-to-confirm — the button is always clickable", () => {
    const onConfirm = () => {};
    render(<ResetDialog open pending={false} onCancel={() => {}} onConfirm={onConfirm} />);

    expect(screen.getByText("Resetar apaga tudo, menos o login")).toBeInTheDocument();
    expect(screen.getByText("Resetar minha conta").closest("button")).not.toBeDisabled();
  });

  it("DeleteDialog gates the terminal button behind typing EXCLUIR exactly", () => {
    function Harness() {
      const [text, setText] = React.useState("");
      return <DeleteDialog open confirmText={text} onConfirmTextChange={setText} pending={false} onCancel={() => {}} onConfirm={() => {}} />;
    }
    render(<Harness />);

    const confirmButton = screen.getByText("Excluir pra sempre").closest("button")!;
    expect(confirmButton).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText("EXCLUIR"), { target: { value: "excluir" } });
    expect(confirmButton).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText("EXCLUIR"), { target: { value: "EXCLUIR" } });
    expect(confirmButton).not.toBeDisabled();
  });

  it("DeleteDialog disables both actions while a delete is pending", () => {
    render(<DeleteDialog open confirmText="EXCLUIR" onConfirmTextChange={() => {}} pending onCancel={() => {}} onConfirm={() => {}} />);

    expect(screen.getByText("Excluindo…").closest("button")).toBeDisabled();
    expect(screen.getByText("Manter minha conta").closest("button")).toBeDisabled();
  });
});

// Standalone router mirroring router.tsx's "/_shell" + "/settings" ids (same pattern as
// detail.test.tsx/voice.test.tsx) — router.tsx already wires /settings to the real SettingsContainer.
// Needs auth in context (unlike detail/voice) since AccountSection reads it.
function renderSettings(queryClient: QueryClient, auth: AppAuth = mockAuth) {
  const rootRoute = createRootRouteWithContext<{ auth: AppAuth }>()();
  const shellRoute = createRoute({ getParentRoute: () => rootRoute, id: "_shell", component: () => <Outlet /> });
  const settingsRoute = createRoute({ getParentRoute: () => shellRoute, path: "/settings", component: SettingsContainer });
  const routeTree = rootRoute.addChildren([shellRoute.addChildren([settingsRoute])]);
  const testRouter = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ["/settings"] }),
    context: { auth }
  });
  const runtime = makeAppRuntime({ baseUrl: "http://localhost", getToken: () => null });

  return render(
    <QueryClientProvider client={queryClient}>
      <RuntimeProvider runtime={runtime}>
        <RouterProvider router={testRouter} />
      </RuntimeProvider>
    </QueryClientProvider>
  );
}

describe("settings route (S9) — real hooks, no mutation submitted", () => {
  it("binds real auth identity, entitlement plan, and granted consent", async () => {
    const queryClient = newQueryClient();
    queryClient.setQueryData(queryKeys.entitlement(), entitlementFixture);
    queryClient.setQueryData(queryKeys.voiceConsent(), { granted: true, grantedAt: "2026-07-02T12:00:00Z" });
    queryClient.setQueryData(queryKeys.billingPlans(), { plans: [], generationsDisclaimer: "" });

    renderSettings(queryClient);

    expect(await screen.findByText(mockAuth.user!.name!)).toBeInTheDocument();
    expect(screen.getByText(`${mockAuth.user!.email} · via Auth0`)).toBeInTheDocument();
    expect(screen.getByText(/concedido em 02 de jul\. de 2026/)).toBeInTheDocument();
    // tier "creator" has no catalog match in the seeded (empty) plans list, so resolvePlanName
    // falls back to the capitalized tier — same real function billing.tsx uses.
    const expectedPlanText = `Creator · ${entitlementFixture.availableCredits} créditos`;
    expect(screen.getByText((_, node) => node?.textContent === expectedPlanText)).toBeInTheDocument();
  });

  it("opens the reset dialog and cancels without invoking the mutation", async () => {
    const queryClient = newQueryClient();
    queryClient.setQueryData(queryKeys.entitlement(), entitlementFixture);
    queryClient.setQueryData(queryKeys.voiceConsent(), { granted: true, grantedAt: "2026-07-02T12:00:00Z" });
    queryClient.setQueryData(queryKeys.billingPlans(), { plans: [], generationsDisclaimer: "" });

    renderSettings(queryClient);
    await screen.findByText("Resetar conta");

    expect(screen.queryByText("Resetar apaga tudo, menos o login")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Resetar"));
    expect(await screen.findByText("Resetar apaga tudo, menos o login")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Cancelar"));
    expect(screen.queryByText("Resetar apaga tudo, menos o login")).not.toBeInTheDocument();
  });

  it("opens the delete dialog and keeps the terminal action disabled until EXCLUIR is typed", async () => {
    const queryClient = newQueryClient();
    queryClient.setQueryData(queryKeys.entitlement(), entitlementFixture);
    queryClient.setQueryData(queryKeys.voiceConsent(), { granted: true, grantedAt: "2026-07-02T12:00:00Z" });
    queryClient.setQueryData(queryKeys.billingPlans(), { plans: [], generationsDisclaimer: "" });

    renderSettings(queryClient);
    const openDeleteButton = await screen.findByRole("button", { name: "Excluir conta" });

    fireEvent.click(openDeleteButton);
    const confirmButton = await screen.findByText("Excluir pra sempre");
    expect(confirmButton.closest("button")).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText("EXCLUIR"), { target: { value: "EXCLUIR" } });
    expect(confirmButton.closest("button")).not.toBeDisabled();

    fireEvent.click(screen.getByText("Manter minha conta"));
    expect(screen.queryByText("Excluir a conta remove tudo — inclusive o login")).not.toBeInTheDocument();
  });

  it("1e — confirming reset snapshots the last execution's topic/channel before the mutation wipes it", async () => {
    const queryClient = newQueryClient();
    queryClient.setQueryData(queryKeys.entitlement(), entitlementFixture);
    queryClient.setQueryData(queryKeys.voiceConsent(), { granted: true, grantedAt: "2026-07-02T12:00:00Z" });
    queryClient.setQueryData(queryKeys.billingPlans(), { plans: [], generationsDisclaimer: "" });
    queryClient.setQueryData(
      queryKeys.executionsList({ status: "all", limit: 1 }),
      executionsPageWith([executionFixture({ briefingTopic: "voz autêntica no trabalho", channel: "professional-network" })])
    );

    // Same token-resolving runtime onboarding.test.tsx uses once a mutation actually fires a
    // real fetch — renderSettings's default (getToken: () => null) is fine for the read-only
    // tests above, not for this one.
    // The transport binds globalThis.fetch once, at makeAppRuntime construction — the stub has to
    // be in place first, or the mutation fires a real (hanging) network request instead.
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = new URL(typeof input === "string" ? input : input.toString());
      if (url.pathname.endsWith("/me/account/reset")) {
        return new Response(JSON.stringify({ onboardingRequired: true, hasVoiceProfile: false }), {
          status: 200,
          headers: { "content-type": "application/json" }
        });
      }
      throw new Error(`unhandled fetch ${url.pathname}`);
    }) as typeof fetch;

    const runtime = makeAppRuntime({ baseUrl: "http://localhost", getToken: () => mockAuth.getAccessTokenSilently() });
    const rootRoute = createRootRouteWithContext<{ auth: AppAuth }>()();
    const shellRoute = createRoute({ getParentRoute: () => rootRoute, id: "_shell", component: () => <Outlet /> });
    const settingsRoute = createRoute({ getParentRoute: () => shellRoute, path: "/settings", component: SettingsContainer });
    const routeTree = rootRoute.addChildren([shellRoute.addChildren([settingsRoute])]);
    const testRouter = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ["/settings"] }),
      context: { auth: mockAuth }
    });

    try {
      render(
        <QueryClientProvider client={queryClient}>
          <RuntimeProvider runtime={runtime}>
            <RouterProvider router={testRouter} />
          </RuntimeProvider>
        </QueryClientProvider>
      );

      fireEvent.click(await screen.findByText("Resetar"));
      fireEvent.click(await screen.findByText("Resetar minha conta"));

      await waitFor(() => expect(storePostResetContext).toHaveBeenCalledTimes(1));
      const [stored] = vi.mocked(storePostResetContext).mock.calls[0];
      expect(stored.topic).toBe("voz autêntica no trabalho");
      expect(stored.audience).toBe("quem te lê no LinkedIn");
    } finally {
      globalThis.fetch = originalFetch;
      vi.mocked(storePostResetContext).mockReset();
    }
  });
});
