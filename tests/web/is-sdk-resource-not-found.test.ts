import { describe, expect, it } from "vitest";
import { createClientSdk } from "../../packages/client-sdk/src/index.js";
import { isSdkResourceNotFound } from "../../apps/web/src/platform/sdk/is-sdk-resource-not-found.js";

describe("isSdkResourceNotFound", () => {
  it("detects resource_not_found from toPromise rejections", async () => {
    const sdk = createClientSdk({
      baseUrl: "https://api.example.com",
      fetcher: async () =>
        new Response(
          JSON.stringify({
            status: 404,
            code: "resource_not_found",
            category: "not_found",
            message: "Voice profile not found",
            retryable: false
          }),
          { status: 404, headers: { "content-type": "application/json" } }
        )
    });

    let caught: unknown;
    try {
      await sdk.toPromise(sdk.voice.getProfile());
    } catch (error) {
      caught = error;
    }

    expect(isSdkResourceNotFound(caught)).toBe(true);
  });
});
