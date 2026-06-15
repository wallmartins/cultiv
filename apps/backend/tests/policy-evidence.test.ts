import { Effect } from "effect";
import { describe, expect, it } from "vitest";
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

describe("Policy evidence persistence and operational read model", () => {
  it("emits input policy evidence for approved generation input", () => {
    const services = Effect.runSync(
      createBackendProductServices(config, {
        now: () => new Date("2026-05-14T00:00:00.000Z")
      })
    );

    Effect.runSync(
      services.inputSafety.authorizeGenerationInput({
        userId: "user_evidence_1",
        contentType: "twitter-thread",
        briefing: "Teste de evidence de input safety",
        language: "pt-BR",
        qualityMode: "balanced"
      })
    );

    const evidence = Effect.runSync(
      services.policyEvidence.listOperationalEvidence({
        boundary: "input",
        actorId: "system"
      })
    );

    expect(evidence.length).toBeGreaterThan(0);
    const inputEvidence = evidence.find((e) => e.boundary === "input");
    expect(inputEvidence).toBeDefined();
    expect(inputEvidence?.outcome).toBe("approve");
    expect(inputEvidence?.actorType).toBe("system");
  });

  it("emits output policy evidence for allowed output", () => {
    const services = Effect.runSync(
      createBackendProductServices(config, {
        now: () => new Date("2026-05-14T00:00:00.000Z")
      })
    );

    Effect.runSync(
      services.outputSafety.evaluateOutput("Texto de teste simples sem problemas.", {
        contentType: "twitter-thread"
      })
    );

    const evidence = Effect.runSync(
      services.policyEvidence.listOperationalEvidence({
        boundary: "output",
        actorId: "system"
      })
    );

    expect(evidence.length).toBeGreaterThan(0);
    const outputEvidence = evidence.find((e) => e.boundary === "output");
    expect(outputEvidence).toBeDefined();
    expect(outputEvidence?.outcome).toBe("approve");
  });

  it("emits consent policy evidence on grant and revoke", () => {
    const services = Effect.runSync(
      createBackendProductServices(config, {
        now: () => new Date("2026-05-14T00:00:00.000Z")
      })
    );

    Effect.runSync(services.voiceConsent.grantConsent("user_evidence_2"));
    Effect.runSync(services.voiceConsent.revokeConsent("user_evidence_2"));

    const evidence = Effect.runSync(
      services.policyEvidence.listOperationalEvidence({
        boundary: "consent",
        actorId: "user_evidence_2"
      })
    );

    expect(evidence.length).toBeGreaterThanOrEqual(2);
    const grantEvidence = evidence.find((e) => e.outcome === "granted");
    const revokeEvidence = evidence.find((e) => e.outcome === "revoked");
    expect(grantEvidence).toBeDefined();
    expect(revokeEvidence).toBeDefined();
    expect(grantEvidence?.boundary).toBe("consent");
    expect(revokeEvidence?.boundary).toBe("consent");
  });

  it("emits consent policy evidence for blocked assertion paths", () => {
    const services = Effect.runSync(
      createBackendProductServices(config, {
        now: () => new Date("2026-05-14T00:00:00.000Z")
      })
    );

    const blocked = Effect.runSync(
      Effect.either(services.voiceConsent.assertConsent("user_evidence_assert_1"))
    );
    expect(blocked._tag).toBe("Left");

    const evidence = Effect.runSync(
      services.policyEvidence.listOperationalEvidence({
        boundary: "consent",
        actorId: "user_evidence_assert_1"
      })
    );

    const assertEvidence = evidence.find((entry) => entry.outcome === "block");
    expect(assertEvidence).toBeDefined();
    expect(assertEvidence?.boundary).toBe("consent");
    expect(assertEvidence?.rationaleCategory).toBe("consent_assert");
    expect(assertEvidence?.summary).toBe("consent assert recorded with outcome block");
  });

  it("filters operational evidence by boundary and outcome", () => {
    const services = Effect.runSync(
      createBackendProductServices(config, {
        now: () => new Date("2026-05-14T00:00:00.000Z")
      })
    );

    Effect.runSync(services.voiceConsent.grantConsent("user_evidence_3"));

    const allEvidence = Effect.runSync(
      services.policyEvidence.listOperationalEvidence({})
    );
    expect(allEvidence.length).toBeGreaterThanOrEqual(1);

    const filtered = Effect.runSync(
      services.policyEvidence.listOperationalEvidence({
        boundary: "consent",
        outcome: "granted"
      })
    );
    expect(filtered.length).toBeGreaterThanOrEqual(1);
    expect(filtered.every((e) => e.boundary === "consent" && e.outcome === "granted")).toBe(true);
  });

  it("returns empty list when no evidence matches filter", () => {
    const services = Effect.runSync(
      createBackendProductServices(config, {
        now: () => new Date("2026-05-14T00:00:00.000Z")
      })
    );

    const evidence = Effect.runSync(
      services.policyEvidence.listOperationalEvidence({
        boundary: "scope",
        since: "2099-01-01T00:00:00.000Z"
      })
    );

    expect(evidence).toHaveLength(0);
  });
});
