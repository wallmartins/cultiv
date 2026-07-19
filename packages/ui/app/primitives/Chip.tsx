import type { ButtonHTMLAttributes } from "react";

export type ChipTone = "accent" | "neutral" | "danger";

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  tone?: ChipTone;
  mono?: boolean;
}

export function Chip({
  active = false,
  tone,
  mono = false,
  type = "button",
  className,
  ...rest
}: ChipProps) {
  const effectiveTone = active ? "accent" : tone;
  const classes = ["chip", effectiveTone && `is-${effectiveTone}`, mono && "is-mono", className]
    .filter(Boolean)
    .join(" ");
  return <button type={type} className={classes} aria-pressed={active || undefined} {...rest} />;
}
