import { readdirSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { Effect, Schema } from "effect";
import { TextQualityVoiceProfileSchema } from "@my-ai-orchestrator/contracts";
import type { EvalCase } from "../types.js";

const FIXTURE_DIRECTORIES = [
  "voice-fidelity",
  "drift-regression",
  "critic-regression"
] as const;

export interface LoadFixturesOptions {
  readonly suite?: string;
  readonly tags?: readonly string[];
  readonly caseId?: string;
}

export interface FixtureIndexEntry {
  readonly suite: string;
  readonly count: number;
}

export class FixtureValidationError extends Error {
  readonly filePath: string;
  readonly details: string;

  constructor(filePath: string, details: string) {
    super(`Invalid fixture ${filePath}: ${details}`);
    this.filePath = filePath;
    this.details = details;
  }
}

export function loadFixtures(options: LoadFixturesOptions = {}, fixtureRoot?: string): EvalCase[] {
  const root = fixtureRoot ?? resolveFixtureRoot();
  const cases: EvalCase[] = [];

  for (const directory of FIXTURE_DIRECTORIES) {
    if (options.suite && directory !== options.suite) {
      continue;
    }

    const dirPath = resolve(root, directory);
    const files = listJsonFiles(dirPath);

    for (const file of files) {
      const filePath = resolve(dirPath, file);
      const parsed = parseFixtureFile(filePath);
      const validated = validateFixture(parsed, filePath);

      if (matchesFilters(validated, options)) {
        cases.push(validated);
      }
    }
  }

  return cases;
}

export function loadFixturesIndex(fixtureRoot?: string): FixtureIndexEntry[] {
  const counts = new Map<string, number>();

  for (const directory of FIXTURE_DIRECTORIES) {
    counts.set(directory, 0);
  }

  for (const fixtureCase of loadFixtures({}, fixtureRoot)) {
    const current = counts.get(fixtureCase.suite) ?? 0;
    counts.set(fixtureCase.suite, current + 1);
  }

  return Array.from(counts.entries())
    .map(([suite, count]) => ({ suite, count }))
    .sort((a, b) => a.suite.localeCompare(b.suite));
}

function resolveFixtureRoot(): string {
  return resolve(import.meta.dirname, ".");
}

function listJsonFiles(dirPath: string): string[] {
  try {
    const stat = statSync(dirPath);
    if (!stat.isDirectory()) {
      return [];
    }

    return readdirSync(dirPath)
      .filter((file) => file.endsWith(".json"))
      .sort();
  } catch {
    return [];
  }
}

function parseFixtureFile(filePath: string): unknown {
  try {
    const content = readFileSync(filePath, "utf8");
    return JSON.parse(content);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new FixtureValidationError(filePath, `Failed to parse JSON: ${message}`);
  }
}

function validateFixture(parsed: unknown, filePath: string): EvalCase {
  const decode = Schema.decodeUnknown(EvalCaseSchema);
  const result = Effect.runSync(Effect.either(decode(parsed)));

  if (result._tag === "Left") {
    throw new FixtureValidationError(filePath, result.left.message);
  }

  return result.right;
}

function matchesFilters(evalCase: EvalCase, options: LoadFixturesOptions): boolean {
  if (options.caseId && !evalCase.id.toLowerCase().includes(options.caseId.toLowerCase())) {
    return false;
  }

  if (options.tags && options.tags.length > 0) {
    const caseTags = new Set(evalCase.tags);
    const hasAllTags = options.tags.every((tag) => caseTags.has(tag));
    if (!hasAllTags) {
      return false;
    }
  }

  return true;
}

const EvalExpectationsSchema = Schema.Struct({
  mustContain: Schema.optional(Schema.Array(Schema.String)),
  mustNotContain: Schema.optional(Schema.Array(Schema.String)),
  wordCountRange: Schema.optional(Schema.Struct({
    min: Schema.Number,
    max: Schema.Number
  })),
  tone: Schema.optional(Schema.Literal("formal", "informal", "neutral")),
  minVoiceScore: Schema.optional(Schema.Number),
  minDriftScore: Schema.optional(Schema.Number),
  minDevelopmentDriftScore: Schema.optional(Schema.Number),
  mustTriggerCritic: Schema.optional(Schema.Array(Schema.String)),
  maxCriticScore: Schema.optional(Schema.Number)
});

const VoiceProfileReferenceSchema = Schema.Struct({
  type: Schema.Literal("fixture"),
  path: Schema.String
});

const EvalVoiceProfileSchema = Schema.Union(
  TextQualityVoiceProfileSchema,
  VoiceProfileReferenceSchema
);

const BaseEvalCaseSchema = Schema.Struct({
  id: Schema.String,
  suite: Schema.String,
  tags: Schema.Array(Schema.String),
  expectations: EvalExpectationsSchema
});

const VoiceFidelityEvalCaseSchema = Schema.extend(BaseEvalCaseSchema, Schema.Struct({
  suite: Schema.Literal("voice-fidelity"),
  input: Schema.Struct({
    contentType: Schema.String,
    briefing: Schema.String,
    voiceProfile: EvalVoiceProfileSchema,
    qualityMode: Schema.Literal("fast", "balanced", "strict")
  })
}));

const DriftRegressionEvalCaseSchema = Schema.extend(BaseEvalCaseSchema, Schema.Struct({
  suite: Schema.Literal("drift-regression"),
  input: Schema.Struct({
    voiceProfile: EvalVoiceProfileSchema,
    candidate: Schema.String,
    stepName: Schema.optional(Schema.String)
  })
}));

const CriticRegressionEvalCaseSchema = Schema.extend(BaseEvalCaseSchema, Schema.Struct({
  suite: Schema.Literal("critic-regression"),
  input: Schema.Struct({
    text: Schema.String
  })
}));

const EvalCaseSchema = Schema.Union(
  VoiceFidelityEvalCaseSchema,
  DriftRegressionEvalCaseSchema,
  CriticRegressionEvalCaseSchema
);
