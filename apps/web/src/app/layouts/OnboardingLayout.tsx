import type { ReactNode } from "react";

export interface OnboardingLayoutProps {
  readonly children: ReactNode;
}

export function OnboardingLayout({ children }: OnboardingLayoutProps) {
  return (
    <div
      className="cartography-grain cartography-grain-quiet relative min-h-screen bg-paper text-ink"
      data-surface="workspace"
    >
      <main>{children}</main>
    </div>
  );
}
