/**
 * @vitest-environment jsdom
 */
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  resolveHistoryPageRange,
  useExecutionsList
} from "../../apps/web/src/app/history/lib/use-executions-list";

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

const baseFilters = {
  period: "30d" as const,
  status: "all" as const,
  intent: "all",
  lengthTier: "all"
};

describe("resolveHistoryPageRange", () => {
  it("clamps the visible range when total is smaller than page size", () => {
    expect(resolveHistoryPageRange(1, 100, 30)).toEqual({
      start: 1,
      end: 30,
      pageCount: 1,
      page: 1
    });
  });

  it("computes page count and range for multi-page results", () => {
    expect(resolveHistoryPageRange(2, 10, 30)).toEqual({
      start: 11,
      end: 20,
      pageCount: 3,
      page: 2
    });
  });
});

describe("useExecutionsList", () => {
  it("requests the selected page and page size from the API", async () => {
    listMock.mockResolvedValue({
      total: 30,
      items: Array.from({ length: 10 }, (_, index) => ({
        jobId: `job-${index}`,
        status: "done",
        contentType: "newsletter",
        createdAt: "2026-06-20T00:00:00.000Z"
      })),
      limit: 10,
      offset: 0
    });

    const { result } = renderHook(() =>
      useExecutionsList({
        filters: baseFilters,
        page: 1,
        pageSize: 10
      })
    );

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.items).toHaveLength(10);
    expect(result.current.total).toBe(30);
    expect(result.current.pageCount).toBe(3);
    expect(result.current.hasNextPage).toBe(true);
    expect(listMock).toHaveBeenCalledWith(
      expect.objectContaining({
        period: "30d",
        status: "all",
        limit: 10,
        offset: 0
      })
    );
  });

  it("refetches from the first page when filters change", async () => {
    listMock.mockImplementation((input: { status?: string; offset?: number }) => {
      if (input.status === "done") {
        return {
          total: 1,
          items: [{ jobId: "done-1", status: "done", contentType: "newsletter", createdAt: "2026-06-20T00:00:00.000Z" }],
          limit: 10,
          offset: input.offset ?? 0
        };
      }

      return {
        total: 40,
        items: Array.from({ length: 10 }, (_, index) => ({
          jobId: `job-${index}`,
          status: "queued",
          contentType: "newsletter",
          createdAt: "2026-06-20T00:00:00.000Z"
        })),
        limit: 10,
        offset: input.offset ?? 0
      };
    });

    const { result, rerender } = renderHook(
      ({ filters }) =>
        useExecutionsList({
          filters,
          page: 1,
          pageSize: 10
        }),
      { initialProps: { filters: baseFilters } }
    );

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.items).toHaveLength(10);
    expect(result.current.hasNextPage).toBe(true);

    rerender({
      filters: {
        ...baseFilters,
        status: "done"
      }
    });

    await waitFor(() => expect(result.current.items).toHaveLength(1));
    expect(result.current.hasNextPage).toBe(false);
    expect(listMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        status: "done",
        offset: 0,
        limit: 10
      })
    );
  });

  it("requests the correct offset when navigating to another page", async () => {
    listMock.mockImplementation((input: { offset?: number; limit?: number }) => {
      const offset = input.offset ?? 0;
      const limit = input.limit ?? 10;
      const remaining = Math.max(0, 30 - offset);
      const pageSize = Math.min(limit, remaining);

      return {
        total: 30,
        items: Array.from({ length: pageSize }, (_, index) => ({
          jobId: `job-${offset + index}`,
          status: "done",
          contentType: "newsletter",
          createdAt: "2026-06-20T00:00:00.000Z"
        })),
        limit,
        offset
      };
    });

    const { result, rerender } = renderHook(
      ({ page }) =>
        useExecutionsList({
          filters: baseFilters,
          page,
          pageSize: 10
        }),
      { initialProps: { page: 1 } }
    );

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.rangeEnd).toBe(10);

    rerender({ page: 3 });

    await waitFor(() => expect(result.current.rangeStart).toBe(21));
    expect(result.current.rangeEnd).toBe(30);
    expect(result.current.items).toHaveLength(10);
    expect(listMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        offset: 20,
        limit: 10
      })
    );
  });
});
