import type { Effect } from "effect";
import type { PipelineDefinition } from "@my-ai-orchestrator/contracts";
import type { LanguageProfile } from "@my-ai-orchestrator/domain";
import type {
  LanguageProfileNotFoundError,
  SkillAlreadyRegisteredError,
  SkillDefinitionInvalidError,
  SkillModuleInvalidError,
  SkillModuleLoadError,
  SkillPackageNameError,
  SkillPathForbiddenError,
  SkillSpecifierError,
  SkillTemplateError
} from "./errors.js";

export type SkillOutput = unknown;

export interface SkillExecutionResult {
  readonly output: SkillOutput;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface SkillMemory {
  readonly read: (key: string) => Effect.Effect<unknown>;
}

export interface SkillExecutionContext {
  readonly pipeline: PipelineDefinition;
  readonly stepIndex: number;
  readonly state: Readonly<Record<string, unknown>>;
  readonly inputs: Readonly<Record<string, unknown>>;
  readonly config?: Readonly<Record<string, unknown>>;
  readonly memory?: SkillMemory;
}

export interface SkillContract {
  readonly type: "generate" | "transform" | "validate" | "enrich";
  readonly input?: {
    readonly required?: readonly string[];
    readonly optional?: readonly string[];
  };
  readonly output?: {
    readonly parser: "text" | "json" | "auto";
    readonly schema?: Readonly<Record<string, unknown>>;
    readonly description?: string;
  };
}

export interface SkillDefinition {
  readonly name: string;
  readonly description?: string;
  readonly contract?: SkillContract;
  readonly execute: (
    context: SkillExecutionContext
  ) => Effect.Effect<SkillExecutionResult, SkillExecutionError>;
}

export interface DeclarativeSkillDefinition {
  readonly name: string;
  readonly description: string;
  readonly promptTemplate: string;
  readonly llmPrompt?: string;
  readonly inputMapping?: Readonly<Record<string, string>>;
  readonly contract?: SkillContract;
}

export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

export interface SkillRegistry {
  register: (skill: SkillDefinition) => Effect.Effect<void, SkillRegistryError>;
  registerDeclarative: (definition: DeclarativeSkillDefinition) => Effect.Effect<void, SkillRegistryError>;
  resolve: (name: string) => SkillDefinition | undefined;
  list: () => string[];
  getDeclarative: (name: string) => DeclarativeSkillDefinition | undefined;
}

export interface SkillInfo {
  readonly name: string;
  readonly type: "native" | "declarative";
  readonly description?: string;
  readonly hasContract: boolean;
}

export interface LoadOptions {
  readonly registry: SkillRegistry;
  readonly baseDir?: string;
  readonly allowedDirs?: readonly string[];
}

export interface SkillLoaderOptions {
  readonly baseDir?: string;
  readonly allowedDirs?: readonly string[];
}

export interface SkillContextPathOptions {
  readonly strict?: boolean;
}

export interface LanguageProfileResolutionOptions {
  readonly explicit?: string;
  readonly contentType?: string;
  readonly sample?: string;
  readonly defaultCode?: string;
}

export interface RefinementSkillContext {
  readonly profile: LanguageProfile;
  readonly languageCode: string;
  readonly languageName: string;
  readonly tone: string;
  readonly constraints: readonly string[];
  readonly forbiddenPatterns: readonly string[];
  readonly requiredMarkers: readonly string[];
  readonly mode: "critic" | "humanizer" | "refine";
  readonly previousScore?: number;
  readonly focusDimensions: readonly string[];
  readonly userVoiceProfile?: unknown;
  readonly voiceExamples?: readonly unknown[];
  readonly contractValidation?: unknown;
  readonly contractViolations?: readonly unknown[];
  readonly retryInstruction: string;
}

export type SkillValidationError = SkillDefinitionInvalidError;

export type SkillRegistryError = SkillAlreadyRegisteredError | SkillDefinitionInvalidError;

export type SkillLoadError =
  | SkillDefinitionInvalidError
  | SkillModuleInvalidError
  | SkillModuleLoadError
  | SkillPackageNameError
  | SkillPathForbiddenError
  | SkillSpecifierError;

export type SkillExecutionError =
  | LanguageProfileNotFoundError
  | SkillDefinitionInvalidError
  | SkillTemplateError;

export type SkillError = SkillExecutionError | SkillLoadError | SkillRegistryError;
