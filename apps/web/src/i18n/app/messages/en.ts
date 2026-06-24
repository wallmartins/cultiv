import type { AppMessages } from "../types";

export const appMessagesEn: AppMessages = {
  auth: {
    signingIn: "Signing in…",
    redirectingToLogin: "Redirecting to sign in…",
    preparingSession: "Preparing session…",
    sessionPrepareFailed:
      "Could not prepare a session with the backend. Check that the server is running and the Auth0 audience is correct.",
    logoutAndSignInAgain: "Sign out and sign in again",
    sessionPrepareFailedLogin: "Could not prepare the session. Try /login again.",
    openingLogin: "Opening sign in…",
    loginFailed: "Could not complete sign in. Try again at /login.",
    sessionPrepareFailedCallback: "Could not prepare the session. Go back to /login and try again.",
    finishingLogin: "Finishing sign in…"
  },
  shell: {
    nav: {
      generate: "Generate",
      history: "Logbook",
      voice: "Voice map",
      settings: "Navigation settings",
      plans: "Journey resources",
      logout: "Sign out"
    },
    quota: { label: "gens" },
    activeExecutions: {
      title: "In progress",
      empty: "No active generations",
      openDrawer: "Open in-progress generations",
      closeDrawer: "Close in-progress generations",
      statusQueued: "Queued",
      statusRunning: "Generating",
      statusDone: "Ready",
      statusFailed: "The route could not be mapped.",
      copy: "Copy",
      export: "Export",
      regenerate: "Regenerate",
      newExpedition: "New expedition",
      viewHistory: "View full history",
      retry: "Try again",
      noCreditsCharged: "Your credits were not used.",
      observationFailure: "We lost connection to the generation.",
      refresh: "Refresh",
      hybridHint:
        "Your route is being mapped… You can close this window."
    },
    sdk: {
      unavailable: "Could not connect to the server. Some data may be out of date.",
      retry: "Try again"
    },
    selectPlaceholder: "Select an option",
    notFound: "Territory not found."
  },
  intentWizard: {
    stepObjectiveTitle: "What do you want to explore?",
    stepObjectiveSubtitle: "Choose the type of expedition for your idea.",
    stepScopeTitle: "Scale and destination",
    stepScopeSubtitle: "Define the depth of exploration and where it will be published.",
    moreOptions: "More options",
    lengthTier: "Depth",
    channel: "Publication territory",
    channelOptional: "Optional",
    channelExpand: "Choose territory",
    intentHelp: "About this expedition",
    back: "Back",
    continue: "Continue",
    changeIntent: "Change expedition",
    catalogLoadError: "Could not load expeditions.",
    catalogRetry: "Try again",
    stepIndicator: "Step {current} of {total}",
    stepExplorar: "Explore",
    stepEscala: "Scale",
    stepCoordenadas: "Coordinates"
  },
  generate: {
    title: "Expedition",
    contentType: "Format",
    contentTypePlaceholder: "Select a format",
    contentTypeHelp: "About this format",
    fieldHelp: "About this field",
    briefing: "Journey coordinates",
    catalogLoadError: "Could not load content formats.",
    catalogRetry: "Try again",
    language: "Map language",
    qualityMode: "Navigation style",
    importedContext: "Support materials",
    importedContextExpand: "Add support materials",
    importedContextCounter: "{count} / 8000",
    importedContextTooLarge: "Support materials must be at most 8,000 characters.",
    previewTitle: "Journey resources",
    previewPrice: "Cost: {price} credits",
    previewBalance: "Balance: {current} → {projected}",
    previewQuota: "Uses ~{cost} generation(s) · About {remaining} of {limit} remaining",
    previewRefreshRecommendation: "Refresh recommendation",
    previewRecommendationStale: "Coordinates changed — refresh the recommendation.",
    generate: "Map the route",
    generateWithCredits: "Map the route ({price} credits)",
    calculating: "Calculating…",
    sending: "Your route is being mapped…",
    noCredits: "No credits",
    incomplete: "Fill in required coordinates",
    blocked: "Material blocked",
    startedToast: "Expedition started",
    guidanceTitle: "How to fill in coordinates",
    guidanceTips: "Navigation tips",
    guidanceMistakes: "Avoid",
    reminderBanner: "Your voice territory is empty. Add raw material to map your voice.",
    reminderBannerAction: "Map my voice",
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
      label: "In the press",
      summary: "Your request is in the press and is waiting to be engraved."
    },
    analyze: {
      label: "Preparing the molds",
      summary: "We structure the briefing guidelines and shape the raw material."
    },
    draft: {
      label: "First print",
      summary: "We engrave the first version aligned with your voice profile and format."
    },
    refine: {
      label: "Afinement",
      summary: "We tune texture, clarity, and authorial alignment before the final pass."
    },
    sanitize: {
      label: "Final review",
      summary: "We apply final polishing and consistency checks before delivering the result."
    }
  },
  history: {
    title: "Logbook",
    subtitle: "All your expeditions in one place.",
    empty: "No expeditions yet. Map your first route.",
    emptyAction: "New expedition",
    error: "Could not load the logbook.",
    retry: "Try again",
    filters: {
      period: "Period",
      status: "Status",
      intent: "Expedition",
      lengthTier: "Format",
      period7d: "Last 7 days",
      period30d: "Last 30 days",
      period90d: "Last 90 days",
      periodAll: "All time",
      statusAll: "All",
      statusDone: "Completed",
      statusFailed: "Failed",
      statusRunning: "In progress",
      statusQueued: "Queued",
      intentAll: "All expeditions",
      lengthTierAll: "All formats"
    },
    columns: {
      format: "Format",
      date: "Departure date",
      mode: "Mode",
      credits: "Credits",
      status: "Status"
    },
    pagination: {
      perPage: "Per page",
      range: "{start}–{end} of {total}",
      page: "Page {page} of {pageCount}",
      previous: "Previous",
      next: "Next"
    },
    detail: {
      copy: "Copy",
      regenerate: "New expedition",
      details: "Route details",
      executionId: "Expedition ID",
      createdAt: "Departure",
      completedAt: "Return",
      voiceConfidence: "Voice confidence",
      adaptationMode: "Adaptation mode",
      progressSteps: "Steps",
      loading: "Loading expedition…",
      notFound: "Expedition not found."
    }
  },
  voice: {
    dashboardTitle: "Your voice map",
    dashboardSubtitle: "How you navigate, how you map routes — and how to improve.",
    dashboardEmpty:
      "Your map is still blank. Teach your voice to get started.",
    dashboardEmptyAction: "Add your first text",
    manageExamples: "Manage texts",
    mirrorFallbackTitle: "Your map today",
    mirrorFallbackSubtitle:
      "With more reference texts, Cultiv will also map your cognitive and argument patterns.",
    mapLayersTitle: "Map layers",
    dashboardTabs: {
      overview: "Overview",
      layers: "Layers",
      health: "Map health"
    },
    detailLayers: {
      formats: "Routes by territory",
      antiPatterns: "Terrains to avoid",
      profileHealth: "Expedition health"
    },
    nextStep: {
      eyebrow: "Next route",
      matureMessage:
        "Your voice map is complete. The natural next step is to chart a new expedition.",
      generateCta: "New expedition",
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
    confidence: "Map confidence",
    confidencePanelTitle: "Voice map confidence",
    confidenceDialEyebrow: "Confidence",
    confidenceDialSubline: {
      high: "charted terrain",
      medium: "contours forming",
      low: "incipient routes",
      none: "blank map"
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
    diagnostics: "Expedition diagnosis",
    reasonCodeMessages: {
      insufficient_examples:
        "There are not enough reference texts yet to build a strong, predictable map. Each new text brings the map closer to your real style.",
      insufficient_diversity:
        "There is enough base material, but more territory and context diversity is needed to stabilize the map in generations.",
      language_conflict:
        "Texts mix languages, which reduces consistency. Prefer one primary language or keep texts separated by language."
    },
    diagnosticsHealthy: {
      highMultiFormat:
        "Your map is well represented across more than one territory. The expedition is ready for firm routes.",
      high: "Your map is well represented and ready for firmer adaptations in generations.",
      default: "The current map is usable, but it can become more representative with new texts."
    },
    coverage: "Mapped territories",
    coverageMissingFormats: "Texts still missing in these territories:",
    coverageComplete:
      "You have covered every recommended territory. Great work — your voice is well distributed across the content types Cultiv supports.",
    underrepresented: "Territories with few texts:",
    examplesTitle: "Reference texts",
    examplesEmpty: "No reference texts yet.",
    examplesEmptyAction: "Add text",
    addExamples: "Add texts",
    newExampleTitle: "New reference text",
    editExampleTitle: "Edit reference text",
    updatingBanner: "Rebuilding your map…",
    rebuildFailed: "The last map rebuild failed.",
    upgradeSoon: "Coming soon",
    composer: {
      addSlot: "Add another text",
      save: "Save texts",
      advanced: "Advanced options",
      removeSlot: "Remove",
      slotTitle: "Text {n}",
      text: "Text",
      format: "Format",
      formatHelp: "About this format",
      language: "Language",
      context: "Context",
      antiPatterns: "Anti-patterns",
      pinned: "Pin this text",
      required: "Required",
      tooShort: "Too short to learn your voice",
      formatRequired: "Select a format",
      languageRequired: "Select a language",
      saving: "Saving…"
    },
    reasoning: {
      title: "How you navigate",
      subtitle: "Patterns of observation, argument, and conclusion inferred from your examples.",
      rebuilding: "Updating inferred reasoning from your latest examples.",
      failedKeepLast:
        "The latest extraction failed, but your previous reasoning snapshot remains active. Add examples or try updating again.",
      coreTitle: "Core reasoning",
      developmentTitle: "How you map routes",
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
    step1Subtitle: "Paste 1-3 examples of your real writing. The more natural, the better.",
    step2Title: "Ready to create",
    step2Subtitle: "Your voice profile is being built. You can already start generating texts.",
    skip: "Skip",
    continue: "Continue",
    goGenerate: "Start generating",
    confidence: "Voice confidence",
    credits: "Available credits"
  },
  settings: {
    title: "Navigation settings",
    subtitle: "Fine-tune your map and compass.",
    profile: "Explorer identity",
    email: "Email",
    locale: "Map language",
    localePt: "Português (Brasil)",
    localeEn: "English",
    privacy: "Clear footprints",
    consentActive: "Consent active",
    consentMissing: "Not granted",
    revokeConsent: "Revoke consent",
    revokeDisabled: "Revocation available when the API is published.",
    logout: "Leave expedition",
    plans: "Resources",
    saved: "Settings saved."
  },
  plans: {
    title: "Journey resources",
    subtitle: "Equipment and supplies for your next expedition.",
    currentPlan: "Current equipment",
    usageHint: "Your monthly usage appears when you generate content.",
    changePlan: "New instruments",
    changePlanDescription: "Pick currency, billing period, and payment method to subscribe.",
    planPro: "Pro",
    planCriador: "Creator",
    planFree: "Free",
    planFreeDescription: "Start exploring with the essentials.",
    planCriadorDescription: "For creators who publish on a steady rhythm.",
    planProDescription: "More quota, every quality mode, and early access.",
    planCurrentBadge: "Current",
    upgradeCriador: "Subscribe to Creator",
    upgradePro: "Subscribe to Pro",
    alreadyPro: "You are on the Pro plan.",
    topUp: "Additional supplies",
    topUpDescription: "One-time pack of extra generations when your plan allowance isn't enough.",
    topUpCta: "Get supplies",
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
    loadError: "Could not load your plan."
  },
  notifications: {
    readyTitle: "Route complete. Your text is ready.",
    readyAction: "View result",
    dismiss: "Dismiss"
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
      message: "Connection lost. Check your network and try again.",
      action: "Refresh"
    },
    default: {
      title: "Something went wrong",
      message: "Try again in a moment.",
      action: "Try again"
    }
  }
};
