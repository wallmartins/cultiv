import "@my-ai-orchestrator/ui/styles.css";
import "@my-ai-orchestrator/ui/type.css";
import "@my-ai-orchestrator/ui/primitives.css";
import "@my-ai-orchestrator/ui/workspace.css";
import "@my-ai-orchestrator/ui/shell.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Auth0Provider } from "@auth0/auth0-react";
import { App } from "./app.js";
import { captureReturnTo } from "./router.js";

createRoot(document.getElementById("app")!).render(
  <StrictMode>
    <Auth0Provider
      domain={import.meta.env.VITE_AUTH0_DOMAIN}
      clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: `${window.location.origin}/app/callback`,
        audience: import.meta.env.VITE_AUTH0_AUDIENCE
      }}
      cacheLocation="localstorage"
      useRefreshTokens
      onRedirectCallback={(appState) => captureReturnTo(appState?.returnTo)}
    >
      <App />
    </Auth0Provider>
  </StrictMode>
);
