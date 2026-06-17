import { cn, Text } from "@my-ai-orchestrator/ui";
import type { ReactNode, TextareaHTMLAttributes, InputHTMLAttributes } from "react";
import { lenisScrollRegionProps } from "./lenis-scroll-region";

type BaseFieldProps = {
  readonly label: string;
  readonly hint?: string;
  readonly error?: string;
  readonly className?: string;
};

export type AppFieldInputProps = BaseFieldProps &
  InputHTMLAttributes<HTMLInputElement> & {
    readonly multiline?: false;
  };

export type AppFieldTextareaProps = BaseFieldProps &
  TextareaHTMLAttributes<HTMLTextAreaElement> & {
    readonly multiline: true;
  };

export type AppFieldProps = AppFieldInputProps | AppFieldTextareaProps;

const controlClassName =
  "workspace-field-control w-full px-4 py-3 font-body text-base text-foreground placeholder:text-muted";

export function AppField(props: AppFieldProps) {
  const { label, hint, error, className, id, multiline, ...rest } = props;
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className={cn("space-y-2", className)}>
      <label htmlFor={fieldId} className="block font-body text-[0.6875rem] font-semibold uppercase tracking-editorial-wide text-foreground/80">
        {label}
      </label>
      {multiline ? (
        <textarea
          id={fieldId}
          className={cn(controlClassName, "min-h-32 resize-y")}
          {...lenisScrollRegionProps}
          {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : (
        <input id={fieldId} className={controlClassName} {...(rest as InputHTMLAttributes<HTMLInputElement>)} />
      )}
      {error ? (
        <Text variant="meta" className="text-red-700">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="meta" className="text-muted-foreground">
          {hint}
        </Text>
      ) : null}
    </div>
  );
}

export function AppFieldSlot({
  label,
  labelAccessory,
  hint,
  error,
  className,
  children
}: BaseFieldProps & { readonly children: ReactNode; readonly labelAccessory?: ReactNode }) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <Text variant="label" className="text-foreground/80">
          {label}
        </Text>
        {labelAccessory}
      </div>
      {children}
      {error ? (
        <Text variant="meta" className="text-red-700">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="meta" className="text-muted-foreground">
          {hint}
        </Text>
      ) : null}
    </div>
  );
}
