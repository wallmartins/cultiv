import type { MarketingContentTypeId } from "../../marketing/content/content-types/catalog.js";

export type MarketingLocale = "pt" | "en";

export type FaqItem = {
  readonly id: string;
  readonly question: string;
  readonly answer: string;
};

export type ContentTypeLabels = Record<
  MarketingContentTypeId,
  { readonly label: string; readonly description: string }
>;

export type LocaleMessages = {
  readonly header: {
    readonly brand: string;
    readonly localeSwitch: string;
    readonly navLabel: string;
    readonly menuOpenLabel: string;
    readonly menuCloseLabel: string;
    readonly ctaWaitlist: string;
    readonly nav: {
      readonly territory: string;
      readonly route: string;
      readonly tools: string;
      readonly questions: string;
    };
  };
  readonly footer: {
    readonly privacy: string;
    readonly terms: string;
    readonly contact: string;
    readonly location: string;
    readonly description: string;
    readonly signature: string;
    readonly seal: string;
  };
  readonly hero: {
    readonly badge: string;
    readonly headline: string;
    readonly subheadline: string;
    readonly ctaPrimary: string;
    readonly ctaSecondary: string;
    readonly genericLabel: string;
    readonly voiceLabel: string;
    readonly genericLine1: string;
    readonly genericLine2: string;
    readonly voiceLine1: string;
    readonly voiceLine2: string;
    readonly comparisonLabel: string;
  };
  readonly territory: {
    readonly eyebrow: string;
    readonly title: string;
    readonly cards: ReadonlyArray<{
      readonly title: string;
      readonly body: string;
    }>;
  };
  readonly route: {
    readonly eyebrow: string;
    readonly title: string;
    readonly steps: ReadonlyArray<{
      readonly index: string;
      readonly title: string;
      readonly body: string;
    }>;
  };
  readonly tools: {
    readonly eyebrow: string;
    readonly title: string;
    readonly subtitle: string;
    readonly demo: {
      readonly stepLabels: readonly [string, string, string];
      readonly phases: ReadonlyArray<{
        readonly title: string;
        readonly subtitle: string;
        readonly intents?: ReadonlyArray<{
          readonly label: string;
          readonly description: string;
          readonly selected?: boolean;
        }>;
        readonly selectedIntentLabel?: string;
        readonly changeIntent?: string;
        readonly lengthTierLabel?: string;
        readonly lengthTiers?: ReadonlyArray<{
          readonly label: string;
          readonly selected?: boolean;
        }>;
        readonly channelLabel?: string;
        readonly channelOptional?: string;
        readonly channelValue?: string;
        readonly fields?: ReadonlyArray<{
          readonly label: string;
          readonly value: string;
        }>;
        readonly previewLabel?: string;
        readonly previewMode?: string;
        readonly previewCost?: string;
        readonly generateCta?: string;
      }>;
    };
  };
  readonly comparison: {
    readonly eyebrow: string;
    readonly title: string;
    readonly comparisonLabel: string;
    readonly verdict: string;
    readonly signature: string;
    readonly genericLabel: string;
    readonly voiceLabel: string;
    readonly genericLine1: string;
    readonly genericLine2: string;
    readonly voiceLine1: string;
    readonly voiceLine2: string;
    readonly genericNote: string;
    readonly voiceNote: string;
  };
  readonly testimonial: {
    readonly quote: string;
    readonly ps: string;
  };
  readonly pricing: {
    readonly eyebrow: string;
    readonly title: string;
    readonly cta: string;
    readonly recommendedBadge: string;
    readonly plans: ReadonlyArray<{
      readonly name: string;
      readonly badge?: string;
      readonly description: string;
      readonly features: ReadonlyArray<string>;
      readonly footer: string;
      readonly recommended?: boolean;
    }>;
  };
  readonly faq: {
    readonly eyebrow: string;
    readonly title: string;
    readonly items: ReadonlyArray<FaqItem>;
  };
  readonly waitlist: {
    readonly eyebrow: string;
    readonly title: string;
    readonly description: string;
    readonly emailLabel: string;
    readonly nameLabel: string;
    readonly namePlaceholder: string;
    readonly consentPrefix: string;
    readonly consentLink: string;
    readonly submit: string;
    readonly submitting: string;
    readonly success: string;
    readonly note: string;
    readonly errors: {
      readonly validation: string;
      readonly provider: string;
      readonly rateLimited: string;
    };
  };
  readonly contentTypes: ContentTypeLabels;
  readonly seo: {
    readonly homeTitle: string;
    readonly homeDescription: string;
    readonly privacyDescription: string;
    readonly termsDescription: string;
    readonly ogImageAlt: string;
  };
  readonly geo: {
    readonly brand: string;
    readonly productDefinition: string;
    readonly keyFacts: ReadonlyArray<string>;
    readonly llms: {
      readonly title: string;
      readonly fullTitle: string;
      readonly tagline: string;
      readonly summary: string;
      readonly category: string;
      readonly audience: string;
      readonly differentiatorLabel: string;
      readonly differentiator: string;
      readonly pricing: string;
      readonly headquarters: string;
      readonly citationNote: string;
      readonly fullFooter: string;
      readonly showcaseNote: string;
      readonly sections: {
        readonly product: string;
        readonly audience: string;
        readonly pricing: string;
        readonly facts: string;
        readonly formats: string;
        readonly formatsDetail: string;
        readonly urls: string;
        readonly contact: string;
        readonly productFlow: string;
        readonly overview: string;
        readonly showcase: string;
        readonly faq: string;
      };
      readonly labels: {
        readonly home: string;
        readonly privacy: string;
        readonly terms: string;
        readonly waitlist: string;
        readonly email: string;
        readonly location: string;
        readonly fullDoc: string;
        readonly alternateLocale: string;
      };
    };
  };
  readonly legal: {
    readonly privacyTitle: string;
    readonly termsTitle: string;
  };
};
