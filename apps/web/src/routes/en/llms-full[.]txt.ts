import { createFileRoute } from "@tanstack/react-router";
import { buildLlmsFullTxt } from "~/utils/geo/llms";

export const Route = createFileRoute("/en/llms-full.txt")({
  server: {
    handlers: {
      GET: () =>
        new Response(buildLlmsFullTxt("en"), {
          headers: { "Content-Type": "text/plain; charset=utf-8" }
        })
    }
  }
});
