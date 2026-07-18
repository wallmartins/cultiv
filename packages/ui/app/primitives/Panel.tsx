import type { HTMLAttributes } from "react";

export interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  dialog?: boolean;
}

export function Panel({ dialog = false, className, ...rest }: PanelProps) {
  const classes = ["panel", dialog && "is-dialog", className].filter(Boolean).join(" ");
  return <div className={classes} {...rest} />;
}
