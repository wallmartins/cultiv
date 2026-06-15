import { describe, expect, it } from "vitest";
import { createDefaultOrchestrationCatalog } from "../../packages/orchestrator/src/catalog.js";

describe("sanitize-step governance", () => {
  it("requires every pipeline to end with a sanitize step", () => {
    const catalog = createDefaultOrchestrationCatalog();

    for (const [name, pipeline] of Object.entries(catalog.pipelines)) {
      const lastStep = pipeline.steps.at(-1);
      expect(lastStep?.name).toBe("sanitize");
      expect(lastStep?.skill).toBe("sanitize");
    }
  });

  it("requires every content type to include sanitize in its steps", () => {
    const catalog = createDefaultOrchestrationCatalog();

    for (const [name, contentType] of Object.entries(catalog.contentTypes)) {
      expect(contentType.steps.at(-1)).toBe("sanitize");
      expect(contentType.steps).toContain("sanitize");
    }
  });
});
