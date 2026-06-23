import type { ReactNode } from "react";
import { AppLocaleProvider } from "~/i18n/app/use-app-locale";

export interface OnboardingLayoutProps {
  readonly children: ReactNode;
}

export function OnboardingLayout({ children }: OnboardingLayoutProps) {
  return (
    <AppLocaleProvider>
      <div className="min-h-screen bg-paper text-ink" data-intensity="quiet">
        <main>{children}</main>
      </div>
    </AppLocaleProvider>
  );
}
