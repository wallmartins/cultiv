import type { ReactNode } from "react";
import { ThreadMessage } from "./ThreadMessage.js";
import type { ThreadMessageData } from "./types.js";

export interface GuidedThreadProps {
  readonly messages: readonly ThreadMessageData[];
  readonly trailing?: ReactNode;
}

// showThread's message list (design L172–193). `trailing` slots the analyzing/firing indicator
// inside the same max-width column, matching the design's single scrolling article.
export function GuidedThread({ messages, trailing }: GuidedThreadProps) {
  return (
    <div className="generate-thread-col">
      {messages.map((message) => (
        <ThreadMessage key={message.id} message={message} />
      ))}
      {trailing}
    </div>
  );
}
