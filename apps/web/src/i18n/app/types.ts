export type AppLocale = "pt" | "en";

export type MappedErrorMessages = {
  readonly title: string;
  readonly message: string;
  readonly action?: string;
};

export type AppShellMessages = {
  readonly nav: {
    readonly generate: string;
    readonly history: string;
    readonly voice: string;
    readonly settings: string;
    readonly billing: string;
    readonly logout: string;
  };
  readonly credits: { readonly label: string };
  readonly activeExecutions: {
    readonly title: string;
    readonly empty: string;
    readonly openDrawer: string;
    readonly closeDrawer: string;
    readonly statusQueued: string;
    readonly statusRunning: string;
    readonly statusDone: string;
    readonly statusFailed: string;
    readonly copy: string;
    readonly regenerate: string;
    readonly viewHistory: string;
    readonly retry: string;
    readonly noCreditsCharged: string;
    readonly observationFailure: string;
    readonly refresh: string;
    readonly hybridHint: string;
  };
  readonly sdk: {
    readonly unavailable: string;
    readonly retry: string;
  };
  readonly selectPlaceholder: string;
};

export type AppIntentWizardMessages = {
  readonly stepObjectiveTitle: string;
  readonly stepObjectiveSubtitle: string;
  readonly stepScopeTitle: string;
  readonly stepScopeSubtitle: string;
  readonly moreOptions: string;
  readonly lengthTier: string;
  readonly channel: string;
  readonly channelOptional: string;
  readonly channelExpand: string;
  readonly intentHelp: string;
  readonly back: string;
  readonly continue: string;
  readonly changeIntent: string;
  readonly catalogLoadError: string;
  readonly catalogRetry: string;
};

export type AppGenerateMessages = {
  readonly title: string;
  readonly contentType: string;
  readonly contentTypePlaceholder: string;
  readonly contentTypeHelp: string;
  readonly fieldHelp: string;
  readonly briefing: string;
  readonly catalogLoadError: string;
  readonly catalogRetry: string;
  readonly language: string;
  readonly qualityMode: string;
  readonly importedContext: string;
  readonly importedContextExpand: string;
  readonly importedContextCounter: string;
  readonly importedContextTooLarge: string;
  readonly previewTitle: string;
  readonly previewPrice: string;
  readonly previewBalance: string;
  readonly previewRefreshRecommendation: string;
  readonly previewRecommendationStale: string;
  readonly generate: string;
  readonly generateWithCredits: string;
  readonly calculating: string;
  readonly sending: string;
  readonly noCredits: string;
  readonly incomplete: string;
  readonly blocked: string;
  readonly startedToast: string;
  readonly guidanceTitle: string;
  readonly guidanceTips: string;
  readonly guidanceMistakes: string;
  readonly reminderBanner: string;
  readonly reminderBannerAction: string;
  readonly blockedReasons: {
    readonly planRestriction: string;
    readonly featureFlagDisabled: string;
    readonly subscriptionInactive: string;
    readonly qualityModePlanRestriction: string;
    readonly insufficientCredits: string;
  };
};

export type AppQualityModeMessages = {
  readonly fast: string;
  readonly balanced: string;
  readonly strict: string;
  readonly helper: string;
  readonly recommended: string;
  readonly help: string;
  readonly descriptions: {
    readonly fast: string;
    readonly balanced: string;
    readonly strict: string;
  };
  readonly unlockPlan: string;
  readonly insufficientCredits: string;
  readonly plans: {
    readonly free: string;
    readonly starter: string;
    readonly pro: string;
    readonly enterprise: string;
  };
};

export type AppHistoryMessages = {
  readonly title: string;
  readonly subtitle: string;
  readonly empty: string;
  readonly emptyAction: string;
  readonly error: string;
  readonly retry: string;
  readonly filters: {
    readonly period: string;
    readonly status: string;
    readonly contentType: string;
    readonly period7d: string;
    readonly period30d: string;
    readonly period90d: string;
    readonly periodAll: string;
    readonly statusAll: string;
    readonly statusDone: string;
    readonly statusFailed: string;
    readonly statusRunning: string;
    readonly statusQueued: string;
    readonly contentTypeAll: string;
  };
  readonly columns: {
    readonly format: string;
    readonly date: string;
    readonly mode: string;
    readonly credits: string;
    readonly status: string;
  };
  readonly detail: {
    readonly copy: string;
    readonly regenerate: string;
    readonly details: string;
    readonly executionId: string;
    readonly createdAt: string;
    readonly completedAt: string;
    readonly voiceConfidence: string;
    readonly adaptationMode: string;
    readonly progressSteps: string;
    readonly loading: string;
    readonly notFound: string;
  };
};

