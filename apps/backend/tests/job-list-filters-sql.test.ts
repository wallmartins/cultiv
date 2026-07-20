import { describe, expect, it, vi } from "vitest";
import { DummyDriver, Kysely, PostgresAdapter, PostgresIntrospector, PostgresQueryCompiler } from "kysely";
import { normalizeExecutionsListFilters } from "@my-ai-orchestrator/contracts";
import { applyJobListFilters } from "../src/infra/postgres-repositories/postgres-job-repository.js";
import type { DatabaseTables } from "../src/infra/postgres-tables.js";

// Compila o SQL sem banco. A suíte Postgres real depende de BACKEND_TEST_DATABASE_URL e não roda
// em CI, então é aqui que a paridade com o caminho in-memory fica garantida.
const db = new Kysely<DatabaseTables>({
  dialect: {
    createAdapter: () => new PostgresAdapter(),
    createDriver: () => new DummyDriver(),
    createIntrospector: (instance) => new PostgresIntrospector(instance),
    createQueryCompiler: () => new PostgresQueryCompiler()
  }
});

function compileWith(filters: Parameters<typeof applyJobListFilters>[1]) {
  return applyJobListFilters(db.selectFrom("jobs").selectAll(), filters).compile();
}

describe("applyJobListFilters", () => {
  it("filtra por generationIntent e lengthTier, não só status/contentType/q", () => {
    const compiled = compileWith(
      normalizeExecutionsListFilters({
        status: "failed",
        contentType: "twitter-thread",
        intent: "share-idea",
        lengthTier: "short",
        q: "voz"
      })
    );

    expect(compiled.sql).toContain("data->>'status'");
    expect(compiled.sql).toContain("data->>'contentType'");
    expect(compiled.sql).toContain("data->>'briefingTopic'");
    // os dois que faltavam: a API aceitava o filtro e o SQL ignorava
    expect(compiled.sql).toContain("data->>'generationIntent'");
    expect(compiled.sql).toContain("data->>'lengthTier'");
    expect(compiled.parameters).toContain("share-idea");
    expect(compiled.parameters).toContain("short");
  });

  it("não emite cláusula para eixo ausente", () => {
    const compiled = compileWith(normalizeExecutionsListFilters({ status: "done" }));

    expect(compiled.sql).toContain("data->>'status'");
    expect(compiled.sql).not.toContain("generationIntent");
    expect(compiled.sql).not.toContain("lengthTier");
  });

  it("aplica o corte de período contra o relógio corrente", () => {
    vi.setSystemTime(Date.parse("2026-06-24T12:00:00.000Z"));

    const compiled = compileWith(normalizeExecutionsListFilters({ period: "30d" }));

    expect(compiled.sql).toContain("created_at");
    expect(compiled.parameters).toContain("2026-05-25T12:00:00.000Z");

    vi.useRealTimers();
  });
});
