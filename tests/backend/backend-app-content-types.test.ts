import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { decodeContentTypeCatalogView } from "@my-ai-orchestrator/contracts";
import {
  createBackendAppTestApp,
  createBackendAppTestConfig,
  createBackendAppTestServices,
  backendAppTestStartedAt
} from "./backend-app.fixtures.js";

describe("backend app content types", () => {
  it("exposes content types through /me/content-types with actor-aware availability", async () => {
    const config = createBackendAppTestConfig({ billingUserId: "user_1" });
    const services = createBackendAppTestServices(config);

    services.billing.upsertSubscription({
      id: "sub_user_1_pro",
      userId: "user_1",
      planId: "pro",
      status: "active",
      startedAt: backendAppTestStartedAt.toISOString()
    });

    Effect.runSync(
      services.database.voiceProfiles.put({
        id: "voice-profile:user_1",
        userId: "user_1",
        version: 1,
        snapshotId: "voice-profile-snapshot:user_1:v1",
        confidence: "high",
        adaptationMode: "standard",
        primaryLanguage: "en-US",
        tone: "informal",
        cadence: "direct",
        description: "English-first voice profile.",
        lexicon: ["build", "ship"],
        constraints: ["keep it concise"],
        styleMarkers: ["first-person"],
        rules: ["open with an opinion"],
        antiPatterns: ["generic intro"],
        createdAt: backendAppTestStartedAt.toISOString(),
        updatedAt: backendAppTestStartedAt.toISOString()
      })
    );

    const app = createBackendAppTestApp(config, services);

    const response = await app.request("/me/content-types");
    expect(response.status).toBe(200);

    const body = await response.json();
    const decoded = await Effect.runPromise(decodeContentTypeCatalogView(body));
    expect(decoded.items.length).toBe(6);
    expect(decoded.commercial?.planTier).toBe("pro");
    expect(decoded.commercial?.allowedQualityModes).toEqual(["fast", "balanced", "strict"]);

    const linkedIn = decoded.items.find((item) => item.id === "linkedin-post");
    expect(linkedIn?.available).toBe(true);
    expect(linkedIn?.supportedLanguages).toContain("en-US");
    expect(linkedIn?.inputSchema.some((field) => field.highImpact)).toBe(true);
    expect(linkedIn?.briefingGuidanceByLanguage?.["en-US"]).toBeDefined();
  });
});
