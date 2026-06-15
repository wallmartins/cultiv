export function normalizeText(content: string): string {
  return content
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const templateHeaderPrefixes = [
  "Finalize",
  "Draft",
  "Hook",
  "Outline",
  "Research",
  "Analyze",
  "Refine",
  "Publish",
  "Tighten",
  "Expand",
  "Topic:",
  "Briefing:",
  "Key briefing:",
  "Analysis source:",
  "Opening angle:",
  "Drafting against:",
  "Previous content:",
  "Previous material:",
  "Refinement focus:",
  "Voice markers:",
  "Voice rules:",
  "Voice examples:",
  "Format contract:",
  "Output rules:",
  "Instruction:",
  "Adapter:",
  "Model:",
  "Language:",
  "Tone:",
  "Step:",
  "Total steps:",
  "Pipeline:",
  "Quality mode:",
  "Goal:",
  "Audience:",
  "{{",
  "---"
];

const headerRegex = new RegExp(
  templateHeaderPrefixes
    .map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|"),
  "g"
);

export function stripTemplateHeaders(content: string): string {
  // Estratégia 1: O LLM frequentemente separa o texto real com "Previous content:"
  // ou variações. Tentamos extrair o que vem DEPOIS do último marcador de conteúdo.
  const contentMarkers = [
    /Previous content:\s*(.+)/s,
    /Previous material:\s*(.+)/s,
    /Draft:\s*(.+)/s,
    /Generated text:\s*(.+)/s,
    /Output:\s*(.+)/s,
    /Texto:\s*(.+)/s,
    /Conteúdo:\s*(.+)/s,
  ];

  for (const marker of contentMarkers) {
    const match = content.match(marker);
    if (match && match[1].trim().length > 30) {
      return normalizeText(match[1].trim());
    }
  }

  // Estratégia 2: Filtragem linha a linha para textos com quebras
  const lines = content.split("\n");
  const lineFiltered = lines.filter((line) => {
    const trimmed = line.trim();
    return !templateHeaderPrefixes.some((prefix) => trimmed.startsWith(prefix));
  });

  const lineResult = normalizeText(lineFiltered.join("\n"));

  if (lineResult.length > 30) {
    return lineResult;
  }

  // Estratégia 3: Fallback para texto contínuo (sem quebras de linha)
  // Remove cada header e o texto que vem imediatamente após ele até o próximo header
  let cleaned = content;
  let previousLength = -1;

  while (cleaned.length !== previousLength) {
    previousLength = cleaned.length;
    cleaned = cleaned.replace(headerRegex, "");
  }

  const continuousResult = normalizeText(cleaned);
  if (continuousResult.length > 30) {
    return continuousResult;
  }

  // Estratégia 4: Se tudo falhou, o texto pode ser quase todo meta.
  // Retornamos o texto original normalizado como último recurso.
  return normalizeText(content);
}
