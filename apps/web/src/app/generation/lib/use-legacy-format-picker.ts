/**
 * Phase 1 alpha: no web feature-flag evaluator yet — DEV and VITE override only.
 * Backend flag: generation.legacy_format_picker
 */
export function useLegacyFormatPickerEnabled(): boolean {
  if (import.meta.env.VITE_LEGACY_FORMAT_PICKER === "true") {
    return true;
  }

  if (import.meta.env.VITE_LEGACY_FORMAT_PICKER === "false") {
    return false;
  }

  return import.meta.env.DEV;
}
