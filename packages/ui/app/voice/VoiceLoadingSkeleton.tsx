import { useMessages } from "../i18n/index.js";

export function VoiceLoadingSkeleton() {
  const t = useMessages();
  return (
    <div className="voice-skeleton" role="status" aria-label={t.voice.loadingAriaLabel}>
      <div className="voice-skeleton-ring" />
      <div className="voice-skeleton-bar" />
      <div className="voice-skeleton-bar is-narrow" />
    </div>
  );
}
