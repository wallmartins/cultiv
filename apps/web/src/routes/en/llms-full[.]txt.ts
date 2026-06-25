import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/en/llms-full.txt")({
  server: {
    handlers: {
      GET: async () => {
        const { buildLlmsFullTxt } = await import("~/marketing/seo/geo/llms-full.server");
        return new Response(buildLlmsFullTxt("en"), {
          headers: { "Content-Type": "text/plain; charset=utf-8" }
        });
      }
    }
  }
});
