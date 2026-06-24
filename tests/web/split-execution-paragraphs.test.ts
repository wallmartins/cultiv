import { describe, expect, it } from "vitest";
import { splitExecutionContentParagraphs } from "../../apps/web/src/app/execution/lib/split-execution-paragraphs";

describe("splitExecutionContentParagraphs", () => {
  it("splits on blank lines into separate paragraphs", () => {
    expect(splitExecutionContentParagraphs("Primeiro parágrafo.\n\nSegundo parágrafo.")).toEqual([
      "Primeiro parágrafo.",
      "Segundo parágrafo."
    ]);
  });

  it("splits single newlines when there is no blank line", () => {
    expect(splitExecutionContentParagraphs("Linha um.\nLinha dois.")).toEqual(["Linha um.", "Linha dois."]);
  });

  it("chunks a single long block for readability", () => {
    const longBlock = "Frase longa com conteúdo. ".repeat(30).trim();

    const paragraphs = splitExecutionContentParagraphs(longBlock);
    expect(paragraphs.length).toBeGreaterThan(1);
  });
});
