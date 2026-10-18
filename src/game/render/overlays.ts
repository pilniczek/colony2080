import { apply, identity, multiply, type Mat2D } from "../../engine/math/mat2d";
import type { ViewTransform } from "../../engine/render/view";
import type { Pose } from "../../engine/rig/pose";
import { jointMatrix } from "../../engine/rig/pose";
import type { Pt, RigNode } from "../../engine/rig/tree";
import { clipFor, type MovementConfig } from "../hero/config";
import { isDucked, type Hero } from "../hero/hero";
import { heroScale, type HeroLook, type Rigs } from "../hero/look";
import type { SandboxWorld } from "../level/sandboxLevel";
import { rigFor, toRigSpace } from "./scene";

export interface OverlayFlags {
  hitbox: boolean;
  tiles: boolean;
  joints: boolean;
  info: boolean;
}

const COLORS = {
  solid: "rgba(80,200,255,0.6)",
  ladder: "rgba(255,220,60,0.7)",
  lift: "rgba(255,140,40,0.8)",
  box: "#3cff6a",
  hidden: "#ff4fd8",
  joint: "#ff3030",
  text: "#e8f0f0",
  textBack: "rgba(0,0,0,0.6)",
};

const TEXT_PX = 12;
const LINE_PX = 15;
const PAD_PX = 6;
const JOINT_PX = 2.5;

function jointPivots(node: RigNode, pose: Pose, m: Mat2D = identity(), out: [string, Pt][] = []): [string, Pt][] {
  if (node.k !== "g") return out;
  let mm = node.m ? multiply(m, node.m) : m;
  const j = node.name != null ? jointMatrix(node, pose[node.name]) : null;
  if (j) mm = multiply(mm, j);
  if (node.name != null && node.pivot) out.push([node.name, apply(mm, node.pivot)]);
  for (const kid of node.kids) jointPivots(kid, pose, mm, out);
  return out;
}

function tiles(ctx: CanvasRenderingContext2D, world: SandboxWorld, cell: number, px: number): void {
  const { grid, lift } = world;
  ctx.lineWidth = px;
  for (let row = 0; row < grid.height; row++) {
    for (let col = 0; col < grid.width; col++) {
      const tile = grid.at(col, row);
      if (tile !== "#" && tile !== "H") continue;
      ctx.strokeStyle = tile === "#" ? COLORS.solid : COLORS.ladder;
      ctx.strokeRect(col * cell, row * cell, cell, cell);
    }
  }
  ctx.strokeStyle = COLORS.lift;
  ctx.lineWidth = 2 * px;
  ctx.beginPath();
  ctx.moveTo(lift.x * cell, lift.y * cell);
  ctx.lineTo((lift.x + lift.w) * cell, lift.y * cell);
  ctx.stroke();
}

function hitbox(ctx: CanvasRenderingContext2D, hero: Hero, cfg: MovementConfig, px: number): void {
  const cell = cfg.cellPx;
  const w = cfg.box.width * cell;
  const h = (isDucked(hero.state) ? cfg.box.duckHeight : cfg.box.height) * cell;
  ctx.strokeStyle = hero.hidden ? COLORS.hidden : COLORS.box;
  ctx.lineWidth = 1.5 * px;
  ctx.setLineDash(hero.hidden ? [4 * px, 3 * px] : []);
  ctx.strokeRect(hero.x * cell - w / 2, hero.y * cell - h, w, h);
  ctx.setLineDash([]);
}

function joints(ctx: CanvasRenderingContext2D, hero: Hero, look: HeroLook, rigs: Rigs, cfg: MovementConfig, px: number): void {
  const scale = heroScale(cfg);
  ctx.save();
  toRigSpace(ctx, hero, look, cfg.cellPx, scale);
  ctx.fillStyle = COLORS.joint;
  const r = (JOINT_PX * px) / scale;
  for (const [, [x, y]] of jointPivots(rigFor(look, rigs), look.pose)) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function info(ctx: CanvasRenderingContext2D, hero: Hero, look: HeroLook, dpr: number, [x, y]: Pt): void {
  const lines = [
    `state ${hero.state}  clip ${clipFor(hero.state, hero.weapon)}  t ${hero.time.toFixed(2)}`,
    `x ${hero.x.toFixed(2)}  y ${hero.y.toFixed(2)}  vx ${hero.vx.toFixed(2)}  vy ${hero.vy.toFixed(2)}`,
    `view ${look.view}  ground ${hero.onGround}  lift ${hero.onLift}  hidden ${hero.hidden}  energy ${hero.energy}  shields ${hero.shields}`,
  ];
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, x, y);
  ctx.font = `${TEXT_PX}px monospace`;
  const width = Math.max(...lines.map((l) => ctx.measureText(l).width));
  ctx.fillStyle = COLORS.textBack;
  ctx.fillRect(PAD_PX, PAD_PX, width + 2 * PAD_PX, lines.length * LINE_PX + PAD_PX);
  ctx.fillStyle = COLORS.text;
  ctx.textBaseline = "top";
  lines.forEach((l, i) => ctx.fillText(l, 2 * PAD_PX, 1.5 * PAD_PX + i * LINE_PX));
  ctx.restore();
}

export function drawOverlays(
  ctx: CanvasRenderingContext2D,
  world: SandboxWorld,
  hero: Hero,
  look: HeroLook,
  rigs: Rigs,
  cfg: MovementConfig,
  view: ViewTransform,
  flags: OverlayFlags,
  textAt: Pt = [0, 0],
): void {
  const dpr = ctx.canvas.clientWidth ? ctx.canvas.width / ctx.canvas.clientWidth : 1;
  const px = dpr / view.scale;
  ctx.save();
  ctx.setTransform(view.scale, 0, 0, view.scale, view.offsetX, view.offsetY);
  if (flags.tiles) tiles(ctx, world, cfg.cellPx, px);
  if (flags.hitbox) hitbox(ctx, hero, cfg, px);
  if (flags.joints) joints(ctx, hero, look, rigs, cfg, px);
  ctx.restore();
  if (flags.info) info(ctx, hero, look, dpr, textAt);
}
