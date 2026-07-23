import type { AppMessages } from "../types.js";

export const app: AppMessages["app"] = {
  loading: "Loading…",
  reload: "Reload",
  loadFailed: "Couldn't load the app",
  loadFailedBody: "This is usually a fresh update — a reload normally fixes it.",

  error: {
    offline: {
      title: "No connection",
      body: "The internet seems to have dropped. Check your connection and try again."
    },
    timeout: {
      title: "This is taking too long",
      body: "The response didn't arrive in time. Try again in a moment."
    },
    denied: {
      title: "Your session expired",
      body: "Sign in again to pick up where you left off."
    },
    notFound: {
      title: "We couldn't find that",
      body: "What you opened isn't here anymore."
    },
    rateLimited: {
      title: "Too many tries in a row",
      body: "Wait a few seconds and try again."
    },
    server: {
      title: "Something slipped",
      body: "This one's on us, not you. We're already on it — try again in a moment."
    },
    generic: {
      title: "That didn't go as planned",
      body: "Try again. If it keeps happening, we'll sort it out."
    }
  }
};
