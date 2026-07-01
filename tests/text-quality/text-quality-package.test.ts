import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import {
  countWords,
  createTextQualityLiveLayer,
  humanizeText,
  resolveVoiceProfile,
  resolveOutputWordTarget,
  refineText,
  selectBestCandidate,
  TextQualityService,
  type CandidateText,
  type QualityLane,
  type VoiceProfile
} from "../../packages/text-quality/src/index.js";

describe("text-quality package", () => {
  it("runs concurrent lanes with explicit voice resolution and stage progress", async () => {
    const progressStages: string[] = [];
    const lanes: readonly QualityLane[] = [
      {
        laneId: "conservative",
        adapter: "openai",
        model: "gpt-4o-mini",
        temperature: 0.2,
        strategy: "conservative",
        generate: () => Effect.succeed("Eu testei isso na prática. O resultado ficou claro, direto e sem pose.")
      },
      {
        laneId: "generic",
        adapter: "openai",
        model: "gpt-4o-mini",
        temperature: 0.8,
        strategy: "creative",
        generate: () => Effect.succeed("Como uma IA, não é clareza, é eficiência. O problema: parecer genérico.")
      }
    ];

    const program = Effect.gen(function* () {
      const service = yield* TextQualityService;

      return yield* service.run({
        request: {
          pipeline: {
            name: "validation-post",
            steps: [{ name: "draft", skill: "draft" }]
          },
          inputs: {
            briefing: "Crie um texto direto, humano e consistente com minha voz",
            userVoiceProfile: {
              tone: "personal",
              styleMarkers: ["eu", "na prática", "direto"],
              rules: ["Prefer first-person observations", "Avoid generic section headings"]
            },
            voiceExamples: [
              "Eu prefiro escrever como quem está pensando em voz alta, mas sem perder precisão."
            ],
            antiPatternExamples: ["não é x, é y", "o problema", "a solução"]
          }
        },
        userId: "user-123",
        briefing: "Crie um texto direto, humano e consistente com minha voz",
        voiceHints: {
          tone: "personal",
          styleMarkers: ["eu", "na prática", "direto"],
          rules: ["Prefer first-person observations", "Avoid generic section headings"],
          antiPatterns: ["não é x, é y", "o problema", "a solução"]
        },
        lanes,
        now: () => new Date("2026-05-13T10:00:00.000Z"),
        onLaneProgress: (progress) =>
          Effect.sync(() => {
            progressStages.push(`${progress.laneId}:${progress.stage}`);
          })
      });
    }).pipe(Effect.provide(createTextQualityLiveLayer()));

    const result = await Effect.runPromise(program);

    expect(result.candidates).toHaveLength(2);
    expect(result.output.length).toBeGreaterThan(0);
    expect(result.bestCandidate.laneId).toBe("conservative");
    expect(result.voiceProfile.userId).toBe("user-123");
    expect(result.voiceProfile.tone).toBe("personal");
    expect(result.voiceProfile.styleMarkers).toContain("na prática");
    expect(result.candidates[1]?.critic.findings.some((finding) => finding.type === "llmish")).toBe(true);
    expect(progressStages).toHaveLength(14);
    expect(progressStages).toEqual(expect.arrayContaining([
      "conservative:draft",
      "conservative:critic",
      "conservative:fidelity",
      "conservative:drift",
      "conservative:humanize",
      "conservative:refine",
      "conservative:score",
      "generic:draft",
      "generic:critic",
      "generic:fidelity",
      "generic:drift",
      "generic:humanize",
      "generic:refine",
      "generic:score"
    ]));
  });

  it("strips meta framing from humanized and refined output", () => {
    const voiceProfile: VoiceProfile = {
      userId: "user-123",
      description: "Direct writing",
      tone: "concise",
      cadence: "tight",
      antiPatterns: ["generic linkedin tone"],
      antiPatternsExplicit: [],
      styleMarkers: ["short paragraphs"],
      rules: ["Apply minimal rewrites when removing LLM tics"],
      constraints: ["keep short, direct sentences"],
      lexicon: [],
      userLabels: []
    };

    const humanized = humanizeText(
      "Eu vejo assim: aqui está uma versão refinada, mantendo o rigor técnico. *** O texto final começa aqui.",
      voiceProfile
    );
    const refined = refineText(
      "Aqui está uma versão revisada: mantendo a naturalidade para o LinkedIn: O texto final começa aqui.",
      voiceProfile
    );

    expect(humanized).toBe("O texto final começa aqui.");
    expect(refined).toBe("O texto final começa aqui.");
  });

  it("prefers publishable output over meta commentary even when scores are close", async () => {
    const candidate = (overrides: Partial<CandidateText>): CandidateText => ({
      laneId: "lane",
      draft: "draft",
      humanizedDraft: "humanized",
      refinedDraft: "Texto final publicável.",
      critic: { findings: [], score: 90 },
      fidelity: { passed: true, score: 90, notes: [] },
      drift: { score: 90, notes: [] },
      score: {
        criticScore: 90,
        fidelityScore: 90,
        driftScore: 90,
        strategyBonus: 0,
        finalScore: 90
      },
      ...overrides
    });

    const selected = await Effect.runPromise(
      selectBestCandidate(
        [
          candidate({
            laneId: "meta",
            refinedDraft:
              "Aqui está uma versão refinada, mantendo o rigor técnico e a naturalidade para o LinkedIn: Texto final publicável.",
            score: {
              criticScore: 96,
              fidelityScore: 96,
              driftScore: 96,
              strategyBonus: 0,
              finalScore: 96
            }
          }),
          candidate({
            laneId: "clean",
            refinedDraft: "Texto final publicável.",
            score: {
              criticScore: 90,
              fidelityScore: 90,
              driftScore: 90,
              strategyBonus: 0,
              finalScore: 90
            }
          })
        ],
        {
          request: {
            pipeline: {
              name: "linkedin-post",
              steps: [{ name: "draft", skill: "draft" }]
            },
            inputs: {
              briefing: "Escreva um post de LinkedIn direto"
            }
          },
          briefing: "Escreva um post de LinkedIn direto",
            voiceProfile: {
            userId: "user-123",
            description: "Direct writing",
            tone: "concise",
            cadence: "tight",
      antiPatterns: [],
            antiPatternsExplicit: [],
            styleMarkers: [],
            rules: [],
            constraints: [],
            lexicon: [],
            userLabels: []
          }
        }
      )
    );

    expect(selected.laneId).toBe("clean");
  });

  it("prefers candidates that match target word count for long-form formats", async () => {
    const shortLinkedIn = repeatWords("clareza", 140);
    const longLinkedIn = repeatWords("clareza", 930);

    const candidate = (laneId: string, refinedDraft: string, finalScore: number): CandidateText => ({
      laneId,
      draft: refinedDraft,
      humanizedDraft: refinedDraft,
      refinedDraft,
      critic: { findings: [], score: 90 },
      fidelity: { passed: true, score: 90, notes: [] },
      drift: { score: 90, notes: [] },
      score: {
        criticScore: 90,
        fidelityScore: 90,
        driftScore: 90,
        strategyBonus: 0,
        finalScore
      }
    });

    const request = {
      pipeline: {
        name: "linkedin-post",
        steps: [{ name: "draft", skill: "draft" }]
      },
      inputs: {
        briefing: "Escreva um post aprofundado para LinkedIn"
      }
    };

    const selected = await Effect.runPromise(
      selectBestCandidate(
        [
          candidate("short", shortLinkedIn, 96),
          candidate("long", longLinkedIn, 90)
        ],
        {
          request,
          briefing: "Escreva um post aprofundado para LinkedIn",
            voiceProfile: {
            userId: "user-123",
            description: "Direct writing",
            tone: "concise",
            cadence: "tight",
      antiPatterns: [],
            antiPatternsExplicit: [],
            styleMarkers: [],
            rules: [],
            constraints: [],
            lexicon: [],
            userLabels: []
          }
        }
      )
    );

    const target = resolveOutputWordTarget(request);

    expect(selected.laneId).toBe("short");
    expect(countWords(shortLinkedIn)).toBeGreaterThanOrEqual(target.minWords);
    expect(countWords(shortLinkedIn)).toBeLessThanOrEqual(target.maxWords);
    expect(countWords(longLinkedIn)).toBeGreaterThan(target.maxWords);
  });

  it("passes through voice hints without re-inferring", async () => {
    const linkedinProfile = await Effect.runPromise(
      resolveVoiceProfile({
        userId: "user-1",
        briefing: "Quero um texto pessoal, humano, direto, com vivências e benefícios surgindo da experiência.",
        request: {
          pipeline: {
            name: "linkedin-post",
            steps: [{ name: "draft", skill: "draft" }]
          },
          inputs: {
            briefing: "Quero um texto pessoal, humano, direto, com vivências e benefícios surgindo da experiência."
          }
        },
        voiceHints: {
          tone: "personal",
          cadence: "direct",
          rules: ["Prefer first-person perspective where natural", "Integrate benefits into the narrative instead of listing them"]
        }
      })
    );

    const architectureProfile = await Effect.runPromise(
      resolveVoiceProfile({
        userId: "user-2",
        briefing: "Texto de arquitetura com vivências reais, consequências e descobertas ao longo da implementação.",
        request: {
          pipeline: {
            name: "architecture-post",
            steps: [{ name: "draft", skill: "draft" }]
          },
          inputs: {
            briefing: "Texto de arquitetura com vivências reais, consequências e descobertas ao longo da implementação."
          }
        },
        voiceHints: {
          tone: "personal",
          cadence: "measured",
          rules: ["Derive consequences from lived examples"]
        }
      })
    );

    expect(linkedinProfile.tone).toBe("personal");
    expect(linkedinProfile.cadence).toBe("direct");
    expect(linkedinProfile.rules).toContain("Prefer first-person perspective where natural");
    expect(linkedinProfile.rules).toContain("Integrate benefits into the narrative instead of listing them");
    expect(architectureProfile.tone).toBe("personal");
    expect(architectureProfile.cadence).toBe("measured");
    expect(architectureProfile.rules).toContain("Derive consequences from lived examples");
  });

  it("preserves coreReasoningSignature from voice hints", async () => {
    const coreReasoningSignature = {
      narrativeProse: "Observa antes de concluir.",
      certaintyLevel: "moderate" as const,
      judgmentFrequency: "low" as const,
      conclusionPace: "slow" as const,
      readerRelationship: "peer" as const,
      authoritySource: "personal_observation" as const,
      derivedAntiPatterns: ["generic advice"]
    };

    const profile = await Effect.runPromise(
      resolveVoiceProfile({
        userId: "user-1",
        briefing: "Briefing",
        request: {
          pipeline: {
            name: "linkedin-post",
            steps: [{ name: "draft", skill: "draft" }]
          },
          inputs: { briefing: "Briefing" }
        },
        voiceHints: {
          tone: "personal",
          cadence: "direct",
          coreReasoningSignature,
          derivedAntiPatterns: ["generic advice"]
        }
      })
    );

    expect(profile.coreReasoningSignature).toEqual(coreReasoningSignature);
    expect(profile.derivedAntiPatterns).toEqual(["generic advice"]);
  });

  it("preserves argumentDevelopmentSignature from voice hints", async () => {
    const argumentDevelopmentSignature = {
      developmentProse: "Abre pela experiência vivida e tolera dúvida antes de concluir.",
      moveLabels: ["experiencia_vivida", "duvida"],
      transitionTendencies: [{ from: "experiencia_vivida", to: "duvida", frequency: "common" as const }],
      epistemicPosture: "exploratory" as const,
      structuralAntiPatterns: ["tese_prematura"]
    };

    const profile = await Effect.runPromise(
      resolveVoiceProfile({
        userId: "user-1",
        briefing: "Briefing",
        request: {
          pipeline: {
            name: "linkedin-post",
            steps: [{ name: "draft", skill: "draft" }]
          },
          inputs: { briefing: "Briefing" }
        },
        voiceHints: {
          tone: "personal",
          cadence: "direct",
          argumentDevelopmentSignature
        }
      })
    );

    expect(profile.argumentDevelopmentSignature).toEqual(argumentDevelopmentSignature);
  });
});

function repeatWords(word: string, count: number): string {
  return Array.from({ length: count }, () => word).join(" ");
}
