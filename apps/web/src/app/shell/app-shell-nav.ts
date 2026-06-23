import type { AppMessages } from "~/i18n/app/types";

export type AppShellNavKey = "generate" | "history" | "voice";

export type AppShellBottomNavKey = AppShellNavKey | "account";

export type AppShellNavItem = {
  readonly key: AppShellNavKey;
  readonly to: "/app/generate" | "/app/history" | "/app/voice";
  readonly label: string;
};

export type AppShellBottomNavItem = {
  readonly key: AppShellBottomNavKey;
  readonly to: "/app/generate" | "/app/history" | "/app/voice" | "/app/settings";
  readonly label: string;
};

export type AppShellBreadcrumb = {
  readonly index: number;
  readonly label: string;
};

export function getAppShellNavItems(messages: AppMessages): readonly AppShellNavItem[] {
  return [
    { key: "generate", to: "/app/generate", label: messages.shell.nav.generate },
    { key: "history", to: "/app/history", label: messages.shell.nav.history },
    { key: "voice", to: "/app/voice", label: messages.shell.nav.voice }
  ];
}

export function getAppBottomNavItems(messages: AppMessages): readonly AppShellBottomNavItem[] {
  return [
    ...getAppShellNavItems(messages),
    { key: "account", to: "/app/settings", label: messages.shell.nav.settings }
  ];
}

export function getAppShellBreadcrumb(pathname: string, messages: AppMessages): AppShellBreadcrumb {
  if (pathname.startsWith("/app/generate")) {
    return { index: 1, label: messages.shell.nav.generate };
  }

  if (pathname.startsWith("/app/history")) {
    return { index: 2, label: messages.history.title };
  }

  if (pathname.startsWith("/app/voice")) {
    return { index: 3, label: messages.shell.nav.voice };
  }

  if (pathname.startsWith("/app/settings")) {
    return { index: 4, label: messages.settings.title };
  }

  if (pathname.startsWith("/app/plans")) {
    return { index: 5, label: messages.plans.title };
  }

  return { index: 0, label: messages.shell.notFound };
}

export function isAppShellNavActive(pathname: string, item: AppShellNavItem): boolean {
  if (item.to === "/app/generate") {
    return pathname === "/app/generate";
  }

  return pathname === item.to || pathname.startsWith(`${item.to}/`);
}

export function isAppBottomNavActive(pathname: string, item: AppShellBottomNavItem): boolean {
  switch (item.key) {
    case "account":
      return pathname === "/app/settings" || pathname.startsWith("/app/settings/");
    case "generate":
      return isAppShellNavActive(pathname, {
        key: "generate",
        to: "/app/generate",
        label: item.label
      });
    case "history":
      return isAppShellNavActive(pathname, {
        key: "history",
        to: "/app/history",
        label: item.label
      });
    case "voice":
      return isAppShellNavActive(pathname, {
        key: "voice",
        to: "/app/voice",
        label: item.label
      });
  }
}
