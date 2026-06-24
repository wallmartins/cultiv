import { createOpenAiCompatibleProvider } from "./openai-compatible.js";

export function createDeepSeekAdapter() {
  return createOpenAiCompatibleProvider({
    name: "deepseek",
    baseUrl: "https://api.deepseek.com/v1"
  });
}
