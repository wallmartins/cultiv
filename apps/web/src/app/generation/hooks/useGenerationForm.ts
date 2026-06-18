import type { ContentTypeCatalogView, QualityMode } from "@my-ai-orchestrator/contracts";
import { useEffect, useMemo, useState } from "react";
import { isBriefingComplete } from "~/app/generation/components/BriefingForm";
import { consumeGeneratePrefill } from "~/app/generation/lib/generate-prefill";

export const IMPORTED_CONTEXT_MAX = 8000;

const INITIAL_GENERATION_FORM = {
  contentTypeId: "",
  briefing: {} as Record<string, unknown>,
  language: "",
  qualityMode: "fast" as QualityMode,
  importedContext: "",
  importedOpen: false,
  submitError: null as string | null,
  fullRefreshKey: 0
};

export function useGenerationForm(catalog: ContentTypeCatalogView | null) {
  const [contentTypeId, setContentTypeId] = useState(INITIAL_GENERATION_FORM.contentTypeId);
  const [briefing, setBriefing] = useState<Record<string, unknown>>(INITIAL_GENERATION_FORM.briefing);
  const [language, setLanguage] = useState(INITIAL_GENERATION_FORM.language);
  const [qualityMode, setQualityMode] = useState<QualityMode>(INITIAL_GENERATION_FORM.qualityMode);
  const [importedContext, setImportedContext] = useState(INITIAL_GENERATION_FORM.importedContext);
  const [importedOpen, setImportedOpen] = useState(INITIAL_GENERATION_FORM.importedOpen);
  const [submitError, setSubmitError] = useState<string | null>(INITIAL_GENERATION_FORM.submitError);
  const [fullRefreshKey, setFullRefreshKey] = useState(INITIAL_GENERATION_FORM.fullRefreshKey);

  const selectedType = useMemo(
    () => catalog?.items.find((item) => item.id === contentTypeId) ?? null,
    [catalog?.items, contentTypeId]
  );

  function resetGenerationForm() {
    setContentTypeId(INITIAL_GENERATION_FORM.contentTypeId);
    setBriefing(INITIAL_GENERATION_FORM.briefing);
    setLanguage(INITIAL_GENERATION_FORM.language);
    setQualityMode(INITIAL_GENERATION_FORM.qualityMode);
    setImportedContext(INITIAL_GENERATION_FORM.importedContext);
    setImportedOpen(INITIAL_GENERATION_FORM.importedOpen);
    setSubmitError(INITIAL_GENERATION_FORM.submitError);
    setFullRefreshKey(INITIAL_GENERATION_FORM.fullRefreshKey);
  }

  useEffect(() => {
    const prefill = consumeGeneratePrefill();
    if (!prefill) {
      return;
    }

    setContentTypeId(prefill.contentType);
    setBriefing(prefill.briefing ?? {});
    setLanguage(prefill.language ?? "pt-BR");
    setQualityMode(prefill.qualityMode ?? "balanced");
    setImportedContext(prefill.importedContext ?? "");
    if (prefill.importedContext) {
      setImportedOpen(true);
    }
  }, []);

  function handleContentTypeChange(nextContentTypeId: string) {
    if (nextContentTypeId !== contentTypeId) {
      setBriefing({});
    }

    setContentTypeId(nextContentTypeId);

    const nextType = catalog?.items.find((item) => item.id === nextContentTypeId);
    if (nextType) {
      setLanguage(nextType.defaultLanguage);
    }
  }

  const commercialRequest = useMemo(() => {
    if (!contentTypeId || !language) {
      return null;
    }

    return {
      contentType: contentTypeId,
      language,
      qualityMode
    };
  }, [contentTypeId, language, qualityMode]);

  const briefingComplete = selectedType
    ? isBriefingComplete(selectedType.inputSchema, briefing)
    : false;

  const fullPreviewRequest = useMemo(() => {
    if (!selectedType || !language || !briefingComplete) {
      return null;
    }

    return {
      contentType: contentTypeId,
      briefing,
      language,
      qualityMode,
      importedContext: importedContext.trim() ? importedContext : undefined
    };
  }, [briefing, briefingComplete, contentTypeId, importedContext, language, qualityMode, selectedType]);

  useEffect(() => {
    if (!briefingComplete) {
      setFullRefreshKey(0);
      return;
    }

    setFullRefreshKey((key) => (key === 0 ? 1 : key));
  }, [briefingComplete]);

  const importedTooLarge = importedContext.length > IMPORTED_CONTEXT_MAX;

  return {
    contentTypeId,
    briefing,
    language,
    qualityMode,
    importedContext,
    importedOpen,
    submitError,
    fullRefreshKey,
    selectedType,
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
    handleContentTypeChange,
    resetGenerationForm
  };
}
