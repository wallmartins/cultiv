import { useAuth0 } from "@auth0/auth0-react";
import { useRouterState } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { useAppLocale } from "~/i18n/app/use-app-locale";
import { AuthLoading } from "./AuthLoading";

export interface RequireAuthProps {
  readonly children: ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0();
  const { messages } = useAppLocale();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  useEffect(() => {
    if (isLoading || isAuthenticated) {
      return;
    }

    void loginWithRedirect({
      appState: {
        returnTo: pathname
      }
    });
  }, [isAuthenticated, isLoading, loginWithRedirect, pathname]);

  if (isLoading) {
    return <AuthLoading />;
  }

  if (!isAuthenticated) {
    return <AuthLoading message={messages.auth.redirectingToLogin} />;
  }

  return children;
}
