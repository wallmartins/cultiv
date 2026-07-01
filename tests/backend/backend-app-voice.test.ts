import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import {
  decodeVoiceExamplesPageView,
  decodeVoiceProfileScreenView
} from "@my-ai-orchestrator/contracts";
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
      adaptationMode: "standard",
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

    const grant = await app.request("/me/voice-training-consent", { method: "POST" });
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

  it("exposes voice examples through the canonical /me routes", async () => {
    const config = createBackendAppTestConfig({ billingUserId: "user_1" });
    const services = createBackendAppTestServices(config);

    Effect.runSync(services.voiceConsent.grantConsent("user_1"));

    const createdOne = Effect.runSync(
      services.voice.createExample("user_1", {
        text: "Writes clear LinkedIn posts with direct openings.",
        explicitContentType: "linkedin-post",
        pinned: true
      })
    );
    Effect.runSync(
      services.voice.createExample("user_1", {
        text: "Also writes newsletters with context and short conclusions.",
        explicitContentType: "newsletter"
      })
    );
    Effect.runSync(
      services.voice.createExample("user_1", {
        text: "Excluded example for state filtering.",
        explicitContentType: "blog-post"
      })
    );

    const app = createBackendAppTestApp(config, services);

    const listResponse = await app.request("/me/voice-profile/examples?state=active&contentType=linkedin-post&limit=1&offset=0");
    expect(listResponse.status).toBe(200);

    const listBody = await listResponse.json();
    const decodedList = await Effect.runPromise(decodeVoiceExamplesPageView(listBody));
    expect(decodedList.total).toBe(1);
    expect(decodedList.limit).toBe(1);
    expect(decodedList.offset).toBe(0);
    expect(decodedList.items[0]?.exampleId).toBe(createdOne.exampleId);

    const createResponse = await app.request("/me/voice-profile/examples", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        text: "Example created through the API.",
        explicitContentType: "linkedin-post",
        pinned: false
      })
    });
    expect(createResponse.status).toBe(404);

    const updateResponse = await app.request(`/me/voice-profile/examples/${createdOne.exampleId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        state: "excluded",
        text: "Updated and excluded text."
      })
    });
    expect(updateResponse.status).toBe(404);
  });
});
