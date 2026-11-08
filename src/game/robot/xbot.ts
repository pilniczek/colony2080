import config from "@config/robots/xbot.json";
import type { Palette } from "../../engine/rig/draw";
import { createBuilder, mirrorPts, type Builder, type GroupNode, type PartSpec, type Pt } from "../../engine/rig/tree";

type Kit = Builder & { low: boolean; bare: boolean; long: boolean; suffix: string };
type Mirror = (pts: Pt[]) => Pt[];

const AX = config.frame.axis;
const SIDE_AX = config.frame.sideAxis;
const FOOT_Y = config.frame.footY;
const FINGER_LW = 0.4;

export const ROBOT: { AX: number; SIDE_AX: number; FOOT_Y: number; gameLine: number; palette: Palette } = {
  AX,
  SIDE_AX,
  FOOT_Y,
  gameLine: config.gameLod.lineW,
  palette: { ...config.palette },
};

const mirror = (pts: Pt[], ax = AX): Pt[] => mirrorPts(pts, ax);

const kit = (low: boolean): Kit => {
  const builder = createBuilder(low ? config.gameLod : null);
  const k: Kit = { ...builder, low, bare: false, long: false, suffix: "" };
  k.hook = (parent, name) => builder.hook(parent, name + k.suffix);
  return k;
};

const both = (k: Kit, parent: GroupNode, spec: PartSpec, ax = AX): void => {
  k.P(parent, spec);
  k.P(parent, { ...spec, pts: mirror(spec.pts, ax) });
};

const leg: Record<"piston" | "thigh" | "knee" | "shin" | "foot" | "toe", PartSpec> & Record<"pistonRing" | "shinSlot", Pt[]> = {
  piston: { pts: [[196, 340], [236, 340], [236, 440], [196, 440]], mat: "chrome", shade: "cyl", r: 1 },
  pistonRing: [[192, 360], [240, 360], [240, 368], [192, 368]],
  thigh: { pts: [[154, 338], [196, 337], [196, 430], [236, 430], [236, 339], [266, 340], [268, 452], [256, 468], [168, 468], [152, 452]], r: 1 },
  knee: { pts: [[150, 456], [272, 456], [276, 478], [262, 510], [232, 530], [190, 530], [160, 510], [146, 478]], mat: "chrome", r: 1 },
  shin: { pts: [[164, 508], [262, 508], [278, 690], [150, 690]], r: 1 },
  shinSlot: [[204, 600], [222, 600], [224, 668], [202, 668]],
  foot: { pts: [[146, 688], [282, 688], [290, 714], [286, 744], [142, 744], [136, 714]], mat: "metal", r: 1 },
  toe: { pts: [[152, 688], [276, 688], [282, 706], [146, 706]], r: 1 },
};
const holes: [number, number, number][] = [[176, 478, 7], [211, 476, 7], [246, 478, 7], [192, 500, 5], [230, 500, 5]];
const capsule = ([x1, y1, r1]: [number, number, number], [x2, y2, r2]: [number, number, number], neck: number, steps = 10): Pt[] => {
  const dir = Math.atan2(y2 - y1, x2 - x1);
  const top = Math.asin(neck / 2 / r1);
  const bottom = Math.PI - Math.asin(neck / 2 / r2);
  const arc = (x: number, y: number, r: number, from: number, to: number): Pt[] =>
    Array.from({ length: steps + 1 }, (_, i): Pt => {
      const a = from + ((to - from) * i) / steps;
      return [x + r * Math.cos(a), y + r * Math.sin(a)];
    });
  return [...arc(x1, y1, r1, dir + top, dir + 2 * Math.PI - top), ...arc(x2, y2, r2, dir - bottom, dir + bottom)];
};
const upperArm = capsule([100, 148, 46], [100, 236, 46], 56);
const sideUpperArm = capsule([300, 156, 62], [314, 240, 48], 60);
const elbow: Pt[] = [[60, 296], [128, 296], [128, 316], [60, 316]];
const forearm: Pt[] = [[35, 306], [138, 304], [143, 318], [141, 408], [133, 420], [49, 422], [35, 403]];

const PR = config.proportions;
const LEG_SHIFT = PR.legShift;
const LEG_CX = PR.legCenterX;
const BODY_SX = PR.bodyScaleX;
const FORE_SHIFT = PR.forearmShift;
const SHOULDER_IN = PR.shoulderIn;
const BADGE_R = PR.badgeRadius;
const FOREARM_SX = PR.forearmScaleX;
const FORE_S = PR.forearmScale;
const HOLD_TF = `scale(${1 / FORE_S})`;
const SIDE_TORSO_SX = PR.sideTorsoScaleX;
const SS = PR.sideShoulder;
const SIDE_SHOULDER_TF = `translate(${SS.cx} ${SS.cy}) scale(${SS.scaleX} ${SS.scaleY}) translate(${-SS.cx} ${-SS.cy})`;
const SIDE_TORSO_TF = `translate(${SIDE_AX} 0) scale(${SIDE_TORSO_SX} 1) translate(${-SIDE_AX} 0)`;

type LegKind = "thigh" | "knee" | "shin" | "foot";

const legTf = (kind: LegKind, cx: number, sx = 0.82): string => {
  if (kind === "thigh") return `translate(${cx} 344) scale(${sx} 1.3) translate(${-cx} -344)`;
  if (kind === "knee") return `translate(0 36) translate(${cx} 0) scale(${sx} 1) translate(${-cx} 0)`;
  if (kind === "shin") return `translate(${cx} 548) scale(${sx} 0.835) translate(${-cx} -508)`;
  return `translate(${cx} 0) scale(${sx} 1) translate(${-cx} 0)`;
};

const legOne = (k: Kit, parent: GroupNode, kind: LegKind, right: boolean): GroupNode =>
  right
    ? k.G(parent, `translate(${-LEG_SHIFT} 0) ${legTf(kind, 2 * AX - LEG_CX)}`)
    : k.G(parent, `translate(${LEG_SHIFT} 0) ${legTf(kind, LEG_CX)}`);

const legGroups = (k: Kit, parent: GroupNode, kind: LegKind): [GroupNode, GroupNode] => [
  legOne(k, parent, kind, false),
  legOne(k, parent, kind, true),
];

const legPair = (k: Kit, parent: GroupNode, spec: PartSpec, kind: LegKind = "foot"): void => {
  const [l, r] = legGroups(k, parent, kind);
  k.P(l, spec);
  k.P(r, { ...spec, pts: mirror(spec.pts) });
};

const legFlat = (k: Kit, parent: GroupNode, pts: Pt[], fill: string, kind: LegKind = "foot"): void => {
  const [l, r] = legGroups(k, parent, kind);
  k.F(l, pts, fill);
  k.F(r, mirror(pts), fill);
};

const backLeg = (k: Kit, s: GroupNode, right: boolean, enemy: boolean): void => {
  const M: Mirror = (p) => (right ? mirror(p) : p);
  const sfx = right ? "R" : "L";
  const piston = leg.piston;
  const hx = right ? 2 * AX - LEG_CX - LEG_SHIFT : LEG_CX + LEG_SHIFT;
  const thigh = k.G(k.G(s, null, "leg" + sfx, [hx, 344]), null, "thigh" + sfx, [hx, 344]);
  k.P(legOne(k, thigh, "thigh", right), { ...piston, pts: M(piston.pts) });
  k.F(legOne(k, thigh, "thigh", right), M(leg.pistonRing), "m1");
  k.P(legOne(k, thigh, "thigh", right), { ...leg.thigh, pts: M(leg.thigh.pts) });
  const lower = k.G(s, null, "shin" + sfx, [hx, 522]);
  k.P(legOne(k, lower, "shin", right), { pts: M([[162, 500], [264, 500], [280, 690], [148, 690]]), r: 1 });
  if (!enemy)
    for (let i = 0; i < 4; i++)
      k.F(legOne(k, lower, "shin", right), M([[176, 560 + i * 26], [252, 560 + i * 26], [254, 566 + i * 26], [174, 566 + i * 26]]), "a0");
  k.P(legOne(k, lower, "knee", right), { pts: M([[178, 456], [244, 456], [246, 512], [176, 512]]), mat: enemy ? "armor" : "metal", shade: "cyl", r: 1 });
  k.P(legOne(k, lower, "foot", right), { pts: M([[146, 688], [282, 688], [290, 714], [286, 744], [142, 744], [136, 714]]), mat: "metal", r: 1 });
  k.hook(k.G(lower, `translate(${hx} 744)`), "foot" + sfx);
};

const bodyGroup = (k: Kit, parent: GroupNode): GroupNode => k.G(parent, `translate(${AX} 0) scale(${BODY_SX} 1) translate(${-AX} 0)`);

const armGroup = (k: Kit, parent: GroupNode, right: boolean): GroupNode =>
  k.G(bodyGroup(k, parent), `translate(${right ? -SHOULDER_IN : SHOULDER_IN} 0)`);

const headFront = (k: Kit, body: GroupNode, back: boolean, enemy: boolean): void => {
  const s = back ? body : k.G(body, null, "head", [320, 120]);
  k.P(s, { pts: [[306, 96], [334, 96], [336, 120], [304, 120]], mat: "metal", shade: "cyl", r: 2 });
  if (!enemy) both(k, s, { pts: [[246, 4], [256, 4], [258, 70], [244, 70]], r: 4, shade: "cyl" });
  both(k, s, { pts: [[240, 56], [266, 52], [268, 98], [242, 100]], r: 2 });
  const crest = (): void => k.P(s, { pts: [[313, 12], [327, 12], [330, 24], [326, 34], [314, 34], [310, 24]], r: 2 });
  if (back && !enemy) crest();
  k.P(s, { pts: [[264, 102], [262, 34], [276, 22], [364, 22], [378, 34], [376, 102]], r: 3 });
  if (!back && !enemy) crest();
  if (back) {
    if (enemy) return;
    k.F(s, [[274, 70], [366, 70], [366, 74], [274, 74]], "a0");
    k.F(s, [[318, 58], [322, 58], [322, 100], [318, 100]], "a0");
    return;
  }
  const face = k.G(s, null, "face", [320, 76]);
  k.P(face, { pts: [[272, 48], [368, 48], [368, 80], [348, 80], [348, 104], [292, 104], [292, 80], [272, 80]], mat: "metal", shade: "none", r: 2 });
  k.F(face, [[274, 50], [320, 50], [320, 102], [294, 102], [294, 78], [274, 78]], "m2");
  k.F(face, [[280, 56], [312, 56], [312, 63], [280, 63]], "visor", 1);
  k.F(face, mirror([[280, 56], [312, 56], [312, 63], [280, 63]]), "visor", 1);
};


