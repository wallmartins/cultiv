import "./settings.css";
import { Mono } from "../primitives/index.js";
import { useMessages } from "../i18n/index.js";
import { AccountSection, type AccountSectionProps } from "./AccountSection.js";
import { DeleteDialog, type DeleteDialogProps } from "./DeleteDialog.js";
import { PlanSummarySection, type PlanSummarySectionProps } from "./PlanSummarySection.js";
import { PreferencesSection, type PreferencesSectionProps } from "./PreferencesSection.js";
import { PrivacyDataSection, type PrivacyDataSectionProps } from "./PrivacyDataSection.js";
import { ResetDialog, type ResetDialogProps } from "./ResetDialog.js";

export interface SettingsScreenProps {
  readonly account: AccountSectionProps;
  readonly preferences: PreferencesSectionProps;
  readonly privacy: PrivacyDataSectionProps;
  // undefined while the entitlement query is still loading.
  readonly plan?: PlanSummarySectionProps;
  readonly resetDialog: ResetDialogProps;
  readonly deleteDialog: DeleteDialogProps;
}

// Column layout, max-width 620px (design linha 358) — narrower than voice/billing (680px) since
// settings rows are single-line, not prose/cards.
export function SettingsScreen({ account, preferences, privacy, plan, resetDialog, deleteDialog }: SettingsScreenProps) {
  const t = useMessages();
  return (
    <div className="settings-screen">
      <div className="settings-screen-inner">
        <Mono as="div" className="settings-page-eyebrow">
          {t.settings.pageEyebrow}
        </Mono>
        <AccountSection {...account} />
        <PreferencesSection {...preferences} />
        <PrivacyDataSection {...privacy} />
        {plan ? <PlanSummarySection {...plan} /> : null}
      </div>
      <ResetDialog {...resetDialog} />
      <DeleteDialog {...deleteDialog} />
    </div>
  );
}
