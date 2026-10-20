import config from "@config/robots/xbot.json";
import type { Palette } from "../../engine/rig/draw";
import { createBuilder, mirrorPts, type Builder, type GroupNode, type PartSpec, type Pt } from "../../engine/rig/tree";

type Bulk = keyof typeof config.gameLod.bulk;
type Kit = Builder & { low: boolean; bulk: (limb: Bulk) => number };
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

const kit = (low: boolean): Kit => ({ ...createBuilder(low ? config.gameLod : null), low, bulk: (limb) => (low ? config.gameLod.bulk[limb] : 1) });

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
const pauldron: Pt[] = [[56, 100], [100, 90], [146, 98], [162, 128], [162, 170], [148, 198], [102, 210], [60, 200], [42, 170], [42, 126]];
const bicep: Pt[] = [[58, 184], [134, 184], [150, 207], [148, 248], [132, 276], [102, 284], [70, 278], [54, 250], [48, 209]];
const elbow: Pt[] = [[60, 296], [128, 296], [128, 316], [60, 316]];
const forearm: Pt[] = [[26, 310], [146, 308], [152, 320], [150, 394], [140, 404], [42, 406], [26, 390]];

const PR = config.proportions;
const LEG_SHIFT = PR.legShift;
const LEG_CX = PR.legCenterX;
const BODY_SX = PR.bodyScaleX;
const FORE_SHIFT = PR.forearmShift;
const BACK_SHOULDER_IN = PR.backShoulderIn;
const BADGE_R = PR.badgeRadius;
const FOREARM_SX = PR.forearmScaleX;
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

const backArmGroup = (k: Kit, parent: GroupNode, right: boolean): GroupNode =>
  k.G(bodyGroup(k, parent), `translate(${right ? -BACK_SHOULDER_IN : BACK_SHOULDER_IN} 0)`);

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

const frontHand = (k: Kit, parent: GroupNode, M: Mirror, thumbFront: boolean): void => {
  const thumb = (): void => {
    k.P(parent, { pts: M([[112, 412], [134, 408], [142, 430], [134, 452], [118, 448], [110, 430]]), r: 4 });
    k.F(parent, M([[116, 430], [136, 428], [136, 431], [116, 433]]), "a0");
  };
  if (!thumbFront) thumb();
  k.P(parent, { pts: M([[46, 400], [129, 398], [129, 434], [46, 436]]), mat: "metal", r: 2 });
  if (k.low)
    for (let i = 0; i < 4; i++)
      k.P(parent, { pts: M([[46 + i * 21, 422], [65 + i * 21, 422], [65 + i * 21, 478], [46 + i * 21, 478]]), shade: "cyl", r: 4 });
  for (let i = 0; i < 4; i++) {
    const x = 46 + i * 21;
    k.P(parent, { pts: M([[x, 428], [x + 10, 422], [x + 20, 428], [x + 20, 444], [x, 444]]), shade: "cyl", r: 3, lw: FINGER_LW });
    k.P(parent, { pts: M([[x, 444], [x + 20, 444], [x + 20, 463], [x, 463]]), shade: "cyl", r: 2, lw: FINGER_LW });
    k.P(parent, { pts: M([[x, 463], [x + 20, 463], [x + 20, 478], [x, 478]]), r: 2, lw: FINGER_LW });
  }
  if (thumbFront) thumb();
};

interface ArmNames {
  arm?: string;
  fore?: string;
  hand?: string;
}

interface FrontArmOptions {
  thumbFront?: boolean;
  foreParent?: GroupNode | null;
  flipHand?: boolean;
  foreUnder?: boolean;
  propBehindArm?: boolean;
}

