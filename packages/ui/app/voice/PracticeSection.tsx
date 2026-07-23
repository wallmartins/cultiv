import { useMessages } from "../i18n/index.js";
import { Chip, Mono, Panel, Pill, Serif } from "../primitives/index.js";
import type { PracticeNicheAskVM, PracticeSectionVM } from "./types.js";

export interface PracticeSectionProps {
  readonly vm: PracticeSectionVM;
}

// Mirrors the ADR 0010 §2 invariant: the 7 Practice Dimensions are derived + invisible to the
// author. This renders only the three declared axes (subject/vantagePoint/audiences) + depth —
// never a dimension field.
export function PracticeSection({ vm }: PracticeSectionProps) {
  const t = useMessages();
  const p = t.voice.practice;

  return (
    <div className="voice-practice-section">
      <Mono eyebrow className="voice-practice-eyebrow">
        {p.sectionEyebrow}
      </Mono>
      <Serif as="h2" size="24px" className="voice-practice-heading">
        {p.sectionHeading}
      </Serif>

      {vm.edit.open ? <PracticeEditForm edit={vm.edit} /> : <PracticeAxesCard axes={vm.axes} onEdit={vm.edit.onOpen} />}

      {vm.nicheAsk ? <PracticeNicheAskCard nicheAsk={vm.nicheAsk} state={vm.nicheAskState} /> : null}
    </div>
  );
}

function PracticeAxesCard({ axes, onEdit }: { axes: PracticeSectionVM["axes"]; onEdit: () => void }) {
  const t = useMessages();
  const p = t.voice.practice;

  return (
    <Panel className="voice-practice-card">
      <div className="voice-practice-card-head">
        <Mono as="span" className={`voice-practice-depth-badge is-${axes.depth}`}>
          {axes.depth === "enriched" ? p.depth.enriched : p.depth.seed}
        </Mono>
        <Pill variant="secondary" onClick={onEdit}>
          {p.edit}
        </Pill>
      </div>
      <div className="voice-practice-axis">
        <Mono as="div" className="voice-practice-axis-label">
          {p.subjectLabel}
        </Mono>
        <div className="voice-practice-axis-value">{axes.subject}</div>
      </div>
      <div className="voice-practice-axis">
        <Mono as="div" className="voice-practice-axis-label">
          {p.vantagePointLabel}
        </Mono>
        <div className="voice-practice-axis-value">{axes.vantagePoint}</div>
      </div>
      <div className="voice-practice-axis">
        <Mono as="div" className="voice-practice-axis-label">
          {p.audiencesLabel}
        </Mono>
        <div className="voice-practice-audience-chips">
          {axes.audiences.map((audience) => (
            <span key={audience} className="voice-descriptor-chip">
              {audience}
            </span>
          ))}
        </div>
      </div>
    </Panel>
  );
}

function PracticeEditForm({ edit }: { edit: PracticeSectionVM["edit"] }) {
  const t = useMessages();
  const p = t.voice.practice;

  return (
    <Panel className="voice-practice-card">
      <div className="voice-practice-field">
        <label className="voice-practice-field-label" htmlFor="practice-subject">
          {p.subjectLabel}
        </label>
        <input
          id="practice-subject"
          className="voice-practice-field-input"
          value={edit.subject}
          onChange={(event) => edit.onSubjectChange(event.target.value)}
        />
      </div>
      <div className="voice-practice-field">
        <label className="voice-practice-field-label" htmlFor="practice-vantage-point">
          {p.vantagePointLabel}
        </label>
        <input
          id="practice-vantage-point"
          className="voice-practice-field-input"
          value={edit.vantagePoint}
          onChange={(event) => edit.onVantagePointChange(event.target.value)}
        />
      </div>
      <div className="voice-practice-field">
        <label className="voice-practice-field-label" htmlFor="practice-audience-draft">
          {p.audiencesLabel}
        </label>
        <input
          id="practice-audience-draft"
          className="voice-practice-field-input"
          value={edit.audienceDraft}
          onChange={(event) => edit.onAudienceDraftChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            edit.onAudienceAdd();
          }}
          placeholder={p.addAudience}
        />
        {edit.audiences.length > 0 ? (
          <div className="voice-practice-audience-chips">
            {edit.audiences.map((audience) => (
              <Chip
                key={audience}
                tone="neutral"
                onClick={() => edit.onAudienceRemove(audience)}
                aria-label={p.audienceRemoveAria(audience)}
              >
                {audience} ×
              </Chip>
            ))}
          </div>
        ) : null}
      </div>
      {edit.error ? <div className="voice-practice-edit-error">{edit.error}</div> : null}
      <div className="voice-practice-edit-actions">
        <Pill variant="secondary" onClick={edit.onCancel} disabled={edit.pending}>
          {p.cancel}
        </Pill>
        <Pill variant="primary" onClick={edit.onSave} disabled={edit.pending}>
          {p.save}
        </Pill>
      </div>
    </Panel>
  );
}

function PracticeNicheAskCard({
  nicheAsk,
  state
}: {
  nicheAsk: PracticeNicheAskVM;
  state: PracticeSectionVM["nicheAskState"];
}) {
  const t = useMessages();
  const p = t.voice.practice.nicheAsk;

  return (
    <Panel className="voice-practice-card">
      <Mono as="div" className="voice-practice-niche-heading">
        {p.heading}
      </Mono>
      <p className="voice-practice-niche-question">{nicheAsk.question}</p>

      {state.answerOpen ? (
        <div className="voice-practice-niche-answer">
          <textarea
            className="voice-practice-field-textarea"
            value={state.answer}
            onChange={(event) => state.onAnswerChange(event.target.value)}
            placeholder={p.answerPlaceholder}
            aria-label={p.heading}
            rows={4}
          />
          <div className="voice-practice-niche-actions">
            <Pill variant="primary" onClick={state.onAnswerSubmit} disabled={state.pending}>
              {p.submit}
            </Pill>
          </div>
        </div>
      ) : (
        <div className="voice-practice-niche-actions">
          <Pill variant="outline" disabled={state.pending} onClick={state.onRespondOpen}>
            {p.respond}
          </Pill>
          <Pill variant="outline" disabled={state.pending} onClick={state.onDismiss}>
            {p.dismiss}
          </Pill>
        </div>
      )}
    </Panel>
  );
}
