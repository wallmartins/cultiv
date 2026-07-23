import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { TRAIT_KEYS, type TraitKey } from "@my-ai-orchestrator/contracts";
import {
  hasVoiceProfile,
  useConsentStatus,
  useExecutionsList,
  useGrantConsent,
  usePracticeIdentity,
  useRecordTraitConfirmation,
  useRespondToNicheAsk,
  useRevokeConsent,
  useShellStore,
  useUiLanguage,
  useUpdateDeclaredAxes,
  useVoiceProfile
} from "@my-ai-orchestrator/shared";
import { useFormat, useMessages } from "@my-ai-orchestrator/ui/app/i18n";
import { VoiceProfileScreen, type PracticeSectionVM, type VoiceProfileScreenState } from "@my-ai-orchestrator/ui/app/voice";
import { RecalibrateWithRunning } from "@my-ai-orchestrator/ui/app/states";
import {
  buildConsentSinceLabel,
  buildCoverage,
  buildDescriptorChips,
  buildMaterialBaseSamples,
  buildPracticeAxes,
  buildPracticeNicheAsk,
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
  const t = useMessages();
  const format = useFormat();
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

  const uiLanguage = useUiLanguage((state) => state.language);
  const identityQuery = usePracticeIdentity(uiLanguage);
  const updateAxes = useUpdateDeclaredAxes(uiLanguage);
  const respondNiche = useRespondToNicheAsk(uiLanguage);

  const [practiceEditOpen, setPracticeEditOpen] = useState(false);
  const [practiceSubject, setPracticeSubject] = useState("");
  const [practiceVantagePoint, setPracticeVantagePoint] = useState("");
  const [practiceAudiences, setPracticeAudiences] = useState<readonly string[]>([]);
  const [practiceAudienceDraft, setPracticeAudienceDraft] = useState("");
  const [practiceEditError, setPracticeEditError] = useState<string | undefined>(undefined);

  const [nicheAnswerOpen, setNicheAnswerOpen] = useState(false);
  const [nicheAnswer, setNicheAnswer] = useState("");

  const identity = identityQuery.data?.profile;

  function openPracticeEdit() {
    if (!identity) return;
    setPracticeSubject(identity.subject);
    setPracticeVantagePoint(identity.vantagePoint);
    setPracticeAudiences(identity.audiences);
    setPracticeAudienceDraft("");
    setPracticeEditError(undefined);
    setPracticeEditOpen(true);
  }

  function cancelPracticeEdit() {
    setPracticeEditOpen(false);
    setPracticeEditError(undefined);
  }

  function addPracticeAudience() {
    const value = practiceAudienceDraft.trim();
    if (!value || practiceAudiences.includes(value)) return;
    setPracticeAudiences((current) => [...current, value]);
    setPracticeAudienceDraft("");
  }

  function removePracticeAudience(value: string) {
    setPracticeAudiences((current) => current.filter((candidate) => candidate !== value));
  }

  function savePracticeEdit() {
    const subject = practiceSubject.trim();
    const vantagePoint = practiceVantagePoint.trim();
    if (!subject || !vantagePoint || practiceAudiences.length === 0) {
      setPracticeEditError(t.voice.practice.editValidationError);
      return;
    }
    setPracticeEditError(undefined);
    updateAxes.mutate(
      { subject, vantagePoint, audiences: practiceAudiences },
      {
        onSuccess: () => setPracticeEditOpen(false),
        onError: () => setPracticeEditError(t.voice.practice.saveError)
      }
    );
  }

  function submitNicheAnswer() {
    const answer = nicheAnswer.trim();
    if (!answer) return;
    respondNiche.mutate(
      { action: "answer", answer },
      {
        onSuccess: () => {
          setNicheAnswer("");
          setNicheAnswerOpen(false);
        }
      }
    );
  }

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

    const practice: PracticeSectionVM | null = identity
      ? {
          axes: buildPracticeAxes(identity),
          nicheAsk: buildPracticeNicheAsk(identity),
          edit: {
            open: practiceEditOpen,
            subject: practiceSubject,
            vantagePoint: practiceVantagePoint,
            audiences: practiceAudiences,
            audienceDraft: practiceAudienceDraft,
            pending: updateAxes.isPending,
            error: practiceEditError,
            onOpen: openPracticeEdit,
            onCancel: cancelPracticeEdit,
            onSubjectChange: setPracticeSubject,
            onVantagePointChange: setPracticeVantagePoint,
            onAudienceDraftChange: setPracticeAudienceDraft,
            onAudienceAdd: addPracticeAudience,
            onAudienceRemove: removePracticeAudience,
            onSave: savePracticeEdit
          },
          nicheAskState: {
            answerOpen: nicheAnswerOpen,
            answer: nicheAnswer,
            pending: respondNiche.isPending,
            onRespondOpen: () => setNicheAnswerOpen(true),
            onAnswerChange: setNicheAnswer,
            onAnswerSubmit: submitNicheAnswer,
            onDismiss: () => respondNiche.mutate({ action: "dismiss" })
          }
        }
      : null;

    state = {
      kind: "ready",
      ring: buildRing(profile, t),
      headline: t.common.confidence.headline[profile.profile.confidence],
      versionLabel: buildVersionLabel(profile, t),
      onRecalibrate: requestRecalibrate,
      proseCore: prose.core,
      proseDevelopment: prose.development,
      descriptorChips: buildDescriptorChips(profile, t),
      traits: buildTraits(profile, t),
      onConfirmTrait: (traitKey) => {
        if (isTraitKey(traitKey)) recordTrait.mutate({ traitKey, response: "confirmed" });
      },
      onContestTrait: (traitKey) => {
        if (isTraitKey(traitKey)) recordTrait.mutate({ traitKey, response: "rejected" });
      },
      pendingTraitKey: recordTrait.isPending ? recordTrait.variables?.traitKey : undefined,
      materialBase: {
        heading: t.voice.materialBase.heading(t.common.samples(profile.materialBase.totalExamples)),
        totalExamples: profile.materialBase.totalExamples,
        activeExamples: profile.materialBase.activeExamples,
        excludedExamples: profile.materialBase.excludedExamples,
        pinnedExamples: profile.materialBase.pinnedExamples,
        footnote: t.voice.materialBase.footnote,
        samples: buildMaterialBaseSamples(profile)
      },
      coverage: buildCoverage(profile.diagnostics, t),
      consent: {
        state: consent.granted ? "granted" : "revoked",
        sinceLabel: buildConsentSinceLabel(consent, t, format),
        onRevoke: () => setRevokeDialogOpen(true),
        onGrant: () => grantConsent.mutate()
      },
      revokeDialog: {
        open: revokeDialogOpen,
        onCancel: () => setRevokeDialogOpen(false),
        onConfirm: () => revokeConsent.mutate(undefined, { onSuccess: () => setRevokeDialogOpen(false) })
      },
      practice
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
                topic: item.briefingTopic ?? t.common.noTopic,
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
