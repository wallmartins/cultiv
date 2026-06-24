import { Effect } from "effect";
import { DatabaseError } from "@my-ai-orchestrator/database";

function toDatabaseError(operation: string, cause: unknown): DatabaseError {
  const message =
    cause instanceof Error
      ? cause.message
      : typeof cause === "string"
        ? cause
        : "Unknown database error";

  return new DatabaseError({
    operation,
    message,
    cause
  });
}

export function postgresTryPromise<A>(
  operation: string,
  tryFn: () => PromiseLike<A> | A
): Effect.Effect<A, DatabaseError> {
  return Effect.tryPromise({
    try: tryFn,
    catch: (cause) => toDatabaseError(operation, cause)
  });
}
