import { cn, IconCompass, IconMap, IconRoute } from "@my-ai-orchestrator/ui";

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

export function NavIconGenerate({ active, className }: NavIconProps) {
  return <IconCompass size={18} className={iconClassName(active, className)} />;
}

export function NavIconHistory({ active, className }: NavIconProps) {
  return <IconMap size={18} className={iconClassName(active, className)} />;
}

export function NavIconVoice({ active, className }: NavIconProps) {
  return <IconRoute size={18} className={iconClassName(active, className)} />;
}

export function NavIconAccount({ active, className }: NavIconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={iconClassName(active, className)}>
      <circle cx="12" cy="8" r="3.5" fill="none" stroke="currentColor" strokeWidth={1.5} />
      <path
        d="M6 19.5c0-3 2.7-5.5 6-5.5s6 2.5 6 5.5"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </svg>
  );
}
