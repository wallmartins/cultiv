import type { ComponentPropsWithoutRef, ReactNode } from "react";

export type BannerTone = "warning" | "danger" | "accent";

export interface BannerProps {
  tone?: BannerTone;
  icon?: ReactNode;
  action?: ReactNode;
  label?: ReactNode;
  glow?: boolean;
  className?: string;
  style?: ComponentPropsWithoutRef<"div">["style"];
  children?: ReactNode;
}

export function Banner({ tone, icon, action, label, glow = false, className, style, children }: BannerProps) {
  const classes = ["banner", tone && `is-${tone}`, glow && "is-glow", className].filter(Boolean).join(" ");
  return (
    <div className={classes} style={style}>
      {icon ? <span className="icon">{icon}</span> : null}
      <div className="label">{label ?? children}</div>
      {action ? <span className="action">{action}</span> : null}
    </div>
  );
}
