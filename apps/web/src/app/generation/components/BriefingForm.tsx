import type { ContentTypeFieldView } from "@my-ai-orchestrator/contracts";
import { Input } from "@my-ai-orchestrator/ui";
import { HelpTooltip } from "~/platform/ui/HelpTooltip";
import { getFieldHelpText, getFieldLabel } from "~/i18n/app/field-labels";
import type { AppLocale } from "~/i18n/app/types";
import { useAppLocale } from "~/i18n/app/use-app-locale";
import { AppSelect } from "~/platform/ui/AppSelect";
import { lenisScrollRegionProps } from "~/platform/ui/lenis-scroll-region";

const textareaClassName =
  "workspace-field-control min-h-28 w-full font-body text-base text-ink placeholder:text-ink-muted";

export interface BriefingFormProps {
  readonly locale: AppLocale;
  readonly contentTypeId: string;
  readonly fields: readonly ContentTypeFieldView[];
  readonly values: Record<string, unknown>;
  readonly onChange: (next: Record<string, unknown>) => void;
}

export function BriefingForm({
  locale,
  contentTypeId,
  fields,
  values,
  onChange
}: BriefingFormProps) {
  const { messages } = useAppLocale();

  function updateField(key: string, value: unknown) {
    onChange({ ...values, [key]: value });
  }

  return (
    <div className="space-y-4">
      {fields.map((field) => {
        const label = getFieldLabel(locale, contentTypeId, field.key, field.label);
        const helpText = getFieldHelpText(locale, contentTypeId, field.key, field.helpText);
        const value = values[field.key];
        const usesTextarea = field.type === "text" || field.type === "string" || field.type === "array";
        const fieldHelp =
          helpText ? (
            <HelpTooltip
              text={helpText}
              ariaLabel={messages.generate.fieldHelp}
              placement="top"
              size="wide"
            />
          ) : null;

        return (
          <div key={field.key}>
            {field.type === "boolean" ? (
              <label htmlFor={`briefing-${field.key}`} className="flex items-center gap-2 text-sm font-medium">
                <input
                  id={`briefing-${field.key}`}
                  type="checkbox"
                  checked={Boolean(value)}
                  onChange={(event) => updateField(field.key, event.target.checked)}
                />
                <span>
                  {label}
                  {field.required ? " *" : ""}
                </span>
                {fieldHelp}
              </label>
            ) : (
              <>
                <label htmlFor={`briefing-${field.key}`} className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <span>
                    {label}
                    {field.required ? " *" : ""}
                  </span>
                  {fieldHelp}
                </label>

                {usesTextarea ? (
                  <textarea
                    id={`briefing-${field.key}`}
                    className={textareaClassName}
                    {...lenisScrollRegionProps}
                    value={typeof value === "string" ? value : ""}
                    onChange={(event) => updateField(field.key, event.target.value)}
                  />
                ) : field.type === "enum" ? (
                  <AppSelect
                    id={`briefing-${field.key}`}
                    value={typeof value === "string" ? value : ""}
                    onChange={(next) => updateField(field.key, next)}
                    options={(field.options ?? []).map((option) => ({ value: option, label: option }))}
                  />
                ) : field.type === "number" ? (
                  <Input
                    id={`briefing-${field.key}`}
                    type="number"
                    className="workspace-field-control"
                    value={typeof value === "number" ? value : ""}
                    onChange={(event) =>
                      updateField(field.key, event.target.value === "" ? undefined : Number(event.target.value))
                    }
                  />
                ) : (
                  <Input
                    id={`briefing-${field.key}`}
                    className="workspace-field-control"
                    value={typeof value === "string" ? value : ""}
                    onChange={(event) => updateField(field.key, event.target.value)}
                  />
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function isBriefingComplete(
  fields: readonly ContentTypeFieldView[],
  values: Record<string, unknown>
): boolean {
  return fields
    .filter((field) => field.required)
    .every((field) => {
      const value = values[field.key];
      if (typeof value === "string") {
        return value.trim().length > 0;
      }

      return value !== undefined && value !== null && value !== "";
    });
}
