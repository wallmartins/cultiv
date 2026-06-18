import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { decodeApiErrorResponse } from "../../packages/contracts/src/execution/errors.js";

describe("execution module split", () => {
  it("imports decodeApiErrorResponse from execution/errors and round-trips ApiErrorResponse", async () => {
    const input = {
      status: 404,
      code: "resource_not_found" as const,
      category: "not_found" as const,
      message: "Execution not found",
      retryable: false,
      details: { executionId: "exec_1" }
    };

    const decoded = await Effect.runPromise(decodeApiErrorResponse(input));

    expect(decoded).toEqual(input);
  });
});
