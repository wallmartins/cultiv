import { cn, Text } from "@my-ai-orchestrator/ui";
import type { CSSProperties, ReactNode } from "react";

export type AppSegmentedOption = {
  readonly value: string;
  readonly label: ReactNode;
  readonly disabled?: boolean;
  readonly ariaLabel?: string;
};

export interface AppSegmentedControlProps {
  readonly name: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly options: readonly AppSegmentedOption[];
  readonly className?: string;
}

function pillStyle(activeIndex: number, itemCount: number): CSSProperties {
  const segment = `calc((100% - 0.5rem) / ${itemCount})`;

  return {
    top: "0.25rem",
    bottom: "0.25rem",
    left: "0.25rem",
    width: segment,
    transform: `translateX(calc(${activeIndex} * 100%))`
  };
}

export function AppSegmentedControl({
  name,
  value,
  onChange,
  options,
  className
}: AppSegmentedControlProps) {
  const activeIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value)
  );

  return (
    <div
      className={cn(
        "relative flex rounded-[var(--radius-cartography)] border border-ink-ghost/70 bg-paper/70 p-1",
        className
      )}
      role="radiogroup"
    >
      <span
        aria-hidden
        className="app-shell-nav-pill pointer-events-none absolute rounded-[calc(var(--radius-cartography)-0.2rem)] bg-pigment-terracotta/14 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-pigment-terracotta)_28%,transparent)]"
        style={pillStyle(activeIndex, options.length)}
      />
      {options.map((option) => {
        const selected = option.value === value;
        const inputId = `${name}-${option.value}`;

        return (
          <label
            key={option.value}
            htmlFor={inputId}
            className={cn(
              "relative z-10 flex min-h-10 flex-1 cursor-pointer items-center justify-center px-3 py-2 text-center transition-colors",
              option.disabled && "cursor-not-allowed opacity-50"
            )}
          >
            <input
              id={inputId}
              type="radio"
              name={name}
              className="sr-only"
              value={option.value}
              checked={selected}
              disabled={option.disabled}
              aria-label={option.ariaLabel}
              onChange={() => onChange(option.value)}
            />
            <Text
              as="span"
              variant="meta"
              className={cn(selected ? "font-semibold text-ink" : "text-ink-muted")}
            >
              {option.label}
            </Text>
          </label>
        );
      })}
    </div>
  );
}
