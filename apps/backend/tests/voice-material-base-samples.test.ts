import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import type { VoiceExample } from "@my-ai-orchestrator/domain";
import type { DatabaseClient } from "@my-ai-orchestrator/database";
import { createBackendProductServices } from "../src/product/core/services.js";
import type { BackendConfig } from "../src/config/config.js";

const config: BackendConfig = {
  environment: "test",
  executionMode: "sync",
  qualityMode: "balanced",
  defaultLanguage: "pt-BR",
  serviceName: "backend",
  host: "127.0.0.1",
  port: 3000,
  version: "0.1.0",
  billingPlanId: "pro",
  billingUserId: "backend"
};

function buildExample(overrides: Partial<VoiceExample> & { readonly id: string; readonly userId: string }): VoiceExample {
  return {
    text: "Texto de exemplo com conteúdo suficiente para os filtros de voz.",
    language: "pt-BR",
    state: "active",
    classificationLabels: [],
    antiPatternsExplicit: [],
    pinned: false,
    pendingProfileImpact: false,
    effectiveContentTypeHints: [],
    evaluation: {
      systemWeight: 0.6,
      attentionLevel: "low",
      attentionReasonCodes: [],
      contributionCode: "reinforces_informal_tone",
      contributionPreview: "",
      userPinned: false
    },
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides
  };
}

const LONG_PINNED_TEXT =
  "Eu escrevo pensando em quem vai ler antes de pensar em quem eu quero parecer ser, e isso muda " +
  "completamente o que vale a pena dizer e o que é só ruído decorativo que ninguém realmente pediu ouvir.";

function seedProfileAndDiagnostics(database: DatabaseClient, userId: string): void {
  Effect.runSync(
    database.voiceProfiles.put({
      id: `voice-profile:${userId}`,
      userId,
      version: 1,
      snapshotId: "snapshot_1",
      confidence: "medium",
      adaptationMode: "standard",
      primaryLanguage: "pt-BR",
      tone: "professional",
      cadence: "balanced",
      lexicon: [],
      constraints: [],
      styleMarkers: [],
      rules: [],
      antiPatterns: [],
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z"
    })
  );

  Effect.runSync(
    database.voiceProfileDiagnostics.put({
      id: `voice-diagnostics:${userId}`,
      userId,
      activeVersion: 1,
      updating: false,
      reasonCodes: [],
      nextActionCodes: [],
      bestCoveredContentTypes: [],
      underrepresentedContentTypes: [],
      pendingRebuild: { status: "idle", nextActionCodes: [] },
      materialBase: {
        totalExamples: 0,
        activeExamples: 0,
        excludedExamples: 0,
        pinnedExamples: 0,
        byClassification: {},
        byContentType: {},
        byLanguage: {}
      },
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z"
    })
  );
}

function buildServices() {
  return Effect.runSync(
    createBackendProductServices(config, { now: () => new Date("2026-03-20T00:00:00.000Z") })
  );
}

