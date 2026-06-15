import type { AIMessage } from "./types.js";

export function renderPrompt(messages: readonly AIMessage[]): string {
  return messages
    .map((message) => {
      const prefix = message.role === "tool" && message.name ? `${message.role}:${message.name}` : message.role;
      return `[${prefix}] ${message.content}`;
    })
    .join("\n");
}
