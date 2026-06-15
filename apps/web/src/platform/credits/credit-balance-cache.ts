type CreditBalanceListener = () => void;

let cachedBalance: number | null = null;
let inFlight: Promise<number> | null = null;
const listeners = new Set<CreditBalanceListener>();

export function getCachedCreditBalance(): number | null {
  return cachedBalance;
}

export function setCachedCreditBalance(balance: number): void {
  cachedBalance = balance;
  notifyCreditBalanceListeners();
}

export function invalidateCreditBalanceCache(): void {
  cachedBalance = null;
  inFlight = null;
  notifyCreditBalanceListeners();
}

export function getCreditBalanceInFlight(): Promise<number> | null {
  return inFlight;
}

export function setCreditBalanceInFlight(promise: Promise<number> | null): void {
  inFlight = promise;
}

export function subscribeCreditBalance(listener: CreditBalanceListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifyCreditBalanceListeners(): void {
  for (const listener of listeners) {
    listener();
  }
}
