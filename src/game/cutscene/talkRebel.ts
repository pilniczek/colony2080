import config from "@config/cutscenes/talk-rebel.json";
import type { Pt } from "../../engine/rig/tree";
import type { Cutscene } from "./index";
import { camera, fitStage, poly, rect, scatter, tracks } from "./kit";
import { drawFace, rng } from "./rebelShot";

type Ctx = CanvasRenderingContext2D;

const { width: W, height: H } = config.stage;
const palette = config.palette;
const BLADES = scatter(rng(51), 900, -300, -300, 2200, 1500);
const POOL: Pt[] = [[880, 300], [1010, 250], [1180, 290], [1330, 380], [1420, 520], [1380, 700], [1460, 860], [1300, 1000], [1060, 980], [900, 860], [820, 640]];
const POOL_WET: Pt[] = [[960, 380], [1100, 340], [1260, 420], [1320, 560], [1240, 700], [1290, 840], [1120, 900], [980, 760], [930, 560]];

const { num } = tracks(config.tracks);

function grass(ctx: Ctx): void {
  rect(ctx, -400, -400, 2400, 1700, palette.grass);
  const tones = [palette.grassDark, palette.grassLight, palette.straw];
  for (let i = 0; i < tones.length; i++) {
    ctx.strokeStyle = tones[i]!;
    ctx.lineWidth = 4 + i;
    ctx.beginPath();
    for (let j = i; j < BLADES.length; j += tones.length) {
      const [x, y, a, b] = BLADES[j]!;
      const len = 30 + a * 50;
      ctx.moveTo(x, y);
      ctx.lineTo(x + len * (0.8 + b * 0.3), y - len * 0.55);
    }
    ctx.stroke();
  }
}

function pool(ctx: Ctx, spread: number): void {
  ctx.save();
  ctx.translate(1100, 680);
  ctx.scale(spread, spread);
  ctx.translate(-1100, -600);
  poly(ctx, POOL, palette.blood);
  poly(ctx, POOL_WET, palette.bloodWet);
  ctx.restore();
}

function render(ctx: Ctx, w: number, h: number, t: number): void {
  ctx.save();
  fitStage(ctx, w, h, W, H);
  const z = num("camZ", t);
  camera(ctx, W, H, num("camX", t), num("camY", t), z);
  grass(ctx);
  pool(ctx, num("spread", t));
  const cough = num("cough", t);
  const talk = num("talk", t) * (0.25 + 0.75 * Math.abs(Math.sin(t * 9) * Math.sin(t * 3.1 + 1)));
  const blink = Math.max(0, 1 - Math.abs(((t + 0.8) % 3.7) - 0.1) * 12);
  const lids = num("lids", t);
  drawFace(ctx, 720, 540 - cough * 18, 2.5, num("tilt", t) + cough * 5, {
    turn: 0.2,
    mouth: Math.min(1, talk * 0.55 + cough),
    lids: Math.min(1, lids + blink * (1 - lids)),
    look: num("look", t),
    brow: 1 + cough,
    blood: 1,
  });
  ctx.restore();
}

export const talkRebel: Cutscene = {
  id: "talkRebel",
  duration: config.duration,
  camera: config.camera,
  render,
};
