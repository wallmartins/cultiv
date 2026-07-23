import { Effect } from "effect";
import type { DatabaseClient, DatabaseError } from "@my-ai-orchestrator/database";
import { toPracticeProfileDomain } from "@my-ai-orchestrator/database";
import type { MePracticeProfileResponse } from "@my-ai-orchestrator/contracts";
import { domainProfileToContracts } from "./practice-profile-domain-bridge.js";

// F4-2 read seam — projects the persisted profile down to its sovereign declared axes so the
// generation flow's audience-narrowing step can offer the author's own audiences as chips. Never
// exposes the derived dimensions (they drive the generator, not the UI). Returns `{ profile: null }`
// when the author has no profile yet (the narrowing step then renders nothing).
export function resolvePracticeProfileDeclaredView(
  database: DatabaseClient,
  userId: string
): Effect.Effect<MePracticeProfileResponse, DatabaseError> {
  return database.practiceProfiles.getByUser(userId).pipe(
    Effect.map((record) => {
      if (!record) {
        return { profile: null };
      }

      const contracts = domainProfileToContracts(toPracticeProfileDomain(record));
      return {
        profile: {
          subject: contracts.subject,
          vantagePoint: contracts.vantagePoint,
          audiences: contracts.audiences,
          depth: contracts.depth
        }
      };
    })
  );
}
