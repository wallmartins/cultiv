import { useId, useState, type ReactNode } from "react";
import { cn } from "../lib/cn.js";
import { Text } from "../primitives/Text.js";

export interface AccordionItem {
  readonly id: string;
  readonly question: string;
  readonly answer: ReactNode;
}

export interface AccordionProps {
  readonly items: ReadonlyArray<AccordionItem>;
}

export function Accordion({ items }: AccordionProps) {
  const baseId = useId();
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);

  return (
    <div className="border-t border-foreground">
      {items.map((item, itemIndex) => {
        const isOpen = openId === item.id;
        const panelId = `${baseId}-${item.id}`;
        const index = String(itemIndex + 1).padStart(2, "0");

        return (
          <section key={item.id} className="border-b border-foreground">
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={panelId}
              className="group flex w-full items-center gap-4 py-6 text-left md:gap-6 md:py-8"
              onClick={() => setOpenId(isOpen ? null : item.id)}
            >
              <Text as="span" variant="meta" className="shrink-0 text-foreground">
                [{index}]
              </Text>
              <Text as="span" variant="h3" className="min-w-0 flex-1 text-base md:text-lg">
                {item.question}
              </Text>
              <span
                aria-hidden
                className="shrink-0 font-body text-xl leading-none text-muted transition-transform duration-200 group-hover:text-foreground"
              >
                {isOpen ? "−" : "+"}
              </span>
            </button>
            <div
              id={panelId}
              className={cn("overflow-hidden pb-6 md:pb-8", isOpen ? "block" : "hidden")}
            >
              <div className="flex gap-4 md:gap-6">
                <Text
                  as="span"
                  variant="meta"
                  aria-hidden
                  className="invisible shrink-0 select-none"
                >
                  [{index}]
                </Text>
                <Text as="div" variant="body" className="min-w-0 flex-1 text-muted">
                  {item.answer}
                </Text>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
