import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { buildProductionSpikes } from "./scripts/spikes-prod";

const root = (path: string): string => fileURLToPath(new URL(path, import.meta.url));

const productionSpikes = (): Plugin => ({
  name: "production-spikes",
  apply: "build",
  closeBundle: () => buildProductionSpikes(root("./spikes"), root("./dist/spikes")),
});

export default defineConfig({
  plugins: [react(), productionSpikes()],
  resolve: {
    alias: { "@config": root("./config") },
  },
  optimizeDeps: { entries: ["index.html", "sandbox.html"] },
  build: {
    rollupOptions: {
      input: { index: root("./index.html"), sandbox: root("./sandbox.html") },
    },
  },
});
