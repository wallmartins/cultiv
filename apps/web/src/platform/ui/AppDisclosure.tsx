import { cn, Text } from "@my-ai-orchestrator/ui";
import { useId, useState, type ReactNode } from "react";

export interface AppDisclosureItem {
  readonly id: string;
  readonly title: string;
  readonly count?: number;
  readonly children: ReactNode;
}

export interface AppDisclosureGroupProps {
  readonly items: ReadonlyArray<AppDisclosureItem>;
  readonly className?: string;
}

function formatTitle(title: string, count: number | undefined): string {
  if (count === undefined) {
    return title;
  }

  return `${title} (${count})`;
}

export function AppDisclosureGroup({ items, className }: AppDisclosureGroupProps) {
  const baseId = useId();
  const [openIds, setOpenIds] = useState<ReadonlySet<string>>(() => new Set());

  const toggle = (id: string) => {
    setOpenIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className={cn("space-y-2", className)}>
      {items.map((item) => {
        const isOpen = openIds.has(item.id);
        const panelId = `${baseId}-${item.id}`;

        return (
          <div key={item.id} className="workspace-card overflow-hidden">
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={panelId}
              className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
              onClick={() => toggle(item.id)}
            >
              <Text as="span" variant="body" className="font-medium text-foreground">
                {formatTitle(item.title, item.count)}
              </Text>
              <span
                aria-hidden
                className="shrink-0 font-body text-lg leading-none text-muted transition-transform duration-200"
              >
                {isOpen ? "−" : "+"}
              </span>
            </button>
            <div
              id={panelId}
              className={cn(
                "border-t border-border-subtle/60 px-5 pb-5 pt-4",
                isOpen ? "block" : "hidden"
              )}
            >
              {item.children}
            </div>
          </div>
        );
      })}
    </div>
  );
}
