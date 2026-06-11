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
              className="group flex w-full items-start justify-between gap-6 py-6 text-left md:py-8"
              onClick={() => setOpenId(isOpen ? null : item.id)}
            >
              <div className="flex items-start gap-4 md:gap-6">
                <Text as="span" variant="meta" className="pt-1 text-foreground">
                  [{index}]
                </Text>
                <Text as="span" variant="h3" className="max-w-3xl text-base md:text-lg">
                  {item.question}
                </Text>
              </div>
              <span
                aria-hidden
                className="pt-1 font-body text-xl leading-none text-muted transition-transform duration-200 group-hover:text-foreground"
              >
                {isOpen ? "−" : "+"}
              </span>
            </button>
            <div
              id={panelId}
              className={cn("overflow-hidden pb-6 md:pb-8", isOpen ? "block" : "hidden")}
            >
              <Text as="div" variant="body" className="max-w-3xl pl-10 text-muted md:pl-14">
                {item.answer}
              </Text>
            </div>
          </section>
        );
      })}
    </div>
  );
}
