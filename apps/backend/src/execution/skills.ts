import { Effect } from "effect";
import type { GenreSignature, RhetoricalMode } from "@my-ai-orchestrator/contracts";
import type { PipelineStep, StepOutput } from "@my-ai-orchestrator/core";
import { getEffectiveConfig, resolveTemplate, type SkillDefinition, type SkillExecutionContext } from "@my-ai-orchestrator/skills";
import { buildRefinementSkillContext } from "@my-ai-orchestrator/skills";
import type { VoiceProfile } from "@my-ai-orchestrator/text-quality";
import { replaceEmDashesWithCommas } from "@my-ai-orchestrator/text-quality";
import { normalizeText, stripTemplateHeaders } from "./quality/quality.js";
import type { BackendSkillOptions } from "./skill-types.js";
import { buildAudienceModulationSection, resolveLexiconInstruction } from "./pipeline/audience-modulation.js";
import { buildGenreSection } from "./pipeline/genre-section.js";
import { buildStepVoiceContext } from "./pipeline/step-context.js";
import {
  classifyStep,
  formatStepLabel,
  resolveContextWordTarget,
  resolveFormatInstructions,
  resolveOutputRules,
  resolveRefinementMode,
  resolveStructuredStepTemplate
} from "./skill-templates.js";
import { resolveExpressionFormatInstructions } from "../product/generation/compositor/expression-instructions.js";
import {
  collectVoiceExampleTexts,
  getBriefingSample,
  getBriefingText,
  getTopic,
  normalizeOutput,
  normalizeViolations,
  resolveLanguage
} from "./skill-inputs.js";

export function createSanitizeSkillDefinition(): SkillDefinition {
  return {
    name: "sanitize",
    description: "Sanitizes the final output by removing template headers, meta-framing, and prompt echo.",
    contract: {
      type: "transform",
      output: {
        parser: "text",
        description: "Clean final text without headers or meta commentary"
      }
    },
    execute: (context) =>
      Effect.gen(function* () {
        const previousStep = context.pipeline.steps[context.stepIndex - 1];
        const rawContent = previousStep ? context.state[previousStep.name] : undefined;

        if (typeof rawContent !== "string") {
          return {
            output: normalizeOutput(rawContent)
          } satisfies StepOutput;
        }

        const stripped = replaceEmDashesWithCommas(stripTemplateHeaders(rawContent));

        return {
          output: stripped
        } satisfies StepOutput;
      })
  };
}