const frontArm = (
  k: Kit,
  parent: GroupNode,
  mirrored: boolean,
  names: ArmNames,
  { thumbFront = false, foreParent = null, flipHand = false, foreUnder = false, propBehindArm = false }: FrontArmOptions = {},
): void => {
  const M: Mirror = (p) => (mirrored ? mirror(p) : p);
  const sh: Pt = mirrored ? [2 * AX - 100, 150] : [100, 150];
  const el: Pt = mirrored ? [2 * AX - 90, 306] : [90, 306];
  const arm = k.G(parent, null, names.arm, sh);
  const foreTf = `translate(${mirrored ? -FORE_SHIFT : FORE_SHIFT} -22)`;
  const under = foreUnder ? k.G(arm, foreTf, names.fore, el) : null;
  k.P(k.G(arm, `translate(${mirrored ? -6 : 6} -22)`), { pts: M(elbow), mat: "metal", shade: "hcyl", r: 1 });
  const domes = k.G(arm, `translate(${sh[0]} 0) scale(${k.bulk("arms")} 1) translate(${-sh[0]} 0)`);
  k.P(domes, { pts: M(bicep), r: 18, shade: "dome" });
  const fore = under || k.G(foreParent ? k.G(foreParent, null, names.arm, sh) : arm, foreTf, names.fore, el);
  const fc = mirrored ? 2 * AX - 89 : 89;
  if (names.hand && propBehindArm) k.hook(k.G(fore, `translate(${fc} 440)`), names.hand);
  const fa = k.G(fore, `translate(${fc} 0) scale(${FOREARM_SX} 1) translate(${-fc} 0)`);
  k.P(fa, { pts: M(forearm), r: 1 });
  k.F(fa, M([[30, 354], [150, 352], [150, 356], [30, 358]]), "a0");
  k.F(fa, M([[30, 374], [150, 372], [150, 376], [30, 378]]), "a0");
  const hand = k.G(fore, `translate(${mirrored ? 2 * AX - 89 : 89} 440)`);
  if (names.hand && !propBehindArm) k.hook(hand, names.hand);
  const hc = mirrored ? 2 * AX - 89 : 89;
  frontHand(k, fore, flipHand ? (p) => mirror(M(p), hc) : M, thumbFront);
};

const shoulder = (k: Kit, parent: GroupNode, mirrored: boolean, arm: string): void => {
  const x = mirrored ? 2 * AX - 100 : 100;
  const domes = k.G(k.G(parent, null, arm, [x, 150]), `translate(${x} 0) scale(${k.bulk("arms")} 1) translate(${-x} 0)`);
  k.P(domes, { pts: mirrored ? mirror(pauldron) : pauldron, r: 20, shade: "dome" });
};

const frontTree = (k: Kit, rightArmFirst: boolean, propBehindArm: boolean, enemy: boolean): GroupNode => {
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
  const arms = bodyGroup(k, s);
  const left = (): void => frontArm(k, arms, false, { arm: "armL", fore: "foreL", hand: "handL" }, { propBehindArm });
  const right = (): void => frontArm(k, arms, true, { arm: "armR", fore: "foreR", hand: "handR" });
  if (rightArmFirst) {
    right();
    left();
  } else {
    left();
    right();
  }
  const shoulders = bodyGroup(k, s);
  shoulder(k, shoulders, false, "armL");
  shoulder(k, shoulders, true, "armR");
  return root;
};

export const buildFront = ({
  lod = false,
  rightArmFirst = false,
  propBehindArm = false,
  enemy = false,
}: { lod?: boolean; rightArmFirst?: boolean; propBehindArm?: boolean; enemy?: boolean } = {}): GroupNode => frontTree(kit(lod), rightArmFirst, propBehindArm, enemy);

