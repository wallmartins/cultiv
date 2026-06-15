import { useAuth0 } from "@auth0/auth0-react";
import { useCallback } from "react";

export const API_ACCESS_SCOPES = "openid profile email offline_access";

export function useApiAccessToken(audience: string) {
  const { getAccessTokenSilently } = useAuth0();

  return useCallback(async () => {
    const token = await getAccessTokenSilently({
      authorizationParams: {
        audience,
        scope: API_ACCESS_SCOPES
      }
    });

    if (!token || token.trim().length === 0) {
      throw new Error("Missing access token for API audience");
    }

    return token;
  }, [audience, getAccessTokenSilently]);
}
