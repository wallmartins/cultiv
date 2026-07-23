import { Serif } from "../primitives/index.js";
import type { ThreadMessageData } from "./types.js";

export interface ThreadMessageProps {
  readonly message: ThreadMessageData;
}

// design L176–187: user bubble right-aligned; system = Serif question + optional impact note.
export function ThreadMessage({ message }: ThreadMessageProps) {
  if (message.kind === "user") {
    return <div className="generate-user-bubble">{message.text}</div>;
  }

  return (
    <div className="generate-system-msg">
      <Serif size="1.25rem" lineHeight={1.35}>
        {message.prompt}
      </Serif>
      {message.note ? <div className="generate-system-note">{message.note}</div> : null}
    </div>
  );
}
