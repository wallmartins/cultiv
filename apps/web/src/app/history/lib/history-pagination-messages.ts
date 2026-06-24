import type { AppHistoryMessages } from "~/i18n/app/types";

export function formatHistoryPaginationRange(
  messages: AppHistoryMessages["pagination"],
  start: number,
  end: number,
  total: number
): string {
  return messages.range
    .replace("{start}", String(start))
    .replace("{end}", String(end))
    .replace("{total}", String(total));
}

export function formatHistoryPaginationPage(
  messages: AppHistoryMessages["pagination"],
  page: number,
  pageCount: number
): string {
  return messages.page.replace("{page}", String(page)).replace("{pageCount}", String(pageCount));
}
