import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@config": fileURLToPath(new URL("./config", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "tools/**/*.test.ts"],
    exclude: ["node_modules/**", "spikes/**", "docs/**", ".claude/**", ".superpowers/**", "dist/**"],
  },
});
