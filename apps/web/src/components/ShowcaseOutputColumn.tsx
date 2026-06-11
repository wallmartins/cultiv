import type { ReactNode } from "react";
import { Text } from "@my-ai-orchestrator/ui";

export interface ShowcaseOutputColumnProps {
  readonly label: string;
  readonly labelClassName: string;
  readonly invert?: boolean;
  readonly children: ReactNode;
}

export function ShowcaseOutputColumn({
  label,
  labelClassName,
  invert = false,
  children
}: ShowcaseOutputColumnProps) {
  return (
    <div
      className={`flex flex-col space-y-4 p-6 md:p-8 ${
        invert ? "bg-showcase-foreground/5" : "border-b border-showcase-foreground/25 md:border-r md:border-b-0"
      }`}
    >
      <Text as="p" variant="caption" className={labelClassName}>
        {label}
      </Text>
      <div className="overflow-hidden">{children}</div>
    </div>
  );
}
