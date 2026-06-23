import { cn } from "@my-ai-orchestrator/ui";

type NavIconProps = {
  readonly active: boolean;
  readonly className?: string;
};

const iconClassName = (active: boolean, className?: string) =>
  cn(
    "size-[1.125rem] shrink-0 transition-colors duration-200",
    active ? "text-pigment-terracotta" : "text-ink-muted",
    className
  );

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const
};

export function NavIconGenerate({ active, className }: NavIconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={iconClassName(active, className)}>
      <path
        {...stroke}
        d="M12 20h7M14.5 5.5l4 4M7 17l-1.5 4.5L3 19l4.5-1.5L17 8.5l-2.5-2.5L7 17z"
      />
    </svg>
  );
}

export function NavIconHistory({ active, className }: NavIconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={iconClassName(active, className)}>
      <circle {...stroke} cx="12" cy="12" r="8" />
      <path {...stroke} d="M12 8v4.5l2.75 1.75" />
    </svg>
  );
}

export function NavIconVoice({ active, className }: NavIconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={iconClassName(active, className)}>
      <path {...stroke} d="M4 10v4M8 8v8M12 6v12M16 9v6M20 11v2" />
    </svg>
  );
}
