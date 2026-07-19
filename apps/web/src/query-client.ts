import { QueryClient } from "@tanstack/react-query";

// The client-sdk transport already retries GET requests internally (DEFAULT_RETRY_POLICY,
// exponential backoff) before an Effect ever fails — retry:false here avoids doubling that.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: 30_000
    }
  }
});
