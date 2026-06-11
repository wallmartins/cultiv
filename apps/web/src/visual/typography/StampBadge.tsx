import { cn } from "@my-ai-orchestrator/ui";

export interface StampBadgeProps {
  readonly label: string;
  readonly value: string;
  readonly className?: string;
  readonly invert?: boolean;
}

export function StampBadge({ label, value, className, invert }: StampBadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex -rotate-3 flex-col items-center justify-center rounded-full border-2 px-5 py-3 text-center",
        invert
          ? "border-showcase-accent text-showcase-accent"
          : "border-golden text-golden",
        className
      )}
      style={{
        borderRadius: "48% 52% 54% 46% / 52% 48% 50% 50%"
      }}
    >
      <span
        className={cn(
          "font-mono text-[0.625rem] uppercase tracking-editorial",
          invert ? "text-showcase-accent" : "text-golden/80"
        )}
      >
        {label}
      </span>
      <span className="font-mono text-sm font-medium">{value}</span>
    </div>
  );
}
