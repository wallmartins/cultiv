import type { GenerationIntent } from "@my-ai-orchestrator/contracts";

/** Minimal briefing payloads for calibration sweeps (safe, generic copy). */
export const CALIBRATION_BRIEFINGS: Readonly<Record<GenerationIntent, Record<string, unknown>>> = {
  "share-idea": {
    topic: "Delegar decisões de produto sem perder alinhamento",
    audience: "lideranças de produto",
    angle: "Clareza de critérios antes de delegar"
  },
  "explain-deeply": {
    topic: "Como estruturar decisões de arquitetura em times pequenos",
    thesis: "Decisões explícitas reduzem retrabalho",
    audience: "engenheiros de software"
  },
  "engage-audience": {
    topic: "Monorepos atrasam times pequenos?",
    hypothesis: "A coordenação extra pode custar mais do que a duplicação evitada",
    question: "Você já viu monorepo acelerar ou travar seu time?"
  },
  "tell-story": {
    topic: "A primeira vez que deleguei uma decisão importante",
    hook: "Eu achava que controle era cuidado",
    beats: ["O conflito", "O aprendizado", "O novo ritual"]
  },
  "update-subscribers": {
    topic: "Novidades do produto neste mês",
    audience: "assinantes da newsletter",
    promise: "O que mudou e por quê",
    sections: ["Lançamentos", "Próximos passos"]
  },
  "document-decision": {
    systemContext: "Precisamos separar orquestração de produto da execução de runtime",
    tradeoffs: ["Mais contratos", "Menos drift", "Mais arquivos"],
    decision: "Adotar snapshots imutáveis entre preview e execução"
  }
};
