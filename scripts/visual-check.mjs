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
let browser;
let failed = false;
try {
  browser = await chromium.launch();
  const page = await browser.newPage();
  page.on("pageerror", (e) => console.error("page error:", e.message));
  const only = process.env.VISUAL_ONLY ? `?only=${encodeURIComponent(process.env.VISUAL_ONLY)}` : "";
  await page.goto(`http://127.0.0.1:${port}/tools/visual/compare.html${only}`);
  const results = await page.waitForFunction(() => window.__visual, null, { timeout: 60000 }).then((h) => h.jsonValue());
  const expected = await page.evaluate(() => window.__visualCount);
  if (results.length !== expected) {
    failed = true;
    console.error(`FAIL expected ${expected} results, got ${results.length}`);
  }
  for (const { name, mismatches, copiedDiff, diff, matrixDelta, pass } of results) {
    if (!pass) failed = true;
    console.log(`${pass ? "ok  " : "FAIL"} ${name}: mismatches ${mismatches} copiedDiff ${copiedDiff} diff ${diff} matrixDelta ${matrixDelta}`);
  }
} finally {
  await browser?.close();
  await server.close();
}
process.exit(failed ? 1 : 0);