export type HandView = "palm" | "back" | "thumb" | "little" | "tips";
export type HandPose = "open" | "reach" | "fist" | "carry" | "cup" | "grip" | "pinch" | "gunGrip";
export type SideHold = "reach" | "grip" | "pinch" | "carry" | "fist" | "cup" | "gunGrip";
export type ArmHold = SideHold;
type FrontHold = "gunGrip" | "cup" | "jab" | "guard";

const HAND = { x0: 46, x1: 130, top: 398, bottom: 470, thick: 34 };
const FINGER = { w: 20, pitch: 21, thick: 18, base: 462, seg: [30, 24, 18] };
const THUMB = { w: 20, thick: 18, seg: [24, 20] };
const HAND_AX = 87.5;
const HAND_FACE: Pt = [(HAND.x0 + HAND.x1 - HAND.thick) / 2, (HAND.x0 + HAND.x1 + HAND.thick) / 2];
const THUMB_BASE: Pt = [124, 424];
const THUMB_SIDE: Pt = [HAND_FACE[0] + 12, THUMB_BASE[1]];
const THUMB_OPEN = [30, 14];
const SIDE_HAND_DX = 224;
const FRONT_HAND_DY = 16;
const ELBOW_R: Pt = [2 * AX - 100, 236];
const ELBOW_L: Pt = [100, 236];
const ELBOW_DROP = 10;
export const SIDE_FORE_TURN = 18;
const JAB_DROP = 10;
const JAB_NEAR = 1.3;
const GUARD_DROP = -60;
const SIDE_SUPPORT_LIFT = 10;
const SIDE_SUPPORT: Pt = [312, 438];
const SIDE_ELBOW: Pt = [311, 288];
const SIDE_WRIST: Pt = [312, 400];
const SIDE_FORE_YAW = 45;
const ARMED_ARM_BACK = 15;
const GRIP_HOLD = 19;
const YAW_K = Math.cos((SIDE_FORE_YAW * Math.PI) / 180);
const SIDE_YAW_TF = `translate(${SIDE_ELBOW[0]} ${SIDE_ELBOW[1]}) scale(1 ${YAW_K}) translate(${-SIDE_ELBOW[0]} ${-SIDE_ELBOW[1]})`;
const SIDE_SUPPORT_YAWED: Pt = [SIDE_SUPPORT[0], SIDE_ELBOW[1] + (SIDE_SUPPORT[1] - SIDE_ELBOW[1]) * YAW_K];
const SUPPORT_TF = `translate(${ELBOW_R[0]} ${ELBOW_R[1] + ELBOW_DROP}) scale(${FORE_S} ${-FORE_S}) translate(-88 -434)`;
const JAB_TF = `translate(${ELBOW_R[0]} ${ELBOW_R[1] + JAB_DROP}) scale(${-FORE_S * JAB_NEAR} ${FORE_S * JAB_NEAR}) translate(-88 -434)`;
const GUARD_TF = `translate(${ELBOW_L[0]} ${ELBOW_L[1] + GUARD_DROP}) scale(${FORE_S}) translate(-88 -434)`;
const SIDE_FORE_TF = `translate(0 -22) rotate(${-SIDE_FORE_TURN} 311 288) translate(311 288) scale(${FORE_S}) translate(-311 -288)`;
const sideSupportTf = ([x, y]: Pt): string => `translate(${x} ${y - SIDE_SUPPORT_LIFT / FORE_S}) scale(1 -1) translate(-88 -434)`;
const fingerX = (i: number): number => HAND.x0 + i * FINGER.pitch;
const fingerY = (k: number): number => FINGER.base + FINGER.seg.slice(0, k).reduce((a, b) => a + b, 0);
const box = (x0: number, y0: number, x1: number, y1: number): Pt[] => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
const same: Mirror = (p) => p;
const wide: Mirror = (p) => mirror(p, HAND_AX);

const bar = ([x, y]: Pt, deg: number, len: number, w: number, ext: number | [number, number] = 0): { pts: [Pt, Pt, Pt, Pt]; end: Pt } => {
  const [e0, e1] = Array.isArray(ext) ? ext : [ext, ext];
  const a = (deg * Math.PI) / 180;
  const dx = Math.sin(a);
  const dy = Math.cos(a);
  const nx = (dy * w) / 2;
  const ny = (-dx * w) / 2;
  const s: Pt = [x - dx * e0, y - dy * e0];
  const e: Pt = [x + dx * (len + e1), y + dy * (len + e1)];
  return { pts: [[s[0] + nx, s[1] + ny], [e[0] + nx, e[1] + ny], [e[0] - nx, e[1] - ny], [s[0] - nx, s[1] - ny]], end: [x + dx * len, y + dy * len] };
};

const chain = (k: Kit, parent: GroupNode, M: Mirror, from: Pt, angles: readonly number[], lens: readonly number[], w: number, spec: Partial<PartSpec> = {}, pads = false): void => {
  let at = from;
  angles.forEach((deg, i) => {
    const len = lens[i] ?? 0;
    const b = bar(at, deg, len, w, w / 2);
    k.P(parent, { pts: M(b.pts), r: w / 3, lw: FINGER_LW, ...spec });
    if (pads) k.P(parent, { pts: M(bar(at, deg, len - 4, w - 6, [i ? w / 2 - 5 : w / 2, w / 2 - 5]).pts), mat: "metal", shade: "cyl", r: 4, lw: FINGER_LW });
    at = b.end;
  });
};

const thumbWedge = (from: Pt, deg: number, len: number, w: number): Pt[] => {
  const [, eo, ei] = bar(from, deg, len, w).pts;
  const a = (deg * Math.PI) / 180;
  const edge = HAND.x1 - 2;
  const top = from[1] - 14;
  const outer = Math.max(edge + 2, eo[0] - (Math.sin(a) * (eo[1] - top)) / Math.cos(a));
  return [[edge, top], [outer, top], eo, ei, [edge, ei[1]]];
};

const inset = (pts: Pt[], f: number): Pt[] => {
  const cx = pts.reduce((a, [x]) => a + x / pts.length, 0);
  const cy = pts.reduce((a, [, y]) => a + y / pts.length, 0);
  return pts.map(([x, y]): Pt => [cx + (x - cx) * f, cy + (y - cy) * f]);
};

const handThumb = (k: Kit, parent: GroupNode, M: Mirror, start: Pt, angles: readonly number[], w = THUMB.w, pads = false, wedge = false): void => {
  if (!wedge) return chain(k, parent, M, start, angles, THUMB.seg, w, { shade: "cyl" }, pads);
  const a0 = angles[0] ?? 0;
  const a1 = angles[1] ?? 0;
  const edge = HAND.x1 - 2;
  const joint = bar(start, a0, THUMB.seg[0] ?? 0, 0).end;
  const reach = Math.min(bar(start, a0, THUMB.seg[0] ?? 0, w).pts[2][0], ...bar(joint, a1, THUMB.seg[1] ?? 0, w, [w / 2, 0]).pts.map((p) => p[0]));
  const from: Pt = [start[0] + Math.max(0, edge - reach), start[1]];
  const root = thumbWedge(from, a0, THUMB.seg[0] ?? 0, w);
  k.P(parent, { pts: M(root), shade: "cyl", r: 3, lw: FINGER_LW });
  if (pads) k.P(parent, { pts: M(inset(root, 0.6)), mat: "metal", shade: "cyl", r: 3, lw: FINGER_LW });
  if (angles.length > 1) chain(k, parent, M, bar(from, a0, THUMB.seg[0] ?? 0, 0).end, angles.slice(1), THUMB.seg.slice(1), w, { shade: "cyl" }, pads);
};

const bare = (k: Kit, draw: () => void): void => {
  k.bare = true;
  try {
    draw();
  } finally {
    k.bare = false;
  }
};

const longForearm = (k: Kit, draw: () => void): void => {
  k.long = true;
  try {
    draw();
  } finally {
    k.long = false;
  }
};

const frontForearm = (k: Kit, parent: GroupNode): void => {
  const fa = k.G(parent, `translate(89 -16) scale(${FOREARM_SX} 1) translate(-89 0)`);
  k.P(fa, { pts: elbow, mat: "metal", shade: "hcyl", r: 1 });
  k.P(fa, { pts: forearm, r: 1 });
  k.F(fa, [[38, 359], [141, 357], [141, 362], [38, 364]], "a0");
  k.F(fa, [[38, 384], [141, 381], [141, 386], [38, 388]], "a0");
};

const handStub = (k: Kit, parent: GroupNode): void => {
  if (k.bare) return;
  if (k.long) return frontForearm(k, parent);
  const fa = k.G(parent, `translate(89 0) scale(${FOREARM_SX} 1) translate(-89 0)`);
  k.P(fa, { pts: [[26, 344], [150, 342], [150, 394], [140, 404], [42, 406], [26, 390]], r: 1 });
  k.F(fa, [[30, 374], [150, 372], [150, 376], [30, 378]], "a0");
};

const forearmEnd = (k: Kit, parent: GroupNode): void => {
  if (k.bare) return;
  k.P(parent, { pts: box(34, 365, 142, 469), r: 8 });
};

const backPlate = (k: Kit, parent: GroupNode, M: Mirror = same): void => {
  k.P(parent, { pts: M([[HAND.x0, HAND.top + 2], [HAND.x1, HAND.top], [HAND.x1, HAND.bottom - 2], [HAND.x0, HAND.bottom]]), r: 2 });
  k.P(parent, { pts: M([[HAND.x0 + 7, HAND.top + 9], [HAND.x1 - 7, HAND.top + 8], [HAND.x1 - 7, HAND.bottom - 12], [HAND.x0 + 7, HAND.bottom - 11]]), shade: "cyl", r: 6 });
};

const CURLED_BACK = [16, 10];
const TRIGGER_BACK = [30, 14];
const PINCH_BACK = [16, 16];

