import { Effect } from "effect";
import type { AppLogger } from "@my-ai-orchestrator/core";
import type { AIAdapterServiceContract } from "@my-ai-orchestrator/ai-adapters";
import type { DatabaseClient, DatabaseError } from "@my-ai-orchestrator/database";
import { toPracticeProfileDiagnosticsDomain, toPracticeProfileDomain } from "@my-ai-orchestrator/database";
import type {
  EnrichmentSuggestionRecord,
  MePracticeIdentityResponse,
  NicheAskResponseInput,
  PracticeDimensionKey,
  UpdateDeclaredAxesInput
} from "@my-ai-orchestrator/contracts";
import type {
  PracticeProfile as DomainPracticeProfile,
  PracticeProfileDiagnostics as DomainPracticeProfileDiagnostics
} from "@my-ai-orchestrator/domain";
import type { BackendProviderTransport } from "../../execution/pipeline/provider-transport.js";
import type { BackendAIPolicyServiceContract } from "../ai-policy/ai-policy-types.js";
import {
  contractsProfileToDomain,
  domainProfileToContracts
} from "./practice-profile-domain-bridge.js";
import {
  resolvePracticeProfileAttempts,
  sameDeclaredAxes,
  type DeclaredPracticeAxes,
  type PracticeProfileGenerationDeps,
  type PracticeProfileLocale
} from "./practice-profile-generation-core.js";
import { enrichPracticeProfile, generateSeedPracticeProfile } from "./practice-profile-generator.js";
import { buildNicheAsk } from "./practice-profile-niche-ask.js";
import {
  PracticeProfileDerivationError,
  PracticeProfileGenerationError,
  PracticeProfileValidationError
} from "./practice-profile-errors.js";

// F5-2(a) — a material declared-axes edit re-seeds G1 synchronously; C-7's aggregate-ceiling class
// (onboarding's `setContext` is 60s over G1+G3, this is 60s over G1 alone — a single surface).
const DECLARATION_RESEED_TIMEOUT = "60 seconds";

// F5-2(b)/F5-3 — the niche-ask "answer" re-triggers G2 with the author's specifics. Same C-7 class,
// a smaller budget: one enrichment pass, no onboarding-critical-path pressure.
const NICHE_ASK_REENRICHMENT_TIMEOUT = "45 seconds";

export interface BackendPracticeProfileServiceDeps {
  readonly database: DatabaseClient;
  readonly now: () => Date;
  readonly aiAdapters: AIAdapterServiceContract;
  readonly providerTransport: BackendProviderTransport;
  readonly aiPolicy: BackendAIPolicyServiceContract;
  readonly logger?: AppLogger;
}

export interface BackendPracticeProfileService {
  // The /voice identity read (F5-1). Never leaks the 7 derived dimensions — only the sovereign
  // declared axes + depth + the curated niche-ask question, if one is pending.
  readonly resolveIdentity: (
    userId: string,
    locale: PracticeProfileLocale
  ) => Effect.Effect<MePracticeIdentityResponse, DatabaseError>;
  // F5-2(a). `undefined` means the author has no profile yet (route maps to 404).
  readonly updateDeclaredAxes: (
    userId: string,
    input: UpdateDeclaredAxesInput,
    locale: PracticeProfileLocale
  ) => Effect.Effect<
    MePracticeIdentityResponse | undefined,
    PracticeProfileValidationError | PracticeProfileDerivationError
  >;
  // F5-2(b)/F5-3. Best-effort re-enrichment on "answer" — never fails the request.
  readonly respondToNicheAsk: (
    userId: string,
    input: NicheAskResponseInput,
    locale: PracticeProfileLocale
  ) => Effect.Effect<MePracticeIdentityResponse, DatabaseError>;
}

function buildIdentityView(
  profile: DomainPracticeProfile | undefined,
  diagnostics: DomainPracticeProfileDiagnostics | undefined,
  locale: PracticeProfileLocale
): MePracticeIdentityResponse {
  if (!profile) {
    return { profile: null };
  }

  // Only the curated question crosses the wire — the dimension keys stay server-side (ADR 0010 §2).
  const nicheAsk = buildNicheAsk({
    subject: profile.subject,
    thinDimensions: diagnostics?.pendingNicheAskDimensions ?? [],
    locale
  });

  return {
    profile: {
      subject: profile.subject,
      vantagePoint: profile.vantagePoint,
      audiences: profile.audiences,
      depth: profile.depth,
      nicheAsk: nicheAsk ? { question: nicheAsk.question } : null
    }
  };
}

// Mirrors voice-calibration-service's toDeclaredAxes — trims, and drops audiences left blank after
// trimming. Kept local: the input shape (UpdateDeclaredAxesInput) is distinct from WizardContext.
function normalizeAxes(input: UpdateDeclaredAxesInput): DeclaredPracticeAxes | undefined {
  const subject = input.subject.trim();
  const vantagePoint = input.vantagePoint.trim();
  const audiences = input.audiences.map((audience) => audience.trim()).filter((audience) => audience.length > 0);
  if (!subject || !vantagePoint || audiences.length === 0) {
    return undefined;
  }
  return { subject, vantagePoint, audiences };
}

