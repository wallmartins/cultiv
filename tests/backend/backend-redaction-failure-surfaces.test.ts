import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import { createPolicyEvidenceHarness } from "./backend-redaction.shared.js";

describe("redaction for input, consent, and output failures", () => {
  it("preserves operational diagnosis after redacting input failure evidence", async () => {
    const { policyEvidence } = await createPolicyEvidenceHarness();

    await Effect.runPromise(
      policyEvidence.recordInputEvidence({
        actorId: "user_1",
        actorType: "application_user",
        resourceId: "req_1",
        outcome: "block",
        occurredAt: "2026-06-01T00:00:00.000Z",
        boundary: "generation",
        findings: [
          { category: "llm_prohibited_data", field: "prompt", message: "attempted instruction override" }
        ],
        overrideAttempt: {
          verdict: "block",
          confidence: "high"
        }
      })
    );

    const evidence = await Effect.runPromise(
      policyEvidence.listOperationalEvidence({ boundary: "input" })
    );

    expect(evidence.length).toBe(1);
    expect(evidence[0]?.boundary).toBe("input");
    expect(evidence[0]?.outcome).toBe("block");
    expect(evidence[0]?.actorId).toBe("user_1");
    expect(evidence[0]?.rationaleCategory).toBe("llm_prohibited_data");
    expect(evidence[0]?.summary).toBe(
      "generation input block with 1 finding(s); primary category llm_prohibited_data; override verdict block (high)"
    );
  });

  it("preserves operational diagnosis after redacting output failure evidence", async () => {
    const { policyEvidence } = await createPolicyEvidenceHarness();

    await Effect.runPromise(
      policyEvidence.recordOutputEvidence({
        actorId: "user_1",
        actorType: "application_user",
        resourceId: "out_1",
        outcome: "quarantine",
        occurredAt: "2026-06-01T00:00:00.000Z",
        contentType: "blog-post",
        findings: [
          { category: "personal_data", field: "output_text", message: "contains personal data", sanitized: true }
        ]
      })
    );

    const evidence = await Effect.runPromise(
      policyEvidence.listOperationalEvidence({ boundary: "output" })
    );

    expect(evidence.length).toBe(1);
    expect(evidence[0]?.boundary).toBe("output");
    expect(evidence[0]?.outcome).toBe("quarantine");
    expect(evidence[0]?.actorId).toBe("user_1");
    expect(evidence[0]?.rationaleCategory).toBe("personal_data");
    expect(evidence[0]?.summary).toBe(
      "output release quarantine for blog-post with 1 finding(s); primary category personal_data"
    );
  });

  it("preserves operational diagnosis after redacting consent failure evidence", async () => {
    const { policyEvidence } = await createPolicyEvidenceHarness();

    await Effect.runPromise(
      policyEvidence.recordConsentEvidence({
        actorId: "user_1",
        actorType: "application_user",
        resourceId: "consent_1",
        outcome: "revoked",
        occurredAt: "2026-06-01T00:00:00.000Z",
        consentAction: "revoke"
      })
    );

    const evidence = await Effect.runPromise(
      policyEvidence.listOperationalEvidence({ boundary: "consent" })
    );

    expect(evidence.length).toBe(1);
    expect(evidence[0]?.boundary).toBe("consent");
    expect(evidence[0]?.outcome).toBe("revoked");
    expect(evidence[0]?.actorId).toBe("user_1");
    expect(evidence[0]?.rationaleCategory).toBe("consent_revoke");
    expect(evidence[0]?.summary).toBe("consent revoke recorded with outcome revoked");
  });
});
