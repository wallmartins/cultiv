import { describe, expect, it } from "vitest";
import { Effect, Layer } from "effect";
import { ClientSdkService, createClientSdk } from "../../packages/client-sdk/src/index.js";
import { listContentTypesSmoke } from "../../apps/web/src/platform/services/content-types-smoke.js";

describe("content types smoke service", () => {
  it("returns catalog summary through ClientSdkService", async () => {
    const fetcher = async () =>
      new Response(
        JSON.stringify({
          items: [
            {
              id: "linkedin-post",
              label: "LinkedIn post",
              available: true,
              defaultLanguage: "pt-BR",
              supportedLanguages: ["pt-BR"],
              steps: [],
              inputSchema: [],
              briefingGuidance: {
                objective: "obj",
                tips: [],
                exampleBriefing: "ex",
                commonMistakes: []
              }
            }
          ]
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" }
        }
      );

    const sdk = createClientSdk({
      baseUrl: "https://api.example.com",
      getToken: () => "token",
      fetcher
    });

    const result = await Effect.runPromise(
      listContentTypesSmoke().pipe(Effect.provide(Layer.succeed(ClientSdkService, sdk)))
    );

    expect(result.count).toBe(1);
    expect(result.labels).toEqual(["LinkedIn post"]);
  });
});
