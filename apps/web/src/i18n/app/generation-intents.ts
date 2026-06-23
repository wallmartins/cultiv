import type {
  GenerationChannel,
  GenerationIntent,
  GenerationLengthTier
} from "@my-ai-orchestrator/contracts";
import type { AppLocale } from "./types";

export type AppGenerationIntentId = GenerationIntent;

export type AppGenerationLengthTierId = GenerationLengthTier;

export type AppGenerationChannelId = GenerationChannel;

export type AppGenerationIntentCopy = {
  readonly label: string;
  readonly description: string;
};

export type AppScopeOptionCopy = {
  readonly label: string;
  readonly description: string;
};

export const GENERATION_INTENT_IDS = [
  "share-idea",
  "explain-deeply",
  "engage-audience",
  "tell-story",
  "update-subscribers",
  "document-decision"
] as const satisfies readonly AppGenerationIntentId[];

export const GENERATION_LENGTH_TIER_IDS = ["short", "medium", "long"] as const satisfies readonly AppGenerationLengthTierId[];

export const GENERATION_CHANNEL_IDS = [
  "unspecified",
  "professional-network",
  "blog",
  "email",
  "social"
] as const satisfies readonly AppGenerationChannelId[];

const intentCopy: Record<AppLocale, Record<AppGenerationIntentId, AppGenerationIntentCopy>> = {
  pt: {
    "share-idea": {
      label: "Compartilhar descoberta",
      description: "Compartilhe uma descoberta, aprendizado ou insight com sua audiência."
    },
    "explain-deeply": {
      label: "Mapear conceito",
      description: "Desdobre um tema com estrutura e profundidade."
    },
    "engage-audience": {
      label: "Provocar conversa",
      description: "Abra espaço para reação, pergunta ou discussão."
    },
    "tell-story": {
      label: "Narrar jornada",
      description: "Conte uma narrativa em um ou mais momentos."
    },
    "update-subscribers": {
      label: "Atualizar exploradores",
      description: "Envie uma edição recorrente no estilo newsletter."
    },
    "document-decision": {
      label: "Documentar rota",
      description: "Registre uma decisão com contexto, alternativas e trade-offs."
    }
  },
  en: {
    "share-idea": {
      label: "Share a discovery",
      description: "Share a discovery, lesson, or insight with your audience."
    },
    "explain-deeply": {
      label: "Map a concept",
      description: "Unpack a topic with structure and depth."
    },
    "engage-audience": {
      label: "Spark conversation",
      description: "Open room for reaction, questions, or discussion."
    },
    "tell-story": {
      label: "Narrate a journey",
      description: "Tell a narrative across one or more beats."
    },
    "update-subscribers": {
      label: "Update your explorers",
      description: "Send a recurring edition in newsletter style."
    },
    "document-decision": {
      label: "Document a route",
      description: "Record a decision with context, alternatives, and trade-offs."
    }
  }
};

const lengthTierCopy: Record<AppLocale, Record<AppGenerationLengthTierId, AppScopeOptionCopy>> = {
  pt: {
    short: {
      label: "Curta",
      description: "Peça breve, poucos parágrafos."
    },
    medium: {
      label: "Média",
      description: "Profundidade padrão com espaço para desenvolver o argumento."
    },
    long: {
      label: "Longa",
      description: "Peça aprofundada com estrutura editorial."
    }
  },
  en: {
    short: {
      label: "Short",
      description: "Brief piece, a few paragraphs."
    },
    medium: {
      label: "Medium",
      description: "Standard depth with room to develop the argument."
    },
    long: {
      label: "Long",
      description: "In-depth piece with editorial structure."
    }
  }
};

