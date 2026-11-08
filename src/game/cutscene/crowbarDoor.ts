import config from "@config/cutscenes/crowbar-door.json";
import robotJson from "@config/robots/xbot.json";
import { apply, rotate, translate } from "../../engine/math/mat2d";
import type { HookDraw } from "../../engine/rig/draw";
import { solve } from "../../engine/rig/pose";
import type { GroupNode, Pt } from "../../engine/rig/tree";
import { ASSETS, type AssetId } from "../env/assets";
import { drawAsset, TILE } from "../env/paint";
import { buildBack, buildSide, ROBOT } from "../robot/xbot";
import type { Cutscene } from "./index";
import { camera, fitStage, fromDom, hookAt, LINE_W, lineFor, ORIGIN, placeRobot, rect, shadow, STAND, tracks, unitScale } from "./kit";

type Palette = typeof config.palette;
type Stage = { ctx: CanvasRenderingContext2D; t: number };

const { width: W, height: H, floorY: FLOOR, doorSeamX: SEAM } = config.stage;
const SCENE = config.stage.scene as [AssetId, number, number][];
const RB = config.robot;
const K = RB.scale;
const ENV_K = (K * (ROBOT.FOOT_Y - robotJson.levels.head)) / (1.9 * TILE);
const BAR = config.crowbar;
let lineW = LINE_W;

const FAR_RANGES: [[number, number], [number, number]] = [[-150, 90], [-140, 10]];
const DEG = 180 / Math.PI;
const palette: Palette = { ...config.palette };

const { num, text } = tracks(config.tracks);

const BACK = { leftArmBehind: true, rightForeBehind: true };

const rodIn = (root: GroupNode, hand: string): Pt => {
  const h = hookAt(root, hand, {});
  const r = hookAt(root, "rod", {});
  const x = r.e - h.e;
  const y = r.f - h.f;
  const k = h.a * h.d - h.b * h.c;
  return [(h.d * x - h.c * y) / k, (h.a * y - h.b * x) / k];
};

type Rigs = { side: GroupNode; back: GroupNode; rod: Pt; rodL: Pt; rodR: Pt };
let rigs: Rigs | null = null;
const robots = (): Rigs =>
  (rigs ??= {
    side: buildSide({ farLimbs: true, propBehindArm: true, hold: "grip", farHold: "grip" }),
    back: buildBack({ ...BACK, holdL: "grip", holdR: "grip" }),
    rod: rodIn(buildSide({ hold: "grip" }), "hand"),
    rodL: rodIn(buildBack({ ...BACK, holdL: "grip" }), "handL"),
    rodR: rodIn(buildBack({ ...BACK, holdR: "grip" }), "handR"),
  });
let farSeed: Record<string, number> | null = null;

function drawWorld({ ctx, t }: Stage): void {
  rect(ctx, -2000, -1000, 6000, 3000, palette.tunnel);
  const size = { gap: num("gap", t) / ENV_K, light: num("glow", t) };
  ctx.save();
  ctx.translate(SEAM - 24 * ENV_K, FLOOR);
  ctx.scale(ENV_K, ENV_K);
  for (const [id, x, state] of SCENE) {
    ctx.save();
    ctx.translate(x, 0);
    drawAsset(ctx, ASSETS[id], { state, t, lines: lineW, size: id === "trainDoor" ? size : undefined });
    ctx.restore();
  }
  ctx.restore();
}

function drawCrowbar(c: CanvasRenderingContext2D, reach: number, w: number, butt: number): void {
  const lw = lineW / unitScale(c);
  const len = reach + butt - w * 0.2;
  c.strokeStyle = ROBOT.palette.mLine!;
  c.lineWidth = lw;
  c.save();
  c.translate(reach - w * 0.2, 0);
  c.rotate(-0.9);
  c.fillStyle = palette.crowbarShade;
  c.fillRect(0, -w / 2, w * 2.4, w);
  c.strokeRect(0, -w / 2, w * 2.4, w);
  c.restore();
  c.fillStyle = palette.crowbarShade;
  c.fillRect(-butt, -w / 2, len, w);
  c.fillStyle = palette.crowbar;
  c.fillRect(-butt, -w / 2, len, w * 0.55);
  c.strokeRect(-butt, -w / 2, len, w);
}

