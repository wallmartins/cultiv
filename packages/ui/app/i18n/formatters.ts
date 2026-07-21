import type { AppLocale } from "./locale.js";

export interface AppFormatters {
  readonly relativeTime: (from: string | Date, now?: Date) => string;
  readonly date: (value: string | Date) => string;
  readonly number: (value: number) => string;
  readonly currency: (value: number, currency: string) => string;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

// numeric "auto" turns -1 day into "ontem"/"yesterday" instead of "há 1 dia"/"1 day ago"; "short"
// matches the design's compact meta lines ("há 5 min.", "3 hr. ago"). `justNow` is passed in rather
// than taken from Intl because format(0, "minute") yields "este minuto"/"this minute", which reads
// badly next to the rest of the copy.
export function makeFormatters(locale: AppLocale, justNow: string): AppFormatters {
  const relative = new Intl.RelativeTimeFormat(locale, { numeric: "auto", style: "short" });
  const dateFormat = new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short", year: "numeric" });
  const numberFormat = new Intl.NumberFormat(locale);

  return {
    relativeTime: (from, now = new Date()) => {
      const then = typeof from === "string" ? new Date(from) : from;
      const elapsed = now.getTime() - then.getTime();
      if (!Number.isFinite(elapsed)) return "";
      if (elapsed < MINUTE) return justNow;
      if (elapsed < HOUR) return relative.format(-Math.round(elapsed / MINUTE), "minute");
      if (elapsed < DAY) return relative.format(-Math.round(elapsed / HOUR), "hour");
      return relative.format(-Math.round(elapsed / DAY), "day");
    },
    date: (value) => dateFormat.format(typeof value === "string" ? new Date(value) : value),
    number: (value) => numberFormat.format(value),
    // Priced by the CURRENCY's own convention, not the reader's locale: the price tag has to match
    // apps/landing (scripts/sync-plans.mjs) for the same plan, and currency here is a user toggle
    // independent of UI language — formatting USD the pt-BR way ("US$ 7,20") would contradict the
    // landing's "$7.20" for a Brazilian reader who flipped to dollars.
    // Whole amounts drop the decimals ("R$ 49", not "R$ 49,00"), as the hand-rolled formatter did.
    currency: (value, currency) =>
      new Intl.NumberFormat(currency === "BRL" ? "pt-BR" : "en-US", {
        style: "currency",
        currency,
        ...(Number.isInteger(value) ? { minimumFractionDigits: 0, maximumFractionDigits: 0 } : {})
      }).format(value)
  };
}
