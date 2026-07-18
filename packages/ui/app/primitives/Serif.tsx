import type { ComponentPropsWithoutRef, ElementType } from "react";

export interface SerifProps {
  as?: ElementType;
  size?: string | number;
  lineHeight?: string | number;
  className?: string;
  style?: ComponentPropsWithoutRef<"span">["style"];
  children?: ComponentPropsWithoutRef<"span">["children"];
}

// Reuses .headline (font-family, font-weight, letter-spacing) and overrides
// only the two axes callers actually vary — size/lineHeight — inline.
export function Serif({ as: Component = "span", size, lineHeight, className, style, ...rest }: SerifProps) {
  const classes = ["headline", className].filter(Boolean).join(" ");
  return (
    <Component
      className={classes}
      style={{
        ...(size !== undefined ? { fontSize: size } : {}),
        ...(lineHeight !== undefined ? { lineHeight } : {}),
        ...style
      }}
      {...rest}
    />
  );
}
