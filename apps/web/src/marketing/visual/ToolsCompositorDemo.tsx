import { cn, RouteLine, Text } from "@my-ai-orchestrator/ui";
import { useState } from "react";
import type { LocaleMessages } from "~/i18n/marketing/types";

type ToolsDemo = LocaleMessages["tools"]["demo"];
type DemoPhase = ToolsDemo["phases"][number];

export interface ToolsCompositorDemoProps {
  readonly demo: ToolsDemo;
}

export function ToolsCompositorDemo({ demo }: ToolsCompositorDemoProps) {
  const [activePhase, setActivePhase] = useState(0);
  const phase = demo.phases[activePhase];
  const progress = (activePhase + 1) / demo.stepLabels.length;

  if (!phase) {
    return null;
  }

  return (
    <div className="mx-auto max-w-4xl">
      <nav
        aria-label="Compositor steps"
        className="mb-8"
      >
        <div className="relative grid grid-cols-3 gap-2">
          <div
            className="pointer-events-none absolute inset-x-[16.67%] top-[0.55rem] h-px"
            aria-hidden="true"
          >
            <RouteLine progress={progress} orientation="horizontal" animate className="h-px w-full" />
          </div>

          {demo.stepLabels.map((label, index) => {
            const isActive = index === activePhase;
            const isDone = index < activePhase;

            return (
              <button
                key={label}
                type="button"
                onClick={() => setActivePhase(index)}
                className={cn(
                  "relative flex flex-col items-center gap-2 rounded-[5px] px-1 py-1 text-center transition-colors duration-200 motion-reduce:transition-none",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
                )}
                aria-current={isActive ? "step" : undefined}
              >
                <span
                  className={cn(
                    "relative z-10 flex h-[1.125rem] w-[1.125rem] items-center justify-center rounded-full border transition-colors duration-200 motion-reduce:transition-none",
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
                <span
                  className={cn(
                    "ui-type-mono text-[0.625rem] uppercase tracking-widest transition-colors duration-200 motion-reduce:transition-none",
                    isActive ? "text-deep-blue" : isDone ? "text-moss" : "text-ink-muted"
                  )}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      <div
        className={cn(
          "overflow-hidden rounded-[5px] border-dotted-cartography bg-off-white p-5 shadow-cartography md:p-7",
          "bg-gradient-to-br from-off-white via-off-white to-cream/50"
        )}
      >
        <header className="mb-6 border-b border-ink-ghost/15 pb-5">
          <Text as="h3" variant="heading" className="mb-2 text-deep-blue">
            {phase.title}
          </Text>
          <Text as="p" variant="body" className="text-ink-muted">
            {phase.subtitle}
          </Text>
        </header>

        {phase.intents ? <ObjectivePhase demo={phase} /> : null}
        {phase.lengthTiers ? (
          <ScopePhase demo={phase} exploreLabel={demo.stepLabels[0] ?? ""} />
        ) : null}
        {phase.fields ? <ComposePhase demo={phase} /> : null}
      </div>
    </div>
  );
}

function ObjectivePhase({ demo }: { readonly demo: DemoPhase }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {demo.intents?.map((intent) => (
        <div
          key={intent.label}
          className={cn(
            "rounded-[5px] border-dotted-cartography p-4 transition-colors duration-200 motion-reduce:transition-none",
            intent.selected
              ? "border-terracotta/70 bg-cream shadow-[inset_0_0_0_1px_rgba(181,90,59,0.12)]"
              : "bg-off-white/80"
          )}
        >
          <Text
            as="span"
            variant="label"
            className={cn("mb-1.5 block", intent.selected ? "text-terracotta" : "text-deep-blue")}
          >
            {intent.label}
          </Text>
          <Text as="span" variant="meta" className="block leading-relaxed text-ink-muted">
            {intent.description}
          </Text>
        </div>
      ))}
    </div>
  );
}

function ScopePhase({
  demo,
  exploreLabel
}: {
  readonly demo: DemoPhase;
  readonly exploreLabel: string;
}) {
  return (
    <div className="space-y-5">
      <div className="rounded-[5px] border-dotted-cartography bg-cream/60 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Text as="span" variant="meta" className="mb-1 block ui-type-mono text-ink-muted">
              {exploreLabel}
            </Text>
            <Text as="span" variant="label" className="text-deep-blue">
              {demo.selectedIntentLabel}
            </Text>
          </div>
          <span className="ui-type-mono text-[0.625rem] uppercase tracking-widest text-terracotta">
            {demo.changeIntent}
          </span>
        </div>
      </div>

      <div className="rounded-[5px] border-dotted-cartography bg-off-white/80 p-4">
        <Text as="span" variant="label" className="mb-3 block text-deep-blue">
          {demo.lengthTierLabel}
        </Text>
        <div className="flex flex-wrap gap-2">
          {demo.lengthTiers?.map((tier) => (
            <span
              key={tier.label}
              className={cn(
                "rounded-[5px] px-3 py-1.5 ui-type-mono text-[0.625rem] uppercase tracking-widest transition-colors",
                tier.selected
                  ? "bg-deep-blue text-off-white"
                  : "border border-ink-ghost/40 bg-cream text-ink-muted"
              )}
            >
              {tier.label}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-[5px] border-dotted-cartography bg-off-white/80 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <Text as="span" variant="label" className="text-deep-blue">
            {demo.channelLabel}
          </Text>
          <Text as="span" variant="meta" className="ui-type-mono text-ink-muted">
            {demo.channelOptional}
          </Text>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-[5px] border border-ink-ghost/30 bg-cream px-3 py-2.5">
          <Text as="span" variant="body" className="text-ink">
            {demo.channelValue}
          </Text>
          <span className="text-ink-muted" aria-hidden="true">
            ▾
          </span>
        </div>
      </div>
    </div>
  );
}

function ComposePhase({ demo }: { readonly demo: DemoPhase }) {
  return (
    <div className="space-y-5">
      <div className="space-y-4">
        {demo.fields?.map((field) => (
          <div key={field.label}>
            <Text as="span" variant="mono" className="mb-1.5 block text-ink-muted">
              {field.label}
            </Text>
            <div className="rounded-[5px] border border-ink-ghost/30 bg-cream px-3 py-2.5">
              <Text as="span" variant="body" className="text-ink">
                {field.value}
              </Text>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-[5px] border-dotted-cartography bg-cream/70 p-4">
        <Text as="span" variant="meta" className="mb-3 block ui-type-mono text-ink-muted">
          {demo.previewLabel}
        </Text>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Text as="span" variant="label" className="text-deep-blue">
            {demo.previewMode}
          </Text>
          <Text as="span" variant="mono" className="text-terracotta">
            {demo.previewCost}
          </Text>
        </div>
        <div className="mt-4 flex justify-end">
          <span className="inline-flex min-h-10 items-center rounded-[5px] bg-terracotta px-5 py-2 ui-type-mono text-[0.6875rem] font-semibold uppercase tracking-widest text-off-white">
            {demo.generateCta}
          </span>
        </div>
      </div>
    </div>
  );
}
