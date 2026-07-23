import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { decodeVoiceProfileScreenView } from "@my-ai-orchestrator/contracts";
import {
  createBackendAppTestApp,
  createBackendAppTestConfig,
  createBackendAppTestServices,
  backendAppTestStartedAt
} from "./backend-app.fixtures.js";

function seedVoiceProfileState(services: ReturnType<typeof createBackendAppTestServices>) {
  Effect.runSync(services.voiceConsent.grantConsent("user_1"));

  Effect.runSync(
    services.database.voiceProfiles.put({
      id: "voice-profile:user_1",
      userId: "user_1",
      version: 4,
      snapshotId: "voice-profile-snapshot:user_1:v4",
      confidence: "medium",
      primaryLanguage: "pt-BR",
      tone: "informal",
      cadence: "direct",
      description: "Direct voice profile.",
      lexicon: ["produto", "cliente"],
      constraints: ["preserve user voice"],
      styleMarkers: ["short paragraphs"],
      rules: ["prefer direct openings"],
      antiPatterns: ["the problem"],
      createdAt: backendAppTestStartedAt.toISOString(),
      updatedAt: backendAppTestStartedAt.toISOString()
    })
  );

  Effect.runSync(
    services.database.voiceProfileDiagnostics.put({
      id: "voice-diagnostics:user_1",
      userId: "user_1",
      activeVersion: 4,
      updating: false,
      reasonCodes: [],
      nextActionCodes: [],
      bestCoveredContentTypes: [],
      underrepresentedContentTypes: [],
      pendingRebuild: {
        status: "idle",
        nextActionCodes: []
      },
      materialBase: {
        totalExamples: 3,
        activeExamples: 3,
        excludedExamples: 0,
        pinnedExamples: 1,
        byClassification: { positive: 3 },
        byContentType: { "linkedin-post": 2, newsletter: 1 },
        byLanguage: { "pt-BR": 3 }
      },
      createdAt: backendAppTestStartedAt.toISOString(),
      updatedAt: backendAppTestStartedAt.toISOString()
    })
  );
}

describe("backend app voice surface", () => {
  it("returns 404 when voice profile does not exist yet", async () => {
    const config = createBackendAppTestConfig({ billingUserId: "user_new" });
    const services = createBackendAppTestServices(config);
    const app = createBackendAppTestApp(config, services);

    const response = await app.request("/me/voice-profile");
    expect(response.status).toBe(404);
  });

  it("grants and reads voice training consent through /me/voice-training-consent", async () => {
    const config = createBackendAppTestConfig({ billingUserId: "user_consent" });
    const services = createBackendAppTestServices(config);
    const app = createBackendAppTestApp(config, services);

    const before = await app.request("/me/voice-training-consent");
    expect(before.status).toBe(200);
    expect(await before.json()).toMatchObject({ granted: false });

    const grant = await app.request("/me/voice-training-consent", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "grant" })
    });
    expect(grant.status).toBe(200);
    expect(await grant.json()).toMatchObject({ granted: true });
  });

  it("exposes the consolidated voice profile on /me/voice-profile", async () => {
    const config = createBackendAppTestConfig({ billingUserId: "user_1" });
    const services = createBackendAppTestServices(config);
    seedVoiceProfileState(services);
    const app = createBackendAppTestApp(config, services);

    const response = await app.request("/me/voice-profile");
    expect(response.status).toBe(200);

    const body = await response.json();
    const decoded = await Effect.runPromise(decodeVoiceProfileScreenView(body));
    expect(decoded.profile.snapshotId).toBe("voice-profile-snapshot:user_1:v4");
    expect(decoded.diagnostics.activeVersion).toBe(4);
    expect(decoded.materialBase.totalExamples).toBe(3);
  });

  it("schedules a retry and returns the screen on POST /me/voice-profile/rebuild", async () => {
    const config = createBackendAppTestConfig({ billingUserId: "user_1" });
    const services = createBackendAppTestServices(config);
    seedVoiceProfileState(services);
    const app = createBackendAppTestApp(config, services);

    const response = await app.request("/me/voice-profile/rebuild", { method: "POST" });
    expect(response.status).toBe(200);

    const decoded = await Effect.runPromise(decodeVoiceProfileScreenView(await response.json()));
    expect(decoded.profile.snapshotId).toContain("user_1");

    // Let the fire-and-forget rebuild settle so it doesn't leak into other tests.
    await Effect.runPromise(services.voiceRebuild.drain("user_1"));
  });

});
