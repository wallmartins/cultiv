import { describe, expect, it } from "vitest";
import { MARKETING_CONTENT_TYPE_IDS } from "../../apps/web/src/marketing/content/content-types/catalog.js";
import { createDefaultOrchestrationCatalog } from "../../packages/orchestrator/src/catalog.js";

/** Compositor plan signatures exist in the orchestrator fallback catalog but are not marketing-facing. */
const INTERNAL_COMPOSITOR_PIPELINE_TYPES = new Set([
  "short-piece",
  "long-piece",
  "serial-piece",
  "edition-piece"
]);

describe("marketing content types catalog", () => {
  it("stays synced with the backend orchestration catalog", () => {
    const backendIds = Object.keys(createDefaultOrchestrationCatalog().contentTypes)
      .filter((id) => !INTERNAL_COMPOSITOR_PIPELINE_TYPES.has(id))
      .sort();
    const marketingIds = [...MARKETING_CONTENT_TYPE_IDS].sort();

    expect(marketingIds).toEqual(backendIds);
  });
});
