import { createFileRoute } from "@tanstack/react-router";
import { handleWaitlistRequest, isWaitlistSuccess } from "~/lib/server/handle-waitlist-request";

export const Route = createFileRoute("/api/waitlist")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const payload = await request.json();
        const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
        const result = await handleWaitlistRequest(payload, ip);
        const status = isWaitlistSuccess(result) ? 200 : result.code === "rate_limited" ? 429 : 400;

        return Response.json(result, { status });
      }
    }
  }
});
