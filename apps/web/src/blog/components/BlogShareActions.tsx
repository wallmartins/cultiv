import { cn } from "@my-ai-orchestrator/ui";
import { useState } from "react";
import { getLocaleMessages } from "~/i18n/marketing/get-locale";
import type { MarketingLocale } from "~/i18n/marketing/types";

export interface BlogShareActionsProps {
  readonly locale: MarketingLocale;
  readonly title: string;
  readonly url: string;
}

const actionButtonClassName = cn(
  "rounded-[5px] border-dotted-cartography bg-off-white px-4 py-2",
  "ui-type-mono text-[0.6875rem] uppercase tracking-widest text-deep-blue",
  "transition duration-200 hover:-translate-y-0.5 hover:border-terracotta motion-reduce:transition-none motion-reduce:hover:translate-y-0",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
);

export function BlogShareActions({ locale, title, url }: BlogShareActionsProps) {
  const messages = getLocaleMessages(locale);
  const [copied, setCopied] = useState(false);
  const canNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  async function handleNativeShare() {
    try {
      await navigator.share({ title, url });
    } catch {
      // User dismissed share sheet or share failed.
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={() => void handleCopy()} className={actionButtonClassName}>
        {copied ? messages.blog.shareCopied : messages.blog.shareCopy}
      </button>
      {canNativeShare ? (
        <button
          type="button"
          onClick={() => void handleNativeShare()}
          className={actionButtonClassName}
        >
          {messages.blog.shareNative}
        </button>
      ) : null}
    </div>
  );
}
