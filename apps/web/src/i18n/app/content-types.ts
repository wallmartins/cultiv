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
      label: "Publicação profissional",
      description:
        "Compartilhe uma ideia ou aprendizado com sua rede em poucos parágrafos. Ideal para LinkedIn e redes profissionais."
    },
    "validation-post": {
      label: "Teste de ideia",
      description:
        "Teste uma hipótese com sua audiência antes de investir em um conteúdo maior. Use contexto, pergunta e evidência."
    },
    "architecture-post": {
      label: "Explicar uma decisão",
      description:
        "Documente uma escolha com contexto, alternativas consideradas e o motivo da decisão."
    },
    "long-form-blog": {
      label: "Artigo aprofundado",
      description: "Desenvolva um argumento com estrutura editorial e profundidade além do post rápido."
    },
    "twitter-thread": {
      label: "Sequência de posts",
      description:
        "Conte uma história ou argumento em vários posts curtos em sequência. Funciona no X e formatos parecidos."
    },
    newsletter: {
      label: "Edição de newsletter",
      description: "Organize uma edição com seções claras e tom de newsletter para assinantes."
    }
  },
  en: {
    "linkedin-post": {
      label: "Professional update",
      description:
        "Share an idea or lesson with your network in a few paragraphs. Best for LinkedIn and professional platforms."
    },
    "validation-post": {
      label: "Idea validation",
      description:
        "Test a hypothesis with your audience before investing in a longer piece. Use context, a question, and evidence."
    },
    "architecture-post": {
      label: "Explain a decision",
      description: "Document a choice with context, alternatives considered, and why you decided."
    },
    "long-form-blog": {
      label: "In-depth article",
      description: "Develop an argument with editorial structure and depth beyond a quick post."
    },
    "twitter-thread": {
      label: "Post series",
      description:
        "Tell a story or build an argument across several short posts in sequence. Works on X and similar formats."
    },
    newsletter: {
      label: "Newsletter edition",
      description: "Organize an edition with clear sections and a newsletter tone for subscribers."
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
