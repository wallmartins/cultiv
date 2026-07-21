import type { AppMessages } from "../types.js";

export const voice: AppMessages["voice"] = {
  pageEyebrow: "Voice profile · how Cultiv learns you",
  confidenceEyebrow: "CONFIDENCE",
  recalibrate: "Recalibrate →",
  versionLabel: (version, samples) => `version ${version} · ${samples}`,
  proseCoreHeading: "How I think",
  proseDevelopmentHeading: "How I develop a piece",
  proseFallback: "prose isn't available yet — recalibrating generates a new reading.",
  errorText: "couldn't load your voice profile.",
  emptyDescription: "your voice shows up here after calibration",
  emptyCta: "calibrate now →",
  loadingAriaLabel: "loading voice profile",

  traits: {
    heading: "The 7 traits of your voice",
    hint: "confirming or disputing tunes the voice",
    confirm: "Checks out",
    contest: "Not quite",
    copy: {
      openingMode: {
        label: "Opens with observation",
        desc: "tends to start from a concrete scene or tension before the thesis"
      },
      perspectiveShiftDensity: {
        label: "Turn density",
        desc: "how many times the argument shifts angle through the piece"
      },
      usesCounterexamples: {
        label: "Uses counterexamples",
        desc: "tests its own thesis against cases that contradict it"
      },
      selfQuestioning: {
        label: "Self-questioning",
        desc: "owns the doubt instead of faking certainty"
      },
      insightTiming: {
        label: "Insight timing",
        desc: "when the core idea shows up — in the opening or only at the close"
      },
      usesAnalogies: {
        label: "Uses analogies",
        desc: "reaches for metaphors and comparisons to make a point"
      },
      closingMode: {
        label: "Closing move",
        desc: "ties off with a conclusion or hands the question back to the reader"
      }
    },
    badge: {
      confirmed: "Confirmed",
      disputed: "Disputed",
      inferred: "Inferred"
    }
  },

  contentType: {
    "linkedin-post": "LinkedIn",
    newsletter: "Newsletter",
    "validation-post": "Validation post",
    "architecture-post": "Technical post",
    "long-form-blog": "Long-form blog",
    "twitter-thread": "Thread"
  },

  coverage: {
    heading: "Coverage by format",
    empty: "coverage not calculated yet",
    nextStepEyebrow: "Next step:",
    nextStepWeak: (contentTypeLabel) =>
      `your voice still has little range in ${contentTypeLabel} — recalibrating builds confidence.`,
    nextStepBalanced: "balanced coverage across your calibrated formats."
  },

  materialBase: {
    sectionHeading: "Material base",
    heading: (samples) => `${samples} from calibration · reading`,
    footnote: "new examples only count in after recalibrating",
    stat: {
      total: "total",
      active: "active",
      excluded: "excluded",
      pinned: "pinned"
    }
  },

  consent: {
    grantedTitle: "Training consent granted",
    revokedTitle: "Consent revoked",
    grantedMeta: (sinceLabel) => `${sinceLabel} · your texts are only used to model your voice`,
    revokedMeta: "your voice profile has been deleted and generation is turned off",
    revoke: "Revoke",
    grantAgain: "Grant again",
    since: (dateLabel) => `since ${dateLabel}`
  },

  revokeDialog: {
    eyebrow: "destructive action",
    title: "Revoking consent deletes your voice",
    body:
      "Your voice profile and the analysis of your samples are permanently deleted, and generation is turned off. Your history and account stay intact. To generate again, you'll need to grant consent and recalibrate.",
    cancel: "Keep my voice",
    confirm: "Revoke and delete"
  }
};
