import type { OrchestrationCatalog } from "@my-ai-orchestrator/orchestrator";

export function resolveCatalogContentTypeDefinitions(
  orchestrationCatalog: OrchestrationCatalog
): ReadonlyArray<{
  readonly id: string;
  readonly label: string;
  readonly defaultLanguage: string;
  readonly steps: readonly string[];
  readonly inputSchema: Readonly<Record<string, unknown>>;
}> {
  return Object.values(orchestrationCatalog.contentTypes).map((contentType) => ({
    id: contentType.id,
    label: contentType.label,
    defaultLanguage: contentType.defaultLanguage,
    steps: [...contentType.steps],
    inputSchema: { ...contentType.inputSchema }
  }));
}
