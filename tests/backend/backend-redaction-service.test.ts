import { describe, expect, it } from "vitest";
import { createBackendRedactionService } from "../../apps/backend/src/safety/redaction.js";
import { createClassifiedRedactionValue } from "../../apps/backend/src/safety/redaction-types.js";

describe("backend redaction service", () => {
  it("redacts secret-like field values in plain objects", () => {
    const redaction = createBackendRedactionService();
    const input = {
      userId: "user_1",
      apiKey: "sk-live-abc123",
      secretToken: "very-secret-value",
      normalField: "this is fine"
    };

    const { redacted, report } = redaction.redactObject(input);

    expect(redacted.apiKey).toBe("[REDACTED: string(14)]");
    expect(redacted.secretToken).toBe("[REDACTED: string(17)]");
    expect(redacted.normalField).toBe("this is fine");
    expect(redacted.userId).toBe("user_1");
    expect(report.redactedPaths).toContain("apiKey");
    expect(report.redactedPaths).toContain("secretToken");
    expect(report.reasons.apiKey).toBe("pattern_secret_like");
  });

  it("redacts nested secret-like fields", () => {
    const redaction = createBackendRedactionService();
    const input = {
      userId: "user_1",
      config: {
        database: {
          password: "super-secret",
          host: "localhost"
        },
        apiKey: "key-123"
      }
    };

    const { redacted, report } = redaction.redactObject(input);

    expect((redacted.config as Record<string, unknown>).database).toEqual({
      password: "[REDACTED: string(12)]",
      host: "localhost"
    });
    expect((redacted.config as Record<string, unknown>).apiKey).toBe("[REDACTED: string(7)]");
    expect(report.redactedPaths).toContain("config.database.password");
    expect(report.redactedPaths).toContain("config.apiKey");
  });

  it("preserves type hints when configured", () => {
    const redaction = createBackendRedactionService({ preserveTypeHints: true });
    const input = {
      apiKey: "key",
      secretCount: 42,
      authFlag: true
    };

    const { redacted } = redaction.redactObject(input);

    expect(redacted.apiKey).toBe("[REDACTED: string(3)]");
    expect(redacted.secretCount).toBe("[REDACTED: number]");
    expect(redacted.authFlag).toBe("[REDACTED: boolean]");
  });

  it("collapses type hints when disabled", () => {
    const redaction = createBackendRedactionService({ preserveTypeHints: false });
    const input = {
      apiKey: "key",
      secretCount: 42
    };

    const { redacted } = redaction.redactObject(input);

    expect(redacted.apiKey).toBe("[REDACTED]");
    expect(redacted.secretCount).toBe("[REDACTED]");
  });

  it("respects max depth for nested objects", () => {
    const redaction = createBackendRedactionService({ maxDepth: 2 });
    const input = {
      level1: {
        level2: {
          level3: {
            apiKey: "deep-secret"
          }
        }
      }
    };

    const { redacted } = redaction.redactObject(input);

    expect((redacted.level1 as Record<string, unknown>).level2).toEqual({
      level3: { "[REDACTED]": "max depth exceeded" }
    });
  });

  it("reports redaction statistics accurately", () => {
    const redaction = createBackendRedactionService();
    const input = {
      userId: "user_1",
      apiKey: "secret",
      config: {
        token: "token",
        host: "localhost"
      }
    };

    const { report } = redaction.redactObject(input);

    expect(report.totalFieldsInspected).toBeGreaterThanOrEqual(5);
    expect(report.redactedPaths.length).toBe(2);
    expect(Object.keys(report.reasons).length).toBe(2);
  });

  it("identifies secret-like field names", () => {
    const redaction = createBackendRedactionService();

    expect(redaction.isSecretLikeField("apiKey")).toBe(true);
    expect(redaction.isSecretLikeField("secret")).toBe(true);
    expect(redaction.isSecretLikeField("password")).toBe(true);
    expect(redaction.isSecretLikeField("userId")).toBe(false);
    expect(redaction.isSecretLikeField("name")).toBe(false);
  });

  it("identifies redacted classifications from safety policy", () => {
    const redaction = createBackendRedactionService();

    expect(redaction.isRedactedClassification("personal_data")).toBe(true);
    expect(redaction.isRedactedClassification("security_sensitive_data")).toBe(true);
    expect(redaction.isRedactedClassification("ordinary_generation_input")).toBe(false);
  });

  it("allows extending secret-like patterns", () => {
    const redaction = createBackendRedactionService({
      secretLikeFieldPatterns: ["custom_secret"]
    });

    expect(redaction.isSecretLikeField("custom_secret")).toBe(true);
    expect(redaction.isSecretLikeField("apiKey")).toBe(true);
  });

  it("redacts classified values even when the field name is not secret-like", () => {
    const redaction = createBackendRedactionService();
    const input = {
      actorId: "user_1",
      importedContext: createClassifiedRedactionValue("customer_confidential_data", {
        text: "Customer roadmap with private milestones",
        owner: "enterprise-account"
      })
    };

    const { redacted, report } = redaction.redactObject(input);
    const classifiedValue = redacted.importedContext as {
      readonly classification: string;
      readonly value: string;
    };

    expect(classifiedValue.classification).toBe("customer_confidential_data");
    expect(classifiedValue.value).toBe("[REDACTED: object]");
    expect(report.redactedPaths).toContain("importedContext");
    expect(report.reasons.importedContext).toBe("classification_customer_confidential");
  });
});
