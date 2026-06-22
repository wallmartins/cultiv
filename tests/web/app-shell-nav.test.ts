import { describe, expect, it } from "vitest";
import { getAppShellNavItems, isAppShellNavActive } from "../../apps/web/src/app/shell/app-shell-nav.js";
import { appMessagesPt } from "../../apps/web/src/i18n/app/messages/pt";
import { resolveAppLocale, resolveAppLocaleFromBrowser } from "../../apps/web/src/i18n/app/resolve-app-locale";

describe("app shell nav", () => {
  const items = getAppShellNavItems(appMessagesPt);

  it("marks generate as active only on the exact route", () => {
    expect(isAppShellNavActive("/app/generate", items[0]!)).toBe(true);
    expect(isAppShellNavActive("/app/history", items[0]!)).toBe(false);
  });

  it("marks history as active for nested routes", () => {
    const history = items[1]!;
    expect(isAppShellNavActive("/app/history", history)).toBe(true);
    expect(isAppShellNavActive("/app/history/job-1", history)).toBe(true);
  });
});

describe("resolveAppLocale", () => {
  it("defaults to pt without browser or storage", () => {
    expect(resolveAppLocaleFromBrowser()).toBe("pt");
    expect(resolveAppLocale()).toBe("pt");
  });
});