const backFingers = (k: Kit, parent: GroupNode, M: Mirror = same, lens: number[] | number[][] = FINGER.seg, curled = false): void => {
  const lensOf = (i: number): number[] => (Array.isArray(lens[0]) ? ((lens as number[][])[i] ?? []) : (lens as number[]));
  const reach = Math.max(...[0, 1, 2, 3].map((i) => lensOf(i).reduce((a, b) => a + b, 0)));
  if (k.low) k.P(parent, { pts: M([[HAND.x0, FINGER.base], [HAND.x1 - 1, FINGER.base], [HAND.x1 - 1, FINGER.base + reach], [HAND.x0, FINGER.base + reach]]), shade: "cyl", r: 4 });
  for (let i = 0; i < 4; i++) {
    const x = fingerX(i);
    let y = FINGER.base;
    lensOf(i).forEach((len, seg, all) => {
      const end = y + len;
      const top: Pt[] = seg ? [[x, y], [x + 20, y]] : [[x, y + 6], [x + 10, y], [x + 20, y + 6]];
      const last = seg === all.length - 1;
      k.P(parent, { pts: M([...top, [x + 20, end], [x, end]]), ...(last && !curled && seg === 2 ? {} : { shade: "cyl" }), r: last && curled ? 7 : seg ? 2 : 3, lw: FINGER_LW });
      y = end;
    });
  }
};

const palmPlate = (k: Kit, parent: GroupNode, M: Mirror, padBottom: number): void => {
  k.P(parent, { pts: box(HAND.x0, HAND.top, HAND.x1, HAND.bottom), r: 3 });
  k.P(parent, { pts: M(box(HAND.x0 + 8, HAND.top + 6, HAND.x1 - 8, padBottom)), mat: "metal", shade: "none", r: 6 });
};

const profilePlate = (k: Kit, parent: GroupNode, S: Mirror): void => {
  const [a, b] = HAND_FACE;
  k.P(parent, { pts: S([[a + 3, HAND.top], [b, HAND.top], [b, HAND.bottom], [a + 3, HAND.bottom]]), r: 3 });
  k.P(parent, { pts: S([[a - 2, HAND.top + 6], [a + 6, HAND.top + 6], [a + 6, HAND.bottom - 2], [a - 2, HAND.bottom - 2]]), mat: "metal", shade: "cyl", r: 4 });
};

const sectionPlate = (k: Kit, parent: GroupNode): void => {
  k.P(parent, { pts: box(HAND.x0, 400, HAND.x1, 400 + HAND.thick), r: 3 });
  k.P(parent, { pts: box(HAND.x0 + 4, 400 + HAND.thick - 6, HAND.x1 - 4, 400 + HAND.thick + 2), mat: "metal", shade: "cyl", r: 4 });
};

const profileHand = (k: Kit, parent: GroupNode, S: Mirror, thumbBehind: boolean, beforeThumb: () => void = () => {}): void => {
  const [y1, y2, y3] = [fingerY(1), fingerY(2), fingerY(3)];
  const fx = HAND_FACE[1] - 2 - FINGER.thick;
  const t = FINGER.thick;
  const thumb = (): void => handThumb(k, parent, S, THUMB_SIDE, [-14, -4], THUMB.thick);
  if (thumbBehind) thumb();
  k.P(parent, { pts: S([[fx, FINGER.base], [fx + t, FINGER.base - 6], [fx + t, y1], [fx, y1]]), shade: "cyl", r: 3, lw: FINGER_LW });
  k.P(parent, { pts: S([[fx, y1], [fx + t, y1], [fx + t, y2], [fx, y2]]), shade: "cyl", r: 2, lw: FINGER_LW });
  k.P(parent, { pts: S([[fx, y2], [fx + t, y2], [fx + t, y3 - 4], [fx + 9, y3], [fx, y3 - 4]]), r: 3, lw: FINGER_LW });
  for (const [top, bottom] of [[FINGER.base + 2, y1 - 2], [y1 + 1, y2 - 2], [y2 + 1, y3 - 5]] as const)
    k.P(parent, { pts: S([[fx - 4, top], [fx + 6, top], [fx + 6, bottom], [fx - 4, bottom]]), mat: "metal", shade: "cyl", r: 4, lw: FINGER_LW });
  profilePlate(k, parent, S);
  beforeThumb();
  if (!thumbBehind) thumb();
};

const robotHand = (k: Kit, parent: GroupNode, M: Mirror): void => {
  backPlate(k, parent, M);
  backFingers(k, parent, M);
  handThumb(k, parent, M, THUMB_BASE, THUMB_OPEN, THUMB.w, false, true);
};

const openHand = (k: Kit, s: GroupNode, view: HandView, beforeThumb: () => void = () => {}): void => {
  const [y1, y2, y3] = [fingerY(1), fingerY(2), fingerY(3)];
  if (view === "back" || view === "palm") {
    const S = view === "palm" ? wide : same;
    handStub(k, s);
    if (view === "back") backPlate(k, s);
    else palmPlate(k, s, same, HAND.bottom - 6);
    if (view === "back") backFingers(k, s);
    else
      for (let i = 0; i < 4; i++) {
        const x = fingerX(i);
        k.P(s, { pts: box(x, FINGER.base - 4, x + 20, y3), r: 4, lw: FINGER_LW });
        for (const [a, b] of [[FINGER.base - 1, y1 - 2], [y1 + 1, y2 - 2], [y2 + 1, y3 - 3]] as const) k.P(s, { pts: box(x + 3, a, x + 17, b), mat: "metal", shade: "cyl", r: 4, lw: FINGER_LW });
      }
    beforeThumb();
    handThumb(k, s, S, THUMB_BASE, THUMB_OPEN, THUMB.w, view === "palm", true);
  } else if (view === "thumb" || view === "little") {
    handStub(k, s);
    profileHand(k, s, view === "thumb" ? wide : same, view === "little", beforeThumb);
  } else {
    forearmEnd(k, s);
    sectionPlate(k, s);
    for (let i = 0; i < 4; i++) {
      const x = fingerX(i);
      k.P(s, { pts: box(x, 402, x + 20, 402 + FINGER.thick), shade: "cyl", r: 6, lw: FINGER_LW });
    }
    beforeThumb();
    k.P(s, { pts: box(HAND.x1 - 2, 416, HAND.x1 + 18, 416 + THUMB.thick), shade: "cyl", r: 6 });
  }
};

const BACK_THUMB: Pt[] = [[HAND.x1 - 6, 420], [HAND.x1 + 7, 422], [HAND.x1 + 7, 458], [HAND.x1 - 6, 460]];

const fistThumb = (dx = 0): Pt[] => ([[-4, 0], [8, 0], [14, 38], [-8, 38], [-9, 18]] as Pt[]).map(([x, y]): Pt => [HAND.x1 + dx + x, THUMB_BASE[1] - 11 + y]);

const fist = (k: Kit, s: GroupNode, view: HandView): void => {
  const [s1 = 0, s2 = 0] = FINGER.seg;
  const knuckle = FINGER.base;
  const bottom = knuckle + FINGER.thick;
  const pip = knuckle + FINGER.thick / 2;
  if (view === "back") {
    handStub(k, s);
    k.P(s, { pts: BACK_THUMB, shade: "cyl", r: 6, lw: FINGER_LW });
    backPlate(k, s);
    backFingers(k, s, same, CURLED_BACK, true);
  } else if (view === "palm") {
    handStub(k, s);
    palmPlate(k, s, same, HAND.bottom - 6);
    for (let i = 0; i < 4; i++) {
      const x = fingerX(i);
      k.P(s, { pts: box(x, pip - s2, x + 20, pip), shade: "cyl", r: 3, lw: FINGER_LW });
      k.P(s, { pts: box(x, knuckle, x + 20, bottom), shade: "cyl", r: 7, lw: FINGER_LW });
    }
    k.P(s, { pts: wide(fistThumb(-4)), shade: "cyl", r: 6, lw: FINGER_LW });
    chain(k, s, wide, bar(THUMB_BASE, -5, THUMB.seg[0] ?? 0, 0).end, [-90], [THUMB.seg[1] ?? 0], THUMB.w, { shade: "cyl" });
  } else if (view === "thumb" || view === "little") {
    const S = view === "thumb" ? wide : same;
    const joint: Pt = [HAND_FACE[1] - 2 - FINGER.thick / 2, pip];
    const front: Pt = [joint[0] - s1, pip];
    const thumb = (): void => {
      const end = bar(THUMB_SIDE, -53, THUMB.seg[0] ?? 0, 0).end;
      chain(k, s, S, THUMB_SIDE, [-53], [THUMB.seg[0] ?? 0], THUMB.thick, { shade: "cyl" });
      if (view === "little") k.P(s, { pts: S(box(end[0] - 13, end[1] - 6, end[0] + 5, end[1] + 12)), shade: "cyl", r: 6 });
    };
    handStub(k, s);
    if (view === "little") thumb();
    profilePlate(k, s, S);
    chain(k, s, S, front, [180], [s2], FINGER.thick, { shade: "cyl" });
    chain(k, s, S, joint, [-90], [s1], FINGER.thick, { shade: "cyl" });
    if (view === "thumb") thumb();
  } else {
    forearmEnd(k, s);
    sectionPlate(k, s);
    const face = 400 + HAND.thick;
    handThumb(k, s, same, [130, face + FINGER.thick - 2], [-60, -90], THUMB.thick);
    for (let i = 0; i < 4; i++) {
      const x = fingerX(i);
      k.P(s, { pts: box(x, 404, x + 20, face + FINGER.thick), shade: "cyl", r: 7, lw: FINGER_LW });
    }
  }
};

const itemAt = (k: Kit, parent: GroupNode, tf: string | null): void => k.hook(k.G(parent, tf), "item");

const slab = (k: Kit, parent: GroupNode, pts: Pt[]): void => k.P(parent, { pts, mat: "chrome", shade: "cyl", r: 4 });

const PALM_MID = (HAND.top + 8 + HAND.bottom) / 2;
const CARRY_TF = `translate(88 ${PALM_MID}) scale(6) translate(-9 6.5)`;

const REST_AT: Partial<Record<HandView, string>> = {
  palm: `translate(${HAND_AX} ${PALM_MID}) rotate(90)`,
  thumb: `translate(${2 * HAND_AX - HAND_FACE[0] + 2} ${PALM_MID}) rotate(90)`,
  tips: `translate(88 436) rotate(180)`,
};

