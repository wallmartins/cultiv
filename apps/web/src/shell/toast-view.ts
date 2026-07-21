import type { ToastItem } from "@my-ai-orchestrator/shared";
import type { AppMessages } from "@my-ai-orchestrator/ui/app/i18n";

// Identity = tema, nunca o formato (regra transversal do breakdown-15) — o toast ecoa só isso.
export function buildToastText(t: AppMessages, toast: ToastItem): string {
  if (toast.kind === "error") {
    const head = t.shell.toast.failed(toast.topic);
    return toast.message ? t.shell.toast.withReason(head, toast.message) : head;
  }
  return t.shell.toast.ready(toast.topic);
}
