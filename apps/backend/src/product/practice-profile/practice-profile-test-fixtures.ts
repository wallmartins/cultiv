// Deterministic fixtures for the test provider transport (config.environment === "test"), mirroring the
// voice reasoning/development fixtures. The SEED dimensions (G1) name concrete anchors (a proper noun or
// number) so the anti-pattern cliché detector passes — dimensions describe the field for the generator.
// The calibration ANCHORS (G3) deliberately name none: a question elicits the author's specific, it never
// presupposes one, so it must read answerable off the top of the head, not like a field quiz.

export const TEST_PRACTICE_PROFILE_SEED_FIXTURE = {
  fieldSpecifics: [
    "Kelsey Hightower's argument that Kubernetes is over-adopted",
    "the 2021 Basecamp thread on operational complexity"
  ],
  dimensions: {
    point: "Whether running Kubernetes is worth its operational cost for a team of 5 engineers.",
    evidence: "A production incident where an EKS control-plane upgrade broke ingress for 40 minutes.",
    readerAssumption: "The reader already ships Docker images in CI but has never operated a control plane.",
    resistance: "The honest counterpoint that managed platforms like Fly.io remove most of the pain.",
    stake: "Picking the wrong platform now locks the team into 18 months of migration debt.",
    fieldCliche: "just rewrite it in Rust",
    lexicon: ["control plane", "ingress", "sidecar", "reconciliation loop"]
  }
} as const;

export const TEST_CALIBRATION_ANCHORS_FIXTURE = {
  anchors: {
    microOpinion:
      "Which received practice in how teams run infrastructure do you think rarely justifies its cost in practice?",
    reasoningReflection:
      "Tell me about one of your own platform decisions that turned out wrong — what only became clear once something broke in production?",
    argumentDevelopment:
      "Walk me through one risky infrastructure decision you made from start to finish, including the point where the more conservative choice would have been the right one.",
    formatAdaptation:
      "Explain to someone outside your field a concept every infrastructure engineer treats as obvious, and why it matters."
  }
} as const;
