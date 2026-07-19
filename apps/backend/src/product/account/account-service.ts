import { Effect } from "effect";
import type { BillingGatewayError } from "@my-ai-orchestrator/payments";
import type { DatabaseClient, DatabaseError } from "@my-ai-orchestrator/database";
import type { AccountDeleteResponse, AccountResetResponse } from "@my-ai-orchestrator/contracts";
import { BackendAccountConfirmationMismatchError } from "../../http/errors.js";
import type { BackendApplicationUserRepository } from "../../auth/application-user.js";
import {
  cancelActiveGatewaySubscriptionIfAny,
  type AccountGatewayCancelDependencies
} from "./account-gateway-cancel.js";
import { runAccountDeleteTransaction, runAccountResetTransaction } from "./account-purge-transaction.js";

// contract-08 decision 6 — re-validated server-side, exact match. No per-user locale is stored
// anywhere in this stack (application_users has no locale column), so both localized phrases are
// accepted rather than guessing one — ponytail: narrow to the account's actual UI language once
// that's tracked somewhere.
const VALID_DELETE_CONFIRMATIONS = new Set(["EXCLUIR", "DELETE"]);

export function isValidAccountDeleteConfirmation(confirmation: string | undefined): boolean {
  return typeof confirmation === "string" && VALID_DELETE_CONFIRMATIONS.has(confirmation);
}

export interface BackendAccountServiceDependencies {
  readonly users: BackendApplicationUserRepository;
  readonly database: DatabaseClient;
  readonly gatewayCancel: AccountGatewayCancelDependencies;
  readonly now: () => Date;
}

export interface BackendAccountDeleteInput {
  readonly confirmation: string;
  readonly idempotencyKey?: string;
}

export interface BackendAccountService {
  readonly reset: (userId: string) => Effect.Effect<AccountResetResponse, DatabaseError | Error>;
  readonly delete: (
    userId: string,
    input: BackendAccountDeleteInput,
    // supplied by the caller (route layer owns the job store + Redis client) — invoked AFTER the
    // gateway cancel succeeds and BEFORE the purge transaction. See the ordering note on delete().
    prePurge: () => Effect.Effect<void, DatabaseError>
  ) => Effect.Effect<AccountDeleteResponse, BackendAccountConfirmationMismatchError | BillingGatewayError | DatabaseError | Error>;
}

export function createBackendAccountService(deps: BackendAccountServiceDependencies): BackendAccountService {
  return {
    // contract-08 §2 — reset has no type-to-confirm (medium blast radius); idempotent by
    // construction (re-running it on an already-reset account just purges nothing further).
    reset(userId) {
      return Effect.gen(function* () {
        yield* runAccountResetTransaction(deps.database, userId, deps.now);

        return {
          onboardingRequired: true,
          hasVoiceProfile: false
        } satisfies AccountResetResponse;
      });
    },

    // contract-08 §3 — sequence order is load-bearing: confirmation (1) before idempotency (2), so
    // a retry still has to prove intent; idempotency (2) before the gateway cancel (3)/pre-purge
    // (4)/transaction (5), so a second call on an already-tombstoned account is a cheap no-op.
    //
    // gateway cancel (3) BEFORE pre-purge (4) — this improves on contract-08 §3's literal step
    // order (which put pre-purge before the gateway cancel): a transient Stripe/ASAAS failure must
    // abort with the account fully intact, including in-flight generations and session state. If
    // pre-purge ran first, a gateway hiccup would still have destroyed in-progress work and Redis
    // session data even though the delete itself failed and the account survives — irreversible
    // collateral damage from a retryable failure. Gateway-cancel-must-succeed now gates BOTH the
    // purge transaction AND the pre-purge step, not just the transaction.
    delete(userId, input, prePurge) {
      return Effect.gen(function* () {
        if (!isValidAccountDeleteConfirmation(input.confirmation)) {
          return yield* Effect.fail(new BackendAccountConfirmationMismatchError({ userId }));
        }

        const existing = yield* deps.users.findById(userId);
        if (existing?.status === "deleted") {
          return { status: "deleted" } satisfies AccountDeleteResponse;
        }
        if (!existing) {
          // invariant violation: an authenticated actor's own row must exist — surfaced as-is
          // rather than silently deleting under a wrong external subject.
          return yield* Effect.fail(new Error(`Application user not found for delete: ${userId}`));
        }

        // MUST succeed — an active paid subscription can never be orphaned, and nothing destructive
        // (not even pre-purge) runs until this proves the gateway side is handled.
        yield* cancelActiveGatewaySubscriptionIfAny(deps.gatewayCancel, userId);

        yield* prePurge();

        yield* runAccountDeleteTransaction(deps.database, userId, existing.externalSubject, deps.now);

        return { status: "deleted" } satisfies AccountDeleteResponse;
      });
    }
  };
}
