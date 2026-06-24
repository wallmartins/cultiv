import type { QualityMode } from "@my-ai-orchestrator/contracts";
import { CoordinateLabel, LogbookProse } from "@my-ai-orchestrator/ui";
import { BriefingForm } from "~/app/generation/components/BriefingForm";
import { BriefingGuidancePanel } from "~/app/generation/components/BriefingGuidancePanel";
import { QualityModeHelpContent } from "~/app/generation/components/QualityModeHelpContent";
import { WizardRouteProgress } from "~/app/generation/components/WizardRouteProgress";
import type { GenerationFormSelection } from "~/app/generation/hooks/useGenerationForm";
import { IMPORTED_CONTEXT_MAX, type useGenerationForm } from "~/app/generation/hooks/useGenerationForm";
import type { useGenerationCommercialGate } from "~/app/generation/hooks/useGenerationCommercialGate";
import { getGenerationLanguageLabel } from "~/i18n/app/generation-languages";
import {
  getQualityModeHelpScreenReaderText,
  getQualityModeTooltip
} from "~/i18n/app/quality-mode-tooltips";
import type { AppLocale, AppMessages } from "~/i18n/app/types";
import { AppField, AppFieldSlot } from "~/platform/ui/AppField";
import { AppSegmentedControl } from "~/platform/ui/AppSegmentedControl";
import { AppSelect } from "~/platform/ui/AppSelect";
import { HelpTooltip } from "~/platform/ui/HelpTooltip";

const QUALITY_MODES: readonly QualityMode[] = ["fast", "balanced", "strict"];

export function GenerationComposeStep({
  locale,
  messages,
  formSelection,
  form,
  commercialGate
}: {
  readonly locale: AppLocale;
  readonly messages: AppMessages;
  readonly formSelection: GenerationFormSelection;
  readonly form: ReturnType<typeof useGenerationForm>;
  readonly commercialGate: ReturnType<typeof useGenerationCommercialGate>;
}) {
  return (
    <>
      <WizardRouteProgress current={3} messages={messages} />

      <BriefingGuidancePanel
        locale={locale}
        item={formSelection.catalogItem}
        guidanceSource={formSelection.mode === "intent" ? "intent" : "content-type"}
      />
      <LogbookProse className="p-5">
        <CoordinateLabel index={3} label={messages.generate.briefing} className="mb-4 block" />
        <BriefingForm
          locale={locale}
          contentTypeId={form.fieldLabelKey}
          fields={form.inputSchema}
          values={form.briefing}
          onChange={form.setBriefing}
        />
      </LogbookProse>

      <LogbookProse className="p-5">
        {form.importedOpen ? (
          <AppField
            multiline
            label={messages.generate.importedContextExpand}
            value={form.importedContext}
            onChange={(event) => form.setImportedContext(event.target.value)}
            maxLength={IMPORTED_CONTEXT_MAX}
            hint={messages.generate.importedContextCounter.replace(
              "{count}",
              String(form.importedContext.length)
            )}
            error={form.importedTooLarge ? messages.generate.importedContextTooLarge : undefined}
          />
        ) : null}
        <button
          type="button"
          className="text-sm font-medium text-terracotta underline-offset-2 hover:underline"
          onClick={() => form.setImportedOpen((open) => !open)}
        >
          {messages.generate.importedContextExpand}
        </button>
      </LogbookProse>

      <LogbookProse className="p-5">
        <AppFieldSlot label={messages.generate.language}>
          <AppSelect
            value={form.language}
            onChange={form.setLanguage}
            options={form.supportedLanguages.map((option) => ({
              value: option,
              label: getGenerationLanguageLabel(locale, option)
            }))}
          />
        </AppFieldSlot>
      </LogbookProse>

      <LogbookProse className="p-5">
        <AppFieldSlot
          label={messages.generate.qualityMode}
          labelAccessory={
            <HelpTooltip
              ariaLabel={messages.qualityModes.help}
              placement="responsive-end"
              size="wide"
              screenReaderText={getQualityModeHelpScreenReaderText(
                locale,
                form.qualityMode,
                messages,
                commercialGate.qualityModeHelpContext
              )}
            >
              <QualityModeHelpContent
                locale={locale}
                mode={form.qualityMode}
                messages={messages}
                context={commercialGate.qualityModeHelpContext}
              />
            </HelpTooltip>
          }
        >
          <AppSegmentedControl
            name="quality-mode"
            value={form.qualityMode}
            onChange={(mode) => form.setQualityMode(mode as QualityMode)}
            options={QUALITY_MODES.map((mode) => {
              const option = commercialGate.qualityModeDisplayOptions.find(
                (candidate) => candidate.id === mode
              );
              const allowed = commercialGate.isModeAllowedForUser(mode);
              const blockedReason =
                option?.blockedReason ?? (!allowed ? "quality_mode_plan_restriction" : undefined);

              return {
                value: mode,
                disabled: !allowed,
                ariaLabel: getQualityModeTooltip(locale, mode, messages, {
                  allowed,
                  blockedReason
                }),
                label: (
                  <>
                    {messages.qualityModes[mode]}
                    {option?.recommended ? " ★" : ""}
                  </>
                )
              };
            })}
          />
        </AppFieldSlot>
      </LogbookProse>
    </>
  );
}
