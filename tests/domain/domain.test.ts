import { describe, expect, it } from 'vitest';
import {
  ContentTypeUnavailableError,
  VoiceBatchExpiredError,
  VoiceBatchNotFoundError,
  VoiceExampleValidationError,
  VoicePinnedLimitExceededError,
  VoiceProfileRebuildFailedError,
  canonicalNextActionCodes,
  canonicalReasonCodes,
  createContentType,
  createExecutionPlan,
  createJob,
  createLanguageProfile,
  createMemoryRecord,
  createPipeline,
  isTerminalJobStatus,
  nextActionCodesForReason,
  toTextQualityVoiceProfile,
  toVoiceProfileView
} from "../../packages/domain/src/index.js";

describe('domain package', () => {
  it('identifies terminal job statuses', () => {
    expect(isTerminalJobStatus('done')).toBe(true);
    expect(isTerminalJobStatus('failed')).toBe(true);
    expect(isTerminalJobStatus('running')).toBe(false);
  });

  it('preserves language profile values without mutation', () => {
    const profile = createLanguageProfile({
      id: 'pt-BR',
      code: 'pt-BR',
      name: 'Portuguese (Brazil)',
      dictionary: new Set(['pipeline', 'conteudo']),
      patterns: {},
      prompts: {},
      defaults: {
        tone: 'professional',
        constraints: ['no english leaks']
      },
      contracts: {
        forbiddenPatterns: ['as an ai'],
        requiredMarkers: ['hook']
      }
    });

    expect(profile.code).toBe('pt-BR');
    expect(profile.contracts.requiredMarkers).toContain('hook');
  });

  it('keeps pipeline and execution plan value objects intact', () => {
    const pipeline = createPipeline({
      id: 'pipeline_1',
      name: 'validation-post',
      type: 'validation-post',
      qualityMode: 'balanced',
      steps: [{ id: 'step_1', skill: 'analyze', config: {} }]
    });
    const plan = createExecutionPlan({
      id: 'plan_1',
      pipeline: {
        name: pipeline.name,
        steps: [{ name: 'analyze', skill: 'analyze' }]
      },
      input: { topic: 'monorepo' },
      mode: 'sync',
      qualityMode: 'balanced'
    });

    expect(pipeline.type).toBe('validation-post');
    expect(plan.mode).toBe('sync');
  });

  it('creates job, memory and content type objects as-is', () => {
    const job = createJob({
      id: 'job_1',
      status: 'queued',
      executionMode: 'async',
      contentType: 'linkedin-post',
      createdAt: '2026-05-09T00:00:00.000Z',
      completedAt: null
    });
    const record = createMemoryRecord({
      id: 'mem_1',
      userId: 'user_1',
      key: 'voice-profile',
      value: { tone: 'direct' },
      createdAt: '2026-05-09T00:00:00.000Z',
      updatedAt: '2026-05-09T00:00:00.000Z'
    });
    const contentType = createContentType({
      id: 'content_1',
      label: 'LinkedIn Post',
      defaultLanguage: 'pt-BR',
      steps: ['hook', 'insight', 'cta'],
      inputSchema: { topic: 'string' }
    });

    expect(job.executionMode).toBe('async');
    expect(record.key).toBe('voice-profile');
    expect(contentType.steps).toContain('cta');
  });

  it('exports canonical reason and action vocabularies', () => {
    expect(canonicalReasonCodes).toContain('insufficient_examples');
    expect(canonicalReasonCodes).toContain('plan_restriction');
    expect(canonicalNextActionCodes).toContain('add_more_examples');
    expect(canonicalNextActionCodes).toContain('upgrade_plan');
  });

  it('maps reason codes to default next actions', () => {
    expect(nextActionCodesForReason('insufficient_examples')).toEqual(['add_more_examples']);
    expect(nextActionCodesForReason('plan_restriction')).toEqual(['upgrade_plan']);
    expect(nextActionCodesForReason('too_many_pinned_examples')).toEqual(['remove_pinned_example']);
  });

  it('creates typed domain errors for voice and catalog flows', () => {
    const validation = new VoiceExampleValidationError({
      reasonCode: 'invalid_example_payload',
      message: 'Text is required',
      field: 'text'
    });
    const missingBatch = new VoiceBatchNotFoundError({ batchId: 'batch_1' });
    const expiredBatch = new VoiceBatchExpiredError({ batchId: 'batch_2', expiredAt: '2026-05-14T18:00:00.000Z' });
    const rebuildFailure = new VoiceProfileRebuildFailedError({
      userId: 'user_1',
      reasonCode: 'insufficient_diversity',
      message: 'Need more varied examples'
    });
    const pinnedLimit = new VoicePinnedLimitExceededError({
      userId: 'user_1',
      attemptedPinnedCount: 4,
      pinnedLimit: 2
    });
    const unavailable = new ContentTypeUnavailableError({
      contentTypeId: 'newsletter',
      reasonCode: 'plan_restriction'
    });

    expect(validation._tag).toBe('VoiceExampleValidationError');
    expect(validation.field).toBe('text');
    expect(missingBatch._tag).toBe('VoiceBatchNotFoundError');
    expect(expiredBatch.expiredAt).toBe('2026-05-14T18:00:00.000Z');
    expect(rebuildFailure.reasonCode).toBe('insufficient_diversity');
    expect(pinnedLimit.pinnedLimit).toBe(2);
    expect(unavailable.reasonCode).toBe('plan_restriction');
  });

  it('maps DerivedVoiceProfile to contract views', () => {
    const derived = {
      id: 'vp_1',
      userId: 'user_1',
      version: 2,
      snapshotId: 'snap_1',
      confidence: 'high' as const,
      adaptationMode: 'standard' as const,
      primaryLanguage: 'pt-BR',
      tone: 'direct',
      cadence: 'short',
      lexicon: ['pipeline'],
      constraints: ['no jargon'],
      styleMarkers: ['questions'],
      rules: ['active voice'],
      antiPatterns: ['buzzwords'],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z'
    };

    const view = toVoiceProfileView(derived);
    expect(view.userId).toBe('user_1');
    expect(view.tone).toBe('direct');

    const pipelineProfile = toTextQualityVoiceProfile(derived, {
      examples: ['sample'],
      userLabels: ['mentor']
    });
    expect(pipelineProfile.examples).toEqual(['sample']);
    expect(pipelineProfile.userLabels).toEqual(['mentor']);
  });
});