const carry = (k: Kit, s: GroupNode, view: HandView, rest = false): void => {
  if (rest) {
    openHand(k, s, view, () => {
      const at = REST_AT[view];
      if (at) k.hook(k.G(s, at), "rest");
    });
    return;
  }
  if (view === "back") itemAt(k, s, `translate(88 ${PALM_MID}) scale(-6 6) translate(-9 6.5)`);
  openHand(k, s, view);
  const a = HAND_FACE[0];
  const edge = box(a - 28, PALM_MID - 38, a - 2, PALM_MID + 38);
  if (view === "palm") itemAt(k, s, CARRY_TF);
  else if (view === "little") slab(k, s, edge);
  else if (view === "thumb") slab(k, s, mirror(edge, HAND_AX));
  else if (view === "tips") slab(k, s, box(22, 436, 154, 462));
};

const CUP = [-30, -75, -125];
const CUP_THUMB = [28, 4];

const supportWrist = (k: Kit, s: GroupNode): void => {
  forearmEnd(k, s);
  sectionPlate(k, s);
};

const cupFingertips = (k: Kit, s: GroupNode): void => {
  const face = 400 + HAND.thick;
  for (let i = 0; i < 4; i++) k.P(s, { pts: box(fingerX(i), 404, fingerX(i) + 20, face + 10), shade: "cyl", r: 7, lw: FINGER_LW });
  k.P(s, { pts: box(HAND.x1 - 2, 420, HAND.x1 + 18, 420 + THUMB.thick), shade: "cyl", r: 6 });
};

const cup = (k: Kit, s: GroupNode, view: HandView): void => {
  const tip = FINGER.base + Math.round((FINGER.seg[0] ?? 0) * Math.cos(((CUP[0] ?? 0) * Math.PI) / 180));
  if (view === "back" || view === "palm") {
    const S = view === "palm" ? wide : same;
    handStub(k, s);
    if (view === "back") backPlate(k, s);
    else {
      palmPlate(k, s, same, HAND.bottom - 6);
      itemAt(k, s, `translate(88 ${PALM_MID}) scale(3) translate(-7 3.5)`);
    }
    if (view === "back") backFingers(k, s, same, [tip - FINGER.base, 12], true);
    else
      for (let i = 0; i < 4; i++) {
        const x = fingerX(i);
        k.P(s, { pts: box(x, FINGER.base - 4, x + 20, tip), shade: "cyl", r: 3, lw: FINGER_LW });
        k.P(s, { pts: box(x + 3, FINGER.base - 1, x + 17, tip - 3), mat: "metal", shade: "cyl", r: 4, lw: FINGER_LW });
        k.P(s, { pts: box(x, tip - 12, x + 20, tip + 10), shade: "cyl", r: 7, lw: FINGER_LW });
      }
    handThumb(k, s, S, THUMB_BASE, CUP_THUMB, THUMB.w, view === "palm", true);
  } else if (view === "thumb" || view === "little") {
    const S = view === "thumb" ? wide : same;
    const thumb = (): void => handThumb(k, s, S, THUMB_SIDE, [-30, -50], THUMB.thick);
    handStub(k, s);
    if (view === "little") thumb();
    itemAt(k, s, `${view === "thumb" ? `translate(${2 * HAND_AX} 0) scale(-1 1) ` : ""}translate(${HAND_FACE[0] - 9} ${PALM_MID}) scale(2.4) rotate(90) translate(-7 3.5)`);
    chain(k, s, S, [HAND_FACE[1] - 2 - FINGER.thick / 2, FINGER.base], CUP, FINGER.seg, FINGER.thick, { shade: "cyl" });
    profilePlate(k, s, S);
    if (view === "thumb") thumb();
  } else {
    supportWrist(k, s);
    cupFingertips(k, s);
  }
};

const GRIP_K = 16;
const GRIP_R = 0.9 * GRIP_K;
const GRIP_C: Pt = [HAND_FACE[0] - GRIP_R, PALM_MID + 6];
const GRIP_CURL = [-60, -110, -160];
const TRIGGER_CURL = [-25, -75, -115];
const gripTf = (y: number): string => `translate(88 ${y}) scale(${GRIP_K}) translate(-13 1.5)`;

interface Rod {
  r: number;
  trigger?: boolean;
  across(k: Kit, s: GroupNode, M: Mirror, y: number, tips?: boolean): void;
  section(k: Kit, s: GroupNode, S: Mirror, c: Pt, r: number): void;
  side(k: Kit, s: GroupNode, S: Mirror, c: Pt): void;
  end(k: Kit, s: GroupNode, depth: number): void;
}

const CROWBAR: Rod = {
  r: GRIP_R,
  across: (k, s, _M, y) => itemAt(k, s, gripTf(y)),
  section: (k, s, S, [cx, cy], r) => k.P(s, { pts: S(box(cx - r, cy - r, cx + r, cy + r)), mat: "chrome", shade: "cyl", r }),
  side: () => {},
  end: () => {},
};

const PISTOL_R = 11;
const PISTOL_SLIDE = { x0: HAND.x1, x1: HAND.x1 + 24, top: 404, muzzle: 566 };

const PISTOL: Rod = {
  r: PISTOL_R,
  trigger: true,
  across: (k, s, M, y, tips = false) => {
    const { x0, x1, top, muzzle } = PISTOL_SLIDE;
    k.P(s, { pts: M([[HAND.x0 - 22, y - PISTOL_R - 12], [x0 + 4, y - PISTOL_R + 2], [x0 + 6, y + PISTOL_R + 4], [HAND.x0 - 20, y + PISTOL_R - 12]]), mat: "metal", shade: "cyl", r: 5 });
    if (tips) return;
    k.P(s, { pts: M(box(x0 - 24, y + PISTOL_R - 2, x0, y + PISTOL_R + 30)), mat: "metal", shade: "cyl", r: 9 });
    k.F(s, M(box(x0 - 18, y + PISTOL_R + 3, x0 - 4, y + PISTOL_R + 24)), "m0", 6);
    k.P(s, { pts: M([[x0 - 13, y + PISTOL_R + 2], [x0 - 8, y + PISTOL_R + 2], [x0 - 10, y + PISTOL_R + 18], [x0 - 14, y + PISTOL_R + 16]]), mat: "metal", shade: "cyl", r: 2 });
    k.P(s, { pts: M(box(x0, top, x1, muzzle)), mat: "chrome", shade: "cyl", r: 4 });
    k.F(s, M(box(x0 + 3, top + 30, x1 - 3, top + 34)), "m1");
    k.F(s, M(box(x0 + 3, muzzle - 8, x1 - 3, muzzle - 4)), "m1");
  },
  section: (k, s, S, [cx, cy], r) => k.P(s, { pts: S(box(cx - r, cy - r, cx + r, cy + r)), mat: "metal", shade: "cyl", r: 5 }),
  side: (k, s, S, [cx]) => {
    const { top, muzzle } = PISTOL_SLIDE;
    k.P(s, { pts: S(box(cx - PISTOL_R, top, cx + PISTOL_R, muzzle)), mat: "chrome", shade: "cyl", r: 4 });
    k.F(s, S(box(cx - PISTOL_R - 2, top + 30, cx + PISTOL_R + 2, top + 34)), "m1");
  },
  end: (k, s, depth) => {
    const { x0, x1 } = PISTOL_SLIDE;
    const mx = (x0 + x1) / 2;
    k.P(s, { pts: box(x0, depth - PISTOL_R - 4, x1, depth + PISTOL_R + 4), mat: "chrome", shade: "cyl", r: 4 });
    k.E(s, mx, depth, 8, 8, "mLine");
    k.E(s, mx, depth, 6.5, 6.5, "m0");
    k.E(s, mx - 1.5, depth - 1.5, 2.5, 2.5, "m2", 0.6);
  },
};

const BARE_GUN: Rod = { ...CROWBAR, r: PISTOL_R, trigger: true, across: () => {}, section: () => {} };
const BARE_ROD: Rod = { ...CROWBAR, across: () => {}, section: () => {} };

const at = (S: Mirror, c: Pt): string => {
  const [x, y] = S([c])[0] ?? c;
  return `translate(${x} ${y})`;
};

