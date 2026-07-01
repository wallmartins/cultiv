export function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 0).length;
}

export function canAdvance(targetWords: number, wordCount: number): boolean {
  return wordCount >= targetWords * 0.5;
}
