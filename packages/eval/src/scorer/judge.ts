import type { TextQualityVoiceProfile } from "@my-ai-orchestrator/contracts";
import type { JudgeScore } from "../types.js";

export interface JudgeMessage {
  readonly role: "system" | "user";
  readonly content: string;
}

export interface JudgeAdapter {
  readonly provider: string;
  readonly model: string;
  readonly complete: (messages: readonly JudgeMessage[]) => Promise<{ readonly text: string }>;
}

export async function scoreWithJudge(
  text: string,
  voiceProfile: TextQualityVoiceProfile,
  adapter: JudgeAdapter
): Promise<JudgeScore | null> {
  if (!voiceProfile.coreReasoningSignature) {
    return null;
  }

  const core = voiceProfile.coreReasoningSignature;
  const development = voiceProfile.argumentDevelopmentSignature;
  const developmentBlock = development
    ? [
        `Argument development:\n${development.developmentProse}`,
        `Epistemic posture: ${development.epistemicPosture}`,
        `Typical moves: ${development.moveLabels.join(", ")}`
      ].join("\n")
    : undefined;

  const messages: JudgeMessage[] = [
    {
      role: "system",
      content: [
        "You are a voice fidelity judge.",
        "Score the candidate from 0 to 100 for voice fidelity against the author reasoning and development signatures.",
        "Penalize heavily if the candidate exceeds the requested word range or reads like a single-dimension essay.",
        "Respond with JSON only: {\"score\": number, \"rationale\": string}"
      ].join("\n")
    },
    {
      role: "user",
      content: [
        `Author reasoning:\n${core.narrativeProse}`,
        `Certainty: ${core.certaintyLevel}; Judgment: ${core.judgmentFrequency}; Conclusion pace: ${core.conclusionPace}`,
        ...(developmentBlock ? [developmentBlock] : []),
        `Candidate:\n${text.slice(0, 2500)}`
      ].join("\n\n")
    }
  ];

  try {
    const completion = await adapter.complete(messages);
    const parsed = parseJudgeResponse(completion.text);

    if (!parsed) {
      return null;
    }

    return {
      score: parsed.score,
      rationale: parsed.rationale,
      provider: adapter.provider,
      model: adapter.model
    };
  } catch {
    return null;
  }
}

function parseJudgeResponse(content: string): { readonly score: number; readonly rationale: string } | null {
  const trimmed = content.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");

  if (start < 0 || end <= start) {
    return null;
  }

  const jsonText = trimmed.startsWith("{") ? trimmed : trimmed.slice(start, end + 1);

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return null;
  }

  if (
    typeof parsed === "object" &&
    parsed !== null &&
    "score" in parsed &&
    "rationale" in parsed &&
    typeof parsed.score === "number" &&
    typeof parsed.rationale === "string"
  ) {
    return {
      score: Math.max(0, Math.min(100, parsed.score)),
      rationale: parsed.rationale
    };
  }

  return null;
}
