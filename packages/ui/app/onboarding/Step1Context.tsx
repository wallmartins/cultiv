import { Banner, Chip, Mono, Panel, Pill, Serif } from "../primitives/index.js";
import { useMessages } from "../i18n/index.js";

export interface Step1ContextProps {
  readonly subject: string;
  readonly onSubjectChange: (value: string) => void;
  readonly vantagePoint: string;
  readonly onVantagePointChange: (value: string) => void;
  readonly audiences: readonly string[];
  readonly audienceDraft: string;
  readonly onAudienceDraftChange: (value: string) => void;
  readonly onAudienceAdd: () => void;
  readonly onAudienceRemove: (value: string) => void;
  readonly onContinue: () => void;
  readonly pending?: boolean;
  /** Omitted in the light (recalibrate) chrome — the × close covers that escape there. */
  readonly onSkipForNow?: () => void;
  /** First calibration only: consent is collected here, before any sample is submitted. Omitted on
   * recalibrate, where consent is already granted. When present, Continuar requires it checked. */
  readonly consent?: {
    readonly granted: boolean;
    readonly onToggle: (granted: boolean) => void;
  };
}

export function Step1Context({
  subject,
  onSubjectChange,
  vantagePoint,
  onVantagePointChange,
  audiences,
  audienceDraft,
  onAudienceDraftChange,
  onAudienceAdd,
  onAudienceRemove,
  onContinue,
  pending = false,
  onSkipForNow,
  consent
}: Step1ContextProps) {
  const t = useMessages();
  const canContinue =
    subject.trim().length > 0 &&
    vantagePoint.trim().length > 0 &&
    audiences.length > 0 &&
    (consent === undefined || consent.granted);

  return (
    <Panel className="wizard-step-panel">
      <Mono eyebrow className="wizard-step-eyebrow">
        {t.onboarding.step1.eyebrow}
      </Mono>
      <Serif as="h1" size="1.7rem" lineHeight={1.3} className="wizard-step-heading">
        {t.onboarding.step1.heading}
      </Serif>
      <div className="wizard-field">
        <label className="wizard-field-label" htmlFor="wizard-subject">
          {t.onboarding.step1.subjectLabel}
        </label>
        <input
          id="wizard-subject"
          className="wizard-field-input"
          value={subject}
          onChange={(event) => onSubjectChange(event.target.value)}
          placeholder={t.onboarding.step1.subjectPlaceholder}
        />
      </div>
      <div className="wizard-field">
        <label className="wizard-field-label" htmlFor="wizard-vantage-point">
          {t.onboarding.step1.vantagePointLabel}
        </label>
        <input
          id="wizard-vantage-point"
          className="wizard-field-input"
          value={vantagePoint}
          onChange={(event) => onVantagePointChange(event.target.value)}
          placeholder={t.onboarding.step1.vantagePointPlaceholder}
        />
      </div>
      <div className="wizard-field">
        <label className="wizard-field-label" htmlFor="wizard-audience-draft">
          {t.onboarding.step1.audiencesLabel}
        </label>
        <input
          id="wizard-audience-draft"
          className="wizard-field-input"
          value={audienceDraft}
          onChange={(event) => onAudienceDraftChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            onAudienceAdd();
          }}
          placeholder={t.onboarding.step1.audiencePlaceholder}
        />
        {audiences.length > 0 ? (
          <div className="wizard-audience-chips">
            {audiences.map((value) => (
              <Chip
                key={value}
                tone="neutral"
                onClick={() => onAudienceRemove(value)}
                aria-label={t.onboarding.step1.audienceRemoveAria(value)}
              >
                {value} ×
              </Chip>
            ))}
          </div>
        ) : null}
      </div>
      <Banner tone="accent" className="wizard-consent-notice">
        {t.onboarding.step1.consentBanner}
      </Banner>
      {consent ? (
        <label className="wizard-consent-toggle">
          <input
            type="checkbox"
            checked={consent.granted}
            onChange={(event) => consent.onToggle(event.target.checked)}
            disabled={pending}
          />
          <span>{t.onboarding.consent.checkboxLabel}</span>
        </label>
      ) : null}
      <div className="wizard-step-footer">
        {onSkipForNow ? (
          <button type="button" className="wizard-skip-link" onClick={onSkipForNow}>
            <Mono as="span">{t.onboarding.skipForNow}</Mono>
          </button>
        ) : (
          <span />
        )}
        <Pill variant="primary" onClick={onContinue} disabled={!canContinue || pending}>
          {t.common.continue}
        </Pill>
      </div>
    </Panel>
  );
}
