import { StatusDot } from "../primitives/index.js";
import { useMessages } from "../i18n/index.js";

export interface RailSearchProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
}

export function RailSearch({ value, onChange }: RailSearchProps) {
  const t = useMessages();
  return (
    <label className="rail-search">
      <StatusDot tone="neutral" size={7} />
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={t.shell.searchPlaceholder}
      />
    </label>
  );
}
