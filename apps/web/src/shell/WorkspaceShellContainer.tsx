import { useDeferredValue, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate, useRouteContext, useRouterState } from "@tanstack/react-router";
import {
  confidenceRingValue,
  creditsAsTexts,
  useCompletionNotifications,
  useEntitlement,
  useExecutionsList,
  useHistoryFilterStore,
  useRunningExecutionsWatch,
  useShellStore,
  useThemeStore,
  useToastStore,
  useUnreadStore,
  useVoiceProfile
} from "@my-ai-orchestrator/shared";
import { WorkspaceShell, type HistoryStatusFilterUI } from "@my-ai-orchestrator/ui/app";
import { LockedCenter } from "@my-ai-orchestrator/ui/app/locked";
import { WizardOverlay } from "../routes/-wizard-overlay.js";
import { buildCompanionContent } from "./companion-view.js";
import { buildHistoryGroups } from "./history-view.js";
import { buildToastText } from "./toast-view.js";

const TOAST_AUTO_DISMISS_MS = 6000;
const HISTORY_PAGE_STEP = 20;

const TOPBAR_LABEL: Record<string, string> = {
  "/generate": "NOVA GERAÇÃO",
  "/voice": "SUA VOZ",
  "/plans": "PLANOS",
  "/billing": "BILLING",
  "/settings": "CONFIGURAÇÕES"
};

function topbarLabelFor(pathname: string): string {
  if (pathname in TOPBAR_LABEL) return TOPBAR_LABEL[pathname];
  if (pathname.startsWith("/g/")) return "GERAÇÃO";
  return "CULTIV";
}

