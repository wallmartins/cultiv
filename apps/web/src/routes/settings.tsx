import { useEffect, useState } from "react";
import { useNavigate, useRouteContext } from "@tanstack/react-router";
import {
  useAccountExportJob,
  useCompletionNotifications,
  useConsentStatus,
  useDeleteAccount,
  useEntitlement,
  useExecutionsList,
  useExportAccount,
  usePlans,
  useResetAccount,
  useToastStore,
  useUiLanguage
} from "@my-ai-orchestrator/shared";
import { useFormat, useMessages } from "@my-ai-orchestrator/ui/app/i18n";
import { SettingsScreen } from "@my-ai-orchestrator/ui/app/settings";
import { resolvePlanName } from "./billing-view.js";
import { storePostResetContext } from "./calibrate-view.js";
import { audienceFromChannel, consentMirrorSinceLabel, initialsFrom } from "./settings-view.js";

// Container for /app/settings (route wired by router.tsx). Only file in S9 that touches
// shared/sdk/router — packages/ui/app/settings stays props-in.
export function SettingsContainer() {
  const t = useMessages();
  const format = useFormat();
  const { auth } = useRouteContext({ from: "/_shell" });
  const navigate = useNavigate();
  const pushToast = useToastStore((state) => state.push);

  const [resetOpen, setResetOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [exportJobId, setExportJobId] = useState<string | undefined>();

  const language = useUiLanguage((state) => state.language);
  const setLanguage = useUiLanguage((state) => state.setLanguage);
  const notifications = useCompletionNotifications();

  const consentQuery = useConsentStatus();
  const entitlementQuery = useEntitlement();
  const plansQuery = usePlans();
  // Only read for its cached snapshot right before a reset wipes it — not rendered here.
  const lastExecutionQuery = useExecutionsList({ status: "all", limit: 1 });

  const exportAccount = useExportAccount();
  const exportJobQuery = useAccountExportJob(exportJobId ?? "", Boolean(exportJobId));
  const resetAccount = useResetAccount();
  const deleteAccount = useDeleteAccount();

  // Export is async (contract-08 §1: pending -> ready|failed) — polls the real job status
  // instead of assuming success once the request is accepted.
  useEffect(() => {
    const job = exportJobQuery.data;
    if (!exportJobId || !job) return;

    if (job.status === "pending") {
      const timer = setTimeout(() => void exportJobQuery.refetch(), 2500);
      return () => clearTimeout(timer);
    }
    if (job.status === "ready") {
      pushToast({ id: `export-${job.jobId}`, kind: "success", topic: t.settings.exportReadyTopic, message: job.downloadUrl ?? undefined });
      setExportJobId(undefined);
    }
    if (job.status === "failed") {
      pushToast({ id: `export-${job.jobId}`, kind: "error", topic: t.settings.exportFailedTopic });
      setExportJobId(undefined);
    }
  }, [exportJobId, exportJobQuery.data, exportJobQuery.refetch, pushToast, t]);

  const exportPending =
    exportAccount.isPending ||
    (exportJobId !== undefined && exportJobQuery.data?.status !== "ready" && exportJobQuery.data?.status !== "failed");

  const goVoice = () => void navigate({ to: "/voice" });
  const goBilling = () => void navigate({ to: "/billing" });
  const doLogout = () => void auth.logout({ logoutParams: { returnTo: window.location.origin } });

  const handleExport = () => {
    exportAccount.mutate(undefined, { onSuccess: (job) => setExportJobId(job.jobId) });
  };

  const handleConfirmReset = () => {
    // Snapshot before the mutation invalidates the cache — the only real, per-user signal left
    // once the account is wiped (AccountResetResponse carries no context of its own, GAP #7).
    const lastExecution = lastExecutionQuery.data?.items[0];
    resetAccount.mutate(undefined, {
      onSuccess: (response) => {
        setResetOpen(false);
        if (response.onboardingRequired && lastExecution?.briefingTopic) {
          storePostResetContext({
            resetDate: new Date().toISOString(),
            topic: lastExecution.briefingTopic,
            audience: audienceFromChannel(t, lastExecution.channel)
          });
        }
        // PostResetReturn (recognized re-onboarding) renders at /calibrate when a snapshot was
        // captured above; without one (no prior generation), the wizard just starts fresh.
        void navigate({ to: response.onboardingRequired ? "/calibrate" : "/generate" });
      }
    });
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmText !== t.settings.deleteConfirmWord) return;
    deleteAccount.mutate({ confirmation: deleteConfirmText }, { onSuccess: doLogout });
  };

  return (
    <SettingsScreen
      account={{
        name: auth.user?.name ?? "",
        email: auth.user?.email ?? "",
        avatarInitials: initialsFrom(auth.user?.name, auth.user?.email),
        avatarUrl: auth.user?.picture,
        onLogout: doLogout
      }}
      preferences={{
        language: { value: language, onChange: setLanguage },
        notifications: { enabled: notifications.enabled, permission: notifications.permission, onToggle: notifications.toggle }
      }}
      privacy={{
        consent: consentQuery.data
          ? {
              granted: consentQuery.data.granted,
              sinceLabel: consentMirrorSinceLabel(t, format, consentQuery.data),
              onGoVoice: goVoice
            }
          : undefined,
        exportData: { pending: exportPending, onExport: handleExport },
        reset: { onOpenReset: () => setResetOpen(true) },
        delete: { onOpenDelete: () => setDeleteOpen(true) }
      }}
      plan={
        entitlementQuery.data
          ? {
              planName: resolvePlanName(t, entitlementQuery.data, plansQuery.data?.plans),
              credits: entitlementQuery.data.availableCredits,
              onGoBilling: goBilling
            }
          : undefined
      }
      resetDialog={{
        open: resetOpen,
        pending: resetAccount.isPending,
        onCancel: () => setResetOpen(false),
        onConfirm: handleConfirmReset
      }}
      deleteDialog={{
        open: deleteOpen,
        confirmText: deleteConfirmText,
        onConfirmTextChange: setDeleteConfirmText,
        pending: deleteAccount.isPending,
        onCancel: () => {
          setDeleteOpen(false);
          setDeleteConfirmText("");
        },
        onConfirm: handleConfirmDelete
      }}
    />
  );
}
