import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import { createPolicyEvidenceHarness } from "./backend-redaction.shared.js";

describe("redacted audit and policy evidence", () => {
  it("redacts metadata in policy evidence before persistence", async () => {
    const { database, policyEvidence } = await createPolicyEvidenceHarness();

    await Effect.runPromise(
      policyEvidence.recordInputEvidence({
        actorId: "user_1",
        actorType: "application_user",
        resourceId: "resource_1",
        outcome: "block",
        occurredAt: "2026-06-01T00:00:00.000Z",
        boundary: "generation",
        findings: [
          { category: "personal_data", field: "email", message: "contains email" }
        ],
        overrideAttempt: {
          verdict: "observe",
          confidence: "low"
        }
      })
    );

    const records = await Effect.runPromise(database.audit.list());
    const evidenceRecord = records.find((record) => record.resourceType === "policy_evidence:input");

    expect(evidenceRecord).toBeDefined();
    expect(evidenceRecord?.metadata).toMatchObject({
      rationaleCategory: "personal_data",
      summary: "generation input block with 1 finding(s); primary category personal_data; override verdict observe (low)"
    });
  });

  it("redacts metadata in evidence read model", async () => {
    const { policyEvidence } = await createPolicyEvidenceHarness();

    await Effect.runPromise(
      policyEvidence.recordConsentEvidence({
        actorId: "user_1",
        actorType: "application_user",
        resourceId: "resource_1",
        outcome: "granted",
        occurredAt: "2026-06-01T00:00:00.000Z",
        consentAction: "grant"
      })
    );

    const evidence = await Effect.runPromise(
      policyEvidence.listOperationalEvidence({ boundary: "consent" })
    );

    expect(evidence.length).toBeGreaterThan(0);
    expect(evidence[0]?.boundary).toBe("consent");
    expect(evidence[0]?.outcome).toBe("granted");
    expect(evidence[0]?.rationaleCategory).toBe("consent_grant");
    expect(evidence[0]?.summary).toBe("consent grant recorded with outcome granted");
  });

  it("keeps redacted evidence actionable for operators", async () => {
    const { policyEvidence } = await createPolicyEvidenceHarness();

    await Effect.runPromise(
      policyEvidence.recordScopeEvidence({
        actorId: "user_1",
        actorType: "application_user",
        resourceId: "resource_1",
        outcome: "block",
        occurredAt: "2026-06-01T00:00:00.000Z",
        stepName: "sanitize",
        boundary: "scope",
        reason: "step_scope_violation",
        field: "unauthorized_output"
      })
    );

    const evidence = await Effect.runPromise(
      policyEvidence.listOperationalEvidence({ boundary: "scope" })
    );

    expect(evidence.length).toBe(1);
    expect(evidence[0]?.boundary).toBe("scope");
    expect(evidence[0]?.outcome).toBe("block");
    expect(evidence[0]?.actorId).toBe("user_1");
    expect(evidence[0]?.rationaleCategory).toBe("step_scope_violation");
    expect(evidence[0]?.summary).toBe(
      "scope scope block in step sanitize due to step_scope_violation on field unauthorized_output"
    );
  });
});
