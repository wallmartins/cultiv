/**
 * @vitest-environment jsdom
 */
import React, { useId, useRef, useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppModal } from "../../apps/web/src/platform/ui/AppModal";

function ModalHarness({ withSecondaryAction = false }: { readonly withSecondaryAction?: boolean }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  return (
    <>
      <button ref={triggerRef} type="button" onClick={() => setOpen(true)}>
        Open modal
      </button>
      <AppModal
        open={open}
        onClose={() => setOpen(false)}
        titleId={titleId}
        returnFocusRef={triggerRef}
        overlayClassName="bg-paper/80"
        panelClassName="rounded border bg-paper-elevated p-4"
      >
        <h2 id={titleId}>Confirm action</h2>
        <button type="button" data-app-modal-initial-focus onClick={() => setOpen(false)}>
          Confirm
        </button>
        {withSecondaryAction ? (
          <button type="button">Cancel</button>
        ) : null}
      </AppModal>
    </>
  );
}

describe("AppModal", () => {
  it("exposes an accessible dialog labelled by its title", () => {
    render(<ModalHarness />);

    fireEvent.click(screen.getByRole("button", { name: "Open modal" }));

    const dialog = screen.getByRole("dialog", { name: "Confirm action" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-labelledby", screen.getByRole("heading", { name: "Confirm action" }).id);
  });

  it("focuses the initial focus target when opened", () => {
    render(<ModalHarness />);

    fireEvent.click(screen.getByRole("button", { name: "Open modal" }));

    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Confirm" }));
  });

  it("closes on Escape and restores focus to the trigger", () => {
    render(<ModalHarness />);

    const trigger = screen.getByRole("button", { name: "Open modal" });
    fireEvent.click(trigger);

    const dialog = screen.getByRole("dialog", { name: "Confirm action" });
    expect(dialog).toBeInTheDocument();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Confirm" }));

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.activeElement).toBe(trigger);
  });

  it("traps Tab from the last focusable element back to the first", () => {
    render(<ModalHarness withSecondaryAction />);

    fireEvent.click(screen.getByRole("button", { name: "Open modal" }));

    const confirm = screen.getByRole("button", { name: "Confirm" });
    const cancel = screen.getByRole("button", { name: "Cancel" });

    cancel.focus();
    fireEvent.keyDown(document, { key: "Tab" });

    expect(document.activeElement).toBe(confirm);
  });

  it("traps Shift+Tab from the first focusable element to the last", () => {
    render(<ModalHarness withSecondaryAction />);

    fireEvent.click(screen.getByRole("button", { name: "Open modal" }));

    const confirm = screen.getByRole("button", { name: "Confirm" });
    const cancel = screen.getByRole("button", { name: "Cancel" });

    confirm.focus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });

    expect(document.activeElement).toBe(cancel);
  });
});
