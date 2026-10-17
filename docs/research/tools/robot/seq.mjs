import { chromium } from 'playwright-core';
const exe = process.env.HOME + '/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell';
const browser = await chromium.launch({ executablePath: exe });
const page = await browser.newPage({ viewport: { width: 1280, height: 820 } });
await page.goto(process.argv[2]);
await page.waitForTimeout(500);
const out = [];
for (let t = 0; t <= 3.95; t += 0.1) {
  await page.evaluate(v => { const s = document.getElementById('scrub'); s.value = Math.round(v / 3.95 * 1000); s.dispatchEvent(new Event('input')); }, t);
  await page.waitForTimeout(60);
  await page.locator('#c').screenshot({ path: `seq_${t.toFixed(1)}.png` });
}
await browser.close();
