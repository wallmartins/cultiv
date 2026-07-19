import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { decodeGenerationIntentCatalogView } from "@my-ai-orchestrator/contracts";
import {
  createBackendAppTestApp,
  createBackendAppTestConfig,
  createBackendAppTestServices,
  backendAppTestStartedAt
} from "./backend-app.fixtures.js";
import { createBackendTestAuthorizationHeader } from "../../apps/backend/src/auth/index.js";

describe("backend generation intents catalog", () => {
  it("exposes generation intents through /me/generation-intents", async () => {
    const config = createBackendAppTestConfig();
    const services = createBackendAppTestServices(config);

    Effect.runSync(
      services.database.voiceProfiles.put({
        id: "voice-profile:user_1",
        userId: "user_1",
        version: 1,
        snapshotId: "voice-profile-snapshot:user_1:v1",
        confidence: "high",
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

    const response = await app.request("/me/generation-intents");
    expect(response.status).toBe(200);

    const body = await response.json();
    const decoded = await Effect.runPromise(decodeGenerationIntentCatalogView(body));
    expect(decoded.items).toHaveLength(6);

    const shareIdea = decoded.items.find((item) => item.id === "share-idea");
    expect(shareIdea).toBeDefined();
    expect(shareIdea?.featured).toBe(true);
    expect(shareIdea?.defaultLengthTier).toBe("short");
    expect(shareIdea?.inputSchema.some((field) => field.key === "topic")).toBe(true);
    expect(shareIdea?.label).toBe("Share an idea");

    const documentDecision = decoded.items.find((item) => item.id === "document-decision");
    expect(documentDecision).toBeDefined();
    expect(documentDecision?.featured).toBe(false);
    expect(documentDecision?.defaultLengthTier).toBe("medium");
    expect(documentDecision?.inputSchema.some((field) => field.key === "systemContext")).toBe(true);

    const featuredCount = decoded.items.filter((item) => item.featured).length;
    expect(featuredCount).toBe(5);
  });

  it("localizes generation intents for pt-BR voice profiles", async () => {
    const config = createBackendAppTestConfig();
    const services = createBackendAppTestServices(config);

    Effect.runSync(
      services.database.voiceProfiles.put({
        id: "voice-profile:user_pt",
        userId: "user_pt",
        version: 1,
        snapshotId: "voice-profile-snapshot:user_pt:v1",
        confidence: "high",
        primaryLanguage: "pt-BR",
        tone: "informal",
        cadence: "direct",
        description: "Perfil em português.",
        lexicon: ["produto"],
        constraints: ["direto"],
        styleMarkers: ["primeira pessoa"],
        rules: ["abrir com opinião"],
        antiPatterns: ["intro genérica"],
        createdAt: backendAppTestStartedAt.toISOString(),
        updatedAt: backendAppTestStartedAt.toISOString()
      })
    );

    const app = createBackendAppTestApp(config, services);
    const response = await app.request("/me/generation-intents", {
      headers: { authorization: createBackendTestAuthorizationHeader({ userId: "user_pt" }) }
    });

    expect(response.status).toBe(200);

    const decoded = await Effect.runPromise(decodeGenerationIntentCatalogView(await response.json()));
    const shareIdea = decoded.items.find((item) => item.id === "share-idea");

    expect(shareIdea?.label).toBe("Compartilhar uma ideia");
    expect(shareIdea?.description).toContain("Opinião");
  });
});
