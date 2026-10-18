export interface ViewTransform {
  scale: number;
  offsetX: number;
  offsetY: number;
}

export function fitView(canvasW: number, canvasH: number, worldW: number, worldH: number): ViewTransform {
  const scale = Math.min(canvasW / worldW, canvasH / worldH);
  return { scale, offsetX: (canvasW - worldW * scale) / 2, offsetY: (canvasH - worldH * scale) / 2 };
}

export function resizeCanvas(canvas: HTMLCanvasElement, dpr: number): void {
  const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
  const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
}
