import type { AppMessages } from "../types";

export const appMessagesEn: AppMessages = {
  shell: {
    nav: {
      generate: "Generate",
      history: "History",
      voice: "Voice",
      settings: "Settings",
      billing: "Billing",
      logout: "Sign out"
    },
    credits: { label: "credits" },
    activeExecutions: {
      title: "In progress",
      empty: "No active generations",
      openDrawer: "Open in-progress generations",
      closeDrawer: "Close in-progress generations",
      statusQueued: "Queued",
      statusRunning: "Generating",
      statusDone: "Ready",
      statusFailed: "Failed",
      copy: "Copy",
      regenerate: "Regenerate",
      viewHistory: "View full history",
      retry: "Try again",
      noCreditsCharged: "No credits were charged.",
      observationFailure: "We lost connection to the generation.",
      refresh: "Refresh",
      hybridHint:
        "You can leave this screen — we'll notify you when the text is ready. Or stay here and follow each step below."
    },
    sdk: {
      unavailable: "Could not connect to the server. Some data may be out of date.",
      retry: "Try again"
    },
    selectPlaceholder: "Select an option"
  },
  intentWizard: {
    stepObjectiveTitle: "What do you want to do?",
    stepObjectiveSubtitle: "Choose the main goal for this piece.",
    stepScopeTitle: "Length and channel",
    stepScopeSubtitle: "Set the length. Channel is optional.",
    moreOptions: "More options",
    lengthTier: "Length",
    channel: "Channel",
    channelOptional: "Optional",
    channelExpand: "Choose channel",
    intentHelp: "About this goal",
    back: "Back",
    continue: "Continue",
    changeIntent: "Change goal",
    catalogLoadError: "Could not load generation goals.",
    catalogRetry: "Try again"
  },
  generate: {
    title: "Generate",
    contentType: "Format",
    contentTypePlaceholder: "Select a format",
    contentTypeHelp: "About this format",
    fieldHelp: "About this field",
    briefing: "Briefing",
    catalogLoadError: "Could not load content formats.",
    catalogRetry: "Try again",
    language: "Text language",
    qualityMode: "Mode",
    importedContext: "Reference material",
    importedContextExpand: "Add reference material",
    importedContextCounter: "{count} / 8000",
    importedContextTooLarge: "Reference material must be at most 8,000 characters.",
    previewTitle: "Preview",
    previewPrice: "Price: {price} credits",
    previewBalance: "Balance: {current} → {projected}",
    previewQuota: "Uses ~{cost} generation(s) · About {remaining} of {limit} remaining",
    previewRefreshRecommendation: "Refresh recommendation",
    previewRecommendationStale: "Briefing changed — refresh the mode recommendation.",
    generate: "Generate text",
    generateWithCredits: "Generate text ({price} credits)",
    calculating: "Calculating…",
    sending: "Sending…",
    noCredits: "No credits",
    incomplete: "Fill in required fields",
    blocked: "Material blocked",
    startedToast: "Generation started",
    guidanceTitle: "How to fill in",
    guidanceTips: "Tips",
    guidanceMistakes: "Avoid",
    reminderBanner: "Your voice has not been taught yet. Add examples to improve results.",
    reminderBannerAction: "Teach my voice",
    blockedReasons: {
      planRestriction: "Unavailable on your plan",
      featureFlagDisabled: "Feature temporarily unavailable",
      subscriptionInactive: "Subscription inactive",
      qualityModePlanRestriction: "Available on a higher plan",
      insufficientCredits: "Insufficient credits"
    }
  },
  qualityModes: {
    fast: "Light",
    balanced: "Balanced",
    strict: "Polished",
    helper: "All modes preserve your voice; mode affects depth and review.",
    recommended: "Recommended",
    help: "About this mode",
    descriptions: {
      fast: "Fastest, most economical generation with lighter review.",
      balanced: "Balance between speed and depth, with moderate review.",
      strict: "Maximum depth and review for complex requests."
    },
    unlockPlan: "Available on the {plan} plan and above.",
    insufficientCredits: "Not enough credits to use this mode right now.",
    plans: {
      free: "Free",
      starter: "Starter",
      pro: "Pro",
      enterprise: "Enterprise"
    }
  },
  executionSteps: {
    fallback: {
      summary: "We're processing this step of the generation."
    },
    queued: {
      label: "Queued",
      summary: "Your request is queued and will start processing shortly."
    },
    analyze: {
      label: "Briefing analysis",
      summary: "We organize topic, goal, and reference material to guide the draft."
    },
    draft: {
      label: "Draft",
      summary: "We generate the first version aligned with your voice profile and format."
    },
    refine: {
      label: "Refinement",
      summary: "We tune tone, clarity, and voice alignment before the final pass."
    },
    sanitize: {
      label: "Final review",
      summary: "We run safety and consistency checks before delivering the result."
    }
  },
  history: {
    title: "History",
    subtitle: "Your past generations.",
    empty: "No generations yet.",
    emptyAction: "Go to Generate",
    error: "Could not load history.",
    retry: "Try again",
    filters: {
      period: "Period",
      status: "Status",
      contentType: "Format",
      period7d: "7 days",
      period30d: "30 days",
      period90d: "90 days",
      periodAll: "All time",
      statusAll: "All",
      statusDone: "Completed",
      statusFailed: "Failed",
      statusRunning: "In progress",
      statusQueued: "Queued",
      contentTypeAll: "All formats"
    },
    columns: {
      format: "Format",
      date: "Date",
      mode: "Mode",
      credits: "Credits",
      status: "Status"
    },
    detail: {
      copy: "Copy",
      regenerate: "Regenerate",
      details: "Details",
      executionId: "Execution ID",
      createdAt: "Created at",
      completedAt: "Completed at",
      voiceConfidence: "Voice confidence",
      adaptationMode: "Adaptation mode",
      progressSteps: "Steps",
      loading: "Loading execution…",
      notFound: "Execution not found."
    }
  },
  voice: {
    dashboardTitle: "Voice",
    dashboardSubtitle: "How Cultiv reads your writing and what to cultivate next.",
    dashboardEmpty:
      "You do not have a voice profile yet. Add samples of your writing so the AI can learn how you write.",
    dashboardEmptyAction: "Add your first example",
    manageExamples: "Manage examples",
    mirrorFallbackTitle: "Your voice today",
    mirrorFallbackSubtitle:
      "With more examples, Cultiv will also describe how you think and argue.",
    detailLayers: {
      formats: "By format",
      antiPatterns: "What to avoid",
      profileHealth: "Profile health"
    },
    nextStep: {
      eyebrow: "Next step",
      matureMessage:
        "Your voice is well represented. The natural next step is to generate content with it.",
      generateCta: "Generate content",
      messages: {
        add_more_examples:
          "More examples make your voice more predictable and consistent in generations.",
        add_examples_from_other_content_types:
          "A sample in another format helps Cultiv read you across more contexts.",
        review_conflicting_examples:
          "Some examples pull your voice in different directions. Reviewing the set may help.",
        remove_pinned_example:
          "Too many pinned examples for your current base size. Consider unpinning one.",
        retry_batch_commit: "The last batch save did not finish. Try submitting the examples again.",
        wait_for_profile_update: "We are recalculating your voice from your latest examples.",
        upgrade_plan: "Your current plan limits how many examples feed your profile."
      },
      ctas: {
        add_more_examples: "Add example",
        add_examples_from_other_content_types: "Add another format",
        review_conflicting_examples: "Review examples",
        remove_pinned_example: "View examples",
        retry_batch_commit: "Try again",
        wait_for_profile_update: "Recalculating…",
        upgrade_plan: "Coming soon"
      }
    },
    confidence: "Confidence",
    confidencePanelTitle: "Confidence in your voice",
    confidenceDialEyebrow: "Confidence",
    confidenceDialSubline: {
      high: "strong roots",
      medium: "taking shape",
      low: "sprouting",
      none: "seeding"
    },
    confidenceLabels: {
      high: "High",
      medium: "Medium",
      low: "Low",
      none: "—"
    },
    confidenceContext: {
      low: "Profile forming — each new example brings Cultiv closer to your real style.",
      medium:
        "Your voice already shows up in generations; examples in other formats can still refine it.",
      high: "Your example base is solid. Cultiv can already adapt your voice confidently in generations.",
      none: "Add examples so Cultiv can start reading your voice."
    },
    confidenceDescriptions: {
      low: "Profile forming: {tone} tone with {cadence}. More varied examples help the AI reproduce your voice more reliably in generations.",
      medium:
        "Solid profile: {tone} tone with {cadence}. Your voice already shows up in generations, but examples in other formats can still refine it.",
      high: "Mature profile: {tone} tone with {cadence}. Signals are consistent across samples — the AI can adapt your voice confidently in new content."
    },
    toneLabels: {
      informal: "informal and reader-close",
      formal: "formal and objective"
    },
    cadenceLabels: {
      direct: "short, direct sentences",
      balanced: "a balanced pace between brevity and detail",
      measured: "longer, more elaborate sentences"
    },
    adaptationMode: "Adaptation mode",
    adaptationModeLabels: {
      conservative: "Conservative",
      standard: "Standard"
    },
    adaptationModeDescriptions: {
      conservative:
        "The AI stays close to your examples and avoids extrapolating when the sample base is still limited.",
      standard:
        "The AI applies your voice more freely while preserving tone and cadence in the formats you request."
    },
    confidenceAdaptationLines: {
      conservative: "Conservative adaptation: Cultiv prefers to stay very close to your examples.",
      standard: "Balanced adaptation between staying faithful to examples and flexing across formats."
    },
    diagnostics: "Diagnostics",
    reasonCodeMessages: {
      insufficient_examples:
        "There are not enough examples yet to build a strong, predictable voice. Each new sample brings the profile closer to your real style.",
      insufficient_diversity:
        "There is enough base material, but more format and context diversity is needed to stabilize your voice in generations.",
      language_conflict:
        "Examples mix languages, which reduces consistency. Prefer one primary language or keep texts separated by language."
    },
    diagnosticsHealthy: {
      highMultiFormat:
        "Your voice is well represented across more than one content type. The profile is ready for firmer adaptations.",
      high: "Your voice is well represented and ready for firmer adaptations in generations.",
      default: "The current profile is usable, but it can become more representative with new examples."
    },
    coverage: "Format coverage",
    coverageMissingFormats: "Examples still missing in these formats:",
    coverageComplete:
      "You have covered every recommended format. Great work — your voice is well distributed across the content types Cultiv supports.",
    underrepresented: "Formats with few examples:",
    examplesTitle: "Examples",
    examplesEmpty: "No examples yet.",
    examplesEmptyAction: "Add example",
    addExamples: "Add examples",
    newExampleTitle: "New example",
    editExampleTitle: "Edit example",
    updatingBanner: "Updating your voice…",
    rebuildFailed: "The last profile update failed.",
    upgradeSoon: "Coming soon",
    composer: {
      addSlot: "Add another example",
      save: "Save examples",
      advanced: "Advanced options",
      removeSlot: "Remove",
      slotTitle: "Example {n}",
      text: "Text",
      format: "Format",
      formatHelp: "About this format",
      language: "Language",
      context: "Context",
      antiPatterns: "Anti-patterns",
      pinned: "Pin this example",
      required: "Required",
      tooShort: "Too short to learn your voice",
      formatRequired: "Select a format",
      languageRequired: "Select a language",
      saving: "Saving…"
    },
    reasoning: {
      title: "How Cultiv reads you",
      subtitle: "Patterns of observation, argument, and conclusion inferred from your examples.",
      rebuilding: "Updating inferred reasoning from your latest examples.",
      failedKeepLast:
        "The latest extraction failed, but your previous reasoning snapshot remains active. Add examples or try updating again.",
      coreTitle: "How I think",
      developmentTitle: "How I develop a text",
      developmentSubtitle:
        "Argumentative path, epistemic posture, and typical moves inferred from your examples.",
      developmentImmature: "With at least three active examples, this mirror becomes more stable.",
      epistemicPosture: "Epistemic posture",
      typicalMoves: "Typical moves",
      developmentTraits: {
        labels: {
          openingMode: "Opening",
          perspectiveShiftDensity: "Perspective shifts",
          usesCounterexamples: "Counterexamples",
          selfQuestioning: "Self-questioning",
          insightTiming: "Insight timing",
          usesAnalogies: "Analogies",
          closingMode: "Closing"
        },
        unknownGap: "Not enough signal yet from your current examples.",
        authorityLinkLabel: "Validation (how I think)",
        authorityLinkAction: "See authority source in How I think",
        evidenceTitle: "Trait evidence",
        gapsTitle: "Gaps",
        gapsBody: "Some traits still lack enough signal in active examples.",
        noEvidence: "No example-linked evidence yet.",
        exampleFallback: "Example",
        exampleUnavailable: "Open example management to see the full excerpt.",
        manageExamplesLink: "Manage examples",
        evidenceHeading: (label, value) => `Evidence — ${label}${value ? `: ${value}` : ""}`,
        exampleLabel: (contentType) => `Example (${contentType})`,
        enums: {
          openingMode: { observation: "Observation", thesis: "Thesis", mixed: "Mixed" },
          density: { low: "Low", moderate: "Moderate", high: "High" },
          frequency: { rare: "Rare", occasional: "Occasional", common: "Common", dominant: "Dominant" },
          insightTiming: { early: "Early", moderate: "Moderate", late: "Late" },
          closingMode: { conclusion: "Conclusion", open_question: "Open question", mixed: "Mixed" }
        }
      },
      traitConfirmation: {
        title: "Does this match how you write?",
        yes: "Yes",
        no: "No",
        unsure: "Not sure",
        prompts: {
          openingMode: "You often open texts from concrete observation.",
          perspectiveShiftDensity: "You shift perspective about this often while developing a text.",
          usesCounterexamples: "You use counterexamples about this often.",
          selfQuestioning: "You often question your own hypothesis while writing.",
          insightTiming: "Your insight tends to land late in the text arc.",
          usesAnalogies: "You reason through analogies about this often.",
          closingMode: "You often close with an open question."
        }
      },
      certaintyLevel: "Certainty level",
      judgmentFrequency: "Judgment frequency",
      conclusionPace: "Conclusion pace",
      readerRelationship: "Reader relationship",
      authoritySource: "Authority source",
      register: "Register",
      openingStyle: "Opening style",
      technicalDensity: "Technical density",
      antiPatternsTitle: "Patterns you avoid",
      noAntiPatterns: "No derived patterns yet.",
      partialFormats: "No per-format expression yet (minimum 2 examples per format).",
      refineHint: "To refine this, add more examples — these fields cannot be edited manually.",
      enums: {
        certaintyLevel: { low: "Low", moderate: "Moderate", high: "High" },
        judgmentFrequency: { low: "Low", moderate: "Moderate", high: "High" },
        conclusionPace: { slow: "Slow", moderate: "Moderate", fast: "Fast" },
        readerRelationship: {
          peer: "Peer",
          mentor: "Mentor",
          observer: "Observer",
          collaborator: "Collaborator",
          guide: "Guide"
        },
        authoritySource: {
          personal_observation: "Personal observation",
          lived_experience: "Lived experience",
          data: "Data",
          reference: "Reference",
          practice: "Practice"
        },
        register: {
          formal: "Formal",
          informal: "Informal",
          technical: "Technical",
          conversational: "Conversational"
        },
        openingStyle: {
          direct: "Direct",
          contextual: "Contextual",
          provocative: "Provocative"
        },
        technicalDensity: { low: "Low", medium: "Medium", high: "High" },
        epistemicPosture: {
          exploratory: "Exploratory",
          investigative: "Investigative",
          advocacy_mixed: "Mixed with advocacy"
        }
      }
    },
    consent: {
      title: "Use of your voice examples",
      body: "To learn how you write, Cultiv stores and processes the text you submit. You can revoke this later in Settings.",
      cancel: "Cancel",
      accept: "Agree and continue"
    }
  },
  onboarding: {
    stepLabel: "Step {current} of {total}",
    step1Title: "Teach your voice",
    step1Subtitle: "Paste your writing so the AI learns how you write.",
    step2Title: "You're ready to generate",
    skip: "Skip",
    continue: "Continue",
    goGenerate: "Go to Generate",
    confidence: "Voice confidence",
    credits: "Available credits"
  },
  settings: {
    title: "Settings",
    profile: "Profile",
    email: "Email",
    locale: "App language",
    localePt: "Portuguese (Brazil)",
    localeEn: "English",
    privacy: "Voice privacy",
    consentActive: "Consent active",
    consentMissing: "Not granted",
    revokeConsent: "Revoke consent",
    revokeDisabled: "Revocation available when the API is published.",
    logout: "Sign out",
    billing: "Billing & credits"
  },
  billing: {
    title: "Billing",
    currentPlan: "Current plan",
    planPro: "Pro",
    planFree: "Free",
    creditsBalance: "{count} credits available",
    upgradePro: "Upgrade to Pro",
    alreadyPro: "You are on the Pro plan.",
    topUp: "Top up credits",
    topUpDescription: "Add 500 credits to your balance (one-time purchase).",
    topUpCta: "Buy 500 credits",
    currencyLabel: "Currency",
    currency: {
      brl: "BRL (Brazil)",
      usd: "USD"
    },
    periodLabel: "Billing period",
    periodMonthly: "Monthly",
    periodAnnual: "Annual (save ~20%)",
    paymentMethodLabel: "Payment method",
    paymentCard: "Card",
    paymentPix: "PIX",
    pixOnlyBrl: "PIX is available for BRL checkout only.",
    annualInstallments: "Annual Pro is charged in up to 12 card installments.",
    checkoutSuccess: "Payment received. Your plan or credits will update shortly.",
    checkoutCancel: "Checkout was cancelled. No charge was made.",
    checkoutError: "Could not start checkout. Try again in a moment.",
    redirecting: "Redirecting…",
    loadError: "Could not load billing details."
  },
  notifications: {
    readyTitle: "Generation ready",
    readyAction: "View result"
  },
  errors: {
    safetyInputBlocked: {
      title: "Content blocked",
      message: "Adjust the briefing or reference material and try again.",
      action: "Edit briefing"
    },
    safetyInputQuarantined: {
      title: "Content needs adjustment",
      message: "Review pasted material before generating.",
      action: "Review material"
    },
    quoteStale: {
      title: "Price outdated",
      message: "We refreshed the preview with the latest price.",
      action: "Refresh preview"
    },
    usageRestricted: {
      title: "No credits or limit reached",
      message: "Wait for credits to renew or adjust your plan.",
      action: "Got it"
    },
    authenticationExpired: {
      title: "Session expired",
      message: "Sign in again to continue.",
      action: "Sign in"
    },
    voiceConsentRequired: {
      title: "Consent required",
      message: "Accept voice example usage before saving.",
      action: "Review consent"
    },
    rateLimited: {
      title: "Too many attempts",
      message: "Wait a moment and try again.",
      action: "Ok"
    },
    serviceUnavailable: {
      title: "Service unavailable",
      message: "Try again in a moment.",
      action: "Try again"
    },
    observationFailure: {
      title: "Connection lost",
      message: "We lost connection to the generation. Refresh to see status.",
      action: "Refresh"
    },
    default: {
      title: "Something went wrong",
      message: "Try again in a moment.",
      action: "Try again"
    }
  }
};
