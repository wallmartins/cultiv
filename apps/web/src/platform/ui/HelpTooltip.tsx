import { cn } from "@my-ai-orchestrator/ui";
import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";

export type HelpTooltipPlacement = "bottom" | "top" | "end" | "responsive-end";
export type HelpTooltipSize = "default" | "wide";

export interface HelpTooltipProps {
  readonly ariaLabel: string;
  readonly text?: string;
  readonly children?: ReactNode;
  readonly screenReaderText?: string;
  readonly placement?: HelpTooltipPlacement;
  readonly size?: HelpTooltipSize;
}

type TooltipAnchor = "bottom" | "top" | "end";

const sizeClassName: Record<HelpTooltipSize, string> = {
  default: "",
  wide: "workspace-tooltip-panel--wide"
};

const anchorClassName: Record<TooltipAnchor, string> = {
  bottom: "workspace-tooltip-panel--anchor-bottom",
  top: "workspace-tooltip-panel--anchor-top",
  end: "workspace-tooltip-panel--anchor-end"
};

function resolveAnchor(placement: HelpTooltipPlacement): TooltipAnchor {
  if (placement === "bottom") {
    return "bottom";
  }

  if (placement === "end") {
    return "end";
  }

  if (placement === "responsive-end" && window.innerWidth >= 1024) {
    return "end";
  }

  return "top";
}

function measurePosition(trigger: HTMLElement, anchor: TooltipAnchor): CSSProperties {
  const rect = trigger.getBoundingClientRect();
  const gap = 8;

  if (anchor === "end") {
    return {
      position: "fixed",
      top: rect.top + rect.height / 2,
      left: rect.right + gap,
      zIndex: 200
    };
  }

  if (anchor === "bottom") {
    return {
      position: "fixed",
      top: rect.bottom + gap,
      left: rect.left + rect.width / 2,
      zIndex: 200
    };
  }

  return {
    position: "fixed",
    top: rect.top - gap,
    left: rect.left + rect.width / 2,
    zIndex: 200
  };
}

export function HelpTooltip({
  text,
  children,
  screenReaderText,
  ariaLabel,
  placement = "top",
  size = "default"
}: HelpTooltipProps) {
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<TooltipAnchor>("top");
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({});
  const tooltipId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const rich = children != null;
  const accessibleText = screenReaderText ?? text;

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) {
      return;
    }

    const nextAnchor = resolveAnchor(placement);
    setAnchor(nextAnchor);
    setPanelStyle(measurePosition(triggerRef.current, nextAnchor));

    function updatePosition() {
      if (!triggerRef.current) {
        return;
      }

      const resolvedAnchor = resolveAnchor(placement);
      setAnchor(resolvedAnchor);
      setPanelStyle(measurePosition(triggerRef.current, resolvedAnchor));
    }

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, placement]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!triggerRef.current?.contains(target) && !(target instanceof Element && target.closest("[data-help-tooltip-panel]"))) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function show() {
    setOpen(true);
  }

  function hide() {
    setOpen(false);
  }

  const panel = open ? (
    <span
      data-help-tooltip-panel
      role="tooltip"
      aria-hidden={rich ? true : undefined}
      style={panelStyle}
      className={cn(
        "workspace-tooltip-panel",
        anchorClassName[anchor],
        sizeClassName[size],
        rich && "workspace-tooltip-panel--rich"
      )}
    >
      {rich ? children : text}
    </span>
  ) : null;

  return (
    <>
      {open && accessibleText ? (
        <span id={tooltipId} className="sr-only">
          {accessibleText}
        </span>
      ) : null}

      <button
        ref={triggerRef}
        type="button"
        className={cn("workspace-tooltip-trigger", open && "border-pigment-terracotta/45 bg-pigment-terracotta/8 text-ink")}
        aria-label={ariaLabel}
        aria-describedby={open && accessibleText ? tooltipId : undefined}
        aria-expanded={open}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={(event) => {
          if (!triggerRef.current?.contains(event.relatedTarget as Node | null)) {
            hide();
          }
        }}
        onClick={() => setOpen((value) => !value)}
      >
        i
      </button>

      {typeof document !== "undefined" && panel ? createPortal(panel, document.body) : null}
    </>
  );
}
