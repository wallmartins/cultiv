import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import {
  createDatabase,
  toPracticeProfileDiagnosticsDomain,
  toPracticeProfileDiagnosticsRecord,
  toPracticeProfileDomain,
  toPracticeProfileRecord
} from "../../packages/database/src/index.js";

const baseDimensions = {
  point: "Achado",
  evidence: "Dado de cliente de amostra pequena",
  readerAssumption: "Conhece a pressão regulatória mas não o dado técnico",
  resistance: "Pushback do chefe sobre custo",
  stake: "Decisão de orçamento a tomar agora",
  fieldCliche: "Levamos sustentabilidade a sério",
  lexicon: ["MRV", "offset"]
};

describe("database practice profile aggregate", () => {
  it("maps practice profile domain records to persistent records and back", () => {
    const profileRecord = toPracticeProfileRecord({
      id: "practice-profile:user_1",
      userId: "user_1",
      version: 2,
      depth: "seed",
      subject: "Infraestrutura de dados para climate-tech",
      vantagePoint: "Engenheira founding em startup early-stage",
      audiences: ["liderança técnica"],
      dimensions: baseDimensions,
      createdAt: "2026-07-21T00:00:00.000Z",
      updatedAt: "2026-07-21T00:00:00.000Z"
    });
    const diagnosticsRecord = toPracticeProfileDiagnosticsRecord({
      id: "practice-diagnostics:user_1",
      userId: "user_1",
      activeVersion: 2,
      updating: false,
      createdAt: "2026-07-21T00:00:00.000Z",
      updatedAt: "2026-07-21T00:00:00.000Z"
    });

    expect(profileRecord.version).toBe(1);
    expect(profileRecord.profileVersion).toBe(2);
    expect(toPracticeProfileDomain(profileRecord).subject).toBe("Infraestrutura de dados para climate-tech");
    expect(diagnosticsRecord.version).toBe(1);
    expect(toPracticeProfileDiagnosticsDomain(diagnosticsRecord).activeVersion).toBe(2);
  });

  it("upserts practice profiles by user, replacing the whole record on rebuild", () => {
    const database = createDatabase();

    Effect.runSync(database.practiceProfiles.put({
      id: "practice-profile:user_1",
      userId: "user_1",
      version: 1,
      depth: "seed",
      subject: "Infraestrutura de dados para climate-tech",
      vantagePoint: "Engenheira founding em startup early-stage",
      audiences: ["liderança técnica"],
      dimensions: baseDimensions,
      createdAt: "2026-07-21T00:00:00.000Z",
      updatedAt: "2026-07-21T00:00:00.000Z"
    }));

    // rebuild substitui inteiro — a second put for the same user replaces the record,
    // it does not merge fields.
    const enriched = Effect.runSync(database.practiceProfiles.put({
      id: "practice-profile:user_1",
      userId: "user_1",
      version: 2,
      depth: "enriched",
      subject: "Infraestrutura de dados para climate-tech",
      vantagePoint: "Engenheira founding em startup early-stage",
      audiences: ["liderança técnica", "investidores"],
      dimensions: { ...baseDimensions, lexicon: ["MRV", "offset", "escopo 3"] },
      createdAt: "2026-07-21T00:00:00.000Z",
      updatedAt: "2026-07-21T00:10:00.000Z"
    }));

    const stored = Effect.runSync(database.practiceProfiles.getByUser("user_1"));

    expect(enriched.profileVersion).toBe(2);
    expect(stored?.depth).toBe("enriched");
    expect(stored?.audiences).toEqual(["liderança técnica", "investidores"]);
    expect(stored?.dimensions.lexicon).toEqual(["MRV", "offset", "escopo 3"]);
  });

  it("persists and removes practice profile diagnostics with enrichment suggestions", () => {
    const database = createDatabase();

    const diagnostics = Effect.runSync(database.practiceProfileDiagnostics.put({
      id: "practice-diagnostics:user_1",
      userId: "user_1",
      activeVersion: 1,
      pendingVersion: 2,
      updating: true,
      summary: "Enriquecimento em progresso.",
      enrichmentSuggestions: {
        lexicon: { response: "accepted", recordedAt: "2026-07-21T00:00:00.000Z" }
      },
      createdAt: "2026-07-21T00:00:00.000Z",
      updatedAt: "2026-07-21T00:00:00.000Z"
    }));

    expect(diagnostics.pendingVersion).toBe(2);
    expect(Effect.runSync(database.practiceProfileDiagnostics.getByUser("user_1"))?.enrichmentSuggestions?.lexicon?.response).toBe(
      "accepted"
    );

    const removed = Effect.runSync(database.practiceProfileDiagnostics.removeByUser("user_1"));
    expect(removed).toBe(true);
    expect(Effect.runSync(database.practiceProfileDiagnostics.getByUser("user_1"))).toBeUndefined();
  });
});
