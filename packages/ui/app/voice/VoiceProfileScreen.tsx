import "./voice.css";
import { Mono, Panel, Pill, type RingTone } from "../primitives/index.js";
import { ConfidenceRing } from "./ConfidenceRing.js";
import { ConsentPanel } from "./ConsentPanel.js";
import { MaterialBaseCoverage } from "./MaterialBaseCoverage.js";
import { MaterialBaseSamples, type MaterialBaseSampleVM } from "./MaterialBaseSamples.js";
import { RevokeConfirmDialog } from "./RevokeConfirmDialog.js";
import { TraitReviewList } from "./TraitReviewList.js";
import { VoiceDescriptorChips } from "./VoiceDescriptorChips.js";
import { VoiceEmptyState } from "./VoiceEmptyState.js";
import { VoiceHeader } from "./VoiceHeader.js";
import { VoiceLoadingSkeleton } from "./VoiceLoadingSkeleton.js";
import { VoiceProseCard } from "./VoiceProseCard.js";
import type { CoverageItemVM, TraitVM } from "./types.js";

export interface VoiceProfileReadyState {
  readonly kind: "ready";
  readonly ring: { readonly value: number; readonly caption: string; readonly tone: RingTone };
  readonly headline: string;
  readonly versionLabel: string;
  readonly onRecalibrate: () => void;
  readonly proseCore: string;
  readonly proseDevelopment: string;
  readonly descriptorChips: readonly string[];
  readonly traits: readonly TraitVM[];
  readonly onConfirmTrait: (traitKey: string) => void;
  readonly onContestTrait: (traitKey: string) => void;
  readonly pendingTraitKey?: string;
  readonly materialBase: {
    readonly heading: string;
    readonly totalExamples: number;
    readonly activeExamples: number;
    readonly excludedExamples: number;
    readonly pinnedExamples: number;
    readonly footnote: string;
    readonly samples?: readonly MaterialBaseSampleVM[];
  };
  readonly coverage: { readonly items: readonly CoverageItemVM[]; readonly nextStep: string };
  readonly consent: {
    readonly state: "granted" | "revoked";
    readonly sinceLabel: string;
    readonly onRevoke: () => void;
    readonly onGrant: () => void;
  };
  readonly revokeDialog: { readonly open: boolean; readonly onCancel: () => void; readonly onConfirm: () => void };
}

export type VoiceProfileScreenState =
  | { readonly kind: "loading" }
  | { readonly kind: "error"; readonly onRetry: () => void }
  | { readonly kind: "empty"; readonly onCalibrate: () => void }
  | VoiceProfileReadyState;

export interface VoiceProfileScreenProps {
  readonly state: VoiceProfileScreenState;
}

export function VoiceProfileScreen({ state }: VoiceProfileScreenProps) {
  return (
    <div className="voice-screen">
      <div className="voice-screen-inner">
        {state.kind === "loading" ? <VoiceLoadingSkeleton /> : null}
        {state.kind === "error" ? <ErrorPanel onRetry={state.onRetry} /> : null}
        {state.kind === "empty" ? (
          <VoiceEmptyState
            onCalibrate={state.onCalibrate}
            size={84}
            description="sua voz aparece aqui depois da calibração"
            ctaLabel="calibrar agora →"
          />
        ) : null}
        {state.kind === "ready" ? <ReadyScreen state={state} /> : null}
      </div>
    </div>
  );
}

function ErrorPanel({ onRetry }: { onRetry: () => void }) {
  return (
    <Panel className="voice-error-panel">
      <div className="voice-error-text">não foi possível carregar o perfil de voz.</div>
      <Pill variant="secondary" onClick={onRetry}>
        tentar de novo
      </Pill>
    </Panel>
  );
}

function ReadyScreen({ state }: { state: VoiceProfileReadyState }) {
  return (
    <>
      <Mono as="div" className="voice-page-eyebrow">
        Perfil de voz · como a Cultiv aprende você
      </Mono>
      {/* seam: S10 — drift nudge (VoiceDriftNudge) slots here as an inline <Banner tone="warning">,
          snoozeable 7d, never a modal (ticket 15). Not implemented in S5. */}
      <div className="voice-header-row">
        <ConfidenceRing value={state.ring.value} caption={state.ring.caption} tone={state.ring.tone} size={96} eyebrow="CONFIANÇA" />
        <VoiceHeader headline={state.headline} versionLabel={state.versionLabel} />
        <Pill variant="secondary" onClick={state.onRecalibrate}>
          Recalibrar →
        </Pill>
      </div>

      <div className="voice-prose-grid">
        <VoiceProseCard heading="Como eu penso" body={state.proseCore} />
        <VoiceProseCard heading="Como eu desenvolvo um texto" body={state.proseDevelopment} />
      </div>

      <VoiceDescriptorChips chips={state.descriptorChips} />

      {/* seam: S10 — low-confidence trait review (LowConfidenceReview) hooks into this section
          when ring.tone === "warning" (ticket 15). TraitReviewList below stays the baseline. */}
      <TraitReviewList
        traits={state.traits}
        onConfirm={state.onConfirmTrait}
        onContest={state.onContestTrait}
        pendingTraitKey={state.pendingTraitKey}
      />

      <div className="voice-material-section">
        <h2 className="voice-material-heading">Material-base</h2>
        <div className="voice-material-grid">
          <MaterialBaseSamples
            heading={state.materialBase.heading}
            totalExamples={state.materialBase.totalExamples}
            activeExamples={state.materialBase.activeExamples}
            excludedExamples={state.materialBase.excludedExamples}
            pinnedExamples={state.materialBase.pinnedExamples}
            footnote={state.materialBase.footnote}
            samples={state.materialBase.samples}
          />
          <MaterialBaseCoverage coverage={state.coverage.items} nextStep={state.coverage.nextStep} />
        </div>
      </div>

      <ConsentPanel
        state={state.consent.state}
        sinceLabel={state.consent.sinceLabel}
        onRevoke={state.consent.onRevoke}
        onGrant={state.consent.onGrant}
      />

      <RevokeConfirmDialog
        open={state.revokeDialog.open}
        onCancel={state.revokeDialog.onCancel}
        onConfirm={state.revokeDialog.onConfirm}
      />
    </>
  );
}
