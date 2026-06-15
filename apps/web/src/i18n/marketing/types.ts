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
      readonly problem: string;
      readonly differentiators: string;
      readonly useCases: string;
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
    readonly headline: string;
    readonly subheadline: string;
    readonly ctaPrimary: string;
    readonly ctaSecondary: string;
  };
  readonly problem: {
    readonly eyebrow: string;
    readonly title: string;
    readonly perspectives: ReadonlyArray<{
      readonly index: string;
      readonly title: string;
      readonly body: string;
    }>;
  };
  readonly solutionBreath: {
    readonly handwrittenNote: string;
    readonly subtitle: string;
    readonly keywords: ReadonlyArray<{
      readonly phrase: string;
      readonly microcopy: string;
    }>;
  };
  readonly differentiators: {
    readonly eyebrow: string;
    readonly title: string;
    readonly chapters: ReadonlyArray<{
      readonly index: string;
      readonly title: string;
      readonly body: string;
    }>;
  };
  readonly useCases: {
    readonly eyebrow: string;
    readonly title: string;
    readonly cases: ReadonlyArray<{
      readonly badge: string;
      readonly title: string;
      readonly body: string;
    }>;
    readonly footnote: string;
  };
  readonly productFlow: {
    readonly eyebrow: string;
    readonly title: string;
    readonly outputLabel: string;
    readonly steps: ReadonlyArray<{
      readonly index: string;
      readonly title: string;
      readonly body: string;
    }>;
  };
  readonly socialProof: {
    readonly eyebrow: string;
    readonly title: string;
    readonly body: string;
  };
  readonly scenes: {
    readonly genericOutput: {
      readonly chatTitle: string;
      readonly assistantName: string;
      readonly recentRepliesLabel: string;
      readonly repeatToneLabel: string;
      readonly lines: readonly [string, string, string];
    };
    readonly fragilePrompt: {
      readonly chatTitle: string;
      readonly userAvatarLabel: string;
      readonly userMessagePreview: string;
      readonly newChatHint: string;
      readonly composerLabel: string;
      readonly sendLabel: string;
      readonly fragments: readonly [string, string, string, string];
    };
    readonly teachVoice: {
      readonly centerLabel: string;
      readonly examples: ReadonlyArray<{
        readonly title: string;
        readonly meta: string;
      }>;
    };
    readonly briefing: {
      readonly label: string;
      readonly format: string;
      readonly objective: string;
      readonly audience: string;
      readonly formatTab: string;
      readonly objectiveTab: string;
      readonly audienceTab: string;
      readonly angleTab: string;
      readonly placeholder: string;
      readonly previewAction: string;
      readonly productLabel: string;
      readonly breadcrumb: string;
      readonly screenTitle: string;
      readonly stepIndicator: string;
      readonly draftSaved: string;
      readonly angleHelper: string;
      readonly voiceStatus: string;
      readonly audienceChips: readonly string[];
      readonly addAudienceLabel: string;
    };
    readonly previewConfidence: {
      readonly label: string;
      readonly productLabel: string;
      readonly breadcrumb: string;
      readonly screenTitle: string;
      readonly stepIndicator: string;
      readonly readyStatus: string;
      readonly formatRecap: string;
      readonly creditsAmount: string;
      readonly creditsCaption: string;
      readonly matchBadge: string;
      readonly matchCaption: string;
      readonly draftLabel: string;
      readonly draftLines: readonly string[];
      readonly toneAssurance: string;
      readonly backAction: string;
      readonly confirm: string;
      readonly footnote: string;
    };
  };
  readonly contentTypes: ContentTypeLabels;
  readonly faq: {
    readonly eyebrow: string;
    readonly title: string;
    readonly description?: string;
    readonly items: ReadonlyArray<FaqItem>;
  };
  readonly showcase: {
    readonly genericLabel: string;
    readonly voiceLabel: string;
    readonly stampLabel: string;
    readonly stampValue: string;
    readonly waveformScript: string;
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
