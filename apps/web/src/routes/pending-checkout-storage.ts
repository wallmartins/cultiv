const STORAGE_KEY = "cultiv:pending-checkout";

// Sem imports de propósito: a raiz do router lê isto de forma síncrona pra decidir se vale a pena
// baixar o watcher (que puxa o SDK e o overlay de checkout). Manter este módulo sem dependências
// é o que mantém esse custo fora do chunk inicial.
//
// Mesma política best-effort do calibrate-view: private-mode Safari e o jsdom dos testes podem
// lançar no acesso. Perder o handle só custa o aviso de falha, nunca a cobrança em si.
export function rememberPendingCheckout(intentId: string): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, intentId);
  } catch {
    // ignore
  }
}

export function forgetPendingCheckout(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function readPendingCheckout(): string | undefined {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? undefined;
  } catch {
    return undefined;
  }
}
