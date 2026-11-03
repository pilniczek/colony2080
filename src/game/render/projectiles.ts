import { BLAST, drawBlast, inBlastUnits } from "../env/blast";
import type { Missile } from "../level/missiles";
import type { Projectile } from "../level/projectile";
import type { Rocket } from "../level/rockets";

const BODY = { length: 0.4, radius: 0.035, nose: 0.1, fin: 0.07 };
const COLORS = { body: "#52683e", line: "#1c2614", nose: "#c4301c", fin: "#33452a", flame: "#ffd060", glow: "rgba(255,150,40,0.45)" };
const PUFF = { start: 0.04, grow: 0.22, rise: 0.15, alpha: 0.5, shade: [176, 170, 160] as const };
const BOOM_SCALE = 0.45;

function smoke(ctx: CanvasRenderingContext2D, r: Projectile, cell: number): void {
  const [red, green, blue] = PUFF.shade;
  for (const [x, y, born] of r.trail) {
    const k = (r.age - born) / r.trailLife;
    if (k >= 1) continue;
    const radius = (PUFF.start + PUFF.grow * k) * cell;
    const cx = x * cell;
    const cy = (y - PUFF.rise * k) * cell;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    g.addColorStop(0, `rgba(${red},${green},${blue},${PUFF.alpha * (1 - k)})`);
    g.addColorStop(1, `rgba(${red},${green},${blue},0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function fins(ctx: CanvasRenderingContext2D): void {
  const { length, radius, fin } = BODY;
  ctx.fillStyle = COLORS.fin;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(-length + fin, s * radius);
    ctx.lineTo(-length - fin * 0.4, s * (radius + fin));
    ctx.lineTo(-length, s * radius);
    ctx.fill();
    ctx.stroke();
  }
}

function body(ctx: CanvasRenderingContext2D, r: Rocket | Missile, cell: number): void {
  const { length, radius, nose } = BODY;
  ctx.save();
  ctx.translate(r.x * cell, r.y * cell);
  ctx.rotate(r.heading);
  ctx.scale(cell, cell);
  ctx.lineWidth = 0.015;
  ctx.strokeStyle = COLORS.line;
  ctx.fillStyle = COLORS.glow;
  ctx.beginPath();
  ctx.arc(-length, 0, radius * 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.flame;
  ctx.beginPath();
  ctx.moveTo(-length, -radius * 0.7);
  ctx.lineTo(-length - radius * (4 + Math.sin(r.age * 60)), 0);
  ctx.lineTo(-length, radius * 0.7);
  ctx.fill();
  if (r.kind === "missile") fins(ctx);
  ctx.fillStyle = COLORS.body;
  ctx.fillRect(-length, -radius, length - nose, radius * 2);
  ctx.strokeRect(-length, -radius, length - nose, radius * 2);
  ctx.fillStyle = COLORS.nose;
  ctx.beginPath();
  ctx.moveTo(-nose, -radius);
  ctx.lineTo(0, 0);
  ctx.lineTo(-nose, radius);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

export function drawProjectiles(ctx: CanvasRenderingContext2D, projectiles: (Rocket | Missile)[], cell: number, unit: number): void {
  for (const r of projectiles) {
    smoke(ctx, r, cell);
    if (r.ended === null) body(ctx, r, cell);
    else if (r.burst && r.ended < BLAST.fade[1]) {
      const age = r.ended;
      inBlastUnits(ctx, r.x * cell, r.y * cell - BLAST.center * unit * BOOM_SCALE, unit * BOOM_SCALE, () => drawBlast(ctx, age, 1));
    }
  }
}
