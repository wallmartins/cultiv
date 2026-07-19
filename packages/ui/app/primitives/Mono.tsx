import type { ComponentPropsWithoutRef, ElementType } from "react";

export interface MonoProps {
  as?: ElementType;
  eyebrow?: boolean;
  className?: string;
  style?: ComponentPropsWithoutRef<"span">["style"];
  children?: ComponentPropsWithoutRef<"span">["children"];
}

export function Mono({ as: Component = "span", eyebrow = false, className, ...rest }: MonoProps) {
  const classes = ["mono", eyebrow && "eyebrow", className].filter(Boolean).join(" ");
  return <Component className={classes} {...rest} />;
}
