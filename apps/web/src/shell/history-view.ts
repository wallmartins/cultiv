import type {
  ExecutionsPageView,
  ExecutionStatusView,
  GenerationChannel,
  GenerationLengthTier
} from "@my-ai-orchestrator/contracts";
import type { HistoryGroupData, HistoryItemData, HistoryItemMetaTone, HistoryItemVisual } from "@my-ai-orchestrator/ui/app";

const LENGTH_LABEL: Record<GenerationLengthTier, string> = { short: "Curto", medium: "Médio", long: "Longo" };

// Best-effort v1 mapping — the contract's channel enum is broader than any single platform name;
// "unspecified" renders as no suffix at all rather than a jargon fallback.
const CHANNEL_LABEL: Partial<Record<GenerationChannel, string>> = {
  "professional-network": "LinkedIn",
  blog: "Blog",
  email: "Newsletter",
  social: "X"
};

const GROUP_ORDER = ["Hoje", "Ontem", "7 dias", "Este mês", "Mais antigo"] as const;

function formatRelativeTime(createdAt: string, now: Date): string {
  const created = new Date(createdAt);
  const minutes = Math.max(0, Math.round((now.getTime() - created.getTime()) / 60_000));
  if (minutes < 60) return minutes <= 1 ? "agora" : `há ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.round(hours / 24);
  return days === 1 ? "ontem" : `há ${days} dias`;
}

function formatSuffix(item: ExecutionStatusView): string {
  const parts: string[] = [];
  if (item.lengthTier) parts.push(LENGTH_LABEL[item.lengthTier]);
  const channelLabel = item.channel ? CHANNEL_LABEL[item.channel] : undefined;
  if (channelLabel) parts.push(channelLabel);
  return parts.length ? ` · ${parts.join(" · ")}` : "";
}

function formatMeta(item: ExecutionStatusView, now: Date): { text: string; tone: HistoryItemMetaTone } {
  if (item.status === "running") {
    const percent = Math.round(item.progress?.percent ?? 0);
    return { text: `escrevendo… ${percent}%`, tone: "accent" };
  }
  if (item.status === "queued") {
    return { text: `na fila${formatSuffix(item)}`, tone: "neutral" };
  }
  if (item.status === "failed") {
    return { text: `falhou${formatSuffix(item)}`, tone: "danger" };
  }
  if (item.status === "cancelled") {
    return { text: `cancelado${formatSuffix(item)}`, tone: "neutral" };
  }
  return { text: `${formatRelativeTime(item.createdAt, now)}${formatSuffix(item)}`, tone: "neutral" };
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

function bucketLabel(createdAt: string, now: Date): (typeof GROUP_ORDER)[number] {
  const created = new Date(createdAt);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const sevenDaysAgo = new Date(startOfToday);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  if (created >= startOfToday) return "Hoje";
  if (created >= startOfYesterday) return "Ontem";
  if (created >= sevenDaysAgo) return "7 dias";
  if (created >= startOfMonth) return "Este mês";
  return "Mais antigo";
}

export function buildHistoryItem(
  item: ExecutionStatusView,
  unread: ReadonlySet<string>,
  activeExecutionId: string | undefined,
  now: Date
): HistoryItemData {
  const meta = formatMeta(item, now);
  return {
    id: item.jobId,
    topic: item.briefingTopic ?? "sem tema",
    unread: unread.has(item.jobId),
    active: item.jobId === activeExecutionId,
    visual: itemVisual(item),
    meta: meta.text,
    metaTone: meta.tone
  };
}

export function buildHistoryGroups(
  page: ExecutionsPageView | undefined,
  unread: ReadonlySet<string>,
  activeExecutionId: string | undefined,
  now: Date
): readonly HistoryGroupData[] {
  const byLabel = new Map<string, HistoryItemData[]>();
  for (const item of page?.items ?? []) {
    const label = bucketLabel(item.createdAt, now);
    const bucket = byLabel.get(label) ?? [];
    bucket.push(buildHistoryItem(item, unread, activeExecutionId, now));
    byLabel.set(label, bucket);
  }

  return GROUP_ORDER.filter((label) => byLabel.has(label)).map((label) => ({ label, items: byLabel.get(label)! }));
}
