import { Chip } from "../primitives/index.js";
import type { HistoryStatusFilterUI } from "./types.js";

export interface RailFilterChipsProps {
  readonly active: HistoryStatusFilterUI;
  readonly onChange: (filter: HistoryStatusFilterUI) => void;
}

const FILTERS: ReadonlyArray<{ readonly key: HistoryStatusFilterUI; readonly label: string }> = [
  { key: "all", label: "TODOS" },
  { key: "done", label: "PRONTOS" },
  { key: "running", label: "RODANDO" },
  { key: "failed", label: "FALHAS" }
];

export function RailFilterChips({ active, onChange }: RailFilterChipsProps) {
  return (
    <div className="rail-filters">
      {FILTERS.map((filter) => (
        <Chip key={filter.key} mono active={active === filter.key} onClick={() => onChange(filter.key)}>
          {filter.label}
        </Chip>
      ))}
    </div>
  );
}
