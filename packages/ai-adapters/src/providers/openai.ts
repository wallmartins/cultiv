import { createOpenAiCompatibleProvider } from "./openai-compatible.js";

export function createOpenAIAdapter() {
  return createOpenAiCompatibleProvider({
    name: "openai",
    baseUrl: "https://api.openai.com/v1"
  });
}
