/**
 * @vitest-environment jsdom
 */
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useExecutionsList } from "../../apps/web/src/app/history/lib/use-executions-list";

const listMock = vi.fn();
const mockClient = {
  executions: {
    list: listMock
  },
  toPromise: (value: unknown) => Promise.resolve(value)
};

vi.mock("../../apps/web/src/platform/runtime/client-sdk-context", () => ({
  useClientSdk: () => mockClient
}));

describe("useExecutionsList", () => {
  it("uses filtered total for hasMore and refetches when filters change", async () => {
    listMock.mockImplementation((input: { offset?: number; status?: string }) => {
      if (input.status === "done") {
        return {
          total: 1,
          items: [{ jobId: "done-1", status: "done", contentType: "newsletter", createdAt: "2026-06-20T00:00:00.000Z" }],
          limit: 20,
          offset: input.offset ?? 0
        };
      }

      return {
        total: 40,
        items: Array.from({ length: 20 }, (_, index) => ({
          jobId: `job-${index}`,
          status: "queued",
          contentType: "newsletter",
          createdAt: "2026-06-20T00:00:00.000Z"
        })),
        limit: 20,
        offset: input.offset ?? 0
      };
    });

    const initialFilters = {
      period: "30d" as const,
      status: "all" as const,
      intent: "all",
      lengthTier: "all"
    };

    const { result, rerender } = renderHook(
      ({ filters }) => useExecutionsList(filters),
      { initialProps: { filters: initialFilters } }
    );

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.items).toHaveLength(20);
    expect(result.current.hasMore).toBe(true);
    expect(listMock).toHaveBeenCalledWith(
      expect.objectContaining({
        period: "30d",
        status: "all",
        limit: 20,
        offset: 0
      })
    );

    rerender({
      filters: {
        period: "30d",
        status: "done",
        intent: "all",
        lengthTier: "all"
      }
    });

    await waitFor(() => expect(result.current.items).toHaveLength(1));
    expect(result.current.hasMore).toBe(false);
    expect(listMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        status: "done",
        offset: 0
      })
    );
  });

  it("sets hasMore to false when the filtered page contains every item", async () => {
    listMock.mockResolvedValue({
      total: 3,
      items: Array.from({ length: 3 }, (_, index) => ({
        jobId: `job-${index}`,
        status: "done",
        contentType: "newsletter",
        createdAt: "2026-06-20T00:00:00.000Z"
      })),
      limit: 20,
      offset: 0
    });

    const { result } = renderHook(() =>
      useExecutionsList({
        period: "30d",
        status: "done",
        intent: "all",
        lengthTier: "all"
      })
    );

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.items).toHaveLength(3);
    expect(result.current.hasMore).toBe(false);
  });

  it("appends the next page via loadMore and clears hasMore when every item is loaded", async () => {
    listMock.mockImplementation((input: { offset?: number; intent?: string }) => {
      if (input.intent !== "share-idea") {
        return {
          total: 0,
          items: [],
          limit: 20,
          offset: 0
        };
      }

      const offset = input.offset ?? 0;
      const remaining = 40 - offset;
      const pageSize = Math.min(20, remaining);

      return {
        total: 40,
        items: Array.from({ length: pageSize }, (_, index) => ({
          jobId: `share-${offset + index}`,
          status: "done",
          contentType: "short-piece",
          generationIntent: "share-idea",
          createdAt: "2026-06-20T00:00:00.000Z"
        })),
        limit: 20,
        offset
      };
    });

    const { result } = renderHook(() =>
      useExecutionsList({
        period: "30d",
        status: "all",
        intent: "share-idea",
        lengthTier: "all"
      })
    );

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.items).toHaveLength(20);
    expect(result.current.hasMore).toBe(true);

    result.current.loadMore();

    await waitFor(() => expect(result.current.items).toHaveLength(40));
    expect(result.current.hasMore).toBe(false);
    expect(listMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        intent: "share-idea",
        offset: 20
      })
    );
  });
});
