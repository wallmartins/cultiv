import type { AppMessages } from "../types.js";

export const onboarding: AppMessages["onboarding"] = {
  nameFallback: "you",
  stepLabel: {
    context_setup: "Context",
    micro_opinion: "Quick take",
    reasoning_reflection: "How I think",
    argument_development: "How I argue",
    format_adaptation: "Versatility",
    review_confirm: "Review"
  },
  helperCopy: {
    micro_opinion: "no hedging — just your opinion, the way you'd say it in conversation.",
    reasoning_reflection: "explain it like you're telling a friend — no dressing it up.",
    argument_development: "make your case all the way through — no need to soften it.",
    format_adaptation: "walk through it slowly, like the reader knows nothing about the topic."
  },
  sampleCounter: (index, total) => `sample ${index} of ${total}`,
  fallbackPrompt: "tell it in your own words",
  errorFallback: "we couldn't confirm your voice right now — check your connection and try again.",
  trialLabel: "your trial",
  trialDaysRemaining: (n) => `${n} ${n === 1 ? "day" : "days"} left`,
  skipForNow: "Calibrate later →",
  voiceReady: "your voice is ready",

  toast: {
    submitError: "we couldn't save that sample",
    skipError: "we couldn't skip that step",
    startFailed: "we couldn't start your calibration right now."
  },

  overlay: {
    recalibrateEyebrow: "recalibrate your voice",
    close: "close"
  },

  buildingVoiceLabel: "building your voice…",

  consent: {
    eyebrow: "formal authorization",
    heading: "can we use these samples to build your voice?",
    body: 'your texts are analyzed only to model your voice profile. you can revoke this anytime in "your voice".',
    checkboxLabel: "I authorize the use of my samples",
    createVoice: "Create my voice"
  },

  lowConfidence: {
    banner: (weakStepLabel) =>
      `the "${weakStepLabel}" sample came out short for your voice — you can review it, or continue anyway.`,
    continueAnyway: "Continue anyway",
    viewSample: "View this sample"
  },

  result: {
    errorEyebrow: "something went wrong",
    errorHeading: "we couldn't build your voice right now",
    retry: "Retry"
  },

  review: {
    eyebrow: "review"
  },

  step1: {
    eyebrow: "before we start",
    heading: "let's get to know you",
    subjectLabel: "what do you write about most?",
    subjectPlaceholder: "e.g. product, career, technology…",
    vantagePointLabel: "where do you speak from on this?",
    vantagePointPlaceholder: "e.g. technical founder, team manager, independent practitioner…",
    audiencesLabel: "who do you write for?",
    audiencePlaceholder: "type an audience and press Enter",
    audienceRemoveAria: (value) => `remove ${value}`,
    consentBanner: "we'll use your texts to build your voice profile"
  },

  voicePreview: {
    confidenceEyebrow: "confidence",
    core: "How you think",
    development: "How you build"
  },

  bridge: {
    eyebrow: "ready",
    highlights: [
      "your voice is already active — every text you generate runs through it",
      'track its confidence and recalibrate anytime in "your voice"',
      "your trial has started — you can generate right from the next screen"
    ],
    skipTour: "Skip tour",
    startWriting: "Start writing →"
  },

  progressAria: "calibration progress",

  writing: {
    readOnlyHelper: "this sample was already submitted — you can reread it, but not edit it here.",
    placeholder: "write it in your own words — it doesn't need to be perfect",
    counterBelow: (target) => `a bit more — around ${target} is ideal`,
    counterInRange: "good range",
    counterOver: "that's fine, you can keep it",
    skipLink: "skip this sample →",
    resumeAtCurrent: "Back to where I left off"
  }
};
