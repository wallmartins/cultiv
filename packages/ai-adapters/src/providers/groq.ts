import { createOpenAiCompatibleProvider } from "./openai-compatible.js";

export function createGroqAdapter() {
  return createOpenAiCompatibleProvider({
    name: "groq",
    baseUrl: "https://api.groq.com/openai/v1"
  });
}
