import { Effect } from "effect";
import type { AppLogger } from "@my-ai-orchestrator/core";
import type { AIAdapterServiceContract } from "@my-ai-orchestrator/ai-adapters";
import type { DatabaseClient } from "@my-ai-orchestrator/database";
import { toPracticeProfileDiagnosticsDomain, toPracticeProfileDomain } from "@my-ai-orchestrator/database";
import type { PracticeProfileDiagnostics as DomainPracticeProfileDiagnostics } from "@my-ai-orchestrator/domain";
import type { BackendProviderTransport } from "../../execution/pipeline/provider-transport.js";
import type { BackendAIPolicyServiceContract } from "../ai-policy/ai-policy-types.js";
import {
  resolvePracticeProfileAttempts,
  resolvePracticeProfileLocale
} from "./practice-profile-generation-core.js";
import {
  contractsProfileToDomain,
  domainProfileToContracts,
  practiceProfileDiagnosticsEntityId
} from "./practice-profile-domain-bridge.js";
import { enrichPracticeProfile } from "./practice-profile-generator.js";

export interface PracticeProfileEnrichmentDeps {
  readonly database: DatabaseClient;
  readonly now: () => Date;
  readonly aiAdapters?: AIAdapterServiceContract;
  readonly providerTransport?: BackendProviderTransport;
  readonly aiPolicy?: BackendAIPolicyServiceContract;
  readonly logger?: AppLogger;
}

// F3-5 · G2 enrichment, invoked once from the voice rebuild pipeline post-consent. Only-adds (03/05):
// a seed profile deepens into "enriched" exactly once; an already-enriched profile is left alone.
// Best-effort — enrichment failure never fails the rebuild (norte G2 degrade: generation runs on the
// seed in the meantime).
export function enrichPracticeProfileForUser(
  deps: PracticeProfileEnrichmentDeps,
  userId: string,
  outputLanguage: string | undefined
): Effect.Effect<void, never> {
  const { database, now, aiAdapters, providerTransport, aiPolicy, logger } = deps;
  if (!aiAdapters || !providerTransport || !aiPolicy) {
    return Effect.void;
  }

  return Effect.gen(function* () {
    const seedRecord = yield* database.practiceProfiles.getByUser(userId);
    if (!seedRecord) {
      return;
    }

    const domainSeed = toPracticeProfileDomain(seedRecord);
    if (domainSeed.depth !== "seed") {
      return;
    }

    const policy = yield* aiPolicy.getActivePolicy();
    const attempts = resolvePracticeProfileAttempts(policy);
    if (attempts.length === 0) {
      return;
    }

    const locale = resolvePracticeProfileLocale(outputLanguage);
    const enrichment = yield* enrichPracticeProfile({
      seedProfile: domainProfileToContracts(domainSeed),
      locale,
      deps: { attempts, aiAdapters, providerTransport }
    }).pipe(Effect.either);

    if (enrichment._tag === "Left") {
      logger?.warn("Practice profile enrichment failed; keeping seed profile", {
        userId,
        reason: enrichment.left.message
      });
      return;
    }

    const timestamp = now().toISOString();
    const enrichedVersion = domainSeed.version + 1;
    const enrichedDomain = contractsProfileToDomain(
      { ...enrichment.right.profile, version: enrichedVersion },
      { createdAt: domainSeed.createdAt, updatedAt: timestamp }
    );
    yield* database.practiceProfiles.put(enrichedDomain, enrichedDomain.version);

    const existingDiagnosticsRecord = yield* database.practiceProfileDiagnostics.getByUser(userId);
    const existingDiagnostics = existingDiagnosticsRecord
      ? toPracticeProfileDiagnosticsDomain(existingDiagnosticsRecord)
      : undefined;

    const diagnostics: DomainPracticeProfileDiagnostics = {
      id: practiceProfileDiagnosticsEntityId(userId),
      userId,
      activeVersion: enrichedVersion,
      updating: false,
      ...(existingDiagnostics?.summary !== undefined ? { summary: existingDiagnostics.summary } : {}),
      ...(existingDiagnostics?.enrichmentSuggestions !== undefined
        ? { enrichmentSuggestions: existingDiagnostics.enrichmentSuggestions }
        : {}),
      pendingNicheAskDimensions: enrichment.right.thinDimensions,
      createdAt: existingDiagnostics?.createdAt ?? timestamp,
      updatedAt: timestamp
    };
    yield* database.practiceProfileDiagnostics.put(diagnostics, enrichedVersion);

    logger?.info("Enriched practice profile during rebuild", {
      userId,
      version: enrichedVersion,
      thinDimensionCount: enrichment.right.thinDimensions.length
    });
  }).pipe(Effect.catchAllCause(() => Effect.void));
}
