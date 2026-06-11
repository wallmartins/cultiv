import type { MarketingContentTypeId } from "../content/content-types/catalog.js";

export type MarketingLocale = "pt" | "en";

export type MethodStep = {
  readonly index: string;
  readonly title: string;
  readonly body: string;
};

export type FaqItem = {
  readonly id: string;
  readonly question: string;
  readonly answer: string;
};

export type HeroSlogan = {
  readonly prefix: string;
  readonly keywords: readonly string[];
  readonly suffix: string;
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
    readonly nav: {
      readonly about: string;
      readonly formats: string;
      readonly showcase: string;
      readonly faq: string;
      readonly waitlist: string;
    };
  };
  readonly footer: {
    readonly privacy: string;
    readonly terms: string;
    readonly contact: string;
    readonly location: string;
  };
  readonly hero: {
    readonly techLabel: string;
    readonly handwrittenNote: string;
    readonly slogan: HeroSlogan;
    readonly scrollCue: string;
  };
  readonly about: {
    readonly eyebrow: string;
    readonly title: string;
    readonly highlight: string;
    readonly intro: string;
    readonly detail: string;
  };
  readonly formats: {
    readonly eyebrow: string;
    readonly title: string;
    readonly description: string;
    readonly note: string;
    readonly stampLabel: string;
    readonly stampValue: string;
    readonly types: ContentTypeLabels;
  };
  readonly method: {
    readonly eyebrow: string;
    readonly steps: ReadonlyArray<MethodStep>;
  };
  readonly faq: {
    readonly eyebrow: string;
    readonly title: string;
    readonly description?: string;
    readonly items: ReadonlyArray<FaqItem>;
  };
  readonly showcase: {
    readonly eyebrow: string;
    readonly title: string;
    readonly description: string;
    readonly scrollHint: string;
    readonly genericLabel: string;
    readonly voiceLabel: string;
    readonly stampLabel: string;
    readonly stampValue: string;
    readonly waveformScript: string;
    readonly viewFullSample: string;
    readonly closeModal: string;
    readonly threadMorePosts: string;
    readonly proseMoreBlocks: string;
    readonly linkedInAuthorName: string;
    readonly linkedInAuthorMeta: string;
  };
  readonly legal: {
    readonly privacyTitle: string;
    readonly termsTitle: string;
  };
  readonly seo: {
    readonly homeTitle: string;
    readonly homeDescription: string;
    readonly privacyDescription: string;
    readonly termsDescription: string;
    readonly ogImageAlt: string;
  };
  readonly geo: {
    readonly brand: string;
    readonly citationLabel: string;
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
        readonly method: string;
        readonly about: string;
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
  readonly waitlist: {
    readonly eyebrow: string;
    readonly titleLines: readonly [string, string];
    readonly description: string;
    readonly stampLabel: string;
    readonly stampValue: string;
    readonly emailLabel: string;
    readonly nameLabel: string;
    readonly namePlaceholder: string;
    readonly consentPrefix: string;
    readonly consentLink: string;
    readonly submit: string;
    readonly submitting: string;
    readonly success: string;
    readonly errors: {
      readonly validation: string;
      readonly provider: string;
      readonly rateLimited: string;
    };
  };
};