const channelCopy: Record<AppLocale, Record<AppGenerationChannelId, AppScopeOptionCopy>> = {
  pt: {
    unspecified: {
      label: "Ainda não sei",
      description: "Escolha o canal depois ou deixe o sistema sugerir o formato."
    },
    "professional-network": {
      label: "Rede profissional",
      description: "LinkedIn e plataformas profissionais parecidas."
    },
    blog: {
      label: "Blog ou site",
      description: "Artigo ou publicação no seu site."
    },
    email: {
      label: "E-mail / newsletter",
      description: "Edição para assinantes ou comunicação por e-mail."
    },
    social: {
      label: "Rede social",
      description: "X, threads e formatos sociais curtos."
    }
  },
  en: {
    unspecified: {
      label: "Not sure yet",
      description: "Pick a channel later or let the system suggest a format."
    },
    "professional-network": {
      label: "Professional network",
      description: "LinkedIn and similar professional platforms."
    },
    blog: {
      label: "Blog or website",
      description: "Article or post on your site."
    },
    email: {
      label: "Email / newsletter",
      description: "Edition for subscribers or email communication."
    },
    social: {
      label: "Social network",
      description: "X, threads, and other short social formats."
    }
  }
};

function isGenerationIntentId(intentId: string): intentId is AppGenerationIntentId {
  return (GENERATION_INTENT_IDS as readonly string[]).includes(intentId);
}

function isGenerationLengthTierId(lengthTierId: string): lengthTierId is AppGenerationLengthTierId {
  return (GENERATION_LENGTH_TIER_IDS as readonly string[]).includes(lengthTierId);
}

function isGenerationChannelId(channelId: string): channelId is AppGenerationChannelId {
  return (GENERATION_CHANNEL_IDS as readonly string[]).includes(channelId);
}

export function getIntentCopy(
  locale: AppLocale,
  intentId: string
): AppGenerationIntentCopy | undefined {
  if (!isGenerationIntentId(intentId)) {
    return undefined;
  }

  return intentCopy[locale][intentId];
}

export function getIntentLabel(locale: AppLocale, intentId: string, fallback: string): string {
  return getIntentCopy(locale, intentId)?.label ?? fallback;
}

export function getIntentDescription(
  locale: AppLocale,
  intentId: string,
  fallback?: string
): string | undefined {
  return getIntentCopy(locale, intentId)?.description ?? fallback;
}

export function getLengthTierCopy(
  locale: AppLocale,
  lengthTierId: string
): AppScopeOptionCopy | undefined {
  if (!isGenerationLengthTierId(lengthTierId)) {
    return undefined;
  }

  return lengthTierCopy[locale][lengthTierId];
}

export function getLengthTierLabel(locale: AppLocale, lengthTierId: string, fallback: string): string {
  return getLengthTierCopy(locale, lengthTierId)?.label ?? fallback;
}

export function getLengthTierDescription(
  locale: AppLocale,
  lengthTierId: string,
  fallback?: string
): string | undefined {
  return getLengthTierCopy(locale, lengthTierId)?.description ?? fallback;
}

export function getChannelCopy(locale: AppLocale, channelId: string): AppScopeOptionCopy | undefined {
  if (!isGenerationChannelId(channelId)) {
    return undefined;
  }

  return channelCopy[locale][channelId];
}

export function getChannelLabel(locale: AppLocale, channelId: string, fallback: string): string {
  return getChannelCopy(locale, channelId)?.label ?? fallback;
}

export function getChannelDescription(
  locale: AppLocale,
  channelId: string,
  fallback?: string
): string | undefined {
  return getChannelCopy(locale, channelId)?.description ?? fallback;
}

function intentCollator(locale: AppLocale): Intl.Collator {
  return new Intl.Collator(locale === "pt" ? "pt-BR" : "en", { sensitivity: "base" });
}

export function compareIntentLabels(
  locale: AppLocale,
  left: { readonly id: string; readonly label: string },
  right: { readonly id: string; readonly label: string }
): number {
  return intentCollator(locale).compare(
    getIntentLabel(locale, left.id, left.label),
    getIntentLabel(locale, right.id, right.label)
  );
}

export function sortIntentsByLabel<T extends { readonly id: string; readonly label: string }>(
  locale: AppLocale,
  items: readonly T[]
): T[] {
  return [...items].sort((left, right) => compareIntentLabels(locale, left, right));
}
