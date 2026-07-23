import { useEffect } from "react";
import { describeError, useMessages, type FriendlyErrorAction } from "@my-ai-orchestrator/ui/app/i18n";

// Local, dependency-light boot/route states: the branded loader and the friendly error surface. They
// live in apps/web (not packages/ui) on purpose — app.tsx and router.tsx render them in the initial
// chunk, and importing a packages/ui *component* here would drag that chunk into the first load. They
// only lean on the i18n module (already loaded) and the global .brand-boot / .btn CSS classes.

// The Cultiv mark, matching packages/ui shell/RailBrand: full ring + accent arc + two quote strokes.
const QUOTE =
  "M62 38c0-9.5-7-16-15.5-16C38 22 32 28.2 32 36.2c0 7.9 6 13.8 14 13.8 1.1 0 2.2-.1 3.2-.4C48 60 42.2 65.6 34.6 68.2l3.4 6.8C50.6 70.6 62 59.6 62 43.6Z";

function BrandMark({ variant }: { variant: "loading" | "error" }) {
  const loading = variant === "loading";
  return (
    <svg viewBox="0 0 96 96" fill="none" aria-hidden="true" className={`brand-boot-mark${loading ? "" : " is-danger"}`}>
      <circle className="brand-boot-ring" cx="48" cy="48" r="37" stroke="currentColor" strokeWidth="5" />
      {loading ? (
        <path className="brand-boot-arc" d="M54.4 11.6A37 37 0 0 1 78.3 26.8" stroke="var(--accent)" strokeWidth="5" strokeLinecap="round" />
      ) : (
        <path d="M54.4 11.6A37 37 0 0 1 78.3 26.8" stroke="currentColor" strokeWidth="5" strokeLinecap="round" opacity="0.16" />
      )}
      <path transform="translate(26.5 31.6) scale(0.62) translate(-32 -22)" fill="currentColor" d={QUOTE} />
      <path transform="translate(51 31.6) scale(0.62) translate(-32 -22)" fill="currentColor" d={QUOTE} />
    </svg>
  );
}

export function BrandLoader({ full = false, label }: { full?: boolean; label?: string }) {
  const t = useMessages();
  return (
    <div className={`brand-boot${full ? " is-full" : ""}`} role="status" aria-live="polite">
      <BrandMark variant="loading" />
      <p className="brand-boot-label">{label ?? t.app.loading}</p>
    </div>
  );
}

export interface BrandErrorProps {
  readonly error?: unknown;
  readonly onRetry?: () => void;
  readonly full?: boolean;
  // Overrides for the rare case with no backend error to map (e.g. a stale chunk after deploy).
  readonly title?: string;
  readonly body?: string;
  readonly action?: FriendlyErrorAction;
}

export function BrandError({ error, onRetry, full = false, title, body, action }: BrandErrorProps) {
  const t = useMessages();
  const described = describeError(t, error);
  const resolvedAction = action ?? described.action;

  // The raw technical failure stays in the console for debugging; the reader only ever sees the
  // friendly copy above (mirrors describeCalibrationError's console.warn).
  useEffect(() => {
    if (error !== undefined) console.warn("[app] surfaced error:", error);
  }, [error]);

  const isReload = resolvedAction === "reload";
  const actionLabel = isReload ? t.app.reload : t.common.retry;
  const onAction = isReload ? () => window.location.reload() : onRetry ?? (() => window.location.reload());

  return (
    <div className={`brand-boot${full ? " is-full" : ""}`} role="alert">
      <BrandMark variant="error" />
      <p className="brand-boot-title">{title ?? described.title}</p>
      <p className="brand-boot-body">{body ?? described.body}</p>
      <button type="button" className="btn solid brand-boot-action" onClick={onAction}>
        {actionLabel}
      </button>
    </div>
  );
}
