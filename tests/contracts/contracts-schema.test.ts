import { describe, expect, it } from 'vitest';
import { Schema } from 'effect';
import {
  BillingGenerationReservationSchema,
  BillingLedgerEntrySchema,
  BillingWalletSchema,
  ExecutionModeSchema,
  GenerationPreviewResponseSchema,
  JobCreatedResponseSchema,
  PipelineRequestSchema,
  PipelineTypeSchema,
  QualityModeSchema,
  SimplifiedPipelineRequestSchema
} from "../../packages/contracts/src/index.js";

describe('contracts package', () => {
  it('decodes a simplified pipeline request', () => {
    const decode = Schema.decodeUnknownSync(SimplifiedPipelineRequestSchema);
    const value = decode({
      userId: 'user_1',
      pipelineType: 'validation-post',
      briefing: 'Write a validation post',
      importedContext: 'External reference text',
      qualityMode: 'balanced'
    });

    expect(value.userId).toBe('user_1');
    expect(value.pipelineType).toBe('validation-post');
    expect(value.qualityMode).toBe('balanced');
    expect(value.importedContext).toBe('External reference text');
  });

  it('rejects richer imported-context payloads that are out of launch scope', () => {
    const decode = Schema.decodeUnknownSync(SimplifiedPipelineRequestSchema);

    expect(() =>
      decode({
        userId: 'user_1',
        pipelineType: 'validation-post',
        briefing: 'Write a validation post',
        importedContext: { html: '<p>unsupported</p>' }
      })
    ).toThrow();
  });

  it('keeps the exported enum schemas aligned', () => {
    expect(Schema.decodeUnknownSync(ExecutionModeSchema)('sync')).toBe('sync');
    expect(Schema.decodeUnknownSync(PipelineTypeSchema)('newsletter')).toBe('newsletter');
    expect(Schema.decodeUnknownSync(QualityModeSchema)('strict')).toBe('strict');
  });

  it('decodes a job created response', () => {
    const decode = Schema.decodeUnknownSync(JobCreatedResponseSchema);
    const value = decode({
      jobId: 'job_1',
      status: 'queued',
      contentType: 'linkedin-post',
      estimatedSteps: 4,
      createdAt: '2026-05-09T00:00:00.000Z'
    });

    expect(value.status).toBe('queued');
    expect(value.contentType).toBe('linkedin-post');
  });

  it('decodes a pipeline request union for explicit and simplified forms', () => {
    const simplified = Schema.decodeUnknownSync(PipelineRequestSchema)({
      userId: 'user_2',
      pipelineType: 'architecture-post',
      briefing: { topic: 'Monorepo' }
    });

    expect('pipeline' in simplified).toBe(false);
    expect(simplified.userId).toBe('user_2');
  });

  it('decodes billing wallet, ledger and reservation contracts', () => {
    const wallet = Schema.decodeUnknownSync(BillingWalletSchema)({
      accountId: 'user_1:pro',
      subscriptionId: 'sub_1',
      activeCycleId: 'cycle_1',
      availableCredits: 96.7,
      reservedCredits: 3.3,
      pendingCredits: 0,
      lifetimeGrantedCredits: 100,
      lifetimeDebitedCredits: 3.3
    });
    const ledger = Schema.decodeUnknownSync(BillingLedgerEntrySchema)({
      subscriptionId: 'sub_1',
      accountId: 'user_1:pro',
      entryType: 'reserve',
      creditsDelta: -3.3,
      balanceAfter: 96.7,
      referenceType: 'generation_cycle',
      referenceId: 'gen_1',
      idempotencyKey: 'reserve:gen_1',
      metadata: { qualityMode: 'balanced' },
      createdAt: '2026-05-09T00:00:00.000Z'
    });
    const reservation = Schema.decodeUnknownSync(BillingGenerationReservationSchema)({
      reservationId: 'gen_1:reservation',
      generationCycleId: 'gen_1',
      subscriptionId: 'sub_1',
      accountId: 'user_1:pro',
      qualityMode: 'balanced',
      retryCount: 1,
      reservedCredits: 3.3,
      status: 'reserved',
      idempotencyKey: 'reserve:gen_1',
      metadata: {},
      createdAt: '2026-05-09T00:00:00.000Z',
      updatedAt: '2026-05-09T00:00:00.000Z'
    });

    expect(wallet.availableCredits).toBe(96.7);
    expect(ledger.entryType).toBe('reserve');
    expect(reservation.status).toBe('reserved');
  });

  it('decodes a generation preview response', () => {
    const value = Schema.decodeUnknownSync(GenerationPreviewResponseSchema)({
      pricingSnapshot: {
        quoteId: 'quote_123',
        policyVersion: '0.1.0',
        contentType: 'newsletter',
        qualityMode: 'balanced',
        creditPrice: 2.5
      },
      currentBalance: 2500,
      projectedBalanceAfterGeneration: 2497.5,
      options: {
        contentTypes: [
          {
            id: 'newsletter',
            label: 'Newsletter',
            allowed: true
          }
        ],
        qualityModes: [
          {
            id: 'fast',
            allowed: true,
            creditPrice: 1
          },
          {
            id: 'balanced',
            allowed: true,
            creditPrice: 2.5,
            recommended: true,
            recommendation: {
              reasonCodes: ['balanced_default'],
              explanation: 'Balanced is recommended because this request benefits from structure without needing the highest-cost mode.'
            }
          }
        ]
      }
    });

    expect(value.pricingSnapshot.qualityMode).toBe('balanced');
    expect(value.pricingSnapshot.quoteId).toBe('quote_123');
    expect(value.options.qualityModes[1]?.creditPrice).toBe(2.5);
    expect(value.options.qualityModes[1]?.recommendation?.reasonCodes).toEqual(['balanced_default']);
  });
});
