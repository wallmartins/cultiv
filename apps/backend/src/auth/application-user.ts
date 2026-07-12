import { Effect } from "effect";
import type { DatabaseError } from "@my-ai-orchestrator/database";

export interface BackendApplicationUser {
  readonly id: string;
  readonly externalSubject: string;
  readonly status: "active" | "suspended";
  readonly onboardingCompletedAt?: Date;
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
}
