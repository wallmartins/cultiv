import type { ButtonHTMLAttributes } from "react";

export type PillVariant = "primary" | "secondary" | "danger" | "outline";
// Tints the outline variant's border+text (e.g. an accent-colored "ver o pronto" or a
// warning-colored "reescrever" pill) without any consumer touching var(--accent)/var(--warning).
export type PillTone = "accent" | "warning";

export interface PillProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: PillVariant;
  tone?: PillTone;
}

const VARIANT_CLASS: Record<PillVariant, string> = {
  primary: "solid",
  secondary: "ghost",
  danger: "danger",
  outline: "outline"
};

export function Pill({ variant = "primary", tone, type = "button", className, ...rest }: PillProps) {
  const classes = ["btn", VARIANT_CLASS[variant], tone && `is-${tone}`, className].filter(Boolean).join(" ");
  return <button type={type} className={classes} {...rest} />;
}
