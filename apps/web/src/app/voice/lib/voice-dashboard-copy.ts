import type {
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
