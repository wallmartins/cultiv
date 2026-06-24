import { cn } from "@my-ai-orchestrator/ui";
import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) => element.getAttribute("aria-hidden") !== "true"
  );
}

function resolveInitialFocus(dialog: HTMLElement, titleId: string): HTMLElement | null {
  return (
    dialog.querySelector<HTMLElement>("[data-app-modal-initial-focus]") ??
    dialog.querySelector<HTMLElement>("[data-app-modal-primary]") ??
    document.getElementById(titleId) ??
    getFocusableElements(dialog)[0] ??
    null
  );
}

function trapTabKey(event: KeyboardEvent, dialog: HTMLElement): void {
  if (event.key !== "Tab") {
    return;
  }

  const focusable = getFocusableElements(dialog);
  if (focusable.length === 0) {
    return;
  }

  const first = focusable[0]!;
  const last = focusable[focusable.length - 1]!;
  const active = document.activeElement;

  if (event.shiftKey) {
    if (active === first || !dialog.contains(active)) {
      event.preventDefault();
      last.focus();
    }
    return;
  }

  if (active === last || !dialog.contains(active)) {
    event.preventDefault();
    first.focus();
  }
}

export interface AppModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly titleId: string;
  readonly returnFocusRef?: RefObject<HTMLElement | null>;
  readonly overlayClassName?: string;
  readonly panelClassName?: string;
  readonly children: ReactNode;
}

export function AppModal({
  open,
  onClose,
  titleId,
  returnFocusRef,
  overlayClassName,
  panelClassName,
  children
}: AppModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    previousFocusRef.current =
      returnFocusRef?.current ?? (document.activeElement as HTMLElement | null);

    const dialog = dialogRef.current;
    if (dialog) {
      resolveInitialFocus(dialog, titleId)?.focus();
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (dialogRef.current) {
        trapTabKey(event, dialogRef.current);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      const target = returnFocusRef?.current ?? previousFocusRef.current;
      target?.focus?.();
    };
  }, [onClose, open, returnFocusRef, titleId]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-[90] flex items-center justify-center p-4",
        overlayClassName
      )}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={panelClassName}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
