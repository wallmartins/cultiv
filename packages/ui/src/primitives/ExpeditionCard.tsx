import type { ButtonHTMLAttributes, ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "../lib/cn.js";

type ExpeditionCardBaseProps = {
  readonly selected?: boolean;
  readonly className?: string;
  readonly children: ReactNode;
};

export type ExpeditionCardProps =
  | (ExpeditionCardBaseProps & { readonly as?: "button" } & ButtonHTMLAttributes<HTMLButtonElement>)
  | (ExpeditionCardBaseProps & { readonly as: "div" } & ComponentPropsWithoutRef<"div">);

const cardClasses = (selected: boolean, className?: string) =>
  cn(
    "rounded-[5px] border-dotted-cartography shadow-cartography text-left",
    "transition duration-[250ms] hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0",
    selected && "border-terracotta border-solid",
    className
  );

export function ExpeditionCard({
  selected = false,
  className,
  children,
  as = "button",
  ...props
}: ExpeditionCardProps) {
  if (as === "div") {
    const divProps = props as ComponentPropsWithoutRef<"div">;

    return (
      <div className={cardClasses(selected, className)} {...divProps}>
        {children}
      </div>
    );
  }

  const buttonProps = props as ButtonHTMLAttributes<HTMLButtonElement>;

  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cardClasses(selected, className)}
      {...buttonProps}
    >
      {children}
    </button>
  );
}
