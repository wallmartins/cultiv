import { Effect } from "effect";

export function swallowWithDiagnostic(args: {
  readonly operation: string;
  readonly context?: Readonly<Record<string, unknown>>;
}) {
  return (error?: unknown): Effect.Effect<void, never> =>
    Effect.logWarning(args.operation, {
      ...args.context,
      cause: toDiagnosticMessage(error)
    }).pipe(
      Effect.orElse(() => Effect.void),
      Effect.zipRight(Effect.void)
    );
}

function toDiagnosticMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  if (typeof error === "string" && error.trim().length > 0) {
    return error.trim();
  }

  return "unknown non-blocking failure";
}
