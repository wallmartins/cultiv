import { Effect } from "effect";

export interface BackendOperator {
  readonly id: string;
  readonly permissions: readonly string[];
  readonly roles: readonly string[];
  readonly status: "active" | "suspended";
}

export interface BackendOperatorRepository {
  readonly findById: (
    id: string
  ) => Effect.Effect<BackendOperator | undefined, never>;

  readonly create: (
    args: {
      readonly id: string;
      readonly permissions?: readonly string[];
      readonly roles?: readonly string[];
      readonly status?: BackendOperator["status"];
    }
  ) => Effect.Effect<BackendOperator, never>;
}
