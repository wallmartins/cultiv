import { cn } from "@my-ai-orchestrator/ui";
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useAppLocale } from "~/i18n/app/use-app-locale";
import { sortAppSelectOptions } from "./app-select-utils";

export type AppSelectOption = {
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean;
};

export interface AppSelectProps {
  readonly id?: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly options: readonly AppSelectOption[];
  readonly className?: string;
  readonly compact?: boolean;
  readonly placeholder?: string;
  readonly sortAlphabetically?: boolean;
  readonly "aria-label"?: string;
}

export function AppSelect({
  id,
  value,
  onChange,
  options,
  className,
  compact = false,
  placeholder: placeholderProp,
  sortAlphabetically = true,
  "aria-label": ariaLabel
}: AppSelectProps) {
  const { locale, messages } = useAppLocale();
  const placeholder = placeholderProp ?? messages.shell.selectPlaceholder;
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listboxId = useId();

  const displayOptions = useMemo(
    () => (sortAlphabetically ? sortAppSelectOptions(locale, options) : [...options]),
    [locale, options, sortAlphabetically]
  );

  const selectedIndex = displayOptions.findIndex((option) => option.value === value);
  const selected = selectedIndex >= 0 ? displayOptions[selectedIndex] : undefined;
  const displayLabel = selected?.label ?? placeholder;

  useEffect(() => {
    if (!open) {
      return;
    }

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    listRef.current?.focus({ preventScroll: true });

    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (!open || activeIndex < 0) {
      return;
    }

    listRef.current
      ?.querySelector<HTMLElement>(`#${listboxId}-option-${activeIndex}`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, listboxId, open]);

  function openList() {
    const nextIndex =
      selectedIndex >= 0 ? selectedIndex : displayOptions.findIndex((option) => !option.disabled);
    setActiveIndex(nextIndex >= 0 ? nextIndex : 0);
    setOpen(true);
  }

  function selectOption(option: AppSelectOption) {
    if (option.disabled) {
      return;
    }

    onChange(option.value);
    setOpen(false);
  }

  function onTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openList();
      return;
    }

    if (event.key === "Escape") {
      setOpen(false);
    }
  }

  function onListKeyDown(event: KeyboardEvent<HTMLUListElement>) {
    const enabledIndexes = displayOptions
      .map((option, index) => (option.disabled ? -1 : index))
      .filter((index) => index >= 0);

    if (enabledIndexes.length === 0) {
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      const current = enabledIndexes.indexOf(activeIndex);
      const next = enabledIndexes[(current + 1) % enabledIndexes.length] ?? enabledIndexes[0]!;
      setActiveIndex(next);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      const current = enabledIndexes.indexOf(activeIndex);
      const previous =
        enabledIndexes[current <= 0 ? enabledIndexes.length - 1 : current - 1] ?? enabledIndexes[0]!;
      setActiveIndex(previous);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const option = displayOptions[activeIndex];
      if (option) {
        selectOption(option);
      }
    }
  }

  return (
    <div
      ref={rootRef}
      className={cn("relative", open && "z-50", className)}
      data-app-select-open={open ? "true" : undefined}
    >
      <button
        id={id}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        className={cn(
          "workspace-field-control flex w-full items-center justify-between gap-3 text-left text-ink",
          "focus-visible:outline-none",
          compact ? "px-3 py-2 text-sm" : "px-4 py-3"
        )}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onTriggerKeyDown}
      >
        <span className={cn("truncate", !selected && "text-ink-muted")}>{displayLabel}</span>
        <span aria-hidden className="text-ink-muted">
          ▾
        </span>
      </button>

      {open ? (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-activedescendant={activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined}
          tabIndex={-1}
          data-lenis-prevent
          data-lenis-prevent-wheel
          data-lenis-prevent-touch
          className="showcase-output-scroll absolute top-[calc(100%+0.25rem)] z-50 max-h-60 w-full overflow-y-auto overscroll-contain rounded-[var(--workspace-radius-sm)] border border-ink-ghost/80 bg-paper-elevated shadow-[var(--workspace-shadow-card)]"
          onKeyDown={onListKeyDown}
          onWheel={(event) => event.stopPropagation()}
        >
          {displayOptions.map((option, index) => {
            const isSelected = option.value === value;
            const isActive = index === activeIndex;

            return (
              <li
                key={option.value}
                id={`${listboxId}-option-${index}`}
                role="option"
                aria-selected={isSelected}
                aria-disabled={option.disabled || undefined}
                className={cn(
                  "cursor-pointer px-4 py-3 text-left text-ink",
                  compact && "px-3 py-2 text-sm",
                  option.disabled && "cursor-not-allowed opacity-50",
                  !option.disabled && (isActive || isSelected) && "bg-paper-pressed",
                  !option.disabled && !isActive && !isSelected && "hover:bg-paper-pressed/70"
                )}
                onMouseEnter={() => {
                  if (!option.disabled) {
                    setActiveIndex(index);
                  }
                }}
                onClick={() => selectOption(option)}
              >
                {option.label}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
