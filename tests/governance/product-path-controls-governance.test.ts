import { describe, it } from "vitest";
import { expectNoImportsMatching, productPathTargets } from "./shared.js";

describe("product path controls governance", () => {
  it("prevents the product path from importing the legacy application control surface", async () => {
    await expectNoImportsMatching(productPathTargets(), [
      /from\s+["'][^"']*src\/features\//,
      /from\s+["'][^"']*src\/shared\//,
      /from\s+["'][^"']*src\/api\//,
      /from\s+["'][^"']*src\/server\.js["']/,
      /from\s+["'][^"']*src\/index\.js["']/,
      /import\(\s*["'][^"']*src\/features\//,
      /import\(\s*["'][^"']*src\/shared\//,
      /import\(\s*["'][^"']*src\/api\//,
      /import\(\s*["'][^"']*src\/server\.js["']/,
      /import\(\s*["'][^"']*src\/index\.js["']/
    ]);
  });
});
