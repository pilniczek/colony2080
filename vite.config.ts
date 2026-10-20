import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { assertNoOriginalGame, buildProductionSpikes, scrubConfig, stripDevOnly } from "./scripts/production";

const root = (path: string): string => fileURLToPath(new URL(path, import.meta.url));

const production = (): Plugin => ({
  name: "production",
  apply: "build",
  enforce: "pre",
  transformIndexHtml: stripDevOnly,
  transform: (code, id) => (/\/config\/.+\.json$/.test(id) ? JSON.stringify(scrubConfig(JSON.parse(code))) : null),
  closeBundle: () => {
    buildProductionSpikes(root("./spikes"), root("./dist/spikes"));
    assertNoOriginalGame(root("./dist"));
  },
});

export default defineConfig({
  plugins: [react(), production()],
  resolve: {
    alias: { "@config": root("./config") },
  },
  optimizeDeps: { entries: ["index.html", "sandbox.html", "game.html", "cheats.html"] },
  build: {
    rollupOptions: {
      input: { index: root("./index.html"), sandbox: root("./sandbox.html"), game: root("./game.html") },
    },
  },
});
