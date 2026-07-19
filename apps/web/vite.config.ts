import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  base: "/app/",
  // Route tree is code-based (src/router.tsx) so tsc --noEmit stays authoritative — no
  // routeTree.gen.ts to manage. @tanstack/router-plugin stays a devDep but unused here.
  plugins: [react()],
  resolve: { alias: { "~": resolve(__dirname, "src") } },
  server: { port: 3000 },
});
