import type { AppMessages } from "../types.js";

export const generate: AppMessages["generate"] = {
  hero: {
    eyebrow: "writes like you think",
    headlinePrefix: "What do you want to ",
    headlineEmphasis: "write",
    headlineSuffix: " about?",
    placeholder: "Paste an idea, a nagging thought, a topic…",
    footerNote: "the guided session comes after · skippable"
  },
  analyzingTheme: "analyzing your topic…",
  startingGeneration: "starting the generation…",
  channelEyebrow: "channel · optional",
  channelPrompt: "Where will you publish this?",
  channelNote: "optional — skipping leaves it as free text",
  channelSkipLink: "skip · stays as free text →",
  audienceEyebrow: "audience · narrow",
  audiencePrompt: "Who's this text for, this time?",
  audienceAddPlaceholder: "another audience…",
  audienceAddAction: "+ add",
  audienceSkipLink: "use every audience →",
  questionPlaceholder: "Answer in a sentence or two…",
  questionSkipLink: "skip question →",
  answerAction: "Answer →",
  generateNow: "Generate now →",
  costHint: "the more you tell it, the richer the text gets",
  costCalculating: "cost: calculating…",
  costFrom: (creditsLabel) => `cost: from ${creditsLabel}`,
  costFull: (creditsLabel, balanceAfter, mode) => `cost: ${creditsLabel} · balance after: ${balanceAfter} · mode: ${mode}`,
  sessionDoneEyebrow: "session complete",
  sessionDoneMessage: "All set. Just hit generate.",
  dispatchError: "credits weren't charged — try again",
  fallbackQuestion: {
    thesis: (theme) => `What's the central thesis or claim you want to make about "${theme}"?`,
    experience: "What concrete experience of yours would be the best example here?",
    tension: "Is there a counterpoint, a tension, or an objection worth naming?",
    motivation: "Why does this topic matter to you right now?"
  },
  questionEyebrow: (current, total) => `question ${current} of ${total} · skippable`,
  channelBucketLabel: {
    professionalNetwork: "Professional network",
    social: "Social media",
    blog: "Blog",
    email: "Newsletter"
  },
  qualityModeLabel: {
    fast: "fast",
    balanced: "balanced",
    strict: "dense"
  },
  trialLabel: "trial period",
  trialTextsEstimate: (textsLabel) => `~${textsLabel}`,
  trialDaysRemaining: (days) => (days === 1 ? "1 day left" : `${days} days left`),
  gateMessage: {
    no_credits: "not enough credits to generate",
    trial_expired: "your trial has expired",
    past_due: "payment pending",
    lapsed: "subscription inactive"
  },
  gateFallback: "generating isn't possible right now",
  queueEta: (minutes) => `~${minutes} min`
};