const robotMatrix = (ax: number, lean = 0): DOMMatrix => new DOMMatrix().translate(RB.x, FLOOR).rotate(lean).scale(K).translate(-ax, -ROBOT.FOOT_Y);

function drawProfile({ ctx, t }: Stage): void {
  const { side, rod } = robots();
  const pose: Record<string, number> = { ...STAND, arm: num("armB", t), fore: num("foreB", t), armFar: 0, foreFar: 0 };
  const blend = num("farGrip", t);
  const turn = num("barTurnB", t);
  if (blend > 0) {
    const rest = apply(hookAt(side, "rodFar", pose), ORIGIN);
    const grip = apply(rotate(translate(hookAt(side, "hand", pose), rod[0], rod[1]), RB.barTilt * DEG + turn), [RB.farGripOffset, 0]);
    const target: Pt = [rest[0] + (grip[0] - rest[0]) * blend, rest[1] + (grip[1] - rest[1]) * blend];
    farSeed = solve(side, "rodFar", pose, ["armFar", "foreFar"], FAR_RANGES, target, farSeed);
    Object.assign(pose, farSeed);
  }
  const k = num("barLen", t);
  const hand: HookDraw | undefined =
    num("barShown", t) >= 0.5
      ? (c) => {
          c.save();
          c.translate(rod[0], rod[1]);
          c.rotate(RB.barTilt + (turn * Math.PI) / 180);
          c.translate(RB.farGripOffset * blend, 0);
          drawCrowbar(c, BAR.reach * k, BAR.width, BAR.butt * k);
          c.restore();
        }
      : undefined;
  shadow(ctx, RB.x, FLOOR + 4, 70, 12, 0.35, palette.shadow);
  placeRobot(ctx, side, robotMatrix(ROBOT.SIDE_AX), { pose, hooks: { hand }, lineW });
}

function drawBack({ ctx, t }: Stage): void {
  const { back, rodL, rodR } = robots();
  const pry = num("pry", t);
  const pull = { arm: RB.pullArmDeg * pry, fore: RB.pullForeDeg * pry };
  const pose = { armL: -12 + pull.arm, foreL: -70 + pull.fore, armR: -20 + pull.arm, foreR: -64 + pull.fore };
  const m = robotMatrix(ROBOT.AX, -2 * pry);
  const [ex, ey] = apply(hookAt(back, "handL", pose, fromDom(m)), rodL);
  const [fx, fy] = apply(hookAt(back, "handR", pose, fromDom(m)), rodR);
  ctx.save();
  ctx.translate(ex, ey);
  ctx.rotate(Math.atan2(fy - ey, fx - ex));
  ctx.scale(K, K);
  drawCrowbar(ctx, BAR.reach, BAR.width, BAR.butt);
  ctx.restore();
  shadow(ctx, RB.x, FLOOR + 4, 90, 12, 0.35, palette.shadow);
  placeRobot(ctx, back, m, { pose, hooks: {}, lineW });
}

function render(ctx: CanvasRenderingContext2D, w: number, h: number, clipT: number): void {
  const t = clipT + config.clip.start;
  ctx.save();
  fitStage(ctx, w, h, W, H);
  const z = num("camZ", t);
  const sh = num("shake", t);
  const cx = num("camX", t) + Math.sin(t * 90) * sh * 0.4;
  const cy = num("camY", t) + Math.cos(t * 77) * sh * 0.4;
  camera(ctx, W, H, cx, cy, z);
  lineW = lineFor(ctx, K);
  const stage = { ctx, t };
  drawWorld(stage);
  if (text("shot", t) === "C") drawBack(stage);
  else drawProfile(stage);
  ctx.restore();
}

export const crowbarDoor: Cutscene = {
  id: "crowbarDoor",
  duration: config.clip.end - config.clip.start,
  camera: "CAM 03 METRO",
  render,
};