export type AppVoiceMessages = {
  readonly dashboardTitle: string;
  readonly dashboardSubtitle: string;
  readonly dashboardEmpty: string;
  readonly dashboardEmptyAction: string;
  readonly confidence: string;
  readonly confidencePanelTitle: string;
  readonly confidenceDialEyebrow: string;
  readonly confidenceDialSubline: {
    readonly high: string;
    readonly medium: string;
    readonly low: string;
    readonly none: string;
  };
  readonly confidenceLabels: {
    readonly high: string;
    readonly medium: string;
    readonly low: string;
    readonly none: string;
  };
  readonly confidenceContext: {
    readonly high: string;
    readonly medium: string;
    readonly low: string;
    readonly none: string;
  };
  readonly confidenceDescriptions: {
    readonly low: string;
    readonly medium: string;
    readonly high: string;
  };
  readonly toneLabels: {
    readonly informal: string;
    readonly formal: string;
  };
  readonly cadenceLabels: {
    readonly direct: string;
    readonly balanced: string;
    readonly measured: string;
  };
  readonly adaptationMode: string;
  readonly adaptationModeLabels: {
    readonly conservative: string;
    readonly standard: string;
  };
  readonly adaptationModeDescriptions: {
    readonly conservative: string;
    readonly standard: string;
  };
  readonly confidenceAdaptationLines: {
    readonly conservative: string;
    readonly standard: string;
  };
  readonly diagnostics: string;
  readonly reasonCodeMessages: {
    readonly insufficient_examples: string;
    readonly insufficient_diversity: string;
    readonly language_conflict: string;
  };
  readonly diagnosticsHealthy: {
    readonly highMultiFormat: string;
    readonly high: string;
    readonly default: string;
  };
  readonly coverage: string;
  readonly coverageMissingFormats: string;
  readonly coverageComplete: string;
  readonly underrepresented: string;
  readonly examplesTitle: string;
  readonly examplesEmpty: string;
  readonly examplesEmptyAction: string;
  readonly addExamples: string;
  readonly newExampleTitle: string;
  readonly editExampleTitle: string;
  readonly updatingBanner: string;
  readonly rebuildFailed: string;
  readonly upgradeSoon: string;
  readonly manageExamples: string;
  readonly mirrorFallbackTitle: string;
  readonly mirrorFallbackSubtitle: string;
  readonly detailLayers: {
    readonly formats: string;
    readonly antiPatterns: string;
    readonly profileHealth: string;
  };
  readonly nextStep: {
    readonly eyebrow: string;
    readonly matureMessage: string;
    readonly generateCta: string;
    readonly messages: {
      readonly add_more_examples: string;
      readonly add_examples_from_other_content_types: string;
      readonly review_conflicting_examples: string;
      readonly remove_pinned_example: string;
      readonly retry_batch_commit: string;
      readonly wait_for_profile_update: string;
      readonly upgrade_plan: string;
    };
    readonly ctas: {
      readonly add_more_examples: string;
      readonly add_examples_from_other_content_types: string;
      readonly review_conflicting_examples: string;
      readonly remove_pinned_example: string;
      readonly retry_batch_commit: string;
      readonly wait_for_profile_update: string;
      readonly upgrade_plan: string;
    };
  };
  readonly composer: {
    readonly addSlot: string;
    readonly save: string;
    readonly advanced: string;
    readonly removeSlot: string;
    readonly slotTitle: string;
    readonly text: string;
    readonly format: string;
    readonly formatHelp: string;
    readonly language: string;
    readonly context: string;
    readonly antiPatterns: string;
    readonly pinned: string;
    readonly required: string;
    readonly tooShort: string;
    readonly formatRequired: string;
    readonly languageRequired: string;
    readonly saving: string;
  };
  readonly consent: {
    readonly title: string;
    readonly body: string;
    readonly cancel: string;
    readonly accept: string;
  };
  readonly reasoning: {
    readonly title: string;
    readonly subtitle: string;
    readonly rebuilding: string;
    readonly failedKeepLast: string;
    readonly coreTitle: string;
    readonly developmentTitle: string;
    readonly developmentSubtitle: string;
    readonly developmentImmature: string;
    readonly epistemicPosture: string;
    readonly typicalMoves: string;
    readonly developmentTraits: {
      readonly labels: Record<
        | "openingMode"
        | "perspectiveShiftDensity"
        | "usesCounterexamples"
        | "selfQuestioning"
        | "insightTiming"
        | "usesAnalogies"
        | "closingMode",
        string
      >;
      readonly unknownGap: string;
      readonly authorityLinkLabel: string;
      readonly authorityLinkAction: string;
      readonly evidenceTitle: string;
      readonly gapsTitle: string;
      readonly gapsBody: string;
      readonly noEvidence: string;
      readonly exampleFallback: string;
      readonly exampleUnavailable: string;
      readonly manageExamplesLink: string;
      readonly evidenceHeading: (label: string, value?: string) => string;
      readonly exampleLabel: (contentType: string) => string;
      readonly enums: {
        readonly openingMode: Record<"observation" | "thesis" | "mixed", string>;
        readonly density: Record<"low" | "moderate" | "high", string>;
        readonly frequency: Record<"rare" | "occasional" | "common" | "dominant", string>;
        readonly insightTiming: Record<"early" | "moderate" | "late", string>;
        readonly closingMode: Record<"conclusion" | "open_question" | "mixed", string>;
      };
    };
    readonly traitConfirmation: {
      readonly title: string;
      readonly yes: string;
      readonly no: string;
      readonly unsure: string;
      readonly prompts: Record<
        | "openingMode"
        | "perspectiveShiftDensity"
        | "usesCounterexamples"
        | "selfQuestioning"
        | "insightTiming"
        | "usesAnalogies"
        | "closingMode",
        string
      >;
    };
    readonly certaintyLevel: string;
    readonly judgmentFrequency: string;
    readonly conclusionPace: string;
    readonly readerRelationship: string;
    readonly authoritySource: string;
    readonly register: string;
    readonly openingStyle: string;
    readonly technicalDensity: string;
    readonly antiPatternsTitle: string;
    readonly noAntiPatterns: string;
    readonly partialFormats: string;
    readonly refineHint: string;
    readonly enums: {
      readonly certaintyLevel: Record<"low" | "moderate" | "high", string>;
      readonly judgmentFrequency: Record<"low" | "moderate" | "high", string>;
      readonly conclusionPace: Record<"slow" | "moderate" | "fast", string>;
      readonly readerRelationship: Record<"peer" | "mentor" | "observer" | "collaborator" | "guide", string>;
      readonly authoritySource: Record<
        "personal_observation" | "lived_experience" | "data" | "reference" | "practice",
        string
      >;
      readonly register: Record<"formal" | "informal" | "technical" | "conversational", string>;
      readonly openingStyle: Record<"direct" | "contextual" | "provocative", string>;
      readonly technicalDensity: Record<"low" | "medium" | "high", string>;
      readonly epistemicPosture: Record<"exploratory" | "investigative" | "advocacy_mixed", string>;
    };
  };
};

