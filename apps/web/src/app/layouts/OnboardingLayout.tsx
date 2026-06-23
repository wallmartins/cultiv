import type { ReactNode } from "react";
import { AppLocaleProvider } from "~/i18n/app/use-app-locale";

export interface OnboardingLayoutProps {
  readonly children: ReactNode;
}

export function OnboardingLayout({ children }: OnboardingLayoutProps) {
  return (
    <AppLocaleProvider>
      <div
        className="cartography-grain cartography-grain-quiet relative min-h-screen bg-paper text-ink"
        data-surface="workspace"
      >
        <main>{children}</main>
      </div>
    </AppLocaleProvider>
  );
}
