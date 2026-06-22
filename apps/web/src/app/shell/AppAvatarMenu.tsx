import { useAuth0 } from "@auth0/auth0-react";
import { cn } from "@my-ai-orchestrator/ui";
import { Link } from "@tanstack/react-router";
import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import type { AppMessages } from "~/i18n/app/types";

export interface AppAvatarMenuProps {
  readonly messages: AppMessages;
}

function MenuIconBilling() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="size-4 shrink-0 opacity-70" aria-hidden>
      <path
        d="M2.5 5.5h11v7a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1v-7Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
      <path
        d="M2.5 6.5 8 3.5l5.5 3M5.5 9h5"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MenuIconSettings() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="size-4 shrink-0 opacity-70" aria-hidden>
      <path
        d="M8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <path
        d="M12.5 8.9c.03-.3.05-.6.05-.9s-.02-.6-.05-.9l1.28-.99a.5.5 0 0 0 .12-.64l-1.22-2.11a.5.5 0 0 0-.6-.22l-1.51.61a7.2 7.2 0 0 0-1.56-.9l-.23-1.6a.5.5 0 0 0-.5-.43H7.17a.5.5 0 0 0-.5.43l-.23 1.6c-.55.22-1.08.52-1.56.9l-1.51-.61a.5.5 0 0 0-.6.22L1.55 5.37a.5.5 0 0 0 .12.64l1.28.99c-.03.3-.05.6-.05.9s.02.6.05.9l-1.28.99a.5.5 0 0 0-.12.64l1.22 2.11c.13.22.39.31.6.22l1.51-.61c.48.38 1.01.68 1.56.9l.23 1.6c.04.25.26.43.5.43h2.44c.24 0 .46-.18.5-.43l.23-1.6c.55-.22 1.08-.52 1.56-.9l1.51.61c.21.09.47 0 .6-.22l1.22-2.11a.5.5 0 0 0-.12-.64l-1.28-.99Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MenuIconLogout() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="size-4 shrink-0 opacity-70" aria-hidden>
      <path
        d="M6 2.5H4.5A1.5 1.5 0 0 0 3 4v8a1.5 1.5 0 0 0 1.5 1.5H6M10.5 11.5 14 8l-3.5-3.5M14 8H6"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function measureMenuPosition(trigger: HTMLElement): CSSProperties {
  const rect = trigger.getBoundingClientRect();
  const gap = 10;

  return {
    position: "fixed",
    top: rect.bottom + gap,
    right: Math.max(12, window.innerWidth - rect.right),
    zIndex: 250
  };
}

export function AppAvatarMenu({ messages }: AppAvatarMenuProps) {
  const { user, logout } = useAuth0();
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) {
      return;
    }

    function updatePosition() {
      if (!triggerRef.current) {
        return;
      }

      setMenuStyle(measureMenuPosition(triggerRef.current));
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        !triggerRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
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

  const initials =
    user?.name
      ?.split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?";

  const displayName = user?.name?.trim() || user?.email || "";
  const displayEmail = user?.email && user?.name ? user.email : null;

  const menu = open ? (
    <div
      ref={menuRef}
      id={menuId}
      role="menu"
      data-avatar-menu-panel
      style={menuStyle}
      className="workspace-overlay min-w-[13.5rem] overflow-hidden p-1.5"
    >
      {displayName ? (
        <div className="px-3 py-2.5">
          <p className="truncate text-sm font-medium text-foreground">{displayName}</p>
          {displayEmail ? (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{displayEmail}</p>
          ) : null}
        </div>
      ) : null}

      {displayName ? <div className="workspace-overlay-divider" role="presentation" /> : null}

      <Link
        to="/app/plans"
        role="menuitem"
        className="workspace-overlay-item"
        onClick={() => setOpen(false)}
      >
        <MenuIconBilling />
        {messages.shell.nav.plans}
      </Link>

      <Link
        to="/app/settings"
        role="menuitem"
        className="workspace-overlay-item"
        onClick={() => setOpen(false)}
      >
        <MenuIconSettings />
        {messages.shell.nav.settings}
      </Link>

      <div className="workspace-overlay-divider" role="presentation" />

      <button
        type="button"
        role="menuitem"
        className="workspace-overlay-item workspace-overlay-item--muted"
        onClick={() => {
          setOpen(false);
          void logout({
            logoutParams: {
              returnTo: `${window.location.origin}/login`
            }
          });
        }}
      >
        <MenuIconLogout />
        {messages.shell.nav.logout}
      </button>
    </div>
  ) : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={cn(
          "flex size-10 items-center justify-center overflow-hidden rounded-full",
          "border border-border-subtle/70 bg-surface-elevated shadow-[var(--workspace-shadow-card)]",
          "transition-[box-shadow,ring-color] duration-[var(--workspace-motion-duration-fast)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pigment-terracotta/35 focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
          open && "ring-2 ring-pigment-terracotta/30 ring-offset-2 ring-offset-surface"
        )}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        {user?.picture ? (
          <img src={user.picture} alt="" className="size-full object-cover" />
        ) : (
          <span className="text-xs font-semibold tracking-wide text-foreground/80">{initials}</span>
        )}
      </button>

      {typeof document !== "undefined" && menu ? createPortal(menu, document.body) : null}
    </>
  );
}
