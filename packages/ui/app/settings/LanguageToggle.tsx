import { useMessages } from "../i18n/index.js";

export type UiLanguageOption = "pt-BR" | "en";

export interface LanguageToggleProps {
  readonly value: UiLanguageOption;
  readonly onChange: (value: UiLanguageOption) => void;
}

function optionClass(active: boolean): string {
  return ["settings-lang-option", active && "is-active"].filter(Boolean).join(" ");
}

export function LanguageToggle({ value, onChange }: LanguageToggleProps) {
  const t = useMessages();
  return (
    <div className="settings-lang-toggle" role="group" aria-label={t.settings.languageGroupLabel}>
      <button type="button" className={optionClass(value === "pt-BR")} onClick={() => onChange("pt-BR")}>
        pt-BR
      </button>
      <button type="button" className={optionClass(value === "en")} onClick={() => onChange("en")}>
        EN
      </button>
    </div>
  );
}
