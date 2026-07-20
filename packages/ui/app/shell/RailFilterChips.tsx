import { Chip } from "../primitives/index.js";
import type { HistoryPeriodFilterUI, HistoryStatusFilterUI } from "./types.js";

export interface RailFilterChipsProps {
  readonly active: HistoryStatusFilterUI;
  readonly onChange: (filter: HistoryStatusFilterUI) => void;
  readonly activePeriod: HistoryPeriodFilterUI;
  readonly onPeriodChange: (period: HistoryPeriodFilterUI) => void;
}

const FILTERS: ReadonlyArray<{ readonly key: HistoryStatusFilterUI; readonly label: string }> = [
  { key: "all", label: "TODOS" },
  { key: "done", label: "PRONTOS" },
  { key: "running", label: "RODANDO" },
  { key: "queued", label: "NA FILA" },
  { key: "failed", label: "FALHAS" },
  { key: "cancelled", label: "CANCELADOS" }
];

const PERIODS: ReadonlyArray<{ readonly key: HistoryPeriodFilterUI; readonly label: string }> = [
  { key: "all", label: "SEMPRE" },
  { key: "7d", label: "7D" },
  { key: "30d", label: "30D" },
  { key: "90d", label: "90D" }
];

export function RailFilterChips({ active, onChange, activePeriod, onPeriodChange }: RailFilterChipsProps) {
  return (
    <>
      <div className="rail-filters">
        {FILTERS.map((filter) => (
          <Chip key={filter.key} mono active={active === filter.key} onClick={() => onChange(filter.key)}>
            {filter.label}
          </Chip>
        ))}
      </div>
      <div className="rail-filters rail-filters-period">
        {PERIODS.map((period) => (
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
