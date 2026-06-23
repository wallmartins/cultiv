import type { AppLocale } from "./types";

export type AppContentTypeId =
  | "linkedin-post"
  | "twitter-thread"
  | "long-form-blog"
  | "newsletter"
  | "validation-post"
  | "architecture-post";

export type AppContentTypeCopy = {
  readonly label: string;
  readonly description: string;
};

const copy: Record<AppLocale, Record<AppContentTypeId, AppContentTypeCopy>> = {
  pt: {
    "linkedin-post": {
      label: "Post LinkedIn",
      description:
        "Compartilhe uma descoberta ou aprendizado com sua rede em poucos parágrafos."
    },
    "validation-post": {
      label: "Teste de ideia",
      description:
        "Teste uma hipótese com sua audiência antes de investir em um conteúdo maior."
    },
    "architecture-post": {
      label: "Documentar decisão",
      description:
        "Registre uma escolha com contexto, alternativas consideradas e trade-offs."
    },
    "long-form-blog": {
      label: "Artigo aprofundado",
      description: "Desenvolva um argumento com estrutura editorial e profundidade."
    },
    "twitter-thread": {
      label: "Thread Twitter",
      description:
        "Conte uma história ou argumento em vários posts curtos em sequência."
    },
    newsletter: {
      label: "Newsletter",
      description: "Organize uma edição com seções claras para seus exploradores."
    }
  },
  en: {
    "linkedin-post": {
      label: "LinkedIn post",
      description:
        "Share a discovery or lesson with your network in a few paragraphs."
    },
    "validation-post": {
      label: "Idea test",
      description:
        "Test a hypothesis with your audience before investing in a longer piece."
    },
    "architecture-post": {
      label: "Document a decision",
      description:
        "Record a choice with context, alternatives considered, and trade-offs."
    },
    "long-form-blog": {
      label: "In-depth article",
      description: "Develop an argument with editorial structure and depth."
    },
    "twitter-thread": {
      label: "Twitter thread",
      description:
        "Tell a story or build an argument across several short posts in sequence."
    },
    newsletter: {
      label: "Newsletter",
      description: "Organize an edition with clear sections for your explorers."
    }
  }
};

export function getContentTypeCopy(
  locale: AppLocale,
  contentTypeId: string
): AppContentTypeCopy | undefined {
  return (copy[locale] as Record<string, AppContentTypeCopy | undefined>)[contentTypeId];
}

export function getContentTypeLabel(locale: AppLocale, contentTypeId: string, fallback: string): string {
  return getContentTypeCopy(locale, contentTypeId)?.label ?? fallback;
}

export function getContentTypeDescription(
  locale: AppLocale,
  contentTypeId: string,
  fallback?: string
): string | undefined {
  return getContentTypeCopy(locale, contentTypeId)?.description ?? fallback;
}

function contentTypeCollator(locale: AppLocale): Intl.Collator {
  return new Intl.Collator(locale === "pt" ? "pt-BR" : "en", { sensitivity: "base" });
}

export function compareContentTypeLabels(
  locale: AppLocale,
  left: { readonly id: string; readonly label: string },
  right: { readonly id: string; readonly label: string }
): number {
  return contentTypeCollator(locale).compare(
    getContentTypeLabel(locale, left.id, left.label),
    getContentTypeLabel(locale, right.id, right.label)
  );
}

export function sortContentTypesByLabel<T extends { readonly id: string; readonly label: string }>(
  locale: AppLocale,
  items: readonly T[]
): T[] {
  return [...items].sort((left, right) => compareContentTypeLabels(locale, left, right));
}
