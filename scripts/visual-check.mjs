import { createServer as netServer } from "node:net";
import { chromium } from "playwright";
import { createServer } from "vite";

const freePort = () =>
  new Promise((resolve, reject) => {
    const s = netServer();
    s.once("error", reject);
    s.listen(0, "127.0.0.1", () => {
      const { port } = s.address();
      s.close(() => resolve(port));
    });
  });

const port = await freePort();
const server = await createServer({ server: { port, strictPort: true, host: "127.0.0.1", open: false }, logLevel: "warn" });
await server.listen();
const browser = await chromium.launch();
let failed = false;
try {
  const page = await browser.newPage();
  page.on("pageerror", (e) => console.error("page error:", e.message));
  await page.goto(`http://127.0.0.1:${port}/tools/visual/compare.html`);
  const results = await page.waitForFunction(() => window.__visual, null, { timeout: 60000 }).then((h) => h.jsonValue());
  for (const { name, mismatches, copiedDiff, diff, matrixDelta, pass } of results) {
    if (!pass) failed = true;
    console.log(`${pass ? "ok  " : "FAIL"} ${name}: mismatches ${mismatches} copiedDiff ${copiedDiff} diff ${diff} matrixDelta ${matrixDelta}`);
  }
} finally {
  await browser.close();
  await server.close();
}
process.exit(failed ? 1 : 0);
