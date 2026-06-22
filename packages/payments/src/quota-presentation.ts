export function resolveQuotaCost(creditPrice: number, canonicalCreditCost: number): number {
  if (canonicalCreditCost <= 0) {
    return 1;
  }

  return Math.max(1, Math.ceil(creditPrice / canonicalCreditCost));
}

export function resolveQuotaRemaining(availableCredits: number, canonicalCreditCost: number): number {
  if (canonicalCreditCost <= 0) {
    return 0;
  }

  return Math.max(0, Math.floor(availableCredits / canonicalCreditCost));
}

export function resolveQuotaLimit(monthlyCredits: number, canonicalCreditCost: number): number {
  if (canonicalCreditCost <= 0) {
    return 0;
  }

  return Math.max(1, Math.floor(monthlyCredits / canonicalCreditCost));
}
