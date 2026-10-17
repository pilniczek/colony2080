import { chromium } from 'playwright-core';
import fs from 'fs';
const exe = process.env.HOME + '/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell';
const [url, out, mode, modelPath, grid] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: exe });
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
await page.goto(url);
await page.waitForFunction(() => window.trace && window.trace.ready);
if (modelPath && modelPath !== '-') {
  const m = JSON.parse(fs.readFileSync(modelPath, 'utf8'));
  await page.evaluate(m => window.trace.setModel(m), m);
}
if (process.env.SAMPLE) await page.evaluate(() => window.trace.sample());
if (process.env.NOOUT) await page.uncheck('#outlines');
await page.selectOption('#mode', mode || 'overlay');
if (grid === '1') await page.check('#grid');
await page.waitForTimeout(300);
const score = await page.evaluate(() => window.trace.score());
await page.locator('#c').screenshot({ path: out });
console.log(JSON.stringify({ score, errors }));
await browser.close();
