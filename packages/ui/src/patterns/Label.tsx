import type { ReactNode } from "react";
import { Text } from "../primitives/Text.js";

export interface LabelProps {
  readonly index: string;
  readonly children: ReactNode;
}

export function Label({ index, children }: LabelProps) {
  return (
    <Text as="p" variant="label">
      <span className="text-ink">[{index}]</span> {children}
    </Text>
  );
}
