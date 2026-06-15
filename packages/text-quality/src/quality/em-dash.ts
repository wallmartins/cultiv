const EM_DASH_SEPARATOR_PATTERN = /\s*[\u2014\u2013]\s*/g;

export function containsEmDash(text: string): boolean {
  return /[\u2014\u2013]/.test(text);
}

export function countEmDashes(text: string): number {
  return text.match(/[\u2014\u2013]/g)?.length ?? 0;
}

export function replaceEmDashesWithCommas(text: string): string {
  return text
    .replace(EM_DASH_SEPARATOR_PATTERN, ", ")
    .replace(/,\s*,+/g, ", ")
    .replace(/\s+,/g, ",")
    .replace(/,\s+([.!?])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
}
