import { defineNitroConfig } from "nitro/config";

export default defineNitroConfig({
  compatibilityDate: "2026-03-01",
  // Vercel sets VERCEL=1 during CI builds; Nitro auto-selects the `vercel` preset
  // and emits Build Output API artifacts to `.vercel/output`.
  preset: process.env.VERCEL ? "vercel" : "node-server"
});
