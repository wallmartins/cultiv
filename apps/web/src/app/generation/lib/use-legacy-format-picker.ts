/**
 * Phase 1 alpha: no web feature-flag evaluator yet — env override only.
 * Backend flag: generation.legacy_format_picker (default off)
 */
export function isLegacyFormatPickerEnabled(env: {
  readonly VITE_LEGACY_FORMAT_PICKER?: string;
}): boolean {
  return env.VITE_LEGACY_FORMAT_PICKER === "true";
}

export function useLegacyFormatPickerEnabled(): boolean {
  return isLegacyFormatPickerEnabled(import.meta.env);
}
