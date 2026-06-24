/**
 * @vitest-environment jsdom
 */
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppSdkGate } from "../../apps/web/src/app/auth/components/AppSdkGate";
import { appMessagesEn } from "../../apps/web/src/i18n/app/messages/en";

const relogin = vi.fn();
const retrySession = vi.fn();
const useSdkSessionStatusMock = vi.fn();

vi.mock("../../apps/web/src/app/auth/lib/use-relogin", () => ({
  useRelogin: () => relogin
}));

vi.mock("../../apps/web/src/platform/runtime/client-sdk-context", () => ({
  useSdkSessionStatus: () => useSdkSessionStatusMock(),
  useRetrySdkSession: () => retrySession
}));

vi.mock("../../apps/web/src/i18n/app/use-app-locale", () => ({
  useAppLocale: () => ({
    locale: "en" as const,
    messages: appMessagesEn,
    setLocale: vi.fn()
  })
}));

describe("AppSdkGate", () => {
  beforeEach(() => {
    relogin.mockReset();
    retrySession.mockReset();
  });

  it("renders preparing session message while status is preparing", () => {
    useSdkSessionStatusMock.mockReturnValue("preparing");

    render(
      <AppSdkGate>
        <p>App content</p>
      </AppSdkGate>
    );

    expect(screen.getByText(appMessagesEn.auth.preparingSession)).toBeInTheDocument();
    expect(screen.queryByText("App content")).not.toBeInTheDocument();
  });

  it("renders preparing session message while status is idle", () => {
    useSdkSessionStatusMock.mockReturnValue("idle");

    render(
      <AppSdkGate>
        <p>App content</p>
      </AppSdkGate>
    );

    expect(screen.getByText(appMessagesEn.auth.preparingSession)).toBeInTheDocument();
    expect(screen.queryByText("App content")).not.toBeInTheDocument();
  });

  it("redirects to login when the auth session is expired", () => {
    useSdkSessionStatusMock.mockReturnValue("auth_expired");

    render(
      <AppSdkGate>
        <p>App content</p>
      </AppSdkGate>
    );

    expect(relogin).toHaveBeenCalledTimes(1);
    expect(screen.getByText(appMessagesEn.auth.redirectingToLogin)).toBeInTheDocument();
    expect(screen.queryByText("App content")).not.toBeInTheDocument();
  });

  it("renders failed session i18n message and recovery actions", () => {
    useSdkSessionStatusMock.mockReturnValue("failed");

    render(
      <AppSdkGate>
        <p>App content</p>
      </AppSdkGate>
    );

    expect(screen.getByText(appMessagesEn.auth.sessionPrepareFailed)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: appMessagesEn.shell.sdk.retry })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: appMessagesEn.errors.authenticationExpired.action })
    ).toBeInTheDocument();
    expect(screen.queryByText("App content")).not.toBeInTheDocument();
  });

  it("calls relogin when sign-in is clicked after a non-auth failure", () => {
    useSdkSessionStatusMock.mockReturnValue("failed");

    render(
      <AppSdkGate>
        <p>App content</p>
      </AppSdkGate>
    );

    fireEvent.click(
      screen.getByRole("button", { name: appMessagesEn.errors.authenticationExpired.action })
    );

    expect(relogin).toHaveBeenCalledTimes(1);
  });

  it("calls retrySession when retry is clicked", () => {
    useSdkSessionStatusMock.mockReturnValue("failed");

    render(
      <AppSdkGate>
        <p>App content</p>
      </AppSdkGate>
    );

    fireEvent.click(screen.getByRole("button", { name: appMessagesEn.shell.sdk.retry }));

    expect(retrySession).toHaveBeenCalledTimes(1);
  });

  it("renders children when the SDK session is ready", () => {
    useSdkSessionStatusMock.mockReturnValue("ready");

    render(
      <AppSdkGate>
        <p>App content</p>
      </AppSdkGate>
    );

    expect(screen.getByText("App content")).toBeInTheDocument();
  });
});
