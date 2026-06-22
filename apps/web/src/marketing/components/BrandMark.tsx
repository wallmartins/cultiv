import { cn, PressMark, Text } from "@my-ai-orchestrator/ui";

export type BrandMarkVariant = "wordmark" | "icon";

export interface BrandMarkProps {
  readonly className?: string;
  readonly variant?: BrandMarkVariant;
}

const pressMarkSize: Record<BrandMarkVariant, number> = {
  icon: 36,
  wordmark: 28
};

export function BrandMark({ className, variant = "wordmark" }: BrandMarkProps) {
  if (variant === "icon") {
    return (
      <PressMark
        size={pressMarkSize.icon}
        className={cn("block shrink-0", className)}
      />
    );
  }

  return (
    <span className={cn("inline-flex shrink-0 items-center gap-2", className)}>
      <PressMark size={pressMarkSize.wordmark} className="block shrink-0" />
      <Text as="span" variant="heading" className="font-semibold tracking-[-0.01em] text-ink">
        Cultiv
      </Text>
    </span>
  );
}
