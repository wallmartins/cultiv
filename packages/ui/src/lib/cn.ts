import { twMerge } from "tailwind-merge";

export function cn(...inputs: ReadonlyArray<string | false | undefined>): string {
  return twMerge(inputs.filter(Boolean).join(" "));
}
