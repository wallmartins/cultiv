import type { ToastItem } from "@my-ai-orchestrator/shared";

// Identity = tema, nunca o formato (regra transversal do breakdown-15) — o toast ecoa só isso.
export function buildToastText(toast: ToastItem): string {
  if (toast.kind === "error") {
    const head = toast.topic ? `"${toast.topic}" não deu certo` : "uma geração não deu certo";
    return toast.message ? `${head} — ${toast.message}` : head;
  }
  return toast.topic ? `"${toast.topic}" ficou pronto` : "sua geração ficou pronta";
}
