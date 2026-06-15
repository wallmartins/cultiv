import { Effect } from "effect";

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
  ) => Effect.Effect<BackendApplicationUser | undefined, never>;

  readonly create: (
    args: {
      readonly id: string;
      readonly externalSubject: string;
      readonly status?: BackendApplicationUser["status"];
      readonly createdAt?: Date;
      readonly updatedAt?: Date;
    }
  ) => Effect.Effect<BackendApplicationUser, never>;

  readonly findById: (
    id: string
  ) => Effect.Effect<BackendApplicationUser | undefined, never>;
}
