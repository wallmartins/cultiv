import type { ExecutionsPageView, ExecutionStatusView } from "@my-ai-orchestrator/contracts";
import type { HistoryGroupData, HistoryItemData, HistoryItemMetaTone, HistoryItemVisual } from "@my-ai-orchestrator/ui/app";
import type { AppFormatters, AppMessages } from "@my-ai-orchestrator/ui/app/i18n";

// Stable ids, not rendered labels — the Map used to be keyed on the translated string, which
// would split a bucket in two the moment the locale changed mid-session.
const GROUP_ORDER = ["today", "yesterday", "week", "month", "older"] as const;
type GroupId = (typeof GROUP_ORDER)[number];

function formatSuffix(t: AppMessages, item: ExecutionStatusView): string {
  const parts: string[] = [];
  if (item.lengthTier) parts.push(t.common.length[item.lengthTier]);
  // The contract's channel enum is broader than any single platform name; "unspecified" renders
  // as no suffix at all rather than a jargon fallback.
  const channelLabel = item.channel ? t.common.channel[item.channel as keyof typeof t.common.channel] : undefined;
  if (channelLabel) parts.push(channelLabel);
  return parts.length ? ` · ${parts.join(" · ")}` : "";
}

function formatMeta(
  t: AppMessages,
  format: AppFormatters,
  item: ExecutionStatusView,
  now: Date
): { text: string; tone: HistoryItemMetaTone } {
  const suffix = formatSuffix(t, item);
  if (item.status === "running") {
    return { text: t.shell.itemWriting(Math.round(item.progress?.percent ?? 0)), tone: "accent" };
  }
  if (item.status === "queued") return { text: t.shell.itemQueued(suffix), tone: "neutral" };
  if (item.status === "failed") return { text: t.shell.itemFailed(suffix), tone: "danger" };
  if (item.status === "cancelled") return { text: t.shell.itemCancelled(suffix), tone: "neutral" };
  return { text: `${format.relativeTime(item.createdAt, now)}${suffix}`, tone: "neutral" };
}

function itemVisual(item: ExecutionStatusView): HistoryItemVisual {
  if (item.status === "running") {
    return { kind: "ring", value: (item.progress?.percent ?? 0) / 100 };
  }
  if (item.status === "failed") {
    return { kind: "dot", tone: "danger" };
  }
  if (item.status === "queued") {
    return { kind: "dot", tone: "neutral", pulse: true };
  }
  return { kind: "dot", tone: "neutral" };
}

function bucketId(createdAt: string, now: Date): GroupId {
  const created = new Date(createdAt);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const sevenDaysAgo = new Date(startOfToday);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  if (created >= startOfToday) return "today";
  if (created >= startOfYesterday) return "yesterday";
  if (created >= sevenDaysAgo) return "week";
  if (created >= startOfMonth) return "month";
  return "older";
}

export function buildHistoryItem(
  t: AppMessages,
  format: AppFormatters,
  item: ExecutionStatusView,
  unread: ReadonlySet<string>,
  activeExecutionId: string | undefined,
  now: Date
): HistoryItemData {
  const meta = formatMeta(t, format, item, now);
  return {
    id: item.jobId,
    topic: item.briefingTopic ?? t.common.noTopic,
    unread: unread.has(item.jobId),
    active: item.jobId === activeExecutionId,
    visual: itemVisual(item),
    meta: meta.text,
    metaTone: meta.tone
  };
}

export function buildHistoryGroups(
  t: AppMessages,
  format: AppFormatters,
  page: ExecutionsPageView | undefined,
  unread: ReadonlySet<string>,
  activeExecutionId: string | undefined,
  now: Date
): readonly HistoryGroupData[] {
  const byId = new Map<GroupId, HistoryItemData[]>();
  for (const item of page?.items ?? []) {
    const id = bucketId(item.createdAt, now);
    const bucket = byId.get(id) ?? [];
    bucket.push(buildHistoryItem(t, format, item, unread, activeExecutionId, now));
    byId.set(id, bucket);
  }

  return GROUP_ORDER.filter((id) => byId.has(id)).map((id) => ({
    label: t.shell.historyGroup[id],
    items: byId.get(id)!
  }));
}
