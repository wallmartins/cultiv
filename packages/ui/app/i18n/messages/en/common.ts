import type { AppMessages } from "../types.js";

export const common: AppMessages["common"] = {
  retry: "Try again",
  cancel: "Cancel",
  close: "Close",
  back: "Back",
  continue: "Continue",
  justNow: "now",
  loading: "loading…",
  noTopic: "no topic",
  freeText: "Free text",
  length: {
    short: "Short",
    medium: "Medium",
    long: "Long"
  },
  channel: {
    "professional-network": "LinkedIn",
    blog: "Blog",
    email: "Newsletter",
    social: "X"
  },
  confidence: {
    caption: { low: "Low", medium: "Medium", high: "High" },
    headline: { low: "Emerging voice", medium: "Voice taking shape", high: "Solid voice" }
  },
  credits: (n) => `${n} ${n === 1 ? "credit" : "credits"}`,
  texts: (n) => `${n} ${n === 1 ? "text" : "texts"}`,
  samples: (n) => `${n} ${n === 1 ? "sample" : "samples"}`,
  days: (n) => `${n} ${n === 1 ? "day" : "days"}`,
  words: (n) => `${n} ${n === 1 ? "word" : "words"}`,
  generations: (n) => `${n} ${n === 1 ? "generation" : "generations"}`
};
