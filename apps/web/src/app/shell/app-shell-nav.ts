import type { AppMessages } from "~/i18n/app/types";

export type AppShellNavKey = "generate" | "history" | "voice" | "plans";

export type AppShellNavItem = {
  readonly key: AppShellNavKey;
  readonly to: "/app/generate" | "/app/history" | "/app/voice" | "/app/plans";
  readonly label: string;
};

export function getAppShellNavItems(messages: AppMessages): readonly AppShellNavItem[] {
  return [
    { key: "generate", to: "/app/generate", label: messages.shell.nav.generate },
    { key: "history", to: "/app/history", label: messages.shell.nav.history },
    { key: "voice", to: "/app/voice", label: messages.shell.nav.voice },
    { key: "plans", to: "/app/plans", label: messages.shell.nav.plans }
  ];
}

export function isAppShellNavActive(pathname: string, item: AppShellNavItem): boolean {
  if (item.to === "/app/generate") {
    return pathname === "/app/generate";
  }

  if (item.to === "/app/plans") {
    return pathname === "/app/plans" || pathname === "/app/billing";
  }

  return pathname === item.to || pathname.startsWith(`${item.to}/`);
}
