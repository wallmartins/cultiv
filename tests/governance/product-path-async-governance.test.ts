import { describe, it } from "vitest";
import { expectNoImportsMatching, productPathTargets } from "./shared.js";

describe("product path async governance", () => {
  it("prevents the product path from importing the legacy async execution path", async () => {
    await expectNoImportsMatching(productPathTargets(), [
      /from\s+["'][^"']*src\/worker\.js["']/,
      /from\s+["'][^"']*src\/api\//,
      /from\s+["'][^"']*src\/features\/pipeline\//,
      /from\s+["'][^"']*src\/server\.js["']/,
      /import\(\s*["'][^"']*src\/worker\.js["']/,
      /import\(\s*["'][^"']*src\/api\//,
      /import\(\s*["'][^"']*src\/features\/pipeline\//,
      /import\(\s*["'][^"']*src\/server\.js["']/
    ]);
  });
});
