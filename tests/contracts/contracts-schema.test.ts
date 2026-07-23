import { describe, expect, it } from 'vitest';
import { Schema } from 'effect';
import {
  BillingCheckoutRequestSchema,
  BillingGenerationReservationSchema,
  BillingLedgerEntrySchema,
  BillingWalletSchema,
  ExecutionModeSchema,
  GenerationPreviewResponseSchema,
  JobCreatedResponseSchema,
  ExecutionTelemetrySchema,
  PipelineRequestSchema,
  PlanSignatureSchema,
  PracticeProfileDiagnosticsSchema,
  PracticeProfileSchema,
  QualityModeSchema,
  SimplifiedPipelineRequestSchema
} from "../../packages/contracts/src/index.js";

describe('contracts package', () => {
  it('decodes a simplified pipeline request', () => {
    const decode = Schema.decodeUnknownSync(SimplifiedPipelineRequestSchema);
    const value = decode({
      userId: 'user_1',
      pipelineType: 'edition-piece',
      briefing: 'Write a validation post',
      importedContext: 'External reference text',
      qualityMode: 'balanced'
    });

    expect(value.userId).toBe('user_1');
    expect(value.pipelineType).toBe('edition-piece');
    expect(value.qualityMode).toBe('balanced');
    expect(value.importedContext).toBe('External reference text');
  });

  it('rejects richer imported-context payloads that are out of launch scope', () => {
    const decode = Schema.decodeUnknownSync(SimplifiedPipelineRequestSchema);

    expect(() =>
      decode({
        userId: 'user_1',
        pipelineType: 'edition-piece',
        briefing: 'Write a validation post',
        importedContext: { html: '<p>unsupported</p>' }
      })
    ).toThrow();
  });

  it('keeps the exported enum schemas aligned', () => {
    expect(Schema.decodeUnknownSync(ExecutionModeSchema)('sync')).toBe('sync');
    expect(Schema.decodeUnknownSync(PlanSignatureSchema)('short-piece')).toBe('short-piece');
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
      pipelineType: 'short-piece',
      briefing: { topic: 'Monorepo' }
    });

    expect('pipeline' in simplified).toBe(false);
    expect(simplified.userId).toBe('user_2');
  });

  it('decodes a valid billing checkout request', () => {
    const decode = Schema.decodeUnknownSync(BillingCheckoutRequestSchema);
    const value = decode({
      productKind: 'subscription',
      internalRef: 'plan_pro_monthly',
      currency: 'BRL',
      billingPeriod: 'monthly'
    });

    expect(value.productKind).toBe('subscription');
    expect(value.internalRef).toBe('plan_pro_monthly');
    expect(value.currency).toBe('BRL');
    expect(value.billingPeriod).toBe('monthly');
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

  it('decodes execution telemetry with step planner metadata', () => {
    const value = Schema.decodeUnknownSync(ExecutionTelemetrySchema)({
      llm: {
        executedCount: 3,
        bypassedCount: 1,
        llmCallsSaved: 1,
        bypassRate: 0.25
      },
      compositor: {
        planId: 'plan-abc'
      },
      planner: {
        patchCount: 1,
        ops: ['removeStep:hook'],
        basePlanSignature: 'short-piece',
        finalPlanSignature: 'short-piece'
      }
    });

    expect(value.planner?.patchCount).toBe(1);
    expect(value.planner?.ops).toEqual(['removeStep:hook']);
    expect(value.planner?.basePlanSignature).toBe('short-piece');
    expect(value.planner?.finalPlanSignature).toBe('short-piece');
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
      quotaRemaining: 1000,
      quotaLimit: 1000,
      quotaCost: 1,
      canonicalCreditCost: 2.5,
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
    expect(value.quotaRemaining).toBe(1000);
    expect(value.quotaLimit).toBe(1000);
    expect(value.quotaCost).toBe(1);
    expect(value.canonicalCreditCost).toBe(2.5);
    expect(value.options.qualityModes[1]?.creditPrice).toBe(2.5);
    expect(value.options.qualityModes[1]?.recommendation?.reasonCodes).toEqual(['balanced_default']);
  });

  it('decodes a practice profile with its seven dimensions', () => {
    const decode = Schema.decodeUnknownSync(PracticeProfileSchema);
    const value = decode({
      userId: 'user_1',
      version: 1,
      depth: 'seed',
      subject: 'Infraestrutura de dados para climate-tech',
      vantagePoint: 'Engenheira founding em startup early-stage, respondendo a investidores e reguladores',
      audiences: ['liderança técnica', 'investidores'],
      dimensions: {
        point: 'Achado',
        evidence: 'Dado de cliente de amostra pequena',
        readerAssumption: 'Conhece a pressão regulatória mas não o dado técnico',
        resistance: 'Pushback do chefe sobre custo',
        stake: 'Decisão de orçamento a tomar agora',
        fieldCliche: 'Levamos sustentabilidade a sério',
        lexicon: ['MRV', 'offset', 'escopo 3']
      }
    });

    expect(value.depth).toBe('seed');
    expect(value.audiences).toEqual(['liderança técnica', 'investidores']);
    expect(value.dimensions.fieldCliche).toBe('Levamos sustentabilidade a sério');
    expect(value.dimensions.lexicon).toEqual(['MRV', 'offset', 'escopo 3']);
  });

  it('decodes practice profile diagnostics with enrichment suggestions keyed by dimension', () => {
    const decode = Schema.decodeUnknownSync(PracticeProfileDiagnosticsSchema);
    const value = decode({
      userId: 'user_1',
      activeVersion: 1,
      pendingVersion: 2,
      updating: true,
      summary: 'Enriquecimento em progresso.',
      enrichmentSuggestions: {
        lexicon: { response: 'accepted', recordedAt: '2026-07-21T00:00:00.000Z' },
        fieldCliche: { response: 'rejected', recordedAt: '2026-07-21T00:00:00.000Z' }
      }
    });

    expect(value.pendingVersion).toBe(2);
    expect(value.enrichmentSuggestions?.lexicon?.response).toBe('accepted');
    expect(value.enrichmentSuggestions?.fieldCliche?.response).toBe('rejected');
  });
});
