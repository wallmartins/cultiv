import type { pt } from "./pt/index.js";

// pt-BR is the reference dictionary: its inferred shape IS the contract. Each en slice annotates
// itself with AppMessages["<slice>"], so a key added to pt and forgotten in en fails `tsc`.
export type AppMessages = typeof pt;
