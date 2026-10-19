export function drawPlaceholder(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const r = Math.min(w, h) * 0.32;
  ctx.fillStyle = "#6a4206";
  ctx.strokeStyle = "#f0a818";
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.roundRect(w / 2 - r, h / 2 - r, 2 * r, 2 * r, 1);
  ctx.fill();
  ctx.stroke();
}