interface BackOptions {
  leftArmBehind?: boolean;
  rightForeBehind?: boolean;
  thumbsBehind?: boolean;
  forearmsUnder?: boolean;
  lod?: boolean;
  enemy?: boolean;
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

const backTree = (k: Kit, { leftArmBehind = false, rightForeBehind = false, thumbsBehind = false, forearmsUnder = false, enemy = false }: BackOptions): GroupNode => {
  const root = k.root();
  const s = k.G(root, null, "body", [AX, 344]);
  const left = { arm: "armL", fore: "foreL", hand: "handL" };
  if (leftArmBehind) frontArm(k, backArmGroup(k, s, false), false, left, { thumbFront: !thumbsBehind });
  const behindRight = rightForeBehind ? backArmGroup(k, s, true) : null;
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
  if (!leftArmBehind) frontArm(k, backArmGroup(k, s, false), false, left, { thumbFront: !thumbsBehind, foreUnder: forearmsUnder });
  frontArm(
    k,
    backArmGroup(k, s, true),
    true,
    { arm: "armR", fore: "foreR", hand: "handR" },
    { thumbFront: !rightForeBehind && !thumbsBehind, foreParent: behindRight, flipHand: rightForeBehind, foreUnder: forearmsUnder },
  );
  shoulder(k, backArmGroup(k, s, false), false, "armL");
  shoulder(k, backArmGroup(k, s, true), true, "armR");
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
  const sx = 0.88 * k.bulk("sideLegs");
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

const sideHand = (k: Kit, parent: GroupNode): void => {
  k.P(parent, { pts: [[342, 410], [366, 406], [374, 428], [366, 448], [350, 444], [340, 428]], r: 4 });
  k.P(parent, { pts: [[270, 398], [353, 396], [353, 434], [270, 436]], mat: "metal", r: 2 });
  if (k.low)
    for (let i = 0; i < 4; i++)
      k.P(parent, { pts: [[270 + i * 21, 422], [289 + i * 21, 422], [289 + i * 21, 478], [270 + i * 21, 478]], shade: "cyl", r: 4 });
  for (let i = 0; i < 4; i++) {
    const x = 270 + i * 21;
    k.P(parent, { pts: [[x, 428], [x + 10, 422], [x + 20, 428], [x + 20, 444], [x, 444]], shade: "cyl", r: 3, lw: FINGER_LW });
    k.P(parent, { pts: [[x, 444], [x + 20, 444], [x + 20, 463], [x, 463]], shade: "cyl", r: 2, lw: FINGER_LW });
    k.P(parent, { pts: [[x, 463], [x + 20, 463], [x + 20, 478], [x, 478]], r: 2, lw: FINGER_LW });
  }
};

const sideArm = (k: Kit, parent: GroupNode, names: Required<ArmNames>, { dim, propBehindArm = false }: { dim?: number; propBehindArm?: boolean } = {}): void => {
  const arm = k.G(parent, "translate(2 -4)", names.arm, [300, 150], { dim });
  k.P(arm, { pts: [[288, 274], [334, 274], [334, 294], [288, 294]], mat: "metal", shade: "cyl", r: 1 });
  const lower = k.G(arm, "translate(0 -22) rotate(-18 311 288)", names.fore, [311, 288]);
  if (propBehindArm) k.hook(k.G(lower, "translate(312 438)"), names.hand);
  const fa = k.G(lower, `translate(312 0) scale(${FOREARM_SX} 1) translate(-312 0)`);
  k.P(fa, { pts: [[262, 290], [358, 286], [366, 302], [366, 392], [354, 402], [270, 404], [258, 390]], r: 1 });
  k.F(fa, [[264, 352], [366, 350], [366, 354], [264, 356]], "a0");
  k.F(fa, [[264, 372], [366, 370], [366, 374], [264, 376]], "a0");
  const hand = k.G(lower, "translate(312 438)");
  if (!propBehindArm) k.hook(hand, names.hand);
  sideHand(k, lower);
  const bulbs = k.G(arm, `translate(${SS.cx} 0) scale(${k.bulk("arms")} 1) translate(${-SS.cx} 0) ${SIDE_SHOULDER_TF}`);
  k.P(bulbs, { pts: [[276, 196], [346, 196], [364, 220], [360, 257], [340, 279], [308, 286], [280, 278], [264, 254], [264, 217]], r: 18, shade: "dome" });
  k.P(bulbs, { pts: [[248, 106], [292, 96], [336, 102], [362, 126], [370, 164], [358, 196], [330, 212], [292, 216], [256, 206], [234, 182], [230, 146], [236, 122]], r: 22, shade: "dome" });
};

const sideTree = (k: Kit, farLimbs: boolean, badge: boolean, propBehindArm: boolean, enemy: boolean): GroupNode => {
  const root = k.root();
  const s = k.G(root, null, "body", [SIDE_AX, 344]);
  if (farLimbs) {
    const dim = 0.55;
    sideArm(k, k.G(s, "translate(-20 0)"), { arm: "armFar", fore: "foreFar", hand: "handFar" }, { dim });
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
  sideArm(k, s, { arm: "arm", fore: "fore", hand: "hand" }, { propBehindArm });
  return root;
};

export const buildSide = ({
  farLimbs = false,
  badge = false,
  propBehindArm = false,
  lod = false,
  enemy = false,
}: { farLimbs?: boolean; badge?: boolean; propBehindArm?: boolean; lod?: boolean; enemy?: boolean } = {}): GroupNode =>
  sideTree(kit(lod), farLimbs, badge, propBehindArm, enemy);
