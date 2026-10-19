export interface ViewTransform {
  scale: number;
  offsetX: number;
  offsetY: number;
}

export function fitView(canvasW: number, canvasH: number, worldW: number, worldH: number): ViewTransform {
  const scale = Math.min(canvasW / worldW, canvasH / worldH);
  return { scale, offsetX: (canvasW - worldW * scale) / 2, offsetY: (canvasH - worldH * scale) / 2 };
}

function followAxis(canvas: number, world: number, scale: number, focus: number): number {
  const size = world * scale;
  if (size <= canvas) return (canvas - size) / 2;
  return 0 - Math.min(Math.max(focus * scale - canvas / 2, 0), size - canvas);
}

export function followView(
  canvasW: number,
  canvasH: number,
  worldW: number,
  worldH: number,
  viewW: number,
  viewH: number,
  focusX: number,
  focusY: number,
): ViewTransform {
  const scale = Math.min(canvasW / Math.min(viewW, worldW), canvasH / Math.min(viewH, worldH));
  return { scale, offsetX: followAxis(canvasW, worldW, scale, focusX), offsetY: followAxis(canvasH, worldH, scale, focusY) };
}

export function resizeCanvas(canvas: HTMLCanvasElement, dpr: number): void {
  const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
  const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
}
