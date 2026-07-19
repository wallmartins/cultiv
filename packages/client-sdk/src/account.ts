import { Effect } from "effect";
import {
  decodeAccountDeleteResponse,
  decodeAccountExportJobView,
  decodeAccountResetResponse,
  type AccountDeleteRequest,
  type AccountDeleteResponse,
  type AccountExportJobView,
  type AccountResetResponse
} from "@my-ai-orchestrator/contracts";
import { assertOkResponseEffect, decodeOkResponseEffect, parseJsonBodyEffect } from "./decode-response.js";
import type { ClientSdkError } from "./errors.js";
import type { HttpTransport } from "./transport.js";

export interface AccountRequestExportInput {
  readonly signal?: AbortSignal;
}

export interface AccountExportJobInput {
  readonly jobId: string;
  readonly signal?: AbortSignal;
}

export interface AccountResetInput {
  readonly signal?: AbortSignal;
}

export interface AccountDeleteInput extends AccountDeleteRequest {
  readonly signal?: AbortSignal;
}

// Mirrors AccountExportBundle in apps/backend/src/product/account/account-export-service.ts. The
// download route serves it raw (route comment: "not schema-validated, raw attachment") — there's
// no contracts decoder to reuse, so this is a structural type, not a validated one.
export interface AccountExportBundle {
  readonly account: {
    readonly id: string;
    readonly externalSubject: string;
    readonly createdAt: string;
  };
  readonly voiceProfile: unknown;
  readonly voiceExamples: readonly unknown[];
  readonly history: readonly unknown[];
  readonly billingSummary: {
    readonly planId: string | undefined;
    readonly ledger: readonly unknown[];
  };
  readonly generatedAt: string;
}

export interface AccountClient {
  readonly requestExport: (input?: AccountRequestExportInput) => Effect.Effect<AccountExportJobView, ClientSdkError>;
  readonly getExportJob: (input: AccountExportJobInput) => Effect.Effect<AccountExportJobView, ClientSdkError>;
  readonly downloadExport: (input: AccountExportJobInput) => Effect.Effect<AccountExportBundle, ClientSdkError>;
  readonly reset: (input?: AccountResetInput) => Effect.Effect<AccountResetResponse, ClientSdkError>;
  readonly deleteAccount: (input: AccountDeleteInput) => Effect.Effect<AccountDeleteResponse, ClientSdkError>;
}

export function createAccountClient(transport: HttpTransport): AccountClient {
  return {
    requestExport(input = {}) {
      return Effect.gen(function* () {
        const response = yield* transport.send({
          method: "POST",
          path: "/me/account/export",
          signal: input.signal
        });

        return yield* decodeOkResponseEffect(response, "account export request", decodeAccountExportJobView);
      });
    },

    getExportJob(input) {
      return Effect.gen(function* () {
        const response = yield* transport.send({
          method: "GET",
          path: `/me/account/export/${encodeURIComponent(input.jobId)}`,
          signal: input.signal
        });

        return yield* decodeOkResponseEffect(response, "account export job", decodeAccountExportJobView);
      });
    },

    downloadExport(input) {
      return Effect.gen(function* () {
        const response = yield* transport.send({
          method: "GET",
          path: `/me/account/export/${encodeURIComponent(input.jobId)}/download`,
          signal: input.signal
        });

        yield* assertOkResponseEffect(response, "account export download");
        return (yield* parseJsonBodyEffect(response.body)) as AccountExportBundle;
      });
    },

    reset(input = {}) {
      return Effect.gen(function* () {
        const response = yield* transport.send({
          method: "POST",
          path: "/me/account/reset",
          signal: input.signal
        });

        return yield* decodeOkResponseEffect(response, "account reset", decodeAccountResetResponse);
      });
    },

    deleteAccount(input) {
      const { signal, ...body } = input;
      return Effect.gen(function* () {
        const response = yield* transport.send({
          method: "DELETE",
          path: "/me/account",
          body,
          signal
        });

        return yield* decodeOkResponseEffect(response, "account delete", decodeAccountDeleteResponse);
      });
    }
  };
}
