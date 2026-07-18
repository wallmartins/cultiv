import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { TRAIT_KEYS, type TraitKey } from "@my-ai-orchestrator/contracts";
import {
  confidenceHeadline,
  hasVoiceProfile,
  useConsentStatus,
  useExecutionsList,
  useGrantConsent,
  useRecordTraitConfirmation,
  useRevokeConsent,
  useShellStore,
  useVoiceProfile
} from "@my-ai-orchestrator/shared";
import { VoiceProfileScreen, type VoiceProfileScreenState } from "@my-ai-orchestrator/ui/app/voice";
import { RecalibrateWithRunning } from "@my-ai-orchestrator/ui/app/states";
import {
  buildConsentSinceLabel,
  buildCoverage,
  buildDescriptorChips,
  buildMaterialBaseSamples,
  buildProse,
  buildRing,
  buildTraits,
  buildVersionLabel
} from "./voice-mappers.js";

// 2c VoiceDriftNudge (states/VoiceDriftNudge.tsx) has no real trigger yet: confidence is a
// qualitative enum (low/medium/high, VoiceProfileDiagnosticsView) with no drop-delta or reaction-
// streak field to read (GAP #2, breakdown-15 §1) — nudging off a fabricated "78 → 65" would be
// exactly the kind of invented number this codebase avoids elsewhere (formatTrialLine et al.).
// ponytail: seam — wire once a confidence-history or reaction-streak field ships.

// TraitVM.traitKey is widened to string at the presentational boundary (packages/ui/app/voice
// never imports the enum) — narrow it back before it reaches the mutation input.
function isTraitKey(value: string): value is TraitKey {
  return (TRAIT_KEYS as readonly string[]).includes(value);
}

// Container for /app/voice (route wired by router.tsx). Companion (packages/ui/app/shell/
// VoiceCompanion.tsx) reads the SAME useVoiceProfile() cache — no second fetch, no second
// VoiceProseCard/ConfidenceRing implementation (breakdown-10 §0).
export function VoiceContainer() {
  const navigate = useNavigate();
  const toggleRecal = useShellStore((state) => state.toggleRecal);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [recalConfirmOpen, setRecalConfirmOpen] = useState(false);

  const profileQuery = useVoiceProfile();
  const consentQuery = useConsentStatus();
  const recordTrait = useRecordTraitConfirmation();
  const grantConsent = useGrantConsent();
  const revokeConsent = useRevokeConsent();
  // Same "all" query the shell's running-watch keeps warm — cache hit, not a second round-trip.
  const runningExecutions = useExecutionsList({ status: "all", limit: 20 });
  const runningItems = (runningExecutions.data?.items ?? []).filter(
    (item) => item.status === "queued" || item.status === "running"
  );

  const goCalibrate = () => navigate({ to: "/calibrate" });

  // 2d — recalibrating mid-generation doesn't interrupt anything server-side (running jobs finish
  // on the version they started with), but it's a real enough surprise to confirm first.
  const requestRecalibrate = () => {
    if (runningItems.length > 0) {
      setRecalConfirmOpen(true);
      return;
    }
    toggleRecal();
  };

  let state: VoiceProfileScreenState;

  if (profileQuery.isError) {
    state = { kind: "error", onRetry: () => void profileQuery.refetch() };
  } else if (profileQuery.data === undefined || consentQuery.data === undefined) {
    state = { kind: "loading" };
  } else if (!hasVoiceProfile(profileQuery.data)) {
    state = { kind: "empty", onCalibrate: goCalibrate };
  } else {
    const profile = profileQuery.data;
    const consent = consentQuery.data;
    const prose = buildProse(profile);

    state = {
      kind: "ready",
      ring: buildRing(profile),
      headline: confidenceHeadline(profile.profile.confidence),
      versionLabel: buildVersionLabel(profile),
      onRecalibrate: requestRecalibrate,
      proseCore: prose.core,
      proseDevelopment: prose.development,
      descriptorChips: buildDescriptorChips(profile),
      traits: buildTraits(profile),
      onConfirmTrait: (traitKey) => {
        if (isTraitKey(traitKey)) recordTrait.mutate({ traitKey, response: "confirmed" });
      },
      onContestTrait: (traitKey) => {
        if (isTraitKey(traitKey)) recordTrait.mutate({ traitKey, response: "rejected" });
      },
      pendingTraitKey: recordTrait.isPending ? recordTrait.variables?.traitKey : undefined,
      materialBase: {
        heading: `${profile.materialBase.totalExamples} amostras da calibração · leitura`,
        totalExamples: profile.materialBase.totalExamples,
        activeExamples: profile.materialBase.activeExamples,
        excludedExamples: profile.materialBase.excludedExamples,
        pinnedExamples: profile.materialBase.pinnedExamples,
        footnote: "novos exemplos só entram recalibrando",
        samples: buildMaterialBaseSamples(profile)
      },
      coverage: buildCoverage(profile.diagnostics),
      consent: {
        state: consent.granted ? "granted" : "revoked",
        sinceLabel: buildConsentSinceLabel(consent),
        onRevoke: () => setRevokeDialogOpen(true),
        onGrant: () => grantConsent.mutate()
      },
      revokeDialog: {
        open: revokeDialogOpen,
        onCancel: () => setRevokeDialogOpen(false),
        onConfirm: () => revokeConsent.mutate(undefined, { onSuccess: () => setRevokeDialogOpen(false) })
      }
    };
  }

  const currentVersion = profileQuery.data?.profile.version ?? 0;

  return (
    <>
      <VoiceProfileScreen state={state} />
      {recalConfirmOpen ? (
        <div className="voice-revoke-backdrop" onClick={() => setRecalConfirmOpen(false)}>
          <div onClick={(event) => event.stopPropagation()}>
            <RecalibrateWithRunning
              running={runningItems.map((item) => ({
                topic: item.briefingTopic ?? "sem tema",
                progress: (item.progress?.percent ?? 0) / 100
              }))}
              fromVersion={currentVersion}
              toVersion={currentVersion + 1}
              onWait={() => setRecalConfirmOpen(false)}
              onProceed={() => {
                setRecalConfirmOpen(false);
                toggleRecal();
              }}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