const grip = (k: Kit, s: GroupNode, view: HandView, rod: Rod = CROWBAR): void => {
  const knuckle = FINGER.base;
  const R = rod.r;
  const [cx, cy]: Pt = [HAND_FACE[0] - R, GRIP_C[1]];
  const near = cy + R + FINGER.thick / 2 + 4;
  const trigger = !!rod.trigger;
  const curled = trigger ? 3 : 4;
  const pull = cy + R + 14;
  const px = fingerX(0);
  if (view === "back") {
    if (!rod.trigger) k.P(s, { pts: BACK_THUMB, shade: "cyl", r: 6, lw: FINGER_LW });
    rod.across(k, s, same, cy);
    k.hook(k.G(s, `translate(${HAND_AX} ${cy})`), "rod");
    handStub(k, s);
    backPlate(k, s);
    backFingers(k, s, same, [0, 1, 2, 3].map((i) => (trigger && i === 3 ? TRIGGER_BACK : CURLED_BACK)), true);
  } else if (view === "palm") {
    handStub(k, s);
    palmPlate(k, s, same, HAND.bottom - 6);
    for (let i = 4 - curled; i < 4; i++) {
      const x = fingerX(i);
      k.P(s, { pts: box(x, knuckle - 4, x + 20, near - 8), shade: "cyl", r: 3, lw: FINGER_LW });
    }
    rod.across(k, s, wide, cy);
    k.hook(k.G(s, `translate(${HAND_AX} ${cy})`), "rod");
    for (let i = 4 - curled; i < 4; i++) {
      const x = fingerX(i);
      k.P(s, { pts: box(x, cy - 4, x + 20, near), shade: "cyl", r: 7, lw: FINGER_LW });
    }
    if (trigger) {
      k.P(s, { pts: box(px, knuckle - 4, px + 20, pull), shade: "cyl", r: 3, lw: FINGER_LW });
      k.P(s, { pts: box(px + 3, knuckle - 1, px + 17, pull - 3), mat: "metal", shade: "cyl", r: 4, lw: FINGER_LW });
      k.P(s, { pts: box(px, pull - 4, px + 20, pull + 12), shade: "cyl", r: 7, lw: FINGER_LW });
    }
    k.P(s, { pts: wide(fistThumb(-4)), shade: "cyl", r: 6, lw: FINGER_LW });
    chain(k, s, wide, bar(THUMB_BASE, -5, THUMB.seg[0] ?? 0, 0).end, [-90], [THUMB.seg[1] ?? 0], THUMB.w, { shade: "cyl" });
  } else if (view === "thumb" || view === "little") {
    const S = view === "thumb" ? wide : same;
    const thumb = (): void => chain(k, s, S, THUMB_SIDE, [-95, -60], THUMB.seg, THUMB.thick, { shade: "cyl" });
    const stubOver = k.long && view === "thumb" && !trigger;
    if (!stubOver) handStub(k, s);
    if (view === "little") {
      rod.side(k, s, S, [cx, cy]);
      thumb();
    }
    const index = (): void => chain(k, s, S, [HAND_FACE[1] - 2 - FINGER.thick / 2, knuckle], TRIGGER_CURL, FINGER.seg, FINGER.thick, { shade: "cyl" });
    if (trigger && view === "little") index();
    rod.section(k, s, S, [cx, cy], R);
    k.hook(k.G(s, at(S, [cx, cy])), "rod");
    chain(k, s, S, [HAND_FACE[1] - 2 - FINGER.thick / 2, knuckle], GRIP_CURL, FINGER.seg, FINGER.thick, { shade: "cyl" });
    if (trigger && view === "thumb") index();
    profilePlate(k, s, S);
    if (view === "thumb" && trigger) {
      thumb();
      rod.side(k, s, S, [cx, cy]);
    } else if (view === "thumb") {
      rod.side(k, s, S, [cx, cy]);
      k.hook(k.G(s, at(S, [cx, cy])), "underThumb");
      if (stubOver) handStub(k, s);
      thumb();
    }
  } else {
    forearmEnd(k, s);
    sectionPlate(k, s);
    const depth = 400 + HAND_FACE[1] - cx - 10;
    rod.across(k, s, same, depth, true);
    k.hook(k.G(s, `translate(${HAND_AX} ${depth})`), "rod");
    const thumbJoint = bar([130, depth + 10], -60, THUMB.seg[0] ?? 0, 0).end;
    chain(k, s, same, [130, depth + 10], [-60], THUMB.seg.slice(0, 1), THUMB.thick, { shade: "cyl" });
    k.hook(k.G(s, `translate(${thumbJoint.join(" ")})`), "thumbTip");
    chain(k, s, same, thumbJoint, [-90], THUMB.seg.slice(1), THUMB.thick, { shade: "cyl" });
    for (let i = 0; i < 4; i++) {
      const x = fingerX(i);
      k.P(s, { pts: box(x, 404, x + 20, depth + R), shade: "cyl", r: 7, lw: FINGER_LW });
    }
    rod.end(k, s, depth);
  }
};

const PINCH_INDEX = [-60, -150, -200];
const PINCH_THUMB = [-15, -10];
const PINCH_AT: Pt = [70, 478];
const PINCH_PIVOT: Pt = [HAND.x1 - 2, THUMB_BASE[1] - 11];
const PINCH_TIP: Pt = [HAND.x1 - 1, THUMB_BASE[1] + 24];
const PINCH_TILT = 12;
const PINCH_EDGE = HAND.x1 - 1;
const PINCH_K = 6;
const PINCH_KEY = [2.2, -2.6, 7.6] as const;
const keyEdge = (x: number): Pt[] => box(x - 3, PINCH_AT[1] - PINCH_KEY[0] * PINCH_K, x + 3, PINCH_AT[1] + PINCH_KEY[2] * PINCH_K);

const pinchThumb = (k: Kit, s: GroupNode, M: Mirror): void => {
  const a = (PINCH_TILT * Math.PI) / 180;
  const [ox, oy] = PINCH_PIVOT;
  const turn = ([x, y]: Pt): Pt => [ox + (x - ox) * Math.cos(a) + (y - oy) * Math.sin(a), oy - (x - ox) * Math.sin(a) + (y - oy) * Math.cos(a)];
  k.P(s, { pts: M(fistThumb(-4).map(turn)), shade: "cyl", r: 6, lw: FINGER_LW });
  chain(k, s, M, turn(PINCH_TIP), [PINCH_TILT], [THUMB.seg[1] ?? 0], THUMB.w, { shade: "cyl" });
};

const pinch = (k: Kit, s: GroupNode, view: HandView): void => {
  const [s1 = 0, s2 = 0] = FINGER.seg;
  const knuckle = FINGER.base;
  const bottom = knuckle + FINGER.thick;
  const pip = knuckle + FINGER.thick / 2;
  if (view === "back") {
    itemAt(k, s, `translate(${PINCH_EDGE} ${PINCH_AT[1]}) rotate(90) scale(${PINCH_K}) translate(${-PINCH_KEY[0]} ${-PINCH_KEY[1]})`);
    handStub(k, s);
    pinchThumb(k, s, same);
    backPlate(k, s);
    backFingers(k, s, same, [0, 1, 2, 3].map((i) => (i === 3 ? PINCH_BACK : CURLED_BACK)), true);
    slab(k, s, keyEdge(PINCH_EDGE));
  } else if (view === "palm") {
    handStub(k, s);
    palmPlate(k, s, same, HAND.bottom - 6);
    for (let i = 0; i < 4; i++) {
      const x = fingerX(i);
      k.P(s, { pts: box(x, pip - s2, x + 20, pip), shade: "cyl", r: 3, lw: FINGER_LW });
      k.P(s, { pts: box(x, knuckle, x + 20, bottom + (i === 0 ? 6 : 0)), shade: "cyl", r: 7, lw: FINGER_LW });
    }
    slab(k, s, keyEdge(2 * HAND_AX - PINCH_EDGE));
    pinchThumb(k, s, wide);
  } else if (view === "thumb" || view === "little") {
    const S = view === "thumb" ? wide : same;
    const joint: Pt = [HAND_FACE[1] - 2 - FINGER.thick / 2, pip];
    const fingers = (): void => {
      chain(k, s, S, [joint[0] - s1, pip], [180], [s2], FINGER.thick, { shade: "cyl" });
      chain(k, s, S, joint, [-90], [s1], FINGER.thick, { shade: "cyl" });
    };
    const index = (): void => chain(k, s, S, [joint[0], knuckle], PINCH_INDEX, FINGER.seg, FINGER.thick, { shade: "cyl" });
    const key = (): void =>
      itemAt(k, s, `${view === "thumb" ? `translate(${2 * HAND_AX} 0) scale(-1 1) ` : ""}translate(${PINCH_AT[0]} ${PINCH_AT[1]}) rotate(90) scale(${PINCH_K}) translate(${-PINCH_KEY[0]} ${-PINCH_KEY[1]})`);
    const thumb = (): void => chain(k, s, S, THUMB_SIDE, PINCH_THUMB, THUMB.seg, THUMB.thick, { shade: "cyl" });
    handStub(k, s);
    if (view === "little") {
      thumb();
      key();
      index();
      fingers();
      profilePlate(k, s, S);
    } else {
      fingers();
      index();
      profilePlate(k, s, S);
      key();
      thumb();
    }
  } else {
    forearmEnd(k, s);
    sectionPlate(k, s);
    const face = 400 + HAND.thick;
    for (let i = 0; i < 4; i++) {
      const x = fingerX(i);
      k.P(s, { pts: box(x, 404, x + 20, face + FINGER.thick), shade: "cyl", r: 7, lw: FINGER_LW });
    }
    const depth = 400 + HAND_FACE[1] - PINCH_AT[0];
    const half = PINCH_KEY[0] * PINCH_K;
    slab(k, s, box(HAND.x1 - 2, depth - half, HAND.x1 + 4, depth + half));
    k.P(s, { pts: box(HAND.x1 + 2, depth - THUMB.thick / 2, HAND.x1 + 22, depth + THUMB.thick / 2), shade: "cyl", r: 6 });
  }
};

const REACH = [-12, -34, -58];
const REACH_CURL = [0.98, 0.8, 0.55];
const REACH_THUMB = [26, 6];
const REACH_THUMB_SIDE = [-16, -6];

const reach = (k: Kit, s: GroupNode, view: HandView): void => {
  const lens = FINGER.seg.map((len, i) => len * (REACH_CURL[i] ?? 1));
  if (view === "back" || view === "palm") {
    const S = view === "palm" ? wide : same;
    const thumb = (): void => handThumb(k, s, S, THUMB_BASE, REACH_THUMB, THUMB.w, view === "palm", true);
    handStub(k, s);
    if (view === "back") {
      thumb();
      itemAt(k, s, null);
      backPlate(k, s);
    } else palmPlate(k, s, same, HAND.bottom - 6);
    if (view === "back") backFingers(k, s, same, lens);
    else for (let i = 0; i < 4; i++) chain(k, s, same, [fingerX(i) + FINGER.w / 2, FINGER.base], [0, 0, 0], lens, FINGER.w, { shade: "cyl" }, true);
    if (view === "palm") thumb();
  } else if (view === "thumb" || view === "little") {
    const S = view === "thumb" ? wide : same;
    const thumb = (): void => handThumb(k, s, S, THUMB_SIDE, REACH_THUMB_SIDE, THUMB.thick);
    handStub(k, s);
    if (view === "little") thumb();
    chain(k, s, S, [HAND_FACE[1] - 2 - FINGER.thick / 2, FINGER.base], REACH, FINGER.seg, FINGER.thick, { shade: "cyl" });
    profilePlate(k, s, S);
    if (view === "thumb") thumb();
  } else {
    forearmEnd(k, s);
    sectionPlate(k, s);
    const face = 400 + HAND.thick;
    for (let i = 0; i < 4; i++) {
      const x = fingerX(i);
      k.P(s, { pts: box(x, 404, x + 20, face + 12), shade: "cyl", r: 7, lw: FINGER_LW });
    }
    k.P(s, { pts: box(HAND.x1 + 6, 436, HAND.x1 + 26, 436 + THUMB.thick), shade: "cyl", r: 6 });
  }
};

const handBuilders: Record<Exclude<HandPose, "carry">, (k: Kit, s: GroupNode, view: HandView) => void> = {
  open: (k, s, view) => openHand(k, s, view),
  reach,
  fist,
  cup,
  grip: (k, s, view) => grip(k, s, view),
  pinch,
  gunGrip: (k, s, view) => grip(k, s, view, PISTOL),
};

