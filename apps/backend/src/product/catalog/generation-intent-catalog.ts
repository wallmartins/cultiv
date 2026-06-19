import type { GenerationIntent, GenerationIntentCatalogItem } from "@my-ai-orchestrator/contracts";
import { defaultLengthTierForIntent } from "../generation/intent-resolver.js";
import { INTENT_BRIEFING_PRESETS } from "./intent-briefing-presets.js";

const FEATURED_INTENTS: readonly GenerationIntent[] = [
  "share-idea",
  "explain-deeply",
  "engage-audience",
  "tell-story",
  "update-subscribers"
];

const CATALOG_INTENTS: readonly GenerationIntent[] = [...FEATURED_INTENTS, "document-decision"];

const INTENT_CATALOG_COPY: Readonly<
  Record<GenerationIntent, Readonly<Record<"pt-BR" | "en-US", { readonly label: string; readonly description: string }>>>
> = {
  "share-idea": {
    "pt-BR": {
      label: "Compartilhar uma ideia",
      description: "Opinião, aprendizado ou insight para uma audiência."
    },
    "en-US": {
      label: "Share an idea",
      description: "Opinion, lesson, or takeaway for an audience."
    }
  },
  "explain-deeply": {
    "pt-BR": {
      label: "Explicar com profundidade",
      description: "Ensinar ou desdobrar um tema com estrutura."
    },
    "en-US": {
      label: "Explain in depth",
      description: "Teach or unpack a topic with structure."
    }
  },
  "engage-audience": {
    "pt-BR": {
      label: "Engajar a audiência",
      description: "Provocar reação, pergunta ou discussão."
    },
    "en-US": {
      label: "Engage your audience",
      description: "Spark reaction, question, or discussion."
    }
  },
  "tell-story": {
    "pt-BR": {
      label: "Contar uma história",
      description: "Narrativa em um ou mais momentos."
    },
    "en-US": {
      label: "Tell a story",
      description: "Narrative across one or more beats."
    }
  },
  "update-subscribers": {
    "pt-BR": {
      label: "Atualizar assinantes",
      description: "Edição recorrente ou atualização no estilo newsletter."
    },
    "en-US": {
      label: "Update subscribers",
      description: "Recurring edition or newsletter-style update."
    }
  },
  "document-decision": {
    "pt-BR": {
      label: "Registrar uma decisão",
      description: "Documentar uma decisão técnica com contexto e trade-offs."
    },
    "en-US": {
      label: "Document a decision",
      description: "Record a technical decision with context and trade-offs."
    }
  }
};

function resolveLocaleCopy(locale: string): "pt-BR" | "en-US" {
  return locale.startsWith("en") ? "en-US" : "pt-BR";
}

export function buildGenerationIntentCatalogView(locale: string): readonly GenerationIntentCatalogItem[] {
  const localeKey = resolveLocaleCopy(locale);

  return CATALOG_INTENTS.map((intent) => {
    const preset = INTENT_BRIEFING_PRESETS[intent];
    const copy = INTENT_CATALOG_COPY[intent][localeKey];

    return {
      id: intent,
      label: copy.label,
      description: copy.description,
      defaultLengthTier: defaultLengthTierForIntent(intent),
      featured: FEATURED_INTENTS.includes(intent),
      inputSchema: [...preset.inputSchema],
      briefingGuidance: preset.briefingGuidance
    };
  });
}
