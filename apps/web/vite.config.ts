import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  base: "/app/",
  // Route tree is code-based (src/router.tsx) so tsc --noEmit stays authoritative — no
  // routeTree.gen.ts to manage. @tanstack/router-plugin stays a devDep but unused here.
  plugins: [react()],
  resolve: { alias: { "~": resolve(__dirname, "src") } },
  build: {
    rolldownOptions: {
      output: {
        // Vendors em chunks próprios: eles mudam muito menos que o app, então um deploy de
        // produto não invalida o cache deles. `effect` sai separado por ser o maior item do
        // bundle (~53% do código-fonte), vindo de client-sdk/contracts.
        advancedChunks: {
          groups: [
            { name: "effect", test: /node_modules[\\/]\.pnpm[\\/]effect@/ },
            { name: "react", test: /node_modules[\\/]\.pnpm[\\/](react|react-dom|scheduler)@/ },
            { name: "auth0", test: /node_modules[\\/]\.pnpm[\\/]@auth0\+/ },
            { name: "tanstack", test: /node_modules[\\/]\.pnpm[\\/]@tanstack\+/ }
          ]
        }
      }
    }
  },
  server: { port: 3000 },
});
