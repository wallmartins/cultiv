import { Effect } from "effect";
import type { BackendOperator, BackendOperatorRepository } from "./operator.js";

export function createBackendOperatorMemoryRepository(): BackendOperatorRepository {
  const store = new Map<string, BackendOperator>();

  return {
    findById(id) {
      return Effect.sync(() => store.get(id));
    },

    create(args) {
      return Effect.sync(() => {
        const operator: BackendOperator = {
          id: args.id,
          permissions: args.permissions ?? [],
          roles: args.roles ?? [],
          status: args.status ?? "active"
        };
        store.set(operator.id, operator);
        return operator;
      });
    }
  };
}
