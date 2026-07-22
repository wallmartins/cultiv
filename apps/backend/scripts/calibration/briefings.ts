// Keys are descriptive calibration-scenario labels (not a contracts type) — the rhetorical
// genre axis these once mapped 1:1 to (`GenerationIntent`) was removed in the Practice Profile
// Phase 1 clean cut; several labels below now map onto the same `RhetoricalMode`.
/** Minimal briefing payloads for calibration sweeps (safe, generic copy). */
export const CALIBRATION_BRIEFINGS: Readonly<Record<string, Record<string, unknown>>> = {
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
  },

  // F6-2: one representative briefing per non-tech style span (ADR 0010 §9 / norte criterio-de-aceite
  // T1-T2) — anchored in field-specific resistance, not the field's own generic average (the average
  // IS the cliché). Additive only; existing keys/consumers above are untouched.
  "marketing-conversion-audit": {
    topic: "Por que um case de sucesso bem escrito ainda não converte",
    audience: "redatores e gestores de marketing",
    angle: "O texto vende quando mostra o antes e depois que move o NPS — não quando promete engajamento e autenticidade"
  },
  "climate-internal-adoption": {
    topic: "Por que o piloto de reciclagem corporativa não vira contrato",
    thesis: "A resistência não é falta de interesse: é o gestor não conseguir defender o orçamento pro próprio chefe",
    audience: "gestores de sustentabilidade"
  },
  "legal-clause-tradeoff": {
    systemContext: "A cláusula de rescisão calcula a multa sobre o saldo contratual total, não sobre o período restante",
    tradeoffs: [
      "Protege o caixa do contratante",
      "Pode ser lida como abusiva em revisão judicial (art. 413 do Código Civil)",
      "Renegociar agora custa menos que litigar depois"
    ],
    decision: "Recalcular a multa proporcional ao tempo restante e registrar a mudança em aditivo"
  }
};
