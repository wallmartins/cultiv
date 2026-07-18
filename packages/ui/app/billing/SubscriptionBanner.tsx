import { Banner, Pill, StatusDot, type StatusDotTone } from "../primitives/index.js";

export type SubscriptionBannerTone = "accent" | "danger" | "neutral";

export interface SubscriptionBannerProps {
  readonly tone: SubscriptionBannerTone;
  readonly title: string;
  readonly message: string;
  readonly actionLabel: string;
  readonly onAction: () => void;
}

const DOT_TONE: Record<SubscriptionBannerTone, StatusDotTone> = {
  accent: "accent",
  danger: "danger",
  neutral: "neutral"
};

// Only rendered for trialing/past_due/canceled/lapsed — "active limpo" has no banner (container decides).
export function SubscriptionBanner({ tone, title, message, actionLabel, onAction }: SubscriptionBannerProps) {
  return (
    <Banner
      tone={tone === "neutral" ? undefined : tone}
      icon={<StatusDot tone={DOT_TONE[tone]} />}
      action={
        <Pill variant={tone === "danger" ? "danger" : "primary"} onClick={onAction}>
          {actionLabel}
        </Pill>
      }
    >
      {/* Explicit ink/muted overrides — Banner's own .is-danger/.is-accent CSS would otherwise tint
          this whole label with the tone color, but only the border/dot/pill carry tone here. */}
      <div style={{ fontWeight: 600, color: "var(--ink)" }}>{title}</div>
      <div style={{ color: "var(--muted)", marginTop: 2, fontSize: "0.88rem" }}>{message}</div>
    </Banner>
  );
}
