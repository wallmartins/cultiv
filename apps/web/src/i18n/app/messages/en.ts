import type { AppMessages } from "../types";

export const appMessagesEn: AppMessages = {
  shell: {
    nav: {
      generate: "Generate",
      history: "History",
      voice: "Voice",
      settings: "Settings",
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
    dashboardSubtitle: "Profile, diagnostics, and writing examples.",
    dashboardEmpty:
      "You do not have a voice profile yet. Add samples of your writing so the AI can learn how you write.",
    dashboardEmptyAction: "Add your first example",
    confidence: "Confidence",
    confidenceLabels: {
      high: "High",
      medium: "Medium",
      low: "Low",
      none: "—"
    },
    adaptationMode: "Adaptation mode",
    diagnostics: "Diagnostics",
    coverage: "Format coverage",
    bestCovered: "Best covered",
    underrepresented: "Underrepresented",
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
    logout: "Sign out"
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