export type AppOnboardingMessages = {
  readonly stepLabel: string;
  readonly step1Title: string;
  readonly step1Subtitle: string;
  readonly step2Title: string;
  readonly skip: string;
  readonly continue: string;
  readonly goGenerate: string;
  readonly confidence: string;
  readonly credits: string;
};

export type AppSettingsMessages = {
  readonly title: string;
  readonly profile: string;
  readonly email: string;
  readonly locale: string;
  readonly localePt: string;
  readonly localeEn: string;
  readonly privacy: string;
  readonly consentActive: string;
  readonly consentMissing: string;
  readonly revokeConsent: string;
  readonly revokeDisabled: string;
  readonly logout: string;
  readonly billing: string;
};

export type AppBillingMessages = {
  readonly title: string;
  readonly currentPlan: string;
  readonly planPro: string;
  readonly planFree: string;
  readonly creditsBalance: string;
  readonly upgradePro: string;
  readonly alreadyPro: string;
  readonly topUp: string;
  readonly topUpDescription: string;
  readonly topUpCta: string;
  readonly currencyLabel: string;
  readonly currency: {
    readonly brl: string;
    readonly usd: string;
  };
  readonly periodLabel: string;
  readonly periodMonthly: string;
  readonly periodAnnual: string;
  readonly paymentMethodLabel: string;
  readonly paymentCard: string;
  readonly paymentPix: string;
  readonly pixOnlyBrl: string;
  readonly annualInstallments: string;
  readonly checkoutSuccess: string;
  readonly checkoutCancel: string;
  readonly checkoutError: string;
  readonly redirecting: string;
  readonly loadError: string;
};

export type AppNotificationMessages = {
  readonly readyTitle: string;
  readonly readyAction: string;
};

export type AppErrorMessages = {
  readonly safetyInputBlocked: MappedErrorMessages;
  readonly safetyInputQuarantined: MappedErrorMessages;
  readonly quoteStale: MappedErrorMessages;
  readonly usageRestricted: MappedErrorMessages;
  readonly authenticationExpired: MappedErrorMessages;
  readonly voiceConsentRequired: MappedErrorMessages;
  readonly rateLimited: MappedErrorMessages;
  readonly serviceUnavailable: MappedErrorMessages;
  readonly observationFailure: MappedErrorMessages;
  readonly default: MappedErrorMessages;
};

export type AppExecutionStepMessages = {
  readonly label: string;
  readonly summary: string;
};

export type AppExecutionStepsMessages = {
  readonly fallback: { readonly summary: string };
  readonly queued: AppExecutionStepMessages;
  readonly analyze: AppExecutionStepMessages;
  readonly draft: AppExecutionStepMessages;
  readonly refine: AppExecutionStepMessages;
  readonly sanitize: AppExecutionStepMessages;
};

export type AppMessages = {
  readonly shell: AppShellMessages;
  readonly intentWizard: AppIntentWizardMessages;
  readonly generate: AppGenerateMessages;
  readonly qualityModes: AppQualityModeMessages;
  readonly executionSteps: AppExecutionStepsMessages;
  readonly history: AppHistoryMessages;
  readonly voice: AppVoiceMessages;
  readonly onboarding: AppOnboardingMessages;
  readonly settings: AppSettingsMessages;
  readonly billing: AppBillingMessages;
  readonly notifications: AppNotificationMessages;
  readonly errors: AppErrorMessages;
};
