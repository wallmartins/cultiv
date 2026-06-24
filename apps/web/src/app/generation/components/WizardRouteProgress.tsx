import { cn, RouteLine, Text } from "@my-ai-orchestrator/ui";
import type { AppMessages } from "~/i18n/app/types";

export interface WizardRouteProgressProps {
  readonly current: number;
  readonly messages: AppMessages;
  readonly className?: string;
}

export function WizardRouteProgress({ current, messages, className }: WizardRouteProgressProps) {
  const labels = [
    messages.intentWizard.stepExplorar,
    messages.intentWizard.stepEscala,
    messages.intentWizard.stepCoordenadas
  ];
  const total = labels.length;
  const progress = Math.min(1, Math.max(0, current / total));

  return (
    <nav
      aria-label={messages.intentWizard.stepIndicator
        .replace("{current}", String(current))
        .replace("{total}", String(total))}
      className={cn("mb-8", className)}
    >
      <div className="relative grid grid-cols-3 gap-2">
        <div
          className="pointer-events-none absolute inset-x-[16.67%] top-[0.55rem] h-px"
          aria-hidden="true"
        >
          <RouteLine progress={progress} orientation="horizontal" animate className="h-px w-full" />
        </div>

        {labels.map((label, index) => {
          const stepNum = index + 1;
          const isActive = stepNum === current;
          const isDone = stepNum < current;

          return (
            <div key={label} className="relative flex flex-col items-center gap-2 text-center">
              <span
                className={cn(
                  "relative z-10 flex h-[1.125rem] w-[1.125rem] items-center justify-center rounded-full border transition-colors duration-[250ms] motion-reduce:transition-none",
                  isDone
                    ? "border-moss bg-moss"
                    : isActive
                      ? "border-terracotta bg-cream"
                      : "border-ink-ghost/60 bg-cream"
                )}
                aria-hidden="true"
              >
                {isDone ? (
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-2.5 w-2.5 text-cream">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <span
                    className={cn(
                      "block h-1.5 w-1.5 rounded-full",
                      isActive ? "bg-terracotta" : "bg-ink-ghost/40"
                    )}
                  />
                )}
              </span>
              <Text
                as="span"
                variant="meta"
                className={cn(
                  "ui-type-mono transition-colors duration-[250ms] motion-reduce:transition-none",
                  isActive ? "text-deep-blue" : isDone ? "text-moss" : "text-ink-muted"
                )}
              >
                {label}
              </Text>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
