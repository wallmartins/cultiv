// Local mirrors of contract types — packages/ui is a zero-dependency leaf (ui: Set([])) and must
// not import @my-ai-orchestrator/contracts. Containers (apps/web/src/routes/*) map real contract
// values into these structurally-identical shapes before passing props down.
export type ExecutionReactionValue = "up" | "down";
export type GenerationLengthTier = "short" | "medium" | "long";
