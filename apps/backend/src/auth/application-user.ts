import { Effect } from "effect";
import type { DatabaseError } from "@my-ai-orchestrator/database";

export interface BackendApplicationUser {
  readonly id: string;
  readonly externalSubject: string;
  readonly status: "active" | "suspended";
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
      readonly createdAt?: Date;
      readonly updatedAt?: Date;
    }
  ) => Effect.Effect<BackendApplicationUser, DatabaseError>;

  readonly findById: (
    id: string
  ) => Effect.Effect<BackendApplicationUser | undefined, DatabaseError>;
}
