import { describe, it } from "vitest";
import { expectNoImportsMatching, productPathTargets } from "./shared.js";

describe("product path support infrastructure governance", () => {
  it("prevents the product path from importing legacy support infrastructure", async () => {
    await expectNoImportsMatching(productPathTargets(), [
      /from\s+["'][^"']*src\/corpus\//,
      /from\s+["'][^"']*src\/storage\//,
      /from\s+["'][^"']*src\/adapters\//,
      /import\(\s*["'][^"']*src\/corpus\//,
      /import\(\s*["'][^"']*src\/storage\//,
      /import\(\s*["'][^"']*src\/adapters\//
    ]);
  });
});
