import { Schema } from "effect";

export const PlanSignatureSchema = Schema.Literal(
  "short-piece",
  "long-piece",
  "serial-piece",
  "edition-piece"
);
export type PlanSignature = typeof PlanSignatureSchema.Type;
