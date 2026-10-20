import { createServer } from "vite";

const server = await createServer({ appType: "custom", server: { middlewareMode: true }, logLevel: "warn" });
try {
  await server.ssrLoadModule("/tools/sound/compare.ts");
} finally {
  await server.close();
}
