// UI never shows raw "créditos" — always "~N textos".
export function creditsAsTexts(availableCredits: number, canonicalCreditCost: number): number {
  if (canonicalCreditCost <= 0) return 0;
  return Math.floor(availableCredits / canonicalCreditCost);
}
