import { describe, expect, it } from "vitest";
import {
  drainBillingRepositoryPersistQueue,
  runBillingRepositoryPersistSerialized
} from "../src/infra/billing/billing-persist-queue.js";

describe("billing persist queue", () => {
  it("runs serialized tasks in order", async () => {
    const order: number[] = [];

    const first = runBillingRepositoryPersistSerialized(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      order.push(1);
    });
    const second = runBillingRepositoryPersistSerialized(async () => {
      order.push(2);
    });
    const third = runBillingRepositoryPersistSerialized(async () => {
      order.push(3);
    });

    await Promise.all([first, second, third]);
    await drainBillingRepositoryPersistQueue();

    expect(order).toEqual([1, 2, 3]);
  });
});
