import type {
  ContentTypeCatalogView,
  GenerationPreviewResponse,
  QualityMode
} from "@my-ai-orchestrator/contracts";
import { useEffect, useMemo } from "react";
import type { QualityModeHelpContext } from "~/i18n/app/quality-mode-tooltips";

type QualityModeOption = GenerationPreviewResponse["options"]["qualityModes"][number];

export function isQualityModeAllowedForUser(
  mode: QualityMode,
  qualityModeOptions: readonly QualityModeOption[],
  catalogAllowedModes: readonly QualityMode[] | undefined
): boolean {
  const previewOption = qualityModeOptions.find((option) => option.id === mode);
  if (previewOption) {
    return previewOption.allowed;
  }

  return catalogAllowedModes?.includes(mode) ?? false;
}

export function useGenerationCommercialGate({
  qualityMode,
  setQualityMode,
  commercialPreview,
  fullPreview,
  catalog
}: {
  readonly qualityMode: QualityMode;
  readonly setQualityMode: (mode: QualityMode) => void;
  readonly commercialPreview: GenerationPreviewResponse | null;
  readonly fullPreview: GenerationPreviewResponse | null;
  readonly catalog: ContentTypeCatalogView | null;
}) {
  const qualityModeOptions = commercialPreview?.options.qualityModes ?? [];
  const qualityModeDisplayOptions = fullPreview?.options.qualityModes ?? qualityModeOptions;
  const catalogAllowedModes = catalog?.commercial?.allowedQualityModes;

  const selectedModeAllowed = isQualityModeAllowedForUser(
    qualityMode,
    qualityModeOptions,
    catalogAllowedModes
  );

  const qualityModeHelpContext = useMemo((): QualityModeHelpContext => {
    const selectedOption = qualityModeOptions.find((option) => option.id === qualityMode);

    return {
      allowed: selectedModeAllowed,
      blockedReason:
        selectedOption?.blockedReason ?? (!selectedModeAllowed ? "quality_mode_plan_restriction" : undefined)
    };
  }, [qualityMode, qualityModeOptions, selectedModeAllowed]);

  useEffect(() => {
    if (!catalogAllowedModes?.length || catalogAllowedModes.includes(qualityMode)) {
      return;
    }

    setQualityMode(catalogAllowedModes[0] ?? "fast");
  }, [catalogAllowedModes, qualityMode, setQualityMode]);

  useEffect(() => {
    if (qualityModeOptions.length === 0 || selectedModeAllowed) {
      return;
    }

    const fallback =
      qualityModeOptions.find((option) => option.recommended && option.allowed) ??
      qualityModeOptions.find((option) => option.allowed);

    if (fallback && fallback.id !== qualityMode) {
      setQualityMode(fallback.id);
    }
  }, [qualityMode, qualityModeOptions, selectedModeAllowed, setQualityMode]);

  const currentBalance = commercialPreview?.currentBalance ?? null;
  const creditPrice = commercialPreview?.pricingSnapshot.creditPrice ?? null;
  const noCredits = currentBalance !== null && creditPrice !== null && currentBalance < creditPrice;

  function isModeAllowedForUser(mode: QualityMode): boolean {
    return isQualityModeAllowedForUser(mode, qualityModeOptions, catalogAllowedModes);
  }

  return {
    qualityModeOptions,
    qualityModeDisplayOptions,
    catalogAllowedModes,
    selectedModeAllowed,
    qualityModeHelpContext,
    currentBalance,
    creditPrice,
    noCredits,
    isModeAllowedForUser
  };
}
