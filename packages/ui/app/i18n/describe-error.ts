import type { AppMessages } from "./messages/types.js";

export type FriendlyErrorAction = "retry" | "reload";

export interface FriendlyError {
  readonly title: string;
  readonly body: string;
  readonly action: FriendlyErrorAction;
}

// Turns a backend / client-sdk failure into reassuring, non-technical copy for a full-screen error
// state. Duck-types the ClientSdkError shape (_tag / stage / status) instead of importing
// @my-ai-orchestrator/client-sdk, so this stays in the initial chunk app.tsx/router.tsx already pay
// for — and any lazy surface can reuse it too.
//
// Sibling to apps/web routes/calibrate-view.ts's describeCalibrationError: that one returns a single
// line for the one screen with no generic escape; this returns title + body + a suggested action.
export function describeError(t: AppMessages, error: unknown): FriendlyError {
  const e =
    error && typeof error === "object"
      ? (error as { _tag?: string; stage?: string; status?: number })
      : undefined;
  const copy = t.app.error;

  switch (e?._tag) {
    case "ClientSdkTransportError":
      // token = the access token couldn't be minted (expired/absent session); the rest (fetch,
      // aborted, body) never reached the server — offline is the honest read, and it's exactly the
      // raw "Failed to fetch" we're replacing.
      return e.stage === "token"
        ? { ...copy.denied, action: "reload" }
        : { ...copy.offline, action: "retry" };
    case "ClientSdkHttpStatusError": {
      const status = e.status ?? 0;
      if (status === 401 || status === 403) return { ...copy.denied, action: "reload" };
      if (status === 404) return { ...copy.notFound, action: "retry" };
      if (status === 429) return { ...copy.rateLimited, action: "retry" };
      if (status === 408 || status === 504) return { ...copy.timeout, action: "retry" };
      if (status >= 500) return { ...copy.server, action: "retry" };
      return { ...copy.generic, action: "retry" };
    }
    case "ClientSdkResponseDecodeError":
    case "ClientSdkContractFailure":
    case "ClientSdkObservationFailure":
      return { ...copy.server, action: "retry" };
    default:
      return { ...copy.generic, action: "retry" };
  }
}
