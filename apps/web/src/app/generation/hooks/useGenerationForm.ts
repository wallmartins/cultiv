import type {
  ContentTypeCatalogItemView,
  ContentTypeCatalogView,
  GenerationIntent,
  GenerationScope,
  QualityMode
} from "@my-ai-orchestrator/contracts";
import { useEffect, useMemo, useState } from "react";
import { isBriefingComplete } from "~/app/generation/components/BriefingForm";
import type { GenerationIntentCatalogItemView } from "~/app/generation/lib/use-generation-intents";

export const IMPORTED_CONTEXT_MAX = 8000;

export const GENERATION_SUPPORTED_LANGUAGES = ["pt-BR", "en-US"] as const;

const INITIAL_GENERATION_FORM = {
  briefing: {} as Record<string, unknown>,
  language: "pt-BR",
  qualityMode: "fast" as QualityMode,
  importedContext: "",
  importedOpen: false,
  submitError: null as string | null,
  fullRefreshKey: 0
};

export type GenerationFormSelection =
  | {
      readonly mode: "intent";
      readonly intent: GenerationIntent;
      readonly scope: GenerationScope;
      readonly catalogItem: GenerationIntentCatalogItemView;
      readonly fieldLabelKey: string;
    }
  | {
      readonly mode: "legacy";
      readonly contentTypeId: string;
      readonly catalogItem: ContentTypeCatalogItemView;
    };

export function useGenerationForm(
  selection: GenerationFormSelection | null,
  commercialCatalog: ContentTypeCatalogView | null
) {
  const [briefing, setBriefing] = useState<Record<string, unknown>>(INITIAL_GENERATION_FORM.briefing);
  const [language, setLanguage] = useState(INITIAL_GENERATION_FORM.language);
  const [qualityMode, setQualityMode] = useState<QualityMode>(INITIAL_GENERATION_FORM.qualityMode);
  const [importedContext, setImportedContext] = useState(INITIAL_GENERATION_FORM.importedContext);
  const [importedOpen, setImportedOpen] = useState(INITIAL_GENERATION_FORM.importedOpen);
  const [submitError, setSubmitError] = useState<string | null>(INITIAL_GENERATION_FORM.submitError);
  const [fullRefreshKey, setFullRefreshKey] = useState(INITIAL_GENERATION_FORM.fullRefreshKey);

  const selectionKey = selection
    ? selection.mode === "intent"
      ? `${selection.intent}:${selection.scope.lengthTier}:${selection.scope.channel ?? ""}`
      : selection.contentTypeId
    : null;

  useEffect(() => {
    setBriefing({});
  }, [selectionKey]);

  const inputSchema = selection?.catalogItem.inputSchema ?? [];
  const supportedLanguages =
    selection?.mode === "legacy"
      ? selection.catalogItem.supportedLanguages
      : [...GENERATION_SUPPORTED_LANGUAGES];

  const fieldLabelKey =
    selection?.mode === "intent" ? selection.fieldLabelKey : (selection?.contentTypeId ?? "");

  function resetGenerationForm() {
    setBriefing(INITIAL_GENERATION_FORM.briefing);
    setLanguage(INITIAL_GENERATION_FORM.language);
    setQualityMode(INITIAL_GENERATION_FORM.qualityMode);
    setImportedContext(INITIAL_GENERATION_FORM.importedContext);
    setImportedOpen(INITIAL_GENERATION_FORM.importedOpen);
    setSubmitError(INITIAL_GENERATION_FORM.submitError);
    setFullRefreshKey(INITIAL_GENERATION_FORM.fullRefreshKey);
  }

  function applyPrefill(prefill: {
    readonly briefing?: Record<string, unknown>;
    readonly language?: string;
    readonly qualityMode?: QualityMode;
    readonly importedContext?: string;
  }) {
    setBriefing(prefill.briefing ?? {});
    setLanguage(prefill.language ?? INITIAL_GENERATION_FORM.language);
    setQualityMode(prefill.qualityMode ?? INITIAL_GENERATION_FORM.qualityMode);
    setImportedContext(prefill.importedContext ?? "");
    if (prefill.importedContext) {
      setImportedOpen(true);
    }
  }

  function handleLegacyContentTypeChange(nextContentTypeId: string, catalog: ContentTypeCatalogView | null) {
    const nextType = catalog?.items.find((item) => item.id === nextContentTypeId);
    if (nextType) {
      setLanguage(nextType.defaultLanguage);
    }
  }

  const commercialRequest = useMemo(() => {
    if (!selection || !language) {
      return null;
    }

    if (selection.mode === "intent") {
      return {
        intent: selection.intent,
        scope: selection.scope,
        language,
        qualityMode
      };
    }

    return {
      contentType: selection.contentTypeId,
      language,
      qualityMode
    };
  }, [language, qualityMode, selection]);

  const briefingComplete = selection ? isBriefingComplete(inputSchema, briefing) : false;

  const fullPreviewRequest = useMemo(() => {
    if (!selection || !language || !briefingComplete) {
      return null;
    }

    const shared = {
      briefing,
      language,
      qualityMode,
      importedContext: importedContext.trim() ? importedContext : undefined
    };

    if (selection.mode === "intent") {
      return {
        ...shared,
        intent: selection.intent,
        scope: selection.scope
      };
    }

    return {
      ...shared,
      contentType: selection.contentTypeId
    };
  }, [briefing, briefingComplete, importedContext, language, qualityMode, selection]);

  useEffect(() => {
    if (!briefingComplete) {
      setFullRefreshKey(0);
      return;
    }

    setFullRefreshKey((key) => (key === 0 ? 1 : key));
  }, [briefingComplete]);

  const importedTooLarge = importedContext.length > IMPORTED_CONTEXT_MAX;

  return {
    briefing,
    language,
    qualityMode,
    importedContext,
    importedOpen,
    submitError,
    fullRefreshKey,
    selection,
    inputSchema,
    supportedLanguages,
    fieldLabelKey,
    briefingComplete,
    commercialRequest,
    fullPreviewRequest,
    importedTooLarge,
    setBriefing,
    setLanguage,
    setQualityMode,
    setImportedContext,
    setImportedOpen,
    setSubmitError,
    setFullRefreshKey,
    applyPrefill,
    handleLegacyContentTypeChange,
    resetGenerationForm
  };
}
