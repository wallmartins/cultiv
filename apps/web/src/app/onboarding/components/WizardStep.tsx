import { cn, LogbookProse, Text } from "@my-ai-orchestrator/ui";
import { canAdvance, countWords } from "~/app/onboarding/lib/voice-calibration-word-count";

export interface WizardStepProps {
  readonly label: string;
  readonly prompt: string;
  readonly theme?: string;
  readonly text: string;
  readonly onTextChange: (value: string) => void;
  readonly targetWords?: number;
  readonly maxWords?: number;
  readonly wordCountLabel: string;
  readonly minWordsHint: string;
  readonly readOnly?: boolean;
}

export function WizardStep({
  label,
  prompt,
  theme,
  text,
  onTextChange,
  targetWords,
  maxWords,
  wordCountLabel,
  minWordsHint,
  readOnly = false
}: WizardStepProps) {
  const wordCount = countWords(text);
  const minWords = targetWords !== undefined ? Math.floor(targetWords * 0.5) : undefined;
  const advanceReady = targetWords !== undefined ? canAdvance(targetWords, wordCount) : wordCount > 0;
  const overMax = maxWords !== undefined && wordCount > maxWords;

  return (
    <LogbookProse className="space-y-4 p-5">
      <Text variant="label" className="block text-ink-muted">
        {label}
      </Text>
      <Text variant="body-lg" className="w-full leading-relaxed text-ink">
        {prompt}
      </Text>
      {theme ? (
        <Text variant="meta" className="text-ink-muted">
          {theme}
        </Text>
      ) : null}
      <textarea
        value={text}
        onChange={(event) => onTextChange(event.target.value)}
        readOnly={readOnly}
        rows={8}
        className={cn(
          "w-full resize-y rounded-[5px] border border-dotted-cartography bg-cream px-4 py-3 font-inter text-sm leading-relaxed text-ink",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta",
          readOnly && "opacity-80"
        )}
        aria-label={label}
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Text
          variant="meta"
          className={cn(
            "font-mono",
            overMax ? "text-terracotta" : advanceReady ? "text-moss" : "text-ink-muted"
          )}
        >
          {wordCountLabel
            .replace("{current}", String(wordCount))
            .replace("{target}", String(targetWords ?? "—"))
            .replace("{min}", String(minWords ?? "—"))}
        </Text>
        {targetWords !== undefined && !advanceReady ? (
          <Text variant="meta" className="text-ink-muted">
            {minWordsHint.replace("{min}", String(minWords))}
          </Text>
        ) : null}
      </div>
    </LogbookProse>
  );
}

export function wizardStepCanAdvance(targetWords: number | undefined, text: string): boolean {
  if (targetWords === undefined) {
    return countWords(text) > 0;
  }

  return canAdvance(targetWords, countWords(text));
}