// The niche-ask "answer" re-enrichment (G2, re-triggered). Any failure — policy resolution, an
// exhausted provider chain, or the timeout — is captured by the caller via Effect.either: this surface
// is best-effort by contract (norte G2 degrade), it must never fail the /voice request.
function runNicheAskReEnrichment(args: {
  readonly profile: DomainPracticeProfile;
  readonly locale: PracticeProfileLocale;
  readonly answer: string;
  readonly aiPolicy: BackendAIPolicyServiceContract;
  readonly aiAdapters: AIAdapterServiceContract;
  readonly providerTransport: BackendProviderTransport;
}) {
  return Effect.gen(function* () {
    const policy = yield* args.aiPolicy.getActivePolicy().pipe(
      Effect.mapError((error) => new PracticeProfileGenerationError({ message: error.message }))
    );
    const attempts = resolvePracticeProfileAttempts(policy);
    if (attempts.length === 0) {
      return yield* Effect.fail(
        new PracticeProfileGenerationError({ message: "no provider attempts configured for practice profile" })
      );
    }

    const deps: PracticeProfileGenerationDeps = {
      attempts,
      aiAdapters: args.aiAdapters,
      providerTransport: args.providerTransport
    };

    return yield* enrichPracticeProfile({
      seedProfile: domainProfileToContracts(args.profile),
      locale: args.locale,
      deps,
      authorSpecifics: args.answer
    });
  }).pipe(
    Effect.timeoutFail({
      duration: NICHE_ASK_REENRICHMENT_TIMEOUT,
      onTimeout: () => new PracticeProfileGenerationError({ message: "practice profile re-enrichment timed out" })
    })
  );
}

