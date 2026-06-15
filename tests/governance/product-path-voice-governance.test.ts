import { describe, it } from "vitest";
import { expectNoImportsMatching, productPathTargets } from "./shared.js";

describe("product path voice governance", () => {
  it("prevents the product path from importing legacy voice and refinement modules", async () => {
    await expectNoImportsMatching(productPathTargets(), [
      /from\s+["'][^"']*src\/skills\//,
      /from\s+["'][^"']*src\/config\/prompts\//,
      /from\s+["'][^"']*src\/language-profiles\//,
      /from\s+["'][^"']*src\/language-gate\//,
      /from\s+["'][^"']*src\/memory\//,
      /import\(\s*["'][^"']*src\/skills\//,
      /import\(\s*["'][^"']*src\/config\/prompts\//,
      /import\(\s*["'][^"']*src\/language-profiles\//,
      /import\(\s*["'][^"']*src\/language-gate\//,
      /import\(\s*["'][^"']*src\/memory\//
    ]);
  });
});
