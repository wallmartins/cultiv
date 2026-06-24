/**
 * @vitest-environment jsdom
 */
import { act, renderHook, waitFor } from "@testing-library/react";
import { useCallback } from "react";
import { describe, expect, it, vi } from "vitest";
import { useSdkQuery } from "../../apps/web/src/platform/sdk/use-sdk-query";

describe("useSdkQuery", () => {
  it("refetches when the query key changes", async () => {
    const queryFn = vi.fn(async (key: string) => (key === "a" ? "first" : "second"));

    const { result, rerender } = renderHook(
      ({ key }) => {
        const fetch = useCallback(() => queryFn(key), [key]);
        return useSdkQuery([key], fetch);
      },
      { initialProps: { key: "a" } }
    );

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.data).toBe("first");

    rerender({ key: "b" });

    await waitFor(() => expect(result.current.data).toBe("second"));
    expect(queryFn.mock.calls.some(([key]) => key === "a")).toBe(true);
    expect(queryFn.mock.calls.some(([key]) => key === "b")).toBe(true);
  });

  it("retries after retry() is called", async () => {
    let allowSuccess = false;
    const queryFn = vi.fn(async () => {
      if (!allowSuccess) {
        throw new Error("network");
      }
      return "ok";
    });

    const { result } = renderHook(() => useSdkQuery(["retry"], queryFn));

    await waitFor(() => expect(result.current.status).toBe("error"));

    const callsBeforeRetry = queryFn.mock.calls.length;
    act(() => {
      allowSuccess = true;
      result.current.retry();
    });

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.data).toBe("ok");
    expect(queryFn.mock.calls.length).toBeGreaterThan(callsBeforeRetry);
  });

  it("aborts in-flight requests on unmount without surfacing an error", async () => {
    let resolveQuery: ((value: string) => void) | undefined;
    const queryFn = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          resolveQuery = resolve;
        })
    );

    const { result, unmount } = renderHook(() => useSdkQuery(["abort"], queryFn));

    expect(result.current.status).toBe("loading");
    unmount();
    resolveQuery?.("late");

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(result.current.status).toBe("loading");
  });
});
