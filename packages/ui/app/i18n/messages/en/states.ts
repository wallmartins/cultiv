import type { AppMessages } from "../types.js";

export const states: AppMessages["states"] = {
  recalibrateNow: "Recalibrate now →",

  degradedDelivery: {
    title: "This text came in shorter than agreed",
    body: (lengthLabel, requestedWords, deliveredWords) =>
      `You asked for ${lengthLabel} (~${requestedWords} words); ${deliveredWords} came out. We delivered it anyway — it might still work. Redoing it costs no credits.`,
    redoFree: "Redo for free →",
    wordCount: (deliveredWords, requestedWords) => `${deliveredWords} of ~${requestedWords} words`
  },

  downgradeSurplus: {
    header: (fromPlan, toPlan) => `change plan · ${fromPlan} → ${toPlan}`,
    heading: (toPlan) => `You have more credits than the ${toPlan} cap.`,
    keptLabel: "stay as plan credits",
    surplusLabel: "become loose balance — no expiry, spent first",
    footnote: (toPlan, keptCredits) =>
      `Nothing is forfeited. From the next cycle on, rollover respects the ${toPlan} cap (${keptCredits}).`,
    keep: (fromPlan) => `Keep ${fromPlan}`,
    confirm: "Confirm downgrade →"
  },

  longTimeoutWatch: {
    writing: "writing in your voice…",
    slowNotice:
      "This is taking longer than usual. The text is still being written — you can close this screen and we'll let you know when it's ready.",
    cancelGeneric: "Cancel and refund the reserved credits",
    cancelWithCredits: (creditsLabel) => `Cancel and refund ${creditsLabel}`,
    continueWaiting: "Keep waiting →"
  },

  pastedThemeFormatted: {
    pastedHint: "pasted from somewhere else? we'll clean it up",
    confirmEyebrow: "here's what I understood — confirm?",
    channelDetected: (channel) => `channel detected: ${channel}`,
    angles: (anglesLabel) => `angles: ${anglesLabel}`,
    // pt has double pluralization here; en only pluralizes "link(s)" — "saved" is invariant.
    linksSaved: (n) => `${n} ${n === 1 ? "link" : "links"} saved as reference — we won't open them, only cite if you ask`,
    useAsPasted: "use the text as I pasted it",
    confirmAndContinue: "Confirm and continue →"
  },

  paymentPendingZeroCredits: {
    creditsLabel: "CREDITS",
    title: "Your credits ran out — and the renewal didn't go through.",
    body: (planName, creditsLabel) =>
      `We couldn't charge your ${planName} plan this month. Once you regularize it, the ${creditsLabel} for the cycle land right away. Your voice and history are intact.`,
    regularize: "Regularize payment →",
    buyExtra: "Buy extra credits",
    footnote: "extra purchases reopen after you regularize · questions? suporte@cultiv.app"
  },

  postResetReturn: {
    title: (name) => `Back to the beginning, ${name}.`,
    body: (dateLabel) =>
      `Your account was reset on ${dateLabel}: voice, examples, and history were erased. Your login and your plan stay the same.`,
    priorContextIntro: "Last time you were writing about",
    priorContextFor: "for",
    priorContextQuestion: "Want to pick up from there or start fresh?",
    startFresh: "Start fresh",
    recalibrateWithContext: "Recalibrate with that context →"
  },

  queueAndTrialGate: {
    lastGeneration: "This is your last trial generation.",
    explanation:
      "After this one, writing again needs a plan. Your voice and history stay — the trial limit is only about volume.",
    queueStatus: (generationsLabel, queueEta) =>
      `${generationsLabel} running right now — this one joins the queue and starts in ${queueEta}`,
    saveForLater: "Save it for later",
    useLast: "Use the last one and join the queue →",
    viewPlans: "see plans before deciding →"
  },

  recalibrateWithRunning: {
    header: (fromVersion, toVersion) => `recalibrate · voice v${fromVersion} → v${toVersion}`,
    runningNotice: (n) => (n === 1 ? "You have 1 text being written right now." : `You have ${n} texts being written right now.`),
    explanation: (fromVersion, toVersion) =>
      `They'll finish with the current voice (v${fromVersion}) — nothing gets interrupted. Everything you generate after recalibrating uses v${toVersion}. History marks each text's version.`,
    finishesAtVersion: (version) => `finishes on v${version}`,
    wait: "Wait for them to finish"
  },

  reconnectionReconcile: {
    title: "You're back — here's what happened",
    viewReady: "See what's ready →",
    offlineIntro: (mins) => `You were offline for ${mins} ${mins === 1 ? "minute" : "minutes"}.`,
    readyEvent: (topic) => `"${topic}" is ready`,
    resumedEvent: (topic, pct) => `"${topic}" is still being written (${pct}%)`,
    sinceThen: (intro, eventsLabel) => `${intro} Meanwhile, ${eventsLabel}.`,
    and: "and",
    resumedStatus: (pct) => `resumed · writing… ${pct}%`
  },

  voiceDriftNudge: {
    prompt: "did that sound like you?",
    confirms: "Sounds right",
    notReally: "Not quite",
    title: "Your voice seems to have shifted since calibration.",
    explanation: (confidenceFrom, confidenceTo) =>
      `That's three "not quite" in a row — confidence dropped from ${confidenceFrom} to ${confidenceTo}. That's normal: everyone's writing evolves. A quick recalibration (just the samples that changed) realigns it.`,
    snooze: "later · don't show for 7 days"
  },

  locked: {
    demoGeneration: {
      seal: "example",
      defaultTopic: "why small teams write better",
      defaultParagraphs: [
        "A big team doesn't write worse for lack of talent — it writes worse because no one owns the voice alone.",
        "That's exactly what your calibrated voice fixes: a way of writing that's yours, recognizable, and repeatable with every generation."
      ]
    },
    lockedCenter: {
      notice: "no real generation yet — the example below is illustrative",
      calibrateCta: "Reactivate my voice →"
    },
    companionEmpty: {
      description: "your voice shows up here after calibration",
      ctaLabel: "calibrate my voice →"
    }
  }
};
