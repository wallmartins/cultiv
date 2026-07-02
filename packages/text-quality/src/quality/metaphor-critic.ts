import type { MetaphorSignature } from "@my-ai-orchestrator/contracts";
import type { CriticFinding } from "../types.js";

const METAPHOR_LEMMA_PATTERNS = [
  /\b(?:e como|like a|as if|just like|semelhante a)\s+(?:um|uma|o|a|the|an)\s+([a-z0-9]{4,})/gi,
  /\b(?:e como|like a|as if|just like|semelhante a)[^.!?]{0,40}?\b(?:um|uma|o|a|the|an)\s+([a-z0-9]{4,})/gi,
  /\b(?:parece um|parece uma|similar a)\s+([a-z0-9]{4,})/gi,
  /\b(?:imagina que|pensa em|pense em|think of|picture this|imagine que|imagine that)[^.!?]{0,100}?\b(?:um|uma|o|a|the|an)\s+([a-z0-9]{4,})/gi
] as const;

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function extractMetaphorLemmas(text: string): readonly string[] {
  const lemmas: string[] = [];
  const normalizedText = normalizeText(text);

  for (const pattern of METAPHOR_LEMMA_PATTERNS) {
    for (const match of normalizedText.matchAll(new RegExp(pattern.source, pattern.flags))) {
      const lemma = match[1]?.trim();
      if (lemma) {
        lemmas.push(normalizeText(lemma));
      }
    }
  }

  return lemmas;
}

function findRepeatedMetaphorLemmas(text: string): readonly string[] {
  const counts = new Map<string, number>();

  for (const lemma of extractMetaphorLemmas(text)) {
    counts.set(lemma, (counts.get(lemma) ?? 0) + 1);
  }

  return [...counts.entries()]
    .filter(([, count]) => count >= 2)
    .map(([lemma]) => lemma);
}

export function collectMetaphorFindings(
  signature: MetaphorSignature | undefined,
  text: string
): readonly CriticFinding[] {
  if (!signature) {
    return [];
  }

  const findings: CriticFinding[] = [];
  const normalized = normalizeText(text);

  for (const lemma of findRepeatedMetaphorLemmas(text)) {
    findings.push({
      type: "metaphor_repetition",
      severity: "medium",
      message: `Metaphor lemma "${lemma}" appears 2+ times`
    });
  }

  for (const domain of signature.avoidLiteralDomains) {
    const normalizedDomain = normalizeText(domain);
    if (normalizedDomain.length >= 4 && normalized.includes(normalizedDomain)) {
      findings.push({
        type: "metaphor_domain_leak",
        severity: "medium",
        message: `Text reuses calibration metaphor domain "${domain}"`
      });
    }
  }

  return findings;
}
