import { Effect } from "effect";
import type {
  BackendApplicationUser,
  BackendApplicationUserRepository
} from "./application-user.js";

export function createBackendApplicationUserMemoryRepository(): BackendApplicationUserRepository {
  const store = new Map<string, BackendApplicationUser>();
  const indexBySubject = new Map<string, string>();

  return {
    findByExternalSubject(externalSubject) {
      return Effect.sync(() => {
        const id = indexBySubject.get(externalSubject);
        if (!id) return undefined;
        return store.get(id);
      });
    },

    create(args) {
      return Effect.sync(() => {
        const now = args.createdAt ?? new Date();
        const user: BackendApplicationUser = {
          id: args.id,
          externalSubject: args.externalSubject,
          status: args.status ?? "active",
          createdAt: now,
          updatedAt: args.updatedAt ?? now
        };
        store.set(user.id, user);
        indexBySubject.set(user.externalSubject, user.id);
        return user;
      });
    },

    findById(id) {
      return Effect.sync(() => store.get(id));
    }
  };
}
