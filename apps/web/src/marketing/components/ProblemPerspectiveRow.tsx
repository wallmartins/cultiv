import type { ReactNode } from "react";
import { Text } from "@my-ai-orchestrator/ui";
import { ProblemSceneMat } from "~/marketing/visual/ProblemSceneMat";

export interface ProblemPerspectiveRowProps {
  readonly index: string;
  readonly title: string;
  readonly body: string;
  readonly visual: ReactNode;
  readonly reverse?: boolean;
}

export function ProblemPerspectiveRow({
  index,
  title,
  body,
  visual,
  reverse = false
}: ProblemPerspectiveRowProps) {
  return (
    <div
      data-section-item
      className="grid items-center gap-10 md:grid-cols-2 md:gap-16 lg:gap-20"
    >
      <ProblemSceneMat reverse={reverse} className={reverse ? "md:order-2" : ""}>
        {visual}
      </ProblemSceneMat>
      <div className={reverse ? "md:order-1" : ""}>
        <Text as="p" variant="meta" className="mb-4 text-moss">
          [{index}]
        </Text>
        <Text as="h3" variant="h3" className="mb-4 text-xl md:text-2xl">
          {title}
        </Text>
        <Text as="p" variant="body-lg" className="text-muted">
          {body}
        </Text>
      </div>
    </div>
  );
}