describe("getProfileScreen — material-base sample quotes (GAP #13)", () => {
  it("returns up to 4 real calibration quotes, pinned-first then most-recent, truncated + labeled", () => {
    const services = buildServices();
    const userId = "user_samples_1";

    Effect.runSync(services.voiceConsent.grantConsent(userId));
    seedProfileAndDiagnostics(services.database, userId);

    Effect.runSync(
      services.database.voiceExamples.create(
        buildExample({
          id: `voice-example:${userId}:1`,
          userId,
          text: LONG_PINNED_TEXT,
          pinned: true,
          channel: "linkedin",
          explicitContentType: "linkedin-post",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z"
        })
      )
    );
    Effect.runSync(
      services.database.voiceExamples.create(
        buildExample({
          id: `voice-example:${userId}:2`,
          userId,
          text: "Sample mais recente entre os não fixados.",
          channel: "newsletter",
          createdAt: "2026-03-10T00:00:00.000Z",
          updatedAt: "2026-03-10T00:00:00.000Z"
        })
      )
    );
    Effect.runSync(
      services.database.voiceExamples.create(
        buildExample({
          id: `voice-example:${userId}:3`,
          userId,
          text: "Sample intermediário entre os não fixados.",
          explicitContentType: "long-form-blog",
          createdAt: "2026-02-15T00:00:00.000Z",
          updatedAt: "2026-02-15T00:00:00.000Z"
        })
      )
    );
    Effect.runSync(
      services.database.voiceExamples.create(
        buildExample({
          id: `voice-example:${userId}:4`,
          userId,
          text: "Sample mais antigo entre os não fixados, sem canal nem tipo explícito.",
          createdAt: "2026-01-20T00:00:00.000Z",
          updatedAt: "2026-01-20T00:00:00.000Z"
        })
      )
    );
    // Most recent of all, but excluded — must never surface as a sample.
    Effect.runSync(
      services.database.voiceExamples.create(
        buildExample({
          id: `voice-example:${userId}:5`,
          userId,
          text: "Sample excluído, o mais recente de todos.",
          state: "excluded",
          createdAt: "2026-03-19T00:00:00.000Z",
          updatedAt: "2026-03-19T00:00:00.000Z"
        })
      )
    );

    const screen = Effect.runSync(services.voice.getProfileScreen(userId));
    expect(screen).toBeDefined();

    const samples = screen!.materialBase.samples;
    expect(samples).toBeDefined();
    expect(samples).toHaveLength(4);

    // Pinned example wins first slot despite being the oldest.
    expect(samples![0].meta).toBe("LinkedIn · 1 jan");
    expect(samples![0].q.endsWith("…")).toBe(true);
    expect(samples![0].q.length).toBeLessThan(LONG_PINNED_TEXT.length);
    expect(LONG_PINNED_TEXT.startsWith(samples![0].q.replace(/…$/, ""))).toBe(true);

    // Remaining slots are most-recent-first among the unpinned active examples.
    expect(samples![1].meta).toBe("Newsletter · 10 mar");
    expect(samples![1].q).toBe("Sample mais recente entre os não fixados.");
    expect(samples![2].meta).toBe("Blog longo · 15 fev");
    expect(samples![3].meta).toBe("Geral · 20 jan");

    // Never leaks the raw enum/id into the display string.
    for (const sample of samples!) {
      expect(sample.meta).not.toContain("linkedin-post");
      expect(sample.meta).not.toContain("long-form-blog");
    }
  });

  it("omits the excluded example's text and returns fewer than 4 samples when fewer than 4 are active", () => {
    const services = buildServices();
    const userId = "user_samples_2";

    Effect.runSync(services.voiceConsent.grantConsent(userId));
    seedProfileAndDiagnostics(services.database, userId);

    Effect.runSync(
      services.database.voiceExamples.create(
        buildExample({
          id: `voice-example:${userId}:1`,
          userId,
          text: "Único exemplo ativo do usuário.",
          createdAt: "2026-02-01T00:00:00.000Z",
          updatedAt: "2026-02-01T00:00:00.000Z"
        })
      )
    );
    Effect.runSync(
      services.database.voiceExamples.create(
        buildExample({
          id: `voice-example:${userId}:2`,
          userId,
          text: "Este exemplo foi excluído e não deve aparecer.",
          state: "excluded",
          createdAt: "2026-02-05T00:00:00.000Z",
          updatedAt: "2026-02-05T00:00:00.000Z"
        })
      )
    );

    const screen = Effect.runSync(services.voice.getProfileScreen(userId));
    const samples = screen!.materialBase.samples;

    expect(samples).toHaveLength(1);
    expect(samples![0].q).toBe("Único exemplo ativo do usuário.");

    const allText = JSON.stringify(samples);
    expect(allText).not.toContain("excluído");
  });

  it("returns an empty samples array (not undefined, no throw) when there are no examples yet", () => {
    const services = buildServices();
    const userId = "user_samples_3";

    Effect.runSync(services.voiceConsent.grantConsent(userId));
    seedProfileAndDiagnostics(services.database, userId);

    const screen = Effect.runSync(services.voice.getProfileScreen(userId));

    expect(screen).toBeDefined();
    expect(screen!.materialBase.samples).toEqual([]);
  });
});
