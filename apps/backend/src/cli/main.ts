import { Effect } from "effect";
import { startBackendServer } from "../app/bootstrap.js";
import { toErrorMessage } from "../http/http.js";

async function main() {
  const bundle = await Effect.runPromise(startBackendServer());

  const gracefulShutdown = async (signal: string) => {
    console.info(`${signal} received, shutting down gracefully...`);
    const forceExit = setTimeout(() => {
      console.warn("Graceful shutdown timed out, forcing exit");
      process.exit(1);
    }, 10000);

    try {
      await bundle.cleanup();
      clearTimeout(forceExit);
      console.info("Graceful shutdown complete");
      process.exit(0);
    } catch (error) {
      console.error("Graceful shutdown failed:", error);
      process.exit(1);
    }
  };

  process.on("SIGTERM", () => void gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => void gracefulShutdown("SIGINT"));

  console.info("Backend server running. Press Ctrl+C to stop.");
}

main().catch((error) => {
  console.error(toErrorMessage(error));
  process.exit(1);
});
