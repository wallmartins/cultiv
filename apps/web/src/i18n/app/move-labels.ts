import type { AppLocale } from "./types";

const MOVE_LABELS: Record<AppLocale, Readonly<Record<string, string>>> = {
  pt: {
    lived_experience: "Experiência vivida",
    experiencia_vivida: "Experiência vivida",
    doubt: "Dúvida",
    duvida: "Dúvida",
    experimentation: "Experimentação",
    experimentacao: "Experimentação",
    conclusion: "Conclusão",
    conclusao: "Conclusão",
    observation: "Observação",
    ambiguity: "Ambiguidade",
    ambiguidade: "Ambiguidade",
    delayed_conclusion: "Conclusão tardia",
    conclusao_tardia: "Conclusão tardia",
    moment: "Momento concreto",
    reflection: "Reflexão",
    reflexao: "Reflexão",
    open_end: "Fechamento aberto",
    thesis: "Tese",
    tese: "Tese",
    evidence: "Evidência",
    evidencia: "Evidência",
    close: "Fechamento",
    fechamento: "Fechamento"
  },
  en: {
    lived_experience: "Lived experience",
    experiencia_vivida: "Lived experience",
    doubt: "Doubt",
    duvida: "Doubt",
    experimentation: "Experimentation",
    experimentacao: "Experimentation",
    conclusion: "Conclusion",
    conclusao: "Conclusion",
    observation: "Observation",
    ambiguity: "Ambiguity",
    ambiguidade: "Ambiguity",
    delayed_conclusion: "Delayed conclusion",
    conclusao_tardia: "Delayed conclusion",
    moment: "Concrete moment",
    reflection: "Reflection",
    reflexao: "Reflection",
    open_end: "Open ending",
    thesis: "Thesis",
    tese: "Thesis",
    evidence: "Evidence",
    evidencia: "Evidence",
    close: "Closing",
    fechamento: "Closing"
  }
};

function formatMoveFallback(move: string): string {
  return move
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getMoveLabel(locale: AppLocale, move: string): string {
  const normalized = move.trim().toLowerCase();
  return MOVE_LABELS[locale][normalized] ?? MOVE_LABELS[locale][move] ?? formatMoveFallback(move);
}
