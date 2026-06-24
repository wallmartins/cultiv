/**
 * @vitest-environment jsdom
 */
import React from "react";
import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RequireAuth } from "../../apps/web/src/app/auth/components/RequireAuth";
import { appMessagesEn } from "../../apps/web/src/i18n/app/messages/en";
import { renderWithRouter } from "./render-with-router";

const loginWithRedirect = vi.fn();
const useAuth0Mock = vi.fn();

vi.mock("@auth0/auth0-react", () => ({
  useAuth0: () => useAuth0Mock()
}));

vi.mock("../../apps/web/src/i18n/app/use-app-locale", () => ({
  useAppLocale: () => ({
    locale: "en" as const,
    messages: appMessagesEn,
    setLocale: vi.fn()
  })
}));

describe("RequireAuth", () => {
  beforeEach(() => {
    loginWithRedirect.mockReset();
  });

  it("renders signing-in message while auth is loading", async () => {
    useAuth0Mock.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      loginWithRedirect
    });

    await renderWithRouter(
      <RequireAuth>
        <p>Protected content</p>
      </RequireAuth>
    );

    await waitFor(() =>
      expect(screen.getByText(appMessagesEn.auth.signingIn)).toBeInTheDocument()
    );
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  });

  it("renders redirecting message when unauthenticated", async () => {
    useAuth0Mock.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      loginWithRedirect
    });

    await renderWithRouter(
      <RequireAuth>
        <p>Protected content</p>
      </RequireAuth>
    );

    await waitFor(() =>
      expect(screen.getByText(appMessagesEn.auth.redirectingToLogin)).toBeInTheDocument()
    );
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  });

  it("redirects unauthenticated users to login with the current pathname", async () => {
    useAuth0Mock.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      loginWithRedirect
    });

    await renderWithRouter(
      <RequireAuth>
        <p>Protected content</p>
      </RequireAuth>,
      "/history"
    );

    await waitFor(() =>
      expect(loginWithRedirect).toHaveBeenCalledWith({
        appState: { returnTo: "/history" }
      })
    );
  });

  it("renders children when authenticated", async () => {
    useAuth0Mock.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      loginWithRedirect
    });

    await renderWithRouter(
      <RequireAuth>
        <p>Protected content</p>
      </RequireAuth>
    );

    await waitFor(() => expect(screen.getByText("Protected content")).toBeInTheDocument());
    expect(loginWithRedirect).not.toHaveBeenCalled();
  });
});
