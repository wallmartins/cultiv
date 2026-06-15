import type { QualityMode } from "@my-ai-orchestrator/contracts";
import type { AppLocale, AppMessages } from "~/i18n/app/types";
import { getQualityModeHelpDetail, type QualityModeHelpContext } from "~/i18n/app/quality-mode-tooltips";

export interface QualityModeHelpContentProps {
  readonly locale: AppLocale;
  readonly mode: QualityMode;
  readonly messages: AppMessages;
  readonly context: QualityModeHelpContext;
}

export function QualityModeHelpContent({ locale, mode, messages, context }: QualityModeHelpContentProps) {
  const { modeLabel, description, footnote } = getQualityModeHelpDetail(locale, mode, messages, context);

  return (
    <>
      <p className="workspace-tooltip-intro">{messages.qualityModes.helper}</p>
      <div className="workspace-tooltip-divider" role="presentation" />
      <div className="workspace-tooltip-detail">
        <p className="workspace-tooltip-detail-label">{modeLabel}</p>
        <p className="workspace-tooltip-detail-body">{description}</p>
        {footnote ? <p className="workspace-tooltip-footnote">{footnote}</p> : null}
      </div>
    </>
  );
}
