import type { VoiceProfile } from "../types.js";
import { replaceEmDashesWithCommas } from "./em-dash.js";

export function humanizeText(text: string, voiceProfile?: VoiceProfile): string {
  const withMinimalRewrites = text
    .replace(/\s+/g, " ")
    .replace(/\s+([,.!?;:])/g, "$1")
    .replace(/\b(therefore|thus|moreover)\b/gi, (match) => match.toLowerCase())
    .replace(/\bAs an AI\b/gi, "")
    .replace(/\bComo uma IA\b/gi, "")
    .replace(/\bN[aã]o e ([^.,!?]+), e ([^.,!?]+)/giu, "$2.")
    .replace(/\bN[aã]o estou vendendo nada\b/giu, "")
    .replace(/\bO problema\b:\s*/giu, "")
    .replace(/\bA solu[cç][aã]o\b:\s*/giu, "")
    .replace(/^\*+\s*/, "")
    .replace(/\s*\*+$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (!voiceProfile) {
    return stripMetaPreamble(replaceEmDashesWithCommas(withMinimalRewrites));
  }

  return stripMetaPreamble(
    replaceEmDashesWithCommas(applyVoiceMarkers(withMinimalRewrites, voiceProfile))
  );
}

function applyVoiceMarkers(text: string, voiceProfile: VoiceProfile): string {
  let next = text;

  if (voiceProfile.tone === "concise") {
    next = next.replace(/\b(al[eé]m disso|por outro lado|em outras palavras)\b/giu, "");
  }

  next = applyUserLabels(next, voiceProfile);

  return next.replace(/\s{2,}/g, " ").trim();
}

function applyUserLabels(text: string, voiceProfile: VoiceProfile): string {
  let next = text;
  const labels = new Set((voiceProfile.userLabels ?? []).map((l) => l.toLowerCase()));

  if (labels.has("formal") || labels.has("profissional")) {
    next = next.replace(/\b(cara|mano|galera)\b/giu, "pessoal");
  }

  if (labels.has("pessoal") || labels.has("personal")) {
    next = next.replace(/\b(a empresa|a equipe|o time)\b/giu, "nós");
  }

  if (labels.has("técnico") || labels.has("technical")) {
    next = next.replace(/\b(coisa|negócio|parada)\b/giu, "componente");
  }

  return next;
}

export function refineText(text: string, voiceProfile?: VoiceProfile): string {
  let next = text
    .replace(/\s*,\s*,+/g, ", ")
    .replace(/\s+\./g, ".")
    .replace(/\?\s+[A-ZÀ-Ý]/gu, (match) => `. ${match.trim().slice(2)}`)
    .replace(/\b(o problema|a solu[cç][aã]o|onde estamos)\b:\s*/giu, "")
    .replace(/^\*+\s*/, "")
    .replace(/\s*\*+$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (!voiceProfile) {
    return stripMetaPreamble(replaceEmDashesWithCommas(next));
  }

  if (voiceProfile.constraints.includes("keep short, direct sentences")) {
    next = next.replace(/,\s+(que|porque|embora)\b/giu, ". $1");
  }

  if (voiceProfile.rules.includes("Apply minimal rewrites when removing LLM tics")) {
    next = next.replace(/\b(n[aã]o é [^.,!?]+, é )/giu, "");
  }

  return stripMetaPreamble(replaceEmDashesWithCommas(next.replace(/\s{2,}/g, " ").trim()));
}

const metaPreamblePatterns = [
  /^(?:aqui est[aá]|segue|abaixo est[aá]|esta é|essa é)\b[^:.!?\n]*[:.-]?\s*/iu,
  /^(?:eu vejo assim|minha leitura é esta|minha visão é esta)\s*[:.-]\s*/iu,
  /^(?:para o linkedin|para a newsletter|para o post|para o artigo)\s*[:,.-]\s*/iu,
  /^(?:uma vers[aã]o\s+(?:refinada|revisada|ajustada)|vers[aã]o\s+(?:refinada|revisada|ajustada))\b[^:.!?\n]*[:.-]?\s*/iu,
  /^(?:mantendo|preservando)\b[^:.!?\n]*(?:naturalidade|rigor|clareza|tom)\b[^:.!?\n]*[:.-]?\s*/iu
] as const;

function stripMetaPreamble(text: string): string {
  let next = text.trim();
  let changed = true;

  const applyMetaPatterns = () => {
    changed = false;

    for (const pattern of metaPreamblePatterns) {
      const updated = next.replace(pattern, "");
      if (updated !== next) {
        next = updated.trim();
        changed = true;
      }
    }
  };

  while (changed) {
    applyMetaPatterns();
  }

  let lower = next.toLowerCase();
  if (
    (lower.startsWith("aqui está") ||
      lower.startsWith("segue") ||
      lower.startsWith("abaixo está") ||
      lower.startsWith("uma versão refinada") ||
      lower.startsWith("versão refinada") ||
      lower.startsWith("uma versão revisada") ||
      lower.startsWith("versão revisada")) &&
    /^[^:\n]{0,220}:\s*/u.test(next)
  ) {
    next = next.replace(/^[^:\n]{0,220}:\s*/u, "").trim();
    changed = true;
  }

  while (changed) {
    applyMetaPatterns();
  }

  lower = next.toLowerCase();
  if (
    lower.startsWith("aqui está") ||
    lower.startsWith("segue") ||
    lower.startsWith("abaixo está") ||
    lower.startsWith("uma versão refinada") ||
    lower.startsWith("versão refinada") ||
    lower.startsWith("mantendo o rigor") ||
    lower.startsWith("mantendo a naturalidade")
  ) {
    next = next.replace(/^[^.!?\n]*[.!?]\s*/u, "").trim();
  }

  next = next.replace(/^(?:\*+\s*)+/, "").trim();
  return next;
}
