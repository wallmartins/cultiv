import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Effect } from "effect";
import { toPracticeProfileDomain } from "@my-ai-orchestrator/database";
import type { PracticeProfile as DomainPracticeProfile } from "@my-ai-orchestrator/domain";
import { createPostgresPracticeProfileRepository } from "../src/infra/postgres-repositories/postgres-practice-profile-repository.js";
import { createPostgresPracticeProfileDiagnosticsRepository } from "../src/infra/postgres-repositories/postgres-practice-profile-diagnostics-repository.js";
import {
  backendTestDatabaseUrl,
  closePostgresTestDatabase,
  openPostgresTestDatabase,
  shouldRunPostgresIntegrationTests,
  type PostgresTestContext
} from "./postgres-test-helpers.js";

const describeIfPostgres = backendTestDatabaseUrl && (await shouldRunPostgresIntegrationTests())
  ? describe
  : describe.skip;

function profile(userId: string, overrides: Partial<DomainPracticeProfile> = {}): DomainPracticeProfile {
  return {
    id: `practice-profile:${userId}`,
    userId,
    version: 1,
    depth: "seed",
    subject: "plataformas de containers",
    vantagePoint: "engenheiro de plataforma numa startup de 5 pessoas",
    audiences: ["engenheiros backend"],
    dimensions: {
      point: "Se operar Kubernetes vale o custo para um time de 5.",
      evidence: "Um upgrade de EKS que derrubou o ingress por 40 minutos.",
      readerAssumption: "Já shippa imagens Docker no CI; nunca operou um control plane.",
      resistance: "Plataformas gerenciadas como Fly.io removem a maior parte da dor.",
      stake: "Errar a plataforma agora custa 18 meses de dívida de migração.",
      fieldCliche: "reescreve em Rust",
      lexicon: ["control plane", "ingress", "reconciliation loop"]
    },
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
    ...overrides
  };
}

describeIfPostgres("PostgreSQL Practice Profile Repositories", () => {
  let context: PostgresTestContext;

  beforeAll(async () => {
    context = await openPostgresTestDatabase();
  });

  afterAll(async () => {
    await closePostgresTestDatabase(context);
  });

  beforeEach(async () => {
    await context.db.deleteFrom("practice_profiles").execute();
    await context.db.deleteFrom("practice_profile_diagnostics").execute();
  });

  it("round-trips a practice profile, preserving dimensions and profile version", async () => {
    const repo = createPostgresPracticeProfileRepository(context.db);
    await Effect.runPromise(repo.put(profile("user-1"), 1));

    const record = await Effect.runPromise(repo.getByUser("user-1"));
    expect(record).toBeDefined();
    const domain = toPracticeProfileDomain(record!);
    expect(domain.version).toBe(1);
    expect(domain.depth).toBe("seed");
    expect(domain.dimensions.lexicon).toEqual(["control plane", "ingress", "reconciliation loop"]);
    expect(domain.dimensions.resistance).toContain("Fly.io");
  });

  it("upserts on user_id — a second put replaces the single row (enrichment overwrite)", async () => {
    const repo = createPostgresPracticeProfileRepository(context.db);
    await Effect.runPromise(repo.put(profile("user-2"), 1));
    await Effect.runPromise(
      repo.put(profile("user-2", { version: 2, depth: "enriched", updatedAt: "2026-07-05T00:00:00.000Z" }), 2)
    );

    const rows = await context.db.selectFrom("practice_profiles").selectAll().execute();
    expect(rows).toHaveLength(1);

    const record = await Effect.runPromise(repo.getByUser("user-2"));
    const domain = toPracticeProfileDomain(record!);
    expect(domain.depth).toBe("enriched");
    expect(domain.version).toBe(2);
  });

  it("removes by user and reports whether a row existed", async () => {
    const repo = createPostgresPracticeProfileRepository(context.db);
    await Effect.runPromise(repo.put(profile("user-3"), 1));

    expect(await Effect.runPromise(repo.removeByUser("user-3"))).toBe(true);
    expect(await Effect.runPromise(repo.removeByUser("user-3"))).toBe(false);
    expect(await Effect.runPromise(repo.getByUser("user-3"))).toBeUndefined();
  });

  it("round-trips diagnostics, including the pending niche-ask dimensions (G5)", async () => {
    const repo = createPostgresPracticeProfileDiagnosticsRepository(context.db);
    await Effect.runPromise(
      repo.put(
        {
          id: "practice-profile-diagnostics:user-4",
          userId: "user-4",
          activeVersion: 2,
          updating: false,
          pendingNicheAskDimensions: ["lexicon", "readerAssumption"],
          createdAt: "2026-07-05T00:00:00.000Z",
          updatedAt: "2026-07-05T00:00:00.000Z"
        },
        2
      )
    );

    const record = await Effect.runPromise(repo.getByUser("user-4"));
    expect(record?.activeVersion).toBe(2);
    expect(record?.pendingNicheAskDimensions).toEqual(["lexicon", "readerAssumption"]);
  });
});
