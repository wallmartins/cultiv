import type {
  NextActionCode,
  VoiceAdaptationMode,
  VoiceMaterialBaseBreakdown,
  VoiceProfileConfidence,
  VoiceProfileDiagnosticsView,
  VoiceProfileView
} from "@my-ai-orchestrator/contracts";
import type { AppVoiceMessages } from "~/i18n/app/types";
import { VOICE_EXAMPLE_FORMATS } from "~/app/voice/lib/voice-example-formats";

function localizeTone(tone: string, messages: AppVoiceMessages): string {
  if (tone === "informal" || tone === "formal") {
    return messages.toneLabels[tone];
  }

  return tone;
}

function localizeCadence(cadence: string, messages: AppVoiceMessages): string {
  if (cadence === "direct" || cadence === "balanced" || cadence === "measured") {
    return messages.cadenceLabels[cadence];
  }

  return cadence;
}

export function getVoiceConfidenceDescription(
  profile: VoiceProfileView,
  messages: AppVoiceMessages
): string {
  const tone = localizeTone(profile.tone, messages);
  const cadence = localizeCadence(profile.cadence, messages);
  const template = messages.confidenceDescriptions[profile.confidence];

  return template.replace("{tone}", tone).replace("{cadence}", cadence);
}

export function getVoiceConfidenceContext(
  confidence: VoiceProfileConfidence,
  messages: AppVoiceMessages
): string {
  if (confidence === "high" || confidence === "medium" || confidence === "low") {
    return messages.confidenceContext[confidence];
  }

  return messages.confidenceContext.none;
}

export function getVoiceConfidenceAdaptationLine(
  mode: VoiceAdaptationMode,
  messages: AppVoiceMessages
): string {
  return messages.confidenceAdaptationLines[mode];
}

export function getVoiceConfidenceDialSubline(
  confidence: VoiceProfileConfidence,
  messages: AppVoiceMessages
): string {
  if (confidence === "high" || confidence === "medium" || confidence === "low") {
    return messages.confidenceDialSubline[confidence];
  }

  return messages.confidenceDialSubline.none;
}

export function getVoiceConfidencePanelMessage(
  profile: VoiceProfileView,
  messages: AppVoiceMessages,
  options: { readonly detailed: boolean }
): string {
  if (options.detailed) {
    return getVoiceConfidenceDescription(profile, messages);
  }

  return getVoiceConfidenceContext(profile.confidence, messages);
}

const diagnosticsReasonPriority = [
  "insufficient_examples",
  "language_conflict",
  "insufficient_diversity"
] as const;

export function getVoiceDiagnosticsText(
  diagnostics: VoiceProfileDiagnosticsView,
  confidence: VoiceProfileConfidence,
  messages: AppVoiceMessages
): string {
  for (const code of diagnosticsReasonPriority) {
    if (diagnostics.reasonCodes.includes(code)) {
      return messages.reasonCodeMessages[code];
    }
  }

  if (confidence === "high" && diagnostics.bestCoveredContentTypes.length > 1) {
    return messages.diagnosticsHealthy.highMultiFormat;
  }

  if (confidence === "high") {
    return messages.diagnosticsHealthy.high;
  }

  return messages.diagnosticsHealthy.default;
}

export function getVoiceAdaptationModeCopy(
  mode: VoiceAdaptationMode,
  messages: AppVoiceMessages
): { readonly label: string; readonly description: string } {
  return {
    label: messages.adaptationModeLabels[mode],
    description: messages.adaptationModeDescriptions[mode]
  };
}

export function getMissingVoiceFormats(
  materialBase: VoiceMaterialBaseBreakdown
): readonly string[] {
  return VOICE_EXAMPLE_FORMATS.filter((format) => (materialBase.byContentType[format] ?? 0) === 0);
}

export function getUnderrepresentedVoiceFormats(
  diagnostics: VoiceProfileDiagnosticsView
): readonly string[] {
  const knownFormats = new Set<string>(VOICE_EXAMPLE_FORMATS);

  return diagnostics.underrepresentedContentTypes
    .map((item) => item.contentType)
    .filter((contentType) => knownFormats.has(contentType));
}

export type VoiceNextStepHref = "/app/generate" | "/app/voice/examples" | "/app/voice/examples/new";

export interface VoiceNextStepView {
  readonly message: string;
  readonly cta: string;
  readonly href: VoiceNextStepHref;
  readonly disabled?: boolean;
}

function voiceNextStepForCode(
  code: NextActionCode,
  messages: AppVoiceMessages
): VoiceNextStepView {
  const message = messages.nextStep.messages[code];
  const cta = messages.nextStep.ctas[code];

  switch (code) {
    case "add_more_examples":
    case "add_examples_from_other_content_types":
    case "retry_batch_commit":
      return { message, cta, href: "/app/voice/examples/new" };
    case "review_conflicting_examples":
    case "remove_pinned_example":
      return { message, cta, href: "/app/voice/examples" };
    case "wait_for_profile_update":
      return { message, cta, href: "/app/generate", disabled: true };
    case "upgrade_plan":
      return {
        message,
        cta: messages.upgradeSoon,
        href: "/app/generate",
        disabled: true
      };
    default: {
      const exhaustive: never = code;
      return exhaustive;
    }
  }
}

export function resolveVoiceNextStep(
  nextActionCodes: readonly NextActionCode[],
  messages: AppVoiceMessages
): VoiceNextStepView {
  const code = nextActionCodes[0];

  if (!code) {
    return {
      message: messages.nextStep.matureMessage,
      cta: messages.nextStep.generateCta,
      href: "/app/generate"
    };
  }

  return voiceNextStepForCode(code, messages);
}

export function resolveVoiceNextStepFromDiagnostics(
  diagnostics: VoiceProfileDiagnosticsView,
  messages: AppVoiceMessages
): VoiceNextStepView {
  if (diagnostics.pendingRebuild.status === "in_progress") {
    return voiceNextStepForCode("wait_for_profile_update", messages);
  }

  return resolveVoiceNextStep(diagnostics.nextActionCodes, messages);
}
