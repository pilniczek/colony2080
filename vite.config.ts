import { cpSync } from "node:fs";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

const root = (path: string): string => fileURLToPath(new URL(path, import.meta.url));

const copySpikes = (): Plugin => ({
  name: "copy-spikes",
  apply: "build",
  closeBundle: () => cpSync(root("./spikes"), root("./dist/spikes"), { recursive: true }),
});

export default defineConfig({
  plugins: [react(), copySpikes()],
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