const heldHand = (k: Kit, parent: GroupNode, pose: SideHold | "carry", view: HandView, tf: string | null, suffix = ""): void => {
  const g = k.G(parent, tf);
  k.suffix = suffix;
  bare(k, () => {
    if (pose === "gunGrip") grip(k, g, view, BARE_GUN);
    else if (pose === "carry") openHand(k, g, view);
    else if (pose === "reach") reach(k, g, view);
    else if (pose === "grip") grip(k, g, view);
    else if (pose === "pinch") pinch(k, g, view);
    else if (pose === "fist") fist(k, g, view);
    else cup(k, g, view);
  });
  k.suffix = "";
};

const PALM_UP: Record<HandView, string> = { palm: "rotate(90 88 470)", back: "rotate(90 88 470)", thumb: "rotate(-90 88 470)", little: "rotate(90 88 470)", tips: "rotate(180 88 434)" };
const FINGERS_LEFT: Record<HandView, string> = { ...PALM_UP, tips: "rotate(-90 88 434)" };
const GUN_UP: Record<HandView, string> = { ...FINGERS_LEFT, back: "rotate(-90 88 470)" };
const REST_UP: Record<HandView, string> = { ...PALM_UP, palm: "rotate(-90 88 470)" };

const upOf = (view: HandView, pose: HandPose, rest: boolean): string | null => {
  if (rest && pose === "carry") return REST_UP[view];
  if (pose === "carry" || pose === "cup") return PALM_UP[view];
  if (pose === "grip" || pose === "pinch") return FINGERS_LEFT[view];
  if (pose === "gunGrip") return GUN_UP[view];
  return null;
};

const handTree = (k: Kit, view: HandView, pose: HandPose, rest: boolean, bareRod: boolean): GroupNode => {
  const root = k.root();
  const up = upOf(view, pose, rest);
  const hand = k.G(up ? k.G(root, up) : root, null, "hand", [89, 400]);
  if (pose === "carry") carry(k, hand, view, rest);
  else if (bareRod && pose === "grip") grip(k, hand, view, BARE_ROD);
  else handBuilders[pose](k, hand, view);
  return root;
};

export const buildHand = ({
  view = "back",
  pose = "open",
  rest = false,
  forearm: long = false,
  bare: bareRod = false,
  lod = false,
}: { view?: HandView; pose?: HandPose; rest?: boolean; forearm?: boolean; bare?: boolean; lod?: boolean } = {}): GroupNode => {
  const k = kit(lod);
  let tree: GroupNode | null = null;
  const build = (): void => {
    tree = handTree(k, view, pose, rest, bareRod);
  };
  if (long) longForearm(k, build);
  else build();
  return tree ?? k.root();
};

export const buildPalmHand = ({ lod = false }: { lod?: boolean } = {}): GroupNode => buildHand({ view: "palm", pose: "open", forearm: true, lod });

const frontHand = (k: Kit, parent: GroupNode, M: Mirror, thumbBehind: boolean): void =>
  profileHand(k, parent, (pts) => M(mirror(pts, HAND_AX).map(([x, y]): Pt => [x, y + FRONT_HAND_DY])), thumbBehind);

interface ArmNames {
  arm?: string;
  fore?: string;
  hand?: string;
  wrist?: string;
}

interface FrontArmOptions {
  hold?: FrontHold | null;
  thumbFront?: boolean;
  foreParent?: GroupNode | null;
  flipHand?: boolean;
  propBehindArm?: boolean;
  pose?: ArmHold | null;
  back?: boolean;
  suffix?: string;
}

const frontArm = (
  k: Kit,
  parent: GroupNode,
  mirrored: boolean,
  names: ArmNames,
  { thumbFront = false, foreParent = null, flipHand = false, propBehindArm = false, hold = null, pose = null, back = false, suffix = "" }: FrontArmOptions = {},
): void => {
  const M: Mirror = (p) => (mirrored ? mirror(p) : p);
  const sh: Pt = mirrored ? [2 * AX - 100, 150] : [100, 150];
  const el: Pt = mirrored ? [2 * AX - 90, 306] : [90, 306];
  const arm = k.G(parent, null, names.arm, sh);
  const foreTf = `translate(${mirrored ? -FORE_SHIFT : FORE_SHIFT} -22) translate(${el[0]} ${el[1]}) scale(${FORE_S}) translate(${-el[0]} ${-el[1]})`;
  const support = hold === "cup" || hold === "jab" || hold === "guard";
  if (!support) k.P(k.G(arm, `translate(${mirrored ? -6 : 6} -22)`), { pts: M(elbow), mat: "metal", shade: "hcyl", r: 1 });
  const fore = k.G(foreParent ? k.G(foreParent, null, names.arm, sh) : arm, foreTf, names.fore, el);
  const fc = mirrored ? 2 * AX - 89 : 89;
  if (names.hand && propBehindArm) k.hook(k.G(fore, `translate(${fc} ${440 + FRONT_HAND_DY}) ${HOLD_TF}${hold === "gunGrip" ? ` scale(1 ${1 / BODY_SX}) translate(${GRIP_HOLD} 0)` : ""}`), names.hand);
  if (!support) {
    const fa = k.G(fore, `translate(${fc} 0) scale(${FOREARM_SX} 1) translate(${-fc} 0)`);
    k.P(fa, { pts: M(forearm), r: 1 });
    k.F(fa, M([[38, 359], [141, 357], [141, 362], [38, 364]]), "a0");
    k.F(fa, M([[38, 384], [141, 381], [141, 386], [38, 388]]), "a0");
  }
  const joint = pose ? k.G(fore, null, names.wrist, [fc, 400 + FRONT_HAND_DY]) : fore;
  const hand = k.G(joint, `translate(${fc} ${440 + FRONT_HAND_DY}) ${HOLD_TF}${back && pose === "gunGrip" ? ` translate(${GRIP_HOLD} 0)` : ""}`);
  if (names.hand && !propBehindArm) k.hook(hand, names.hand);
  if (hold === "gunGrip") heldHand(k, fore, hold, "back", `${mirrored ? `translate(${2 * AX} 0) scale(-1 1) ` : ""}translate(0 ${FRONT_HAND_DY})`);
  else if (hold === "jab" || hold === "guard") {
    const wrist = hold === "jab" ? k.G(k.G(arm, null, "supportR", ELBOW_R), JAB_TF) : k.G(k.G(arm, null, "supportL", ELBOW_L), GUARD_TF);
    forearmEnd(k, wrist);
    heldHand(k, wrist, "fist", "tips", null);
  } else if (support) {
    const wrist = k.G(k.G(arm, null, "supportR", ELBOW_R), SUPPORT_TF);
    k.hook(k.G(wrist, "translate(88 434)"), "support");
    supportWrist(k, wrist);
  } else if (pose) {
    const behind = thumbFront && !flipHand;
    const tf = `${flipHand ? `translate(${2 * fc} 0) scale(-1 1) ` : ""}${mirrored ? `translate(${2 * AX} 0) scale(-1 1) ` : ""}translate(0 ${FRONT_HAND_DY})${behind ? ` translate(${2 * HAND_AX} 0) scale(-1 1)` : ""}`;
    heldHand(k, joint, pose, back ? "back" : behind ? "little" : "thumb", tf, suffix);
  } else frontHand(k, fore, flipHand ? (p) => mirror(M(p), fc) : M, thumbFront && !flipHand);
};

const shoulder = (k: Kit, parent: GroupNode, mirrored: boolean, name: string): void => {
  const x = mirrored ? 2 * AX - 100 : 100;
  const domes = k.G(parent, null, name, [x, 150]);
  k.P(domes, { pts: mirrored ? mirror(upperArm) : upperArm, r: 2, shade: "dome" });
};

interface FrontOptions {
  lod?: boolean;
  rightArmFirst?: boolean;
  propBehindArm?: boolean;
  enemy?: boolean;
  armed?: boolean;
  fists?: boolean;
  holdL?: ArmHold | null;
  holdR?: ArmHold | null;
  backHandL?: boolean;
  backHandR?: boolean;
}

const heldSides = (holdL: ArmHold | null, holdR: ArmHold | null, backHandL: boolean, backHandR: boolean): [Pick<FrontArmOptions, "back" | "suffix">, Pick<FrontArmOptions, "back" | "suffix">] => {
  const two = !!holdL && !!holdR;
  return [
    { back: backHandL, suffix: two ? "L" : "" },
    { back: backHandR, suffix: two ? "R" : "" },
  ];
};

