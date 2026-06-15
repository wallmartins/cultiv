import { franc } from "franc";
import { Effect } from "effect";
import type { LanguageProfile } from "@my-ai-orchestrator/domain";
import { LanguageProfileNotFoundError } from "./errors.js";
import type { LanguageProfileResolutionOptions, RefinementSkillContext } from "./types.js";

const LANGUAGE_PROFILES = new Map<string, LanguageProfile>([
  [
    "pt-BR",
    {
      id: "pt-BR",
      code: "pt-BR",
      name: "Portuguese (Brazil)",
      dictionary: new Set(["conteudo", "refino", "tom", "clareza", "contrato"]),
      patterns: {
        performative: [/como uma ia/i, /sou um modelo/i],
        "freshnessClichés": [/revolucionario/i, /game changer/i],
        markerIsolated: [/\b\w+\b/g],
        validCharRange: /[À-ÿ]/u
      },
      prompts: {
        critic: "Avalie o texto em pt-BR com foco em naturalidade, fidelidade e consistencia.",
        humanizer: "Reescreva o texto em pt-BR com tom humano, preciso e sem excessos.",
        refine: "Aprimore o texto em pt-BR preservando a intencao original e reduzindo ruido."
      },
      defaults: {
        tone: "professional",
        constraints: ["avoid english leakage", "preserve meaning", "keep natural cadence"]
      },
      contracts: {
        forbiddenPatterns: ["as an ai", "i am unable"],
        requiredMarkers: ["clarity", "natural cadence"]
      }
    }
  ],
  [
    "en-US",
    {
      id: "en-US",
      code: "en-US",
      name: "English (United States)",
      dictionary: new Set(["content", "refine", "tone", "clarity", "contract"]),
      patterns: {
        performative: [/as an ai/i, /i cannot/i],
        "freshnessClichés": [/revolutionary/i, /game changer/i],
        markerIsolated: [/\b\w+\b/g],
        validCharRange: /[A-Za-z]/u
      },
      prompts: {
        critic: "Evaluate the text in en-US with focus on naturalness, fidelity and consistency.",
        humanizer: "Rewrite the text in en-US with a human tone, precision and no excess.",
        refine: "Improve the text in en-US while preserving intent and reducing noise."
      },
      defaults: {
        tone: "professional",
        constraints: ["avoid portuguese leakage", "preserve meaning", "keep natural cadence"]
      },
      contracts: {
        forbiddenPatterns: ["as an ai", "i am unable"],
        requiredMarkers: ["clarity", "natural cadence"]
      }
    }
  ]
]);

const CONTENT_TYPE_LANGUAGE: Record<string, string> = {
  "long-form-blog": "pt-BR",
  "validation-post": "pt-BR",
  "architecture-post": "pt-BR",
  "linkedin-post": "pt-BR",
  "twitter-thread": "pt-BR",
  newsletter: "pt-BR"
};

export function registerLanguageProfile(profile: LanguageProfile): void {
  LANGUAGE_PROFILES.set(profile.code, profile);
}

export function getLanguageProfile(code: string): LanguageProfile | undefined {
  return LANGUAGE_PROFILES.get(code);
}

export function listLanguageProfiles(): string[] {
  return Array.from(LANGUAGE_PROFILES.keys());
}

export function detectLanguageCode(sample: string): string | undefined {
  const iso = franc(sample, { minLength: 10 });
  if (iso === "und") return undefined;
  if (iso === "por") return "pt-BR";
  if (iso === "eng") return "en-US";
  return undefined;
}

export function resolveLanguageProfile(
  options: LanguageProfileResolutionOptions = {}
): Effect.Effect<LanguageProfile, LanguageProfileNotFoundError> {
  const fallbackCode = options.defaultCode ?? "pt-BR";
  const explicit = options.explicit ? LANGUAGE_PROFILES.get(options.explicit) : undefined;
  if (explicit) return Effect.succeed(explicit);

  const contentTypeCode = options.contentType ? CONTENT_TYPE_LANGUAGE[options.contentType] : undefined;
  if (contentTypeCode) {
    const profile = LANGUAGE_PROFILES.get(contentTypeCode);
    if (profile) return Effect.succeed(profile);
  }

  const detectedCode = options.sample ? detectLanguageCode(options.sample) : undefined;
  if (detectedCode) {
    const profile = LANGUAGE_PROFILES.get(detectedCode);
    if (profile) return Effect.succeed(profile);
  }

  const fallback = LANGUAGE_PROFILES.get(fallbackCode);
  if (!fallback) {
    return Effect.fail(new LanguageProfileNotFoundError({ code: fallbackCode }));
  }

  return Effect.succeed(fallback);
}

export function buildRefinementSkillContext(
  options: LanguageProfileResolutionOptions & {
    readonly mode?: "critic" | "humanizer" | "refine";
    readonly previousScore?: number;
    readonly focusDimensions?: readonly string[];
    readonly userVoiceProfile?: unknown;
    readonly voiceExamples?: readonly unknown[];
    readonly contractValidation?: unknown;
    readonly contractViolations?: readonly unknown[];
    readonly voiceTone?: string;
  } = {}
): Effect.Effect<RefinementSkillContext, LanguageProfileNotFoundError> {
  return Effect.map(resolveLanguageProfile(options), (profile) => {
    const mode = options.mode ?? "refine";
    const prompt =
      profile.prompts[mode] ??
      profile.prompts.refine ??
      "Refine the text with clarity and precision.";

    return {
      profile,
      languageCode: profile.code,
      languageName: profile.name,
      tone: options.voiceTone ?? profile.defaults.tone,
      constraints: profile.defaults.constraints,
      forbiddenPatterns: profile.contracts.forbiddenPatterns,
      requiredMarkers: profile.contracts.requiredMarkers,
      mode,
      previousScore: options.previousScore,
      focusDimensions: options.focusDimensions ?? [],
      userVoiceProfile: options.userVoiceProfile,
      voiceExamples: options.voiceExamples,
      contractValidation: options.contractValidation,
      contractViolations: options.contractViolations,
      retryInstruction: prompt
    };
  });
}
