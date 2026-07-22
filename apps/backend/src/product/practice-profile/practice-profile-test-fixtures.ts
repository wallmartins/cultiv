// Deterministic fixtures for the test provider transport (config.environment === "test"), mirroring the
// voice reasoning/development fixtures. Every specificity-bearing field names a concrete anchor (a proper
// noun or number) so the anti-pattern cliché detector passes on the first attempt — the fixtures model a
// well-anchored generation, not a generic one.

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
    microOpinion: "Is operating the Kubernetes control plane worth it for a team of 5 engineers?",
    reasoningReflection:
      "Tell me about the EKS upgrade that broke ingress for 40 minutes — what did you change afterward?",
    argumentDevelopment:
      "Walk me through choosing between Kubernetes and Fly.io end to end, including where staying on Kubernetes was the right call.",
    formatAdaptation:
      "Explain what a reconciliation loop is to a backend developer who has only ever used Docker Compose."
  }
} as const;