const frontTree = (
  k: Kit,
  { rightArmFirst = false, propBehindArm = false, enemy = false, armed = false, fists = false, holdL = null, holdR = null, backHandL = false, backHandR = false }: FrontOptions,
): GroupNode => {
  const root = k.root();
  const s = k.G(root, null, "body", [AX, 344]);
  k.P(bodyGroup(k, s), { pts: [[248, 316], [392, 316], [398, 352], [374, 392], [320, 404], [266, 392], [242, 352]], r: 18 });
  const hipBar = bodyGroup(k, s);
  k.P(hipBar, { pts: [[198, 318], [442, 318], [442, 372], [198, 372]], mat: "chrome", shade: "hcyl", r: 6 });
  for (const x of [214, 236, 398, 420]) k.F(hipBar, [[x, 318], [x + 6, 318], [x + 6, 372], [x, 372]], "m1");
  legPair(k, s, leg.piston, "thigh");
  legFlat(k, s, leg.pistonRing, "m1", "thigh");
  legPair(k, s, leg.thigh, "thigh");
  if (!enemy) for (let i = 0; i < 3; i++) legFlat(k, s, [[160, 372 + i * 16], [190, 372 + i * 16], [190, 376 + i * 16], [160, 376 + i * 16]], "a0", "thigh");
  legPair(k, s, leg.shin, "shin");
  if (!enemy) legPair(k, s, { pts: leg.shinSlot, mat: "metal", shade: "none", r: 1 }, "shin");
  legPair(k, s, leg.foot);
  legPair(k, s, leg.toe);
  legPair(k, s, enemy ? { ...leg.knee, mat: "armor" } : leg.knee, "knee");
  const [kl, kr] = legGroups(k, s, "knee");
  for (const [x, y, r] of holes) {
    k.E(kl, x, y, r, r * 0.8, "hole");
    k.E(kr, 2 * AX - x, y, r, r * 0.8, "hole");
  }
  const b = bodyGroup(k, s);
  k.P(b, { pts: [[172, 196], [250, 178], [320, 172], [390, 178], [468, 196], [446, 300], [436, 322], [204, 322], [194, 300]], mat: "metal", r: 10 });
  k.P(b, { pts: [[300, 182], [340, 182], [340, 304], [300, 304]], mat: "chrome", shade: "cyl", r: 3 });
  for (let i = 0; i < 6; i++) {
    const y = 194 + i * 18;
    both(k, b, { pts: [[252, y], [300, y], [300, y + 10], [252, y + 10]], mat: "chrome", shade: "hcyl", r: 4 });
  }
  k.P(b, { pts: [[196, 250], [232, 250], [232, 270], [196, 270]], mat: "metal", shade: "none", r: 2 });
  k.F(b, [[200, 254], [228, 254], [228, 266], [200, 266]], "screen", 2);
  k.E(b, 214, 288, 14, 9, "m0");
  k.E(b, 214, 288, 9, 5, "screen", 0.7);
  k.P(b, { pts: [[200, 300], [440, 300], [438, 322], [202, 322]], mat: "metal", shade: "none", r: 3 });
  k.P(b, { pts: [[262, 318], [378, 318], [384, 340], [370, 372], [340, 398], [320, 410], [300, 398], [270, 372], [256, 340]], r: 18 });
  k.P(b, {
    pts: [[148, 132], [178, 112], [250, 106], [320, 104], [390, 106], [462, 112], [492, 132], [502, 166], [478, 196], [446, 204], [418, 238], [394, 254], [356, 258], [334, 222], [320, 214], [306, 222], [284, 258], [246, 254], [222, 238], [194, 204], [162, 196], [138, 166]],
    r: 16,
  });
  k.F(b, [[317, 110], [323, 110], [323, 150], [317, 150]], "m0");
  k.P(b, { pts: [[300, 160], [340, 160], [344, 182], [330, 196], [310, 196], [296, 182]], r: 12, shade: "dome" });
  if (!enemy) k.trefoil(b, 418, 150, BADGE_R, 1 / BODY_SX);
  headFront(k, s, false, enemy);
  const [heldL, heldR] = heldSides(holdL, holdR, backHandL, backHandR);
  const left = (): void =>
    frontArm(k, armGroup(k, s, false), false, { arm: "armL", fore: "foreL", hand: "handL", wrist: "wristL" }, { propBehindArm, hold: armed ? "gunGrip" : fists ? "guard" : null, pose: holdL, ...heldL });
  const right = (): void =>
    frontArm(k, armGroup(k, s, true), true, { arm: "armR", fore: "foreR", hand: "handR", wrist: "wristR" }, { hold: armed ? "cup" : fists ? "jab" : null, pose: holdR, ...heldR });
  if (fists) {
    shoulder(k, armGroup(k, s, false), false, "armL");
    left();
    shoulder(k, armGroup(k, s, true), true, "armR");
    right();
    return root;
  }
  if (armed) {
    shoulder(k, armGroup(k, s, true), true, "armR");
    right();
    shoulder(k, armGroup(k, s, false), false, "armL");
    left();
    cupFingertips(k, k.G(k.G(k.G(armGroup(k, s, true), null, "armR", [2 * AX - 100, 150]), null, "supportR", ELBOW_R), SUPPORT_TF));
    return root;
  }
  if (rightArmFirst) {
    right();
    left();
  } else {
    left();
    right();
  }
  shoulder(k, armGroup(k, s, false), false, "armL");
  shoulder(k, armGroup(k, s, true), true, "armR");
  return root;
};

export const buildFront = ({ lod = false, ...opts }: FrontOptions = {}): GroupNode => frontTree(kit(lod), opts);

const TOP = { chest: 420, back: 530, palm: 270, shoulder: [124, 478, 46] as const };

const circlePts = (cx: number, cy: number, r: number, n = 18): Pt[] =>
  Array.from({ length: n }, (_, i): Pt => [cx + r * Math.cos((i * 2 * Math.PI) / n), cy + r * Math.sin((i * 2 * Math.PI) / n)]);

const topHand = (k: Kit, parent: GroupNode, x: number, mirrored: boolean, name: string): void => {
  const g = k.G(parent, `translate(${x} ${TOP.palm}) ${mirrored ? "scale(-1 1) " : ""}rotate(180) translate(-88 -438)`, name, [88, 280]);
  longForearm(k, () => openHand(k, g, "palm"));
};

const topTree = (k: Kit, forearms: boolean, spread: number): GroupNode => {
  const root = k.root();
  const s = k.G(root, null, "body", [AX, 470]);
  const [sx, sy, sr] = TOP.shoulder;
  k.P(s, { pts: [[AX - 106, TOP.chest], [AX + 106, TOP.chest], [AX + 112, TOP.chest + 40], [AX + 100, TOP.back], [AX - 100, TOP.back], [AX - 112, TOP.chest + 40]], mat: "metal", r: 4 });
  k.P(s, { pts: [[AX - 96, TOP.chest + 4], [AX + 96, TOP.chest + 4], [AX + 90, TOP.chest + 34], [AX - 90, TOP.chest + 34]], r: 4 });
  k.P(s, { pts: [[AX - 90, TOP.back - 34], [AX + 90, TOP.back - 34], [AX + 96, TOP.back - 4], [AX - 96, TOP.back - 4]], r: 4 });
  for (const side of [-1, 1]) k.P(s, { pts: circlePts(AX + side * sx, sy, sr), shade: "dome", r: 0 });
  const head = k.G(s, null, "head", [AX, 490]);
  k.P(head, { pts: [[AX - 44, TOP.chest + 30], [AX + 44, TOP.chest + 30], [AX + 46, TOP.chest + 112], [AX - 46, TOP.chest + 112]], shade: "cyl", r: 6 });
  k.P(head, { pts: [[AX - 8, TOP.chest + 24], [AX + 8, TOP.chest + 24], [AX + 8, TOP.chest + 108], [AX - 8, TOP.chest + 108]], shade: "cyl", r: 4 });
  k.F(head, [[AX - 30, TOP.chest + 32], [AX + 30, TOP.chest + 32], [AX + 30, TOP.chest + 38], [AX - 30, TOP.chest + 38]], "visor", 1);
  if (forearms) {
    topHand(k, s, AX - spread, true, "foreL");
    topHand(k, s, AX + spread, false, "foreR");
    for (const [side, name] of [[-1, "handL"], [1, "handR"]] as const) k.hook(k.G(s, `translate(${AX + side * spread} ${TOP.palm})`), name);
    k.hook(k.G(s, `translate(${AX} ${TOP.palm})`), "carry");
  }
  return root;
};

export const buildTop = ({ forearms = false, spread = 93, lod = false }: { forearms?: boolean; spread?: number; lod?: boolean } = {}): GroupNode =>
  topTree(kit(lod), forearms, spread);
interface BackOptions {
  leftArmBehind?: boolean;
  rightForeBehind?: boolean;
  lod?: boolean;
  enemy?: boolean;
  holdL?: ArmHold | null;
  holdR?: ArmHold | null;
  backHandL?: boolean;
  backHandR?: boolean;
}

const backDetail = (k: Kit, b: GroupNode): void => {
  k.F(b, [[316, 104], [324, 104], [324, 262], [316, 262]], "a0");
  for (const side of [false, true]) {
    const M: Mirror = (p) => (side ? mirror(p) : p);
    k.F(b, M([[220, 150], [268, 146], [268, 152], [220, 156]]), "a0");
    for (const [x, y] of [[236, 196], [278, 230]] as Pt[]) k.E(b, side ? 2 * AX - x : x, y, 4, 4, "a0");
  }
  for (const [x, y, h] of [[250, 160, 40], [268, 170, 60], [384, 150, 50], [404, 200, 34]] as [number, number, number][])
    k.F(b, [[x, y], [x + 4, y], [x + 3, y + h], [x + 1, y + h]], "a0");
};

const backTree = (k: Kit, { leftArmBehind = false, rightForeBehind = false, enemy = false, holdL = null, holdR = null, backHandL = false, backHandR = false }: BackOptions): GroupNode => {
  const root = k.root();
  const s = k.G(root, null, "body", [AX, 344]);
  const left = { arm: "armL", fore: "foreL", hand: "handL", wrist: "wristL" };
  const [heldL, heldR] = heldSides(holdL, holdR, backHandL, backHandR);
  if (leftArmBehind) frontArm(k, armGroup(k, s, false), false, left, { thumbFront: true, pose: holdL, ...heldL });
  const behindRight = rightForeBehind ? armGroup(k, s, true) : null;
  k.P(bodyGroup(k, s), { pts: [[198, 318], [442, 318], [442, 372], [198, 372]], mat: "chrome", shade: "hcyl", r: 6 });
  backLeg(k, s, false, enemy);
  backLeg(k, s, true, enemy);
  const b = bodyGroup(k, s);
  k.P(b, { pts: [[248, 316], [392, 316], [398, 352], [374, 392], [320, 404], [266, 392], [242, 352]], r: 18 });
  k.P(b, { pts: [[172, 196], [468, 196], [446, 300], [436, 322], [204, 322], [194, 300]], mat: "metal", r: 10 });
  k.P(b, {
    pts: [[148, 132], [178, 112], [250, 106], [320, 104], [390, 106], [462, 112], [492, 132], [502, 166], [478, 196], [446, 204], [418, 238], [394, 254], [356, 262], [320, 266], [284, 262], [246, 254], [222, 238], [194, 204], [162, 196], [138, 166]],
    r: 16,
  });
  if (!enemy) backDetail(k, b);
  headFront(k, s, true, enemy);
  if (!leftArmBehind) frontArm(k, armGroup(k, s, false), false, left, { thumbFront: true, pose: holdL, ...heldL });
  frontArm(
    k,
    armGroup(k, s, true),
    true,
    { arm: "armR", fore: "foreR", hand: "handR", wrist: "wristR" },
    { thumbFront: !rightForeBehind, foreParent: behindRight, flipHand: rightForeBehind, pose: holdR, ...heldR },
  );
  shoulder(k, armGroup(k, s, false), false, "armL");
  shoulder(k, armGroup(k, s, true), true, "armR");
  k.hook(k.G(s, `translate(330 236) rotate(${(-0.95 * 180) / Math.PI}) translate(-40 -60)`), "back");
  return root;
};

export const buildBack = ({ lod = false, ...opts }: BackOptions = {}): GroupNode => backTree(kit(lod), opts);
interface LegNames {
  hip: string;
  knee: string;
  ankle: string;
  heel?: string;
  toe?: string;
}

