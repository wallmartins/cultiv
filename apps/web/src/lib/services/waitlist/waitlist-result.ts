import type { WaitlistErrorBody, WaitlistSuccess } from "./types.js";

export function isWaitlistSuccess(
  result: WaitlistSuccess | WaitlistErrorBody
): result is WaitlistSuccess {
  return "ok" in result && result.ok === true;
}
