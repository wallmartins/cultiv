import path from "node:path";
import { fileURLToPath } from "node:url";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig, loadEnv } from "vite";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDir, "");

  return {
  server: {
    port: 3000
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/gsap")) {
            return "vendor-gsap";
          }

          if (id.includes("node_modules/lenis")) {
            return "vendor-lenis";
          }

          if (id.includes("node_modules/effect")) {
            return "vendor-effect";
          }
        }
      }
    }
  },
  resolve: {
    alias: {
      "~": path.resolve(rootDir, "src")
    }
  },
  plugins: [
    tailwindcss(),
    tanstackStart({
      srcDirectory: "src"
    }),
    viteReact(),
    nitro()
  ],
  define: {
    "import.meta.env.SITE_URL": JSON.stringify(env.SITE_URL ?? ""),
    "import.meta.env.VITE_API_BASE_URL": JSON.stringify(env.VITE_API_BASE_URL ?? "")
  }
  };
});
