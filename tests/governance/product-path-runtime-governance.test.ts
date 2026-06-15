import { describe, it } from "vitest";
import { expectNoImportsMatching, productPathTargets } from "./shared.js";

describe("product path runtime governance", () => {
  it("prevents the product path from importing the legacy runtime tree", async () => {
    await expectNoImportsMatching(productPathTargets(), [
      /from\s+["'][^"']*src\/core\//,
      /from\s+["'][^"']*src\/orchestrator\//,
      /from\s+["'][^"']*src\/pipeline-execution\//,
      /import\(\s*["'][^"']*src\/core\//,
      /import\(\s*["'][^"']*src\/orchestrator\//,
      /import\(\s*["'][^"']*src\/pipeline-execution\//
    ]);
  });
});
