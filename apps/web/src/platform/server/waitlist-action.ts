import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { handleWaitlistRequest } from "./handle-waitlist-request";

export const submitWaitlistAction = createServerFn({ method: "POST" })
  .validator((payload: unknown) => payload)
  .handler(async ({ data }) => {
    const headers = getRequestHeaders();
    const ip = headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
    return handleWaitlistRequest(data, ip);
  });

export type { WaitlistErrorBody, WaitlistSuccess } from "~/platform/services/waitlist/types";
