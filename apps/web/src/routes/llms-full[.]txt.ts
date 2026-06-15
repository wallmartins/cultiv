import { createFileRoute } from "@tanstack/react-router";
import { buildLlmsFullTxt } from "~/marketing/seo/geo/llms";

export const Route = createFileRoute("/llms-full.txt")({
  server: {
    handlers: {
      GET: () =>
        new Response(buildLlmsFullTxt("pt"), {
          headers: { "Content-Type": "text/plain; charset=utf-8" }
        })
    }
  }
});
