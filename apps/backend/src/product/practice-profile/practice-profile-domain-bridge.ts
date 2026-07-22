import type { PracticeProfile as ContractsPracticeProfile } from "@my-ai-orchestrator/contracts";
import type { PracticeProfile as DomainPracticeProfile } from "@my-ai-orchestrator/domain";

// F1-4 disambiguation landing (ADR 0010 / contracts practice-profile.ts:31-34): the generator emits the
// bare-value contracts `PracticeProfile` (no identity), the repository stores the domain Entity (id +
// timestamps). This is the one seam that needs both shapes at once, so the conversion lives here.
// Names spell the direction out (contractsProfileToDomain, not toDomainPracticeProfile) so they don't
// read as a synonym of the database converter `toPracticeProfileDomain` (row→domain).

// One profile per user (ADR 0010 §4), upserted on user_id — deterministic ids keep put() idempotent.
export function practiceProfileEntityId(userId: string): string {
  return `practice-profile:${userId}`;
}

export function practiceProfileDiagnosticsEntityId(userId: string): string {
  return `practice-profile-diagnostics:${userId}`;
}

export function contractsProfileToDomain(
  profile: ContractsPracticeProfile,
  timestamps: { readonly createdAt: string; readonly updatedAt: string }
): DomainPracticeProfile {
  return {
    id: practiceProfileEntityId(profile.userId),
    userId: profile.userId,
    version: profile.version,
    depth: profile.depth,
    subject: profile.subject,
    vantagePoint: profile.vantagePoint,
    audiences: profile.audiences,
    dimensions: profile.dimensions,
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt
  };
}

export function domainProfileToContracts(profile: DomainPracticeProfile): ContractsPracticeProfile {
  return {
    userId: profile.userId,
    version: profile.version,
    depth: profile.depth,
    subject: profile.subject,
    vantagePoint: profile.vantagePoint,
    audiences: profile.audiences,
    dimensions: profile.dimensions
  };
}
