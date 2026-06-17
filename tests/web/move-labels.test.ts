import { describe, expect, it } from "vitest";
import { getMoveLabel } from "../../apps/web/src/i18n/app/move-labels";

describe("getMoveLabel", () => {
  it("returns Portuguese labels for common extraction keys", () => {
    expect(getMoveLabel("pt", "lived_experience")).toBe("Experiência vivida");
    expect(getMoveLabel("pt", "doubt")).toBe("Dúvida");
  });

  it("returns English labels when locale is en", () => {
    expect(getMoveLabel("en", "lived_experience")).toBe("Lived experience");
    expect(getMoveLabel("en", "doubt")).toBe("Doubt");
  });
});
