export function VoiceLoadingSkeleton() {
  return (
    <div className="voice-skeleton" role="status" aria-label="carregando perfil de voz">
      <div className="voice-skeleton-ring" />
      <div className="voice-skeleton-bar" />
      <div className="voice-skeleton-bar is-narrow" />
    </div>
  );
}
