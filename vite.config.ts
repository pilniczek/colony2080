import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@config": fileURLToPath(new URL("./config", import.meta.url)) },
  },
  optimizeDeps: { entries: ["sandbox.html"] },
  build: {
    rollupOptions: {
      input: { sandbox: fileURLToPath(new URL("./sandbox.html", import.meta.url)) },
    },
  },
});
