import { Chip } from "../primitives/index.js";
import { useMessages } from "../i18n/index.js";
import type { HistoryPeriodFilterUI, HistoryStatusFilterUI } from "./types.js";

export interface RailFilterChipsProps {
  readonly active: HistoryStatusFilterUI;
  readonly onChange: (filter: HistoryStatusFilterUI) => void;
  readonly activePeriod: HistoryPeriodFilterUI;
  readonly onPeriodChange: (period: HistoryPeriodFilterUI) => void;
}

// Keys only — the labels come from the dictionary, keyed by these.
const FILTER_KEYS: readonly HistoryStatusFilterUI[] = ["all", "done", "running", "queued", "failed", "cancelled"];
const PERIOD_KEYS: readonly HistoryPeriodFilterUI[] = ["all", "7d", "30d", "90d"];

export function RailFilterChips({ active, onChange, activePeriod, onPeriodChange }: RailFilterChipsProps) {
  const t = useMessages();
  const filters = FILTER_KEYS.map((key) => ({ key, label: t.shell.statusFilter[key] }));
  const periods = PERIOD_KEYS.map((key) => ({ key, label: t.shell.periodFilter[key] }));
  return (
    <>
      <div className="rail-filters">
        {filters.map((filter) => (
          <Chip key={filter.key} mono active={active === filter.key} onClick={() => onChange(filter.key)}>
            {filter.label}
          </Chip>
        ))}
      </div>
      <div className="rail-filters rail-filters-period">
        {periods.map((period) => (
          <Chip
            key={period.key}
            mono
            active={activePeriod === period.key}
            onClick={() => onPeriodChange(period.key)}
          >
            {period.label}
          </Chip>
        ))}
      </div>
    </>
  );
}
