import { describe, expect, it } from "vitest";
import { createBillingRepository } from "@my-ai-orchestrator/payments";
import {
  BillingDestructivePersistBlockedError,
  writePostgresBillingRepository
} from "../../apps/backend/src/infra/postgres-billing-store.js";

describe("billing destructive persist guard", () => {
  it("blocks full table replace unless explicitly opted in", async () => {
    const repository = createBillingRepository();

    await expect(writePostgresBillingRepository({} as never, repository)).rejects.toBeInstanceOf(
      BillingDestructivePersistBlockedError
    );
  });
});
