import { createFileRoute } from "@tanstack/react-router";
import { buildLlmsTxt } from "~/utils/geo/llms";

export const Route = createFileRoute("/llms.txt")({
  server: {
    handlers: {
      GET: () =>
        new Response(buildLlmsTxt("pt"), {
          headers: { "Content-Type": "text/plain; charset=utf-8" }
        })
    }
  }
});