function initialsFrom(name: string | undefined, email: string | undefined): string {
  const source = name?.trim() || email?.trim();
  if (!source) return "?";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

export interface WorkspaceShellContainerProps {
  readonly children: ReactNode;
}

// The only piece that touches `shared`/router — packages/ui/app/shell stays props-in.
// Bindings-by-name follow .scratch/implementacao-app-web/research/breakdown-07-shell.md §2.
export function WorkspaceShellContainer({ children }: WorkspaceShellContainerProps) {
  const { appMode, auth } = useRouteContext({ from: "/_shell" });
  const locked = appMode === "locked";
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const railOpen = useShellStore((state) => state.railOpen);
  const toggleRail = useShellStore((state) => state.toggleRail);
  const closeRail = useShellStore((state) => state.closeRail);
  const companionOpen = useShellStore((state) => state.companionOpen);
  const toggleCompanion = useShellStore((state) => state.toggleCompanion);
  const closeCompanion = useShellStore((state) => state.closeCompanion);

  const filterQuery = useHistoryFilterStore((state) => state.q);
  const filterStatus = useHistoryFilterStore((state) => state.status);
  const filterPeriod = useHistoryFilterStore((state) => state.period);
  const setQuery = useHistoryFilterStore((state) => state.setQuery);
  const setStatus = useHistoryFilterStore((state) => state.setStatus);
  // React defers the query-driving value so fast typing doesn't fire a network request per keystroke.
  const deferredQuery = useDeferredValue(filterQuery);

  // undefined until "mostrar mais antigos" is used — the server echoes back the effective limit
  // it applied (ExecutionsPageView.limit), so bumping from that instead of a guessed constant
  // never skips or re-requests the same page twice.
  const [historyLimit, setHistoryLimit] = useState<number | undefined>(undefined);
  useEffect(() => {
    setHistoryLimit(undefined);
  }, [deferredQuery, filterStatus, filterPeriod]);

  const executions = useExecutionsList({
    q: deferredQuery || undefined,
    status: filterStatus,
    period: filterPeriod,
    limit: historyLimit
  });
  const entitlement = useEntitlement();
  const voiceProfile = useVoiceProfile();
  const unread = useUnreadStore((state) => state.unread);

  // Keeps the rail's live items + unread dots + the toast/notifications signal below current
  // regardless of which route is mounted.
  useRunningExecutionsWatch();

  const toasts = useToastStore((state) => state.toasts);
  const dismissToast = useToastStore((state) => state.dismiss);
  const markRead = useUnreadStore((state) => state.markRead);
  const completionNotifications = useCompletionNotifications();
  // The toast slot (ShellToast) is a single fixed pill (packages/ui/src/shell.css) — only the
  // most recently pushed toast shows; earlier ones are still queued in the store underneath.
  const activeToast = toasts[toasts.length - 1];

  useEffect(() => {
    if (!activeToast) return;
    const timer = window.setTimeout(() => dismissToast(activeToast.id), TOAST_AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [activeToast, dismissToast]);

  // 2.5 Web Notifications — same completion signal that feeds the toast, fired once per toast id
  // and only while the tab is hidden (a visible tab already shows the toast/rail live).
  const notifiedIdsRef = useRef(new Set<string>());
  useEffect(() => {
    if (!activeToast || notifiedIdsRef.current.has(activeToast.id)) return;
    notifiedIdsRef.current.add(activeToast.id);
    if (!completionNotifications.enabled || typeof Notification === "undefined" || !document.hidden) return;
    const notification = new Notification(buildToastText(activeToast));
    notification.onclick = () => {
      window.focus();
      void navigate({ to: "/g/$executionId", params: { executionId: activeToast.id } });
      notification.close();
    };
  });

  function openToast(toast: (typeof toasts)[number]) {
    markRead(toast.id);
    dismissToast(toast.id);
    void navigate({ to: "/g/$executionId", params: { executionId: toast.id } });
  }

  // 2a ReconnectionReconcile (states/ReconnectionReconcile.tsx) has no host yet: the SDK's
  // execution watch (execution-watch.ts) only reports terminal failure, never a "reconnected
  // successfully after being offline" signal — there's nothing real to gate this banner on.
  // ponytail: seam — wire once startExecutionWatch (or a navigator.onLine listener) exposes that.

  useEffect(() => {
    const inGenerationContext = pathname === "/generate" || pathname.startsWith("/g/");
    if (!inGenerationContext) closeCompanion();
  }, [pathname, closeCompanion]);

  const activeExecutionId = pathname.startsWith("/g/") ? pathname.slice(3) : undefined;
  const now = useMemo(() => new Date(), [executions.data]);
  const groups = useMemo(
    () => buildHistoryGroups(executions.data, unread, activeExecutionId, now),
    [executions.data, unread, activeExecutionId, now]
  );
  const emptyReason =
    groups.length > 0 ? undefined : filterQuery || filterStatus !== "all" ? "filtered" : "never-generated";

  const olderCount = executions.data ? Math.max(0, executions.data.total - executions.data.items.length) : 0;
  const onShowOlder = () => {
    if (executions.data) setHistoryLimit(executions.data.limit + HISTORY_PAGE_STEP);
  };

  // Only worth asking "does this exist under another status?" when a specific status filter is
  // the reason the rail came up empty — a global empty rail has nothing to point at.
  const otherStatusQuery = useExecutionsList(
    { q: deferredQuery || undefined, status: "all", period: filterPeriod },
    { enabled: emptyReason === "filtered" && filterStatus !== "all" }
  );
  const otherStatusMatches = otherStatusQuery.data?.total ?? 0;

  const creditsLabel = entitlement.data
    ? `${entitlement.data.availableCredits} créditos · ~${creditsAsTexts(entitlement.data.availableCredits, entitlement.data.canonicalCreditCost)} textos`
    : "— créditos";

  const goVoice = () => navigate({ to: "/voice" });

  return (
    <>
      <WorkspaceShell
        theme={theme}
        locked={locked}
        railOpen={railOpen}
        onRailBackdropClick={closeRail}
        rail={{
          open: railOpen,
          locked,
          onNewGeneration: () => {
            closeRail();
            navigate({ to: "/generate" });
          },
          search: filterQuery,
          onSearchChange: setQuery,
          activeFilter: filterStatus as HistoryStatusFilterUI,
          onFilterChange: setStatus,
          groups,
          emptyReason,
          olderCount,
          onShowOlder,
          otherStatusMatches,
          onClearFilter: () => setStatus("all"),
          onOpenItem: (id) => {
            closeRail();
            navigate({ to: "/g/$executionId", params: { executionId: id } });
          },
          voiceConfidenceValue: voiceProfile.data ? confidenceRingValue(voiceProfile.data.profile.confidence) : undefined,
          onToggleCompanion: toggleCompanion,
          avatarInitials: initialsFrom(auth.user?.name, auth.user?.email),
          onOpenVoiceProfile: goVoice,
          onOpenBilling: () => navigate({ to: "/billing" }),
          onOpenSettings: () => navigate({ to: "/settings" }),
          onLogout: () => auth.logout({ logoutParams: { returnTo: window.location.origin } })
        }}
        topbar={{
          label: topbarLabelFor(pathname),
          creditsLabel,
          onToggleTheme: toggleTheme,
          onToggleRail: toggleRail
        }}
        companion={{
          open: companionOpen,
          onClose: closeCompanion,
          content: buildCompanionContent(locked, voiceProfile.data, goVoice)
        }}
        toast={activeToast ? { text: buildToastText(activeToast), onClick: () => openToast(activeToast) } : undefined}
      >
        {locked && pathname !== "/voice" ? <LockedCenter onCalibrate={() => navigate({ to: "/calibrate" })} /> : children}
      </WorkspaceShell>
      <WizardOverlay />
    </>
  );
}
