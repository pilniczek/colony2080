import config from "@config/cutscenes/hull-cover-punch.json";
import { drawRig } from "../../engine/rig/draw";
import type { Pose } from "../../engine/rig/pose";
import type { GroupNode } from "../../engine/rig/tree";
import { buildSide, ROBOT } from "../robot/xbot";
import { hullCoverScene, type Strike } from "./hullCover";
import type { Cutscene } from "./index";
import { lineFor, shadow, STAND } from "./kit";

const S = config.stage;
const STANCE: Record<string, number> = { hipNear: -16, kneeNear: 10, ankleNear: 2.8, hipFar: 14, kneeFar: 6, ankleFar: -15.4 };
const GUARD = { arm: -38, fore: -92, armFar: -30, foreFar: -96 };
const JAB = { arm: -88, fore: 12 };
const JAB_FAR = { armFar: -84, foreFar: 6 };

let sideRig: GroupNode | null = null;
const side = (): GroupNode => (sideRig ??= buildSide({ farLimbs: true }));

const mix = (a: number, b: number, k: number): number => a + (b - a) * k;

function punchPose(raise: number, jab: number, jabFar: number, lunge: number): Pose {
  const pose: Pose = { body: { rot: 2 * raise, dx: lunge } };
  for (const key in STANCE) pose[key] = mix(STAND[key]!, STANCE[key]!, raise);
  pose.arm = mix(GUARD.arm * raise, JAB.arm, jab);
  pose.fore = mix(GUARD.fore * raise, JAB.fore, jab);
  pose.armFar = mix(GUARD.armFar * raise, JAB_FAR.armFar, jabFar);
  pose.foreFar = mix(GUARD.foreFar * raise, JAB_FAR.foreFar, jabFar);
  return pose;
}

const punch: Strike = (ctx, t, { view: V, at, palette, hits }) => {
  const jab = at("jab", t);
  const jabFar = at("jabFar", t);
  const pose = punchPose(at("raise", t), jab, jabFar, S.lunge * Math.max(jab, jabFar));
  const m = new DOMMatrix().translate(V.x, V.floorY).scale(V.scale).translate(-ROBOT.SIDE_AX, -ROBOT.FOOT_Y);
  shadow(ctx, V.x, V.floorY, 200 * V.scale, 22 * V.scale, 0.4, palette.shadow!);
  ctx.save();
  ctx.transform(m.a, m.b, m.c, m.d, m.e, m.f);
  drawRig(ctx, side(), { palette: ROBOT.palette, pose, lineW: lineFor(ctx, V.scale) });
  ctx.restore();
  if (at("hits", t) >= 0.5) hits(Math.floor(t / S.sparkSeconds));
};

export const hullCoverPunch: Cutscene = { id: "hullCoverPunch", duration: config.duration, camera: config.camera, render: hullCoverScene(config, punch) };
