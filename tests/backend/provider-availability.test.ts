import { describe, expect, it } from "vitest";
import { filterConfiguredProviderAttempts, isProviderConfigured } from "../../apps/backend/src/execution/pipeline/provider-availability.js";

describe("provider availability", () => {
  const geminiOnlyConfig = {
    geminiApiKey: "gemini-key",
    groqApiKey: "groq-key"
  };

  it("filters attempts to providers with configured API keys", () => {
    const attempts = filterConfiguredProviderAttempts(
      { environment: "production", ...geminiOnlyConfig },
      [
      { provider: "gemini", model: "gemini-3.1-flash-lite" },
      { provider: "openai", model: "gpt-4o-mini" },
      { provider: "groq", model: "llama-3.3-70b-versatile" }
    ]);

    expect(attempts).toEqual([
      { provider: "gemini", model: "gemini-3.1-flash-lite" },
      { provider: "groq", model: "llama-3.3-70b-versatile" }
    ]);
  });

  it("reports provider availability from config", () => {
    expect(isProviderConfigured(geminiOnlyConfig, "gemini")).toBe(true);
    expect(isProviderConfigured(geminiOnlyConfig, "openai")).toBe(false);
    expect(isProviderConfigured(geminiOnlyConfig, "groq")).toBe(true);
  });

  it("keeps all attempts in test environment regardless of API keys", () => {
    const attempts = filterConfiguredProviderAttempts(
      { environment: "test" },
      [
        { provider: "gemini", model: "gemini-3.1-flash-lite" },
        { provider: "openai", model: "gpt-4o-mini" }
      ]
    );

    expect(attempts).toHaveLength(2);
  });
});
