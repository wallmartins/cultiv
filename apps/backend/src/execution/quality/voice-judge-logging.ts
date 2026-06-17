export function logVoiceJudgeEvent(
  event: string,
  details: Readonly<Record<string, unknown>>
): void {
  console.info("[cultiv] Voice judge", {
    event,
    ...details
  });
}
