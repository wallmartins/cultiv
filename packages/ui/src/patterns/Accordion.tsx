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
    <div className="flex flex-col gap-3 md:gap-4">
      {items.map((item, itemIndex) => {
        const isOpen = openId === item.id;
        const panelId = `${baseId}-${item.id}`;
        const index = String(itemIndex + 1).padStart(2, "0");

        return (
          <section
            key={item.id}
            className={cn(
              "press-edge rounded-[var(--radius-press)] border bg-paper-elevated transition-[border-color,box-shadow] duration-200",
              isOpen
                ? "border-pigment-terracotta/45 shadow-[var(--shadow-press-edge),0_0_0_1px_rgba(181,89,58,0.08)]"
                : "border-ink-ghost hover:border-ink/20"
            )}
          >
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={panelId}
              className="group flex w-full items-start gap-4 px-5 py-5 text-left md:gap-5 md:px-6 md:py-6"
              onClick={() => setOpenId(isOpen ? null : item.id)}
            >
              <Text
                as="span"
                variant="meta"
                aria-hidden
                className={cn(
                  "mt-0.5 shrink-0 tabular-nums transition-colors duration-200",
                  isOpen ? "text-pigment-terracotta" : "text-ink-muted"
                )}
              >
                {index}
              </Text>
              <Text
                as="span"
                variant="h3"
                className={cn(
                  "min-w-0 flex-1 text-base leading-snug transition-colors duration-200 md:text-lg",
                  isOpen ? "text-ink" : "text-ink group-hover:text-ink"
                )}
              >
                {item.question}
              </Text>
              <span
                aria-hidden
                className={cn(
                  "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm leading-none transition-[border-color,background-color,color] duration-200",
                  isOpen
                    ? "border-pigment-terracotta/30 bg-pigment-terracotta/10 text-pigment-terracotta"
                    : "border-ink-ghost bg-paper text-ink-muted group-hover:border-ink/25 group-hover:text-ink"
                )}
              >
                {isOpen ? "−" : "+"}
              </span>
            </button>
            <div
              id={panelId}
              className={cn("overflow-hidden", isOpen ? "block" : "hidden")}
            >
              <div className="flex gap-4 border-t border-ink-ghost/80 px-5 pt-4 pb-5 md:gap-5 md:px-6 md:pt-5 md:pb-6">
                <Text
                  as="span"
                  variant="meta"
                  aria-hidden
                  className="invisible mt-0.5 shrink-0 select-none tabular-nums"
                >
                  {index}
                </Text>
                <Text as="div" variant="body" className="min-w-0 flex-1 text-ink-muted leading-relaxed">
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
