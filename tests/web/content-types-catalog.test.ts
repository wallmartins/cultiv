import { describe, expect, it } from "vitest";
import { MARKETING_CONTENT_TYPE_IDS } from "../../apps/web/src/marketing/content/content-types/catalog.js";
import { createDefaultOrchestrationCatalog } from "../../packages/orchestrator/src/catalog.js";

describe("marketing content types catalog", () => {
  it("stays synced with the backend orchestration catalog", () => {
    const backendIds = Object.keys(createDefaultOrchestrationCatalog().contentTypes).sort();
    const marketingIds = [...MARKETING_CONTENT_TYPE_IDS].sort();

    expect(marketingIds).toEqual(backendIds);
  });
});
