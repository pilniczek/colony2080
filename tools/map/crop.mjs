import { chromium } from "playwright";
import { readFileSync } from "node:fs";
const [src, col, row, cols, rows, out, scale = "2"] = process.argv.slice(2);
const c = Number(col), r = Number(row), w = Number(cols), h = Number(rows), s = Number(scale);
const data = "data:image/png;base64," + readFileSync(src).toString("base64");
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: w * 24 * s, height: h * 24 * s } });
await page.setContent(`<body style="margin:0;background:#000"><canvas id=c width=${w * 24 * s} height=${h * 24 * s}></canvas></body>`);
await page.evaluate(async ([data, c, r, w, h, s]) => {
  const img = new Image();
  img.src = data;
  await img.decode();
  const ctx = document.getElementById("c").getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, c * 24, r * 24, w * 24, h * 24, 0, 0, w * 24 * s, h * 24 * s);
  ctx.strokeStyle = "rgba(255,255,0,0.5)";
  ctx.fillStyle = "#ff0";
  ctx.font = "12px monospace";
  for (let i = 0; i <= w; i += 5) { ctx.beginPath(); ctx.moveTo(i * 24 * s, 0); ctx.lineTo(i * 24 * s, h * 24 * s); ctx.stroke(); ctx.fillText(String(c + i), i * 24 * s + 2, 12); }
  for (let j = 0; j <= h; j += 5) { ctx.beginPath(); ctx.moveTo(0, j * 24 * s); ctx.lineTo(w * 24 * s, j * 24 * s); ctx.stroke(); ctx.fillText(String(r + j), 2, j * 24 * s + 24); }
}, [data, c, r, w, h, s]);
await page.screenshot({ path: out });
await browser.close();
