import { describe, expect, it } from "vitest";
import { parseStoredJsonRecord } from "../src/infra/postgres-repositories/json-column.js";

describe("parseStoredJsonRecord", () => {
  it("parses JSON strings", () => {
    expect(parseStoredJsonRecord<{ id: string }>('{"id":"a"}')).toEqual({ id: "a" });
  });

  it("accepts objects returned by the pg driver for jsonb columns", () => {
    expect(parseStoredJsonRecord<{ id: string }>({ id: "a" })).toEqual({ id: "a" });
  });
});
