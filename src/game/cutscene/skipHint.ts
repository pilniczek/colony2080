import { filmRect } from "./securityCam";

const FILM_H = 900;
const HINT = {
  size: 30,
  inset: 80,
  colour: "rgba(228, 238, 220, 0.75)",
  font: "Share Tech Mono, Oxanium, monospace",
};

export function drawSkipHint(ctx: CanvasRenderingContext2D, w: number, h: number, text: string): void {
  const r = filmRect(w, h);
  const u = r.h / FILM_H;
  ctx.save();
  ctx.font = `${HINT.size * u}px ${HINT.font}`;
  ctx.fillStyle = HINT.colour;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(text, r.x + HINT.inset * u, r.y + r.h - (HINT.inset / 2) * u);
  ctx.restore();
}
