import type { ContentTypeCatalogView } from "@my-ai-orchestrator/contracts";
import { LogbookProse, Text } from "@my-ai-orchestrator/ui";
import { getBlockedReason } from "~/app/generation/lib/get-blocked-reason";
import type { useGenerationForm } from "~/app/generation/hooks/useGenerationForm";
import type { useGenerationWizard } from "~/app/generation/hooks/useGenerationWizard";
import type { ContentTypesStatus } from "~/app/generation/lib/use-content-types";
import { getContentTypeDescription, getContentTypeLabel } from "~/i18n/app/content-types";
import type { AppLocale, AppMessages } from "~/i18n/app/types";
import { formatSdkError } from "~/platform/sdk/format-sdk-error";
import { AppFieldSlot } from "~/platform/ui/AppField";
import { AppSelect } from "~/platform/ui/AppSelect";
import { HelpTooltip } from "~/platform/ui/HelpTooltip";

export function LegacyContentTypeSection({
  legacyFormatPickerEnabled,
  contentTypesCatalog,
  contentTypesStatus,
  contentTypesError,
  retryContentTypes,
  legacyContentTypeId,
  setLegacyContentTypeId,
  locale,
  messages,
  form,
  wizard
}: {
  readonly legacyFormatPickerEnabled: boolean;
  readonly contentTypesCatalog: ContentTypeCatalogView | null;
  readonly contentTypesStatus: ContentTypesStatus;
  readonly contentTypesError: unknown;
  readonly retryContentTypes: () => void;
  readonly legacyContentTypeId: string;
  readonly setLegacyContentTypeId: (id: string) => void;
  readonly locale: AppLocale;
  readonly messages: AppMessages;
  readonly form: ReturnType<typeof useGenerationForm>;
  readonly wizard: ReturnType<typeof useGenerationWizard>;
}) {
  if (!legacyFormatPickerEnabled) {
    return null;
  }

  return (
    <>
      {contentTypesCatalog ? (
        <LogbookProse className="mb-6 p-4">
          <AppFieldSlot
            label={messages.generate.contentType}
            labelAccessory={
              legacyContentTypeId && getContentTypeDescription(locale, legacyContentTypeId) ? (
                <HelpTooltip
                  text={getContentTypeDescription(locale, legacyContentTypeId)!}
                  ariaLabel={messages.generate.contentTypeHelp}
                  placement="responsive-end"
                  size="wide"
                />
              ) : null
            }
          >
            <AppSelect
              id="content-type-legacy"
              className="w-full"
              value={legacyContentTypeId}
              onChange={(nextContentTypeId) => {
                if (nextContentTypeId !== legacyContentTypeId) {
                  form.setBriefing({});
                }
                setLegacyContentTypeId(nextContentTypeId);
                form.handleLegacyContentTypeChange(nextContentTypeId, contentTypesCatalog);
                wizard.resetWizard();
              }}
              placeholder={messages.generate.contentTypePlaceholder}
              options={(contentTypesCatalog.items ?? []).map((item) => ({
                value: item.id,
                label: `${getContentTypeLabel(locale, item.id, item.label)}${
                  !item.available ? ` (${getBlockedReason(item.reasonCode, messages)})` : ""
                }`,
                disabled: !item.available
              }))}
            />
          </AppFieldSlot>
        </LogbookProse>
      ) : null}

      {contentTypesStatus === "error" && !contentTypesCatalog ? (
        <LogbookProse className="mb-6 border-red-700/30 bg-red-700/10 p-4">
          <Text variant="body" className="mb-2 text-red-800">
            {messages.generate.catalogLoadError}
          </Text>
          <Text variant="meta" className="mb-3 text-red-800/80">
            {contentTypesError
              ? formatSdkError(contentTypesError, messages).message
              : messages.errors.default.message}
          </Text>
          <button
            type="button"
            className="text-sm font-medium text-ink underline-offset-2 hover:underline"
            onClick={retryContentTypes}
          >
            {messages.generate.catalogRetry}
          </button>
        </LogbookProse>
      ) : null}
    </>
  );
}