const sideLeg = (k: Kit, parent: GroupNode, names: LegNames, enemy: boolean, dim?: number): void => {
  const sx = PR.sideLegScaleX;
  const hip = k.G(parent, null, names.hip, [300, 344], { dim });
  const th = k.G(hip, legTf("thigh", SIDE_AX, sx));
  k.P(th, { pts: [[278, 342], [314, 342], [314, 440], [278, 440]], mat: "chrome", shade: "cyl", r: 1 });
  k.P(th, { pts: [[246, 338], [278, 338], [278, 432], [314, 432], [314, 338], [342, 338], [346, 452], [334, 468], [258, 468], [246, 452]], r: 1 });
  const knee = k.G(hip, null, names.knee, [300, 522]);
  const sh = k.G(knee, legTf("shin", SIDE_AX, sx));
  k.P(sh, { pts: [[256, 500], [340, 500], [354, 690], [240, 690]], r: 1 });
  if (!enemy) k.P(sh, { pts: [[298, 540], [312, 540], [316, 660], [298, 660]], mat: "metal", shade: "none", r: 1 });
  const ankle = k.G(knee, null, names.ankle, [300, 700]);
  const ft = k.G(ankle, legTf("foot", SIDE_AX, 0.88));
  k.P(ft, { pts: [[204, 688], [384, 688], [402, 712], [398, 744], [202, 744]], mat: "metal", r: 1 });
  k.P(ft, { pts: [[300, 688], [384, 688], [396, 706], [300, 706]], r: 1 });
  if (names.heel) k.hook(k.G(ankle, "translate(220 744)"), names.heel);
  if (names.toe) k.hook(k.G(ankle, "translate(380 744)"), names.toe);
  const kn = k.G(knee, legTf("knee", SIDE_AX, sx));
  k.E(kn, 300, 486, 30, 30, "m1");
  k.E(kn, 294, 480, 12, 12, "m3");
  k.P(kn, { pts: [[300, 448], [340, 452], [362, 478], [362, 510], [344, 534], [318, 532], [310, 500]], mat: enemy ? "armor" : "chrome", r: 1 });
};

const sideHand = (k: Kit, parent: GroupNode): void => robotHand(k, parent, (pts) => pts.map(([x, y]): Pt => [x + SIDE_HAND_DX, y]));

const sideArm = (
  k: Kit,
  parent: GroupNode,
  names: Required<Omit<ArmNames, "wrist">> & { wrist?: string },
  { dim, propBehindArm = false, hold = null, back = false, suffix = "" }: { dim?: number; propBehindArm?: boolean; hold?: SideHold | null; back?: boolean; suffix?: string } = {},
): void => {
  const arm = k.G(parent, "translate(2 -4)", names.arm, [300, 150], { dim });
  k.P(arm, { pts: [[288, 274], [334, 274], [334, 294], [288, 294]], mat: "metal", shade: "cyl", r: 1 });
  const [wx, wy] = hold === "cup" ? SIDE_SUPPORT_YAWED : SIDE_SUPPORT;
  const handTf = `translate(${wx} ${wy}) ${HOLD_TF}${hold === "gunGrip" ? ` translate(${GRIP_HOLD} 0)` : ""}`;
  if (propBehindArm) k.hook(k.G(k.G(arm, SIDE_FORE_TF, names.fore, SIDE_ELBOW), handTf), names.hand);
  k.P(k.G(arm, SIDE_SHOULDER_TF), { pts: sideUpperArm, r: 2, shade: "dome" });
  const lower = k.G(arm, SIDE_FORE_TF, names.fore, SIDE_ELBOW);
  const fa = k.G(hold === "cup" ? k.G(lower, SIDE_YAW_TF) : lower, `translate(312 0) scale(${FOREARM_SX} 1) translate(-312 0)`);
  k.P(fa, { pts: [[262, 290], [358, 286], [366, 302], [366, 392], [354, 402], [270, 404], [258, 390]], r: 1 });
  k.F(fa, [[264, 352], [366, 350], [366, 354], [264, 356]], "a0");
  k.F(fa, [[264, 372], [366, 370], [366, 374], [264, 376]], "a0");
  const picking = hold === "reach" || hold === "grip" || hold === "pinch";
  const palm = picking ? k.G(lower, null, names.wrist ?? "wrist", SIDE_WRIST) : lower;
  const hand = k.G(palm, handTf);
  if (!propBehindArm) k.hook(hand, names.hand);
  if (hold === "cup") supportWrist(k, k.G(k.G(lower, null, "supportFar", SIDE_SUPPORT_YAWED), sideSupportTf(SIDE_SUPPORT_YAWED)));
  else if (hold === "carry") heldHand(k, lower, hold, back ? "back" : "thumb", `translate(${SIDE_HAND_DX} 0)`, suffix);
  else if (picking) heldHand(k, palm, hold, back ? "back" : "little", `translate(${SIDE_HAND_DX} 0)`, suffix);
  else if (hold) heldHand(k, lower, hold, "back", `translate(${SIDE_HAND_DX} 0)`, suffix);
  else sideHand(k, lower);
};

interface SideOptions {
  farLimbs?: boolean;
  badge?: boolean;
  propBehindArm?: boolean;
  lod?: boolean;
  enemy?: boolean;
  armed?: boolean;
  fists?: boolean;
  carry?: boolean;
  hold?: SideHold | null;
  farHold?: SideHold | null;
  backHand?: boolean;
  farBackHand?: boolean;
}

const sideTree = (
  k: Kit,
  { farLimbs = false, badge = false, propBehindArm = false, enemy = false, armed = false, fists = false, carry: carrying = false, hold = null, farHold = null, backHand = false, farBackHand = false }: SideOptions,
): GroupNode => {
  const root = k.root();
  const s = k.G(root, null, "body", [SIDE_AX, 344]);
  const pair = armed ? null : fists ? "fist" : carrying ? "carry" : null;
  if (farLimbs) {
    const dim = 0.55;
    sideArm(k, k.G(s, "translate(-20 0)"), { arm: "armFar", fore: "foreFar", hand: "handFar", wrist: "wristFar" }, { dim, hold: armed ? "cup" : (farHold ?? pair), back: farBackHand, suffix: hold && farHold ? "Far" : "" });
    sideLeg(k, k.G(s, "translate(-24 0)"), { hip: "hipFar", knee: "kneeFar", ankle: "ankleFar", heel: "heelFar", toe: "toeFar" }, enemy, dim);
  }
  const lowerTorso = k.G(s, SIDE_TORSO_TF);
  k.P(lowerTorso, { pts: [[222, 316], [398, 316], [398, 372], [222, 372]], mat: "chrome", shade: "hcyl", r: 2 });
  k.P(lowerTorso, { pts: [[214, 236], [390, 236], [378, 322], [226, 322]], mat: "metal", r: 2 });
  for (let i = 0; i < 4; i++)
    k.P(lowerTorso, { pts: [[300, 244 + i * 18], [380, 244 + i * 18], [380, 254 + i * 18], [300, 254 + i * 18]], mat: "chrome", shade: "hcyl", r: 4 });
  k.P(lowerTorso, { pts: [[350, 318], [392, 318], [400, 344], [390, 380], [366, 404], [352, 400]], r: 2 });
  k.P(lowerTorso, { pts: [[216, 316], [264, 316], [268, 352], [256, 392], [234, 404], [214, 394], [206, 352]], r: 6 });
  sideLeg(k, s, { hip: "hipNear", knee: "kneeNear", ankle: "ankleNear", heel: "heelNear", toe: "toeNear" }, enemy);
  const upperTorso = k.G(s, SIDE_TORSO_TF, "chest", [SIDE_AX, 344]);
  k.P(upperTorso, { pts: [[194, 112], [406, 112], [388, 330], [212, 330]], mat: "metal", r: 2 });
  const sideChestPlate: Pt[] = [[352, 104], [400, 104], [412, 118], [412, 212], [402, 240], [386, 248], [368, 236], [352, 220]];
  k.P(upperTorso, { pts: mirror(sideChestPlate, SIDE_AX), r: 12 });
  k.hook(k.G(upperTorso, `translate(218 170) scale(${1 / SIDE_TORSO_SX} 1) rotate(30)`), "back");
  k.P(upperTorso, { pts: sideChestPlate, r: 12 });
  if (badge && !enemy) k.trefoil(upperTorso, 400, 150, BADGE_R, 0.5 / SIDE_TORSO_SX, 0.68);
  const head = k.G(s, "translate(-28 0)", "head", [320, 156]);
  k.P(head, { pts: [[300, 100], [336, 100], [340, 160], [304, 160]], mat: "metal", shade: "none", r: 4 });
  k.P(head, { pts: [[312, 96], [336, 96], [338, 120], [310, 120]], mat: "metal", shade: "cyl", r: 2 });
  k.P(head, { pts: [[282, 102], [280, 34], [292, 22], [374, 22], [388, 34], [388, 104]], r: 3 });
  if (!enemy) k.P(head, { pts: [[300, 24], [304, 12], [382, 12], [388, 24], [388, 34], [376, 24]], r: 2 });
  k.P(head, { pts: [[356, 48], [388, 48], [388, 104], [372, 104], [372, 80], [356, 80]], mat: "metal", shade: "none", r: 2 });
  k.F(head, [[368, 56], [388, 56], [388, 63], [368, 63]], "visor", 1);
  k.P(head, { pts: [[300, 56], [328, 52], [330, 98], [302, 100]], r: 2 });
  if (!enemy) k.P(head, { pts: [[308, 4], [318, 4], [320, 70], [306, 70]], r: 4, shade: "cyl" });
  sideArm(k, armed ? k.G(s, `translate(${-ARMED_ARM_BACK} ${GRIP_HOLD})`) : s, { arm: "arm", fore: "fore", hand: "hand" }, { propBehindArm, hold: hold ?? (armed ? "gunGrip" : pair), back: backHand });
  if (farLimbs && armed) {
    const lower = k.G(k.G(k.G(s, "translate(-20 0)"), "translate(2 -4)", "armFar", [300, 150]), SIDE_FORE_TF, "foreFar", SIDE_ELBOW);
    cupFingertips(k, k.G(k.G(lower, null, "supportFar", SIDE_SUPPORT_YAWED), sideSupportTf(SIDE_SUPPORT_YAWED)));
  }
  return root;
};

export const buildSide = ({ lod = false, ...opts }: SideOptions = {}): GroupNode => sideTree(kit(lod), opts);
