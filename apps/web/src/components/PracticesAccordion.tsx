import { useState } from "react";
import { Text } from "@my-ai-orchestrator/ui";
import { cn } from "@my-ai-orchestrator/ui";
import type { MethodStep } from "~/i18n/types";

export interface PracticesAccordionProps {
  readonly steps: ReadonlyArray<MethodStep>;
}

export function PracticesAccordion({ steps }: PracticesAccordionProps) {
  const [openIndex, setOpenIndex] = useState<string | null>(steps[0]?.index ?? null);

  return (
    <div className="border-t border-foreground">
      {steps.map((step) => {
        const isOpen = openIndex === step.index;

        return (
          <article key={step.index} className="border-b border-foreground" data-section-item>
            <button
              type="button"
              aria-expanded={isOpen}
              className="group flex w-full items-start gap-5 py-6 text-left md:gap-8 md:py-8"
              onClick={() => setOpenIndex(isOpen ? null : step.index)}
            >
              <Text as="span" variant="meta" className="pt-2">
                [{step.index}]
              </Text>
              <div className="flex-1 space-y-3">
                <Text
                  as="span"
                  variant={isOpen ? "handwritten" : "display-sm"}
                  className={cn(
                    "block transition-colors duration-200",
                    isOpen ? "text-golden" : "group-hover:text-moss"
                  )}
                >
                  {step.title}
                </Text>
                {isOpen ? (
                  <Text as="p" variant="body-lg" className="max-w-3xl text-muted">
                    {step.body}
                  </Text>
                ) : null}
              </div>
              <span
                aria-hidden
                className="pt-2 font-body text-xl leading-none text-muted transition-transform duration-200 group-hover:text-moss"
              >
                {isOpen ? "−" : "+"}
              </span>
            </button>
          </article>
        );
      })}
    </div>
  );
}
