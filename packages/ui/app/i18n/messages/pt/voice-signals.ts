// Backend voice signals arrive as raw slugs. antiPatterns are an open set (author- and
// model-authored free text), so unknown values fall back to a humanized form — see voiceSignalLabel.
export const voiceSignals = {
  "first-person": "Primeira pessoa",
  "first-person narrative": "Narrativa em primeira pessoa",
  "short-paragraphs": "Parágrafos curtos",
  "short paragraphs": "Parágrafos curtos",
  "direct-address": "Fala direto com o leitor",
  "direct opening": "Abertura direta",
  "author-selected-reference": "Referências escolhidas pelo autor",
  prefer_first_person_when_relevant: "Primeira pessoa quando fizer sentido",
  prefer_conservative_voice_adaptation: "Adaptação conservadora da voz",
  prefer_shorter_paragraphs: "Preferir parágrafos mais curtos",
  avoid_mixing_languages_without_context: "Não misturar idiomas sem contexto",
  preserve_target_language: "Manter o idioma do texto",
  avoid_voice_caricature: "Sem caricatura da voz",
  preserve_author_voice: "Preservar a voz do autor",
  "forced tech metaphors unrelated to the topic": "Metáforas técnicas forçadas fora do tema",
  "language drift": "Deriva de idioma"
};
