import config from "@config/cutscenes/vesnice-start.json";
import { shade } from "../../engine/rig/draw";
import type { Pt } from "../../engine/rig/tree";
import { ROBOT } from "../robot/xbot";
import type { Cutscene } from "./index";
import { bank, feet, fitStage, oval, poly, stillLayer, stroke, tracks } from "./kit";
import { arms, lineFor, robots, sky, type Sky, walker, walkPose } from "./repairCrane";

const ST = config.stage;
const { width: W, height: H } = ST;
const WALK = config.walk;
const DUSK = { brightness: 0.85, saturate: 0.95 };
const palette = { ...config.palette };
const SKY: Sky = { palette, sun: ST.sun };

const { num } = tracks(config.tracks);

const CLOUDS = bank(17, 24, -150, 1900, -40, ST.horizon - 80, 180, 360, 16, 30);
const HILL: Pt[] = [[-100, 900], [-100, 640], [300, 560], [650, 522], [900, 516], [1200, 546], [1700, 620], [1700, 900]];
const RIDGE: Pt[] = [[-100, 600], [400, 540], [800, 560], [1200, 498], [1700, 560], [1700, 700], [-100, 700]];
const FACETS: Pt[][] = [[[300, 560], [650, 522], [560, 600], [260, 640]], [[650, 522], [900, 516], [820, 570]], [[-100, 680], [260, 640], [180, 760], [-100, 800]]];
const CRACKS: Pt[][] = [[[560, 600], [600, 700], [560, 820]], [[820, 570], [900, 660]], [[1200, 546], [1150, 640], [1260, 760]]];
const FRONDS: [number, number, number, number, number, number][] = [[-40, 960, 520, 520, 18, 1], [180, 960, 300, 700, 12, 0.7]];

const backdrop = stillLayer();

function frond(ctx: CanvasRenderingContext2D, x: number, y: number, len: number, rise: number, leaves: number, k: number): void {
  const tipX = x + len, tipY = y - rise;
  const cx = x + len * 0.2, cy = y - rise * 1.1;
  ctx.strokeStyle = palette.leaf;
  ctx.lineWidth = 8 * k;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(cx, cy, tipX, tipY);
  ctx.stroke();
  for (let i = 1; i <= leaves; i++) {
    const u = i / (leaves + 1), v = 1 - u;
    const px = v * v * x + 2 * u * v * cx + u * u * tipX;
    const py = v * v * y + 2 * u * v * cy + u * u * tipY;
    const dir = Math.atan2(2 * v * (cy - y) + 2 * u * (tipY - cy), 2 * v * (cx - x) + 2 * u * (tipX - cx));
    const side = i % 2 ? 1 : -1;
    const size = (1 - u * 0.6) * 46 * k;
    const a = dir + side * 0.9;
    oval(ctx, px + Math.cos(a) * size, py + Math.sin(a) * size, size, size * 0.32, i % 3 ? palette.leaf : palette.leafLit, a);
  }
}

function render(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void {
  ctx.save();
  fitStage(ctx, w, h, W, H);
  backdrop(ctx, ["hill"], (c) => {
    sky(c, SKY, ST.horizon, CLOUDS);
    poly(c, RIDGE, palette.ridge);
    poly(c, HILL, palette.rock);
    for (const f of FACETS) poly(c, f, palette.rockLit);
    for (const k of CRACKS) stroke(c, k, palette.rockDark, 6);
  });
  ctx.save();
  feet(ctx, num("walkerX", t), num("walkerY", t), num("walkerK", t), num("walkerK", t), ROBOT.AX);
  const { lift, pose } = walkPose(WALK, arms(num, t), t, num("stride", t));
  walker(ctx, WALK, robots().front, pose, shade(ROBOT.palette, DUSK), lineFor(ctx), lift);
  ctx.restore();
  ctx.save();
  ctx.translate(num("plantShift", t), -num("plantShift", t) * 0.4);
  for (const [x, y, len, rise, leaves, k] of FRONDS) frond(ctx, x, y, len, rise, leaves, k);
  ctx.restore();
  ctx.restore();
}

export const vesniceStart: Cutscene = {
  id: "vesniceStart",
  duration: config.duration,
  camera: config.camera,
  render,
};
