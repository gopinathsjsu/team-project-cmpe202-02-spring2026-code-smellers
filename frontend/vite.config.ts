import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), tailwindcss()],
    /** Lets app code use `process.env.VITE_API_URL` so Jest (Node) and Vite both resolve the same symbol. */
    define: {
      "process.env.VITE_API_URL": JSON.stringify(env.VITE_API_URL ?? ""),
    },
    server: {
      proxy: {
        "/api": {
          target: "http://localhost:3000",
          changeOrigin: true,
        },
      },
    },
  };
});
