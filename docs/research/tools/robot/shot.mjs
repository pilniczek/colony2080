import { chromium } from 'playwright-core';
const exe = process.env.HOME + '/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell';
const browser = await chromium.launch({ executablePath: exe });
const page = await browser.newPage({ viewport: { width: 1280, height: 820 } });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(process.argv[2]);
await page.waitForTimeout(600);
for (const t of process.argv.slice(3)) {
  await page.evaluate(v => { const s = document.getElementById('scrub'); s.value = Math.round(v / 5.8 * 1000); s.dispatchEvent(new Event('input')); }, parseFloat(t));
  await page.waitForTimeout(150);
  await page.locator('#c').screenshot({ path: `out_${t}.png` });
}
console.log('errors:', JSON.stringify(errors));
await browser.close();
