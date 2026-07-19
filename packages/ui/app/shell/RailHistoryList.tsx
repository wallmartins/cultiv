import { Mono, Pill, Ring, Serif, StatusDot } from "../primitives/index.js";
import type { HistoryGroupData, HistoryItemData, RailEmptyReason } from "./types.js";

export interface RailHistoryListProps {
  readonly groups: readonly HistoryGroupData[];
  readonly emptyReason?: RailEmptyReason;
  readonly onOpenItem: (id: string) => void;
  readonly olderCount?: number;
  readonly onShowOlder?: () => void;
  readonly otherStatusMatches?: number;
  readonly onClearFilter?: () => void;
}

export function RailHistoryList({
  groups,
  emptyReason,
  onOpenItem,
  olderCount,
  onShowOlder,
  otherStatusMatches,
  onClearFilter
}: RailHistoryListProps) {
  if (emptyReason) {
    return (
      <div className="rail-history">
        <EmptyRail reason={emptyReason} otherStatusMatches={otherStatusMatches} onClearFilter={onClearFilter} />
      </div>
    );
  }

  return (
    <div className="rail-history">
      {groups.map((group) => (
        <HistoryGroup key={group.label} group={group} onOpenItem={onOpenItem} />
      ))}
      {olderCount ? (
        <Pill variant="outline" onClick={onShowOlder} className="rail-show-older">
          mostrar mais antigos · {olderCount}
        </Pill>
      ) : null}
    </div>
  );
}

function HistoryGroup({ group, onOpenItem }: { group: HistoryGroupData; onOpenItem: (id: string) => void }) {
  return (
    <>
      <Mono as="div" className="history-group-label">
        {group.label}
      </Mono>
      {group.items.map((item) => (
        <HistoryItem key={item.id} item={item} onOpen={() => onOpenItem(item.id)} />
      ))}
    </>
  );
}

function HistoryItem({ item, onOpen }: { item: HistoryItemData; onOpen: () => void }) {
  const metaClass = ["history-item-meta", item.metaTone !== "neutral" && `is-${item.metaTone}`].filter(Boolean).join(" ");

  return (
    <button
      type="button"
      className="history-item"
      onClick={onOpen}
      aria-current={item.active ? "page" : undefined}
    >
      {item.visual.kind === "ring" ? (
        <Ring value={item.visual.value} size={16} width={2} className="history-item-ring" />
      ) : (
        <StatusDot tone={item.visual.tone} pulse={item.visual.pulse} className="history-item-dot" />
      )}
      <div className="history-item-body">
        <Serif as="div" size="0.9rem" lineHeight={1.35} className="history-item-topic">
          {item.topic}
        </Serif>
        <Mono as="div" className={metaClass}>
          {item.meta}
        </Mono>
      </div>
      {item.unread ? <span className="history-item-unread" /> : null}
    </button>
  );
}

function EmptyRail({
  reason,
  otherStatusMatches,
  onClearFilter
}: {
  reason: RailEmptyReason;
  otherStatusMatches?: number;
  onClearFilter?: () => void;
}) {
  if (reason === "filtered" && otherStatusMatches) {
    return (
      <div className="rail-empty">
        <Mono as="div">nada aqui com esse filtro — mas há {otherStatusMatches} resultados em outros status</Mono>
        <Pill variant="outline" tone="accent" onClick={onClearFilter} className="rail-show-older">
          Limpar filtro e mostrar os {otherStatusMatches} →
        </Pill>
      </div>
    );
  }

  const text =
    reason === "filtered"
      ? "nenhuma geração encontrada · limpe a busca ou os filtros"
      : "nenhuma geração ainda · toque em ＋ Nova geração para começar";
  return (
    <Mono as="div" className="rail-empty">
      {text}
    </Mono>
  );
}