export function createBackendSkillDefinition(
  step: PipelineStep,
  options: BackendSkillOptions
): SkillDefinition {
  if (step.name === "sanitize") {
    return createSanitizeSkillDefinition();
  }

  return {
    name: step.name,
    description: `Backend execution skill for ${step.name}`,
    contract: {
      type: classifyStep(step.name),
      output: {
        parser: "text",
        description: `Generated output for ${step.name}`
      }
    },
    execute: (context) =>
      Effect.gen(function* () {
        const voiceProfile = context.state.voiceProfile as Partial<VoiceProfile> | undefined;
        const voiceExampleTexts = collectVoiceExampleTexts(voiceProfile);
        const stepExamples = step.name === "hook"
          ? voiceExampleTexts.slice(0, 1)
          : step.name === "refine" || step.name === "tighten"
            ? voiceExampleTexts.slice(0, 2)
            : voiceExampleTexts;

        const refinement = yield* buildRefinementSkillContext({
          mode: resolveRefinementMode(step.name),
          explicit: resolveLanguage(context),
          contentType: context.pipeline.name,
          sample: getBriefingSample(context.inputs),
          defaultCode: "pt-BR",
          previousScore: typeof context.state.__score === "number" ? context.state.__score : undefined,
          focusDimensions: [step.name, options.qualityMode],
          voiceTone: voiceProfile?.tone,
          userVoiceProfile: voiceProfile,
          voiceExamples: stepExamples.length > 0 ? stepExamples : undefined,
          contractValidation: context.state.contractValidation,
          contractViolations: normalizeViolations(context.state.contractViolations)
        });

        const previousStep = context.pipeline.steps[context.stepIndex - 1];
        const previousContent = previousStep ? context.state[previousStep.name] : undefined;
        const briefingText = getBriefingText(context.inputs);
        const stepVoice = buildStepVoiceContext(step.name, voiceProfile, {
          briefing: briefingText,
          rhetoricalMode:
            typeof context.inputs.rhetoricalMode === "string"
              ? (context.inputs.rhetoricalMode as RhetoricalMode)
              : undefined
        });
        const topic = getTopic(context.inputs, context.state, context.pipeline.name);
        const audience = typeof context.inputs.audience === "string" ? context.inputs.audience : undefined;
        const genre =
          typeof context.inputs.genre === "object" && context.inputs.genre !== null
            ? (context.inputs.genre as GenreSignature)
            : undefined;
        const contextWordTarget = resolveContextWordTarget(context.inputs);
        const expressionProfile =
          typeof context.inputs.expressionProfile === "string" ? context.inputs.expressionProfile : undefined;
        const formatInstructions = expressionProfile
          ? resolveExpressionFormatInstructions(expressionProfile, step.name, contextWordTarget)
          : resolveFormatInstructions(context.pipeline.name, step.name, contextWordTarget);
        const templateContext = {
          state: context.state,
          inputs: context.inputs,
          config: getEffectiveConfig(context),
          memory: context.memory,
          locals: {
            adapter: options.adapter,
            model: options.model,
            qualityMode: options.qualityMode,
            stepName: step.name,
            stepLabel: formatStepLabel(step.name),
            stepIndex: context.stepIndex + 1,
            totalSteps: context.pipeline.steps.length,
            pipelineName: context.pipeline.name,
            topic,
            briefingText,
            previousContent: normalizeOutput(previousContent),
            sourceText: normalizeOutput(previousContent) || briefingText,
            formatInstructions,
            outputRules: resolveOutputRules(step.name),
            voiceDescription: voiceProfile?.description?.trim() || "- (not specified)",
            styleMarkers: stepVoice.styleMarkers,
            voiceRules: stepVoice.voiceRules,
            voiceConstraints: stepVoice.voiceConstraints,
            antiPatterns: stepVoice.antiPatterns,
            lexicon: stepVoice.lexicon,
            lexiconInstruction: resolveLexiconInstruction(audience),
            audienceModulation: buildAudienceModulationSection(audience),
            genreSection: buildGenreSection(genre),
            cadence: voiceProfile?.cadence ?? "natural",
            voiceExamples: stepVoice.voiceExamples,
            authorReasoning: stepVoice.authorReasoning,
            authorReasoningSection: stepVoice.authorReasoningSection,
            authorDevelopment: stepVoice.authorDevelopment,
            authorDevelopmentSection: stepVoice.authorDevelopmentSection,
            argumentLensesSection: stepVoice.argumentLensesSection,
            quantitativeConstraintsSection: stepVoice.quantitativeConstraintsSection,
            retryInstruction: refinement.retryInstruction,
            tone: refinement.tone,
            languageCode: refinement.languageCode,
            languageName: refinement.languageName,
            constraints: refinement.constraints.join(", "),
            previousScore: refinement.previousScore ?? 0
          }
        };

        const structuredTemplate = resolveStructuredStepTemplate(step.name);
        const systemPrompt = yield* resolveTemplate(structuredTemplate.system, templateContext);
        const userPrompt = yield* resolveTemplate(structuredTemplate.user, templateContext);
        const normalizedSystem = normalizeText(systemPrompt);
        const normalizedUser = normalizeText(userPrompt);

        return {
          output: { system: normalizedSystem, user: normalizedUser }
        } satisfies StepOutput;
      })
  };
}