export function createBackendPracticeProfileService(
  deps: BackendPracticeProfileServiceDeps
): BackendPracticeProfileService {
  const { database, now, aiAdapters, providerTransport, aiPolicy, logger } = deps;

  return {
    resolveIdentity(userId, locale) {
      return Effect.gen(function* () {
        const profileRecord = yield* database.practiceProfiles.getByUser(userId);
        if (!profileRecord) {
          return { profile: null };
        }

        const diagnosticsRecord = yield* database.practiceProfileDiagnostics.getByUser(userId);
        const profile = toPracticeProfileDomain(profileRecord);
        const diagnostics = diagnosticsRecord ? toPracticeProfileDiagnosticsDomain(diagnosticsRecord) : undefined;
        return buildIdentityView(profile, diagnostics, locale);
      });
    },

    updateDeclaredAxes(userId, input, locale) {
      return Effect.gen(function* () {
        const axes = normalizeAxes(input);
        if (!axes) {
          return yield* Effect.fail(
            new PracticeProfileValidationError({
              message: "subject, vantagePoint, and at least one audience are required"
            })
          );
        }

        const existingRecord = yield* database.practiceProfiles.getByUser(userId).pipe(Effect.orDie);
        if (!existingRecord) {
          return undefined;
        }
        const existing = toPracticeProfileDomain(existingRecord);
        const timestamp = now().toISOString();

        let updatedProfile: DomainPracticeProfile;
        let diagnostics: DomainPracticeProfileDiagnostics | undefined;

        if (sameDeclaredAxes(existing, axes)) {
          // Cosmetic (C-1 class): persist the author's surface form, keep the derived lifecycle as-is.
          updatedProfile = {
            ...existing,
            subject: axes.subject,
            vantagePoint: axes.vantagePoint,
            audiences: axes.audiences,
            updatedAt: timestamp
          };
          yield* database.practiceProfiles.put(updatedProfile, updatedProfile.version).pipe(Effect.orDie);

          const diagnosticsRecord = yield* database.practiceProfileDiagnostics.getByUser(userId).pipe(Effect.orDie);
          diagnostics = diagnosticsRecord ? toPracticeProfileDiagnosticsDomain(diagnosticsRecord) : undefined;
        } else {
          // Material (C-1 class): a legitimate re-seed — recalibration is a new lifecycle (ADR 0010 §4).
          const policy = yield* aiPolicy.getActivePolicy().pipe(
            Effect.mapError((error) => new PracticeProfileDerivationError({ userId, message: error.message }))
          );
          const attempts = resolvePracticeProfileAttempts(policy);
          if (attempts.length === 0) {
            return yield* Effect.fail(
              new PracticeProfileDerivationError({
                userId,
                message: "no provider attempts configured for practice profile"
              })
            );
          }

          const generationDeps: PracticeProfileGenerationDeps = { attempts, aiAdapters, providerTransport };
          const newVersion = existing.version + 1;
          const seed = yield* generateSeedPracticeProfile({
            userId,
            version: newVersion,
            axes,
            locale,
            deps: generationDeps
          }).pipe(
            Effect.mapError((error) => new PracticeProfileDerivationError({ userId, message: error.message })),
            Effect.timeoutFail({
              duration: DECLARATION_RESEED_TIMEOUT,
              onTimeout: () =>
                new PracticeProfileDerivationError({ userId, message: "Practice profile re-seed timed out" })
            })
          );

          // The profile stays untouched until this point — put() only runs after a successful re-seed.
          updatedProfile = contractsProfileToDomain(seed, { createdAt: existing.createdAt, updatedAt: timestamp });
          yield* database.practiceProfiles.put(updatedProfile, updatedProfile.version).pipe(Effect.orDie);

          const existingDiagnosticsRecord = yield* database.practiceProfileDiagnostics
            .getByUser(userId)
            .pipe(Effect.orDie);
          if (existingDiagnosticsRecord) {
            const existingDiagnostics = toPracticeProfileDiagnosticsDomain(existingDiagnosticsRecord);
            diagnostics = {
              ...existingDiagnostics,
              activeVersion: newVersion,
              pendingNicheAskDimensions: [],
              updatedAt: timestamp
            };
            yield* database.practiceProfileDiagnostics.put(diagnostics, newVersion).pipe(Effect.orDie);
          }
        }

        return buildIdentityView(updatedProfile, diagnostics, locale);
      });
    },

    respondToNicheAsk(userId, input, locale) {
      return Effect.gen(function* () {
        const diagnosticsRecord = yield* database.practiceProfileDiagnostics.getByUser(userId);
        const diagnostics = diagnosticsRecord ? toPracticeProfileDiagnosticsDomain(diagnosticsRecord) : undefined;
        const pending = diagnostics?.pendingNicheAskDimensions ?? [];

        const profileRecord = yield* database.practiceProfiles.getByUser(userId);
        const profile = profileRecord ? toPracticeProfileDomain(profileRecord) : undefined;

        if (!diagnostics || pending.length === 0) {
          return buildIdentityView(profile, diagnostics, locale);
        }

        const timestamp = now().toISOString();

        // Record the author's response on every pending dimension (append-only, read-merge-write over
        // the existing suggestions). Built per outcome — a failed re-enrichment records nothing.
        const recordResponse = (
          response: EnrichmentSuggestionRecord["response"]
        ): Partial<Record<PracticeDimensionKey, EnrichmentSuggestionRecord>> => {
          const suggestions: Partial<Record<PracticeDimensionKey, EnrichmentSuggestionRecord>> = {
            ...diagnostics.enrichmentSuggestions
          };
          for (const dimension of pending) {
            suggestions[dimension] = { response, recordedAt: timestamp };
          }
          return suggestions;
        };

        if (input.action === "dismiss") {
          const updatedDiagnostics: DomainPracticeProfileDiagnostics = {
            ...diagnostics,
            enrichmentSuggestions: recordResponse("rejected"),
            pendingNicheAskDimensions: [],
            updatedAt: timestamp
          };
          yield* database.practiceProfileDiagnostics.put(updatedDiagnostics, updatedDiagnostics.activeVersion);
          return buildIdentityView(profile, updatedDiagnostics, locale);
        }

        // action === "answer"
        if (!profile) {
          return buildIdentityView(undefined, diagnostics, locale);
        }

        const enrichmentResult = yield* runNicheAskReEnrichment({
          profile,
          locale,
          answer: input.answer,
          aiPolicy,
          aiAdapters,
          providerTransport
        }).pipe(Effect.either);

        if (enrichmentResult._tag === "Left") {
          // Degrade (best-effort, norte G2): the re-enrichment failed, so nothing is applied and
          // nothing is recorded — the ask stays pending so the author can retry once providers recover,
          // rather than silently dropping it (and falsely logging the unanswered dimension as accepted).
          logger?.warn("Practice profile niche-ask re-enrichment failed; leaving the ask pending", {
            userId,
            reason: enrichmentResult.left.message
          });
          return buildIdentityView(profile, diagnostics, locale);
        }

        const newVersion = profile.version + 1;
        const enrichedDomain = contractsProfileToDomain(
          { ...enrichmentResult.right.profile, version: newVersion },
          { createdAt: profile.createdAt, updatedAt: timestamp }
        );
        yield* database.practiceProfiles.put(enrichedDomain, newVersion);

        const updatedDiagnostics: DomainPracticeProfileDiagnostics = {
          ...diagnostics,
          activeVersion: newVersion,
          pendingNicheAskDimensions: enrichmentResult.right.thinDimensions,
          enrichmentSuggestions: recordResponse("accepted"),
          updatedAt: timestamp
        };
        yield* database.practiceProfileDiagnostics.put(updatedDiagnostics, newVersion);
        return buildIdentityView(enrichedDomain, updatedDiagnostics, locale);
      });
    }
  };
}
