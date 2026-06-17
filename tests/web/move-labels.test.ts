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

  it("normalizes spaced English labels to Portuguese when locale is pt", () => {
    expect(getMoveLabel("pt", "Anecdotal Hook")).toBe("Gancho anecdótico");
    expect(getMoveLabel("pt", "Problem Redefinition")).toBe("Redefinição do problema");
    expect(getMoveLabel("pt", "Deconstruction Of Assumptions")).toBe("Desconstrução de pressupostos");
    expect(getMoveLabel("pt", "Pragmatic Trade Off Analysis")).toBe("Análise pragmática de trade-offs");
    expect(getMoveLabel("pt", "Heuristic Proposal")).toBe("Proposta heurística");
    expect(getMoveLabel("pt", "Call To Reflection")).toBe("Chamado à reflexão");
  });

  it("normalizes snake_case English labels to Portuguese when locale is pt", () => {
    expect(getMoveLabel("pt", "anecdotal_hook")).toBe("Gancho anecdótico");
    expect(getMoveLabel("pt", "problem_redefinition")).toBe("Redefinição do problema");
  });
});
