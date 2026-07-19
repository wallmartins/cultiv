import { Effect } from "effect";
import type { DatabaseError } from "@my-ai-orchestrator/database";

export interface BackendApplicationUser {
  readonly id: string;
  readonly externalSubject: string;
  // contract-08 decision 4 — "deleted" is a terminal tombstone, never reachable from "suspended".
  readonly status: "active" | "suspended" | "deleted";
  readonly onboardingCompletedAt?: Date;
  readonly deletedAt?: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface BackendApplicationUserRepository {
  readonly findByExternalSubject: (
    externalSubject: string
  ) => Effect.Effect<BackendApplicationUser | undefined, DatabaseError>;

  readonly create: (
    args: {
      readonly id: string;
      readonly externalSubject: string;
      readonly status?: BackendApplicationUser["status"];
      readonly onboardingCompletedAt?: Date;
      readonly createdAt?: Date;
      readonly updatedAt?: Date;
    }
  ) => Effect.Effect<BackendApplicationUser, DatabaseError>;

  readonly findById: (
    id: string
  ) => Effect.Effect<BackendApplicationUser | undefined, DatabaseError>;

  readonly updateOnboardingStatus: (
    id: string,
    completedAt: Date
  ) => Effect.Effect<BackendApplicationUser, DatabaseError>;

  // contract-08 decision 4 — tombstone: status="deleted" + deletedAt. id + externalSubject are
  // KEPT (not nulled) — findByExternalSubject must still match the tombstoned row so the auth
  // guard can reject it; nulling externalSubject would make it "not found" and auto-create a new
  // row with the same subject, i.e. resurrect the account. This table stores no other PII.
  // Terminal — no repository method reverses this.
  readonly tombstone: (
    id: string,
    deletedAt: Date
  ) => Effect.Effect<BackendApplicationUser, DatabaseError>;
}
