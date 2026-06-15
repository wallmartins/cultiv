import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { decodeContentTypeCatalogView } from "@my-ai-orchestrator/contracts";
import {
  createBackendAppTestApp,
  createBackendAppTestConfig,
  createBackendAppTestServices,
  backendAppTestStartedAt
} from "./backend-app.fixtures.js";

describe("backend content types catalog source", () => {
  it("returns all policy content types even when the database only has a persisted subset", async () => {
    const config = createBackendAppTestConfig({ billingUserId: "user_1" });
    const services = createBackendAppTestServices(config);

    services.billing.upsertSubscription({
      id: "sub_user_1_pro",
      userId: "user_1",
      planId: "pro",
      status: "active",
      startedAt: backendAppTestStartedAt.toISOString()
    });

    const at = backendAppTestStartedAt.toISOString();
    for (const contentType of [
      {
        id: "linkedin-post",
        label: "LinkedIn Post",
        defaultLanguage: "pt-BR",
        steps: ["hook", "draft"],
        inputSchema: {}
      },
      {
        id: "twitter-thread",
        label: "Twitter Thread",
        defaultLanguage: "pt-BR",
        steps: ["hook", "expand"],
        inputSchema: {}
      },
      {
        id: "long-form-blog",
        label: "Long Form Blog",
        defaultLanguage: "pt-BR",
        steps: ["research", "draft"],
        inputSchema: {}
      }
    ]) {
      Effect.runSync(services.database.contentTypes.put(contentType, 1, at));
    }

    const app = createBackendAppTestApp(config, services);
    const response = await app.request("/me/content-types");
    expect(response.status).toBe(200);

    const decoded = await Effect.runPromise(decodeContentTypeCatalogView(await response.json()));
    expect(decoded.items.map((item) => item.id).sort()).toEqual(
      [
        "architecture-post",
        "linkedin-post",
        "long-form-blog",
        "newsletter",
        "twitter-thread",
        "validation-post"
      ].sort()
    );
  });
});
