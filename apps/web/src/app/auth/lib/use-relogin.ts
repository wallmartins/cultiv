import { useAuth0 } from "@auth0/auth0-react";
import { useRouterState } from "@tanstack/react-router";
import { useCallback } from "react";

const DEFAULT_RETURN_TO = "/app/generate";

function resolveReloginReturnTo(pathname: string, fallback = DEFAULT_RETURN_TO): string {
  if (pathname === "/login" || pathname === "/callback") {
    return fallback;
  }

  return pathname;
}

export function useRelogin(fallbackReturnTo = DEFAULT_RETURN_TO) {
  const { loginWithRedirect, logout } = useAuth0();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return useCallback(() => {
    const returnTo = resolveReloginReturnTo(pathname, fallbackReturnTo);

    void logout({ openUrl: false })
      .catch(() => undefined)
      .finally(() => {
        void loginWithRedirect({
          authorizationParams: {
            prompt: "login"
          },
          appState: {
            returnTo
          }
        });
      });
  }, [fallbackReturnTo, loginWithRedirect, logout, pathname]);
}
