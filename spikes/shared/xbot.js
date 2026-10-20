(() => {
const CFG = window.C28_CONFIG.robots.xbot;
const PALETTE = { ...CFG.palette };

const MAT = {
  armor: ["a0", "a1", "a2", "a3", "aLine"],
  metal: ["m0", "m1", "m2", "m3", "mLine"],
  chrome: ["c0", "c1", "c2", "c3", "mLine"]
};

const AX = CFG.frame.axis;
const SIDE_AX = CFG.frame.sideAxis;
const FOOT_Y = CFG.frame.footY;
const FINGER_LW = 0.4;

function parseTf(str) {
  const m = new DOMMatrix();
  if (!str) return m;
  for (const [, op, raw] of str.matchAll(/(\w+)\(([^)]*)\)/g)) {
    const a = raw.trim().split(/[\s,]+/).map(Number);
    if (op === "translate") m.translateSelf(a[0], a[1] || 0);
    else if (op === "scale") m.scaleSelf(a[0], a.length > 1 ? a[1] : a[0]);
    else if (op === "rotate") m.translateSelf(a[1] || 0, a[2] || 0).rotateSelf(a[0]).translateSelf(-(a[1] || 0), -(a[2] || 0));
  }
  return m;
}

function roundedPath(pts, r) {
  if (!r) return "M" + pts.map(p => p.join(",")).join("L") + "Z";
  const n = pts.length;
  let d = "";
  for (let i = 0; i < n; i++) {
    const p = pts[i], a = pts[(i - 1 + n) % n], b = pts[(i + 1) % n];
    const la = Math.hypot(a[0] - p[0], a[1] - p[1]), lb = Math.hypot(b[0] - p[0], b[1] - p[1]);
    const rr = Math.min(r, la / 2, lb / 2);
    const s = [p[0] + (a[0] - p[0]) / la * rr, p[1] + (a[1] - p[1]) / la * rr];
    const e = [p[0] + (b[0] - p[0]) / lb * rr, p[1] + (b[1] - p[1]) / lb * rr];
    d += (i ? "L" : "M") + s.join(",") + "Q" + p.join(",") + " " + e.join(",");
  }
  return d + "Z";
}

function flatten(pts, r, steps = 6) {
  if (!r) return pts;
  const n = pts.length, out = [];
  for (let i = 0; i < n; i++) {
    const p = pts[i], a = pts[(i - 1 + n) % n], b = pts[(i + 1) % n];
    const la = Math.hypot(a[0] - p[0], a[1] - p[1]), lb = Math.hypot(b[0] - p[0], b[1] - p[1]);
    const rr = Math.min(r, la / 2, lb / 2);
    const s = [p[0] + (a[0] - p[0]) / la * rr, p[1] + (a[1] - p[1]) / la * rr];
    const e = [p[0] + (b[0] - p[0]) / lb * rr, p[1] + (b[1] - p[1]) / lb * rr];
    for (let k = 0; k <= steps; k++) {
      const t = k / steps, u = 1 - t;
      out.push([u * u * s[0] + 2 * u * t * p[0] + t * t * e[0], u * u * s[1] + 2 * u * t * p[1] + t * t * e[1]]);
    }
  }
  return out;
}

function clipHalf(poly, side) {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i], q = poly[(i + 1) % poly.length];
    const dp = side(p), dq = side(q);
    if (dp >= 0) out.push(p);
    if (dp * dq < 0) {
      const t = dp / (dp - dq);
      out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]);
    }
  }
  return out;
}

function clipPoly(poly, convex) {
  const n = convex.length;
  const area = convex.reduce((s, p, i) => { const q = convex[(i + 1) % n]; return s + p[0] * q[1] - q[0] * p[1]; }, 0);
  const sgn = Math.sign(area);
  for (let i = 0; i < n && poly.length; i++) {
    const a = convex[i], b = convex[(i + 1) % n];
    poly = clipHalf(poly, p => sgn * ((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])));
  }
  return poly;
}

function polyPath(pts) {
  return pts.length > 2 ? new Path2D("M" + pts.map(p => p.join(",")).join("L") + "Z") : null;
}

function bbox(pts) {
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}

function mirrorPts(pts, ax = AX) {
  return pts.map(([x, y]) => [2 * ax - x, y]).reverse();
}

let lod = null;

function bulk(limb) {
  return lod?.bulk?.[limb] ?? 1;
}

function tiny(pts) {
  if (!lod) return false;
  const [x0, y0, x1, y1] = bbox(pts);
  const w = x1 - x0, h = y1 - y0;
  return Math.min(w, h) < lod.minThickness || w * h < lod.minArea;
}

function withLod(on, build) {
  lod = on ? CFG.gameLod : null;
  try { return build(); } finally { lod = null; }
}

function G(parent, tf, name, pivot, extra = {}) {
  const n = { k: "g", m: tf ? parseTf(tf) : null, name, pivot, kids: [], ...extra };
  parent.kids.push(n);
  return n;
}

function P(parent, spec) {
  const { pts } = spec;
  if (tiny(pts)) return;
  const r = lod && (spec.r ?? 4) < lod.minRadius ? 0 : spec.r ?? 4;
  parent.kids.push({ k: "part", spec, path: new Path2D(roundedPath(pts, r)), box: bbox(pts), r });
}

function F(parent, pts, fill, r = 0) {
  if (fill !== "visor" && tiny(pts)) return;
  parent.kids.push({ k: "flat", path: new Path2D(roundedPath(pts, r)), fill });
}

function E(parent, cx, cy, rx, ry, fill, opacity = 1) {
  if (tiny([[cx - rx, cy - ry], [cx + rx, cy + ry]])) return;
  parent.kids.push({ k: "ellipse", cx, cy, rx, ry, fill, opacity });
}

function hook(parent, name) {
  parent.kids.push({ k: "hook", name });
}

function both(parent, spec, ax = AX) {
  P(parent, spec);
  P(parent, { ...spec, pts: mirrorPts(spec.pts, ax) });
}

function trefoil(parent, x, y, r, sx = 1, outer = 0.84) {
  const g = G(parent, `translate(${x} ${y}) scale(${sx} 1)`);
  g.kids.push({ k: "trefoil", r, outer });
}

const leg = {
  piston: { pts: [[196, 340], [236, 340], [236, 440], [196, 440]], mat: "chrome", shade: "cyl", r: 1 },
  pistonRing: [[192, 360], [240, 360], [240, 368], [192, 368]],
  thigh: { pts: [[154, 338], [196, 337], [196, 430], [236, 430], [236, 339], [266, 340], [268, 452], [256, 468], [168, 468], [152, 452]], r: 1 },
  knee: { pts: [[150, 456], [272, 456], [276, 478], [262, 510], [232, 530], [190, 530], [160, 510], [146, 478]], mat: "chrome", r: 1 },
  shin: { pts: [[164, 508], [262, 508], [278, 690], [150, 690]], r: 1 },
  shinSlot: [[204, 600], [222, 600], [224, 668], [202, 668]],
  foot: { pts: [[146, 688], [282, 688], [290, 714], [286, 744], [142, 744], [136, 714]], mat: "metal", r: 1 },
  toe: { pts: [[152, 688], [276, 688], [282, 706], [146, 706]], r: 1 }
};
const holes = [[176, 478, 7], [211, 476, 7], [246, 478, 7], [192, 500, 5], [230, 500, 5]];
const pauldron = [[56, 100], [100, 90], [146, 98], [162, 128], [162, 170], [148, 198], [102, 210], [60, 200], [42, 170], [42, 126]];
const bicep = [[58, 184], [134, 184], [150, 207], [148, 248], [132, 276], [102, 284], [70, 278], [54, 250], [48, 209]];
const elbow = [[60, 296], [128, 296], [128, 316], [60, 316]];
const forearm = [[26, 310], [146, 308], [152, 320], [150, 394], [140, 404], [42, 406], [26, 390]];

const PR = CFG.proportions;
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
function legTf(kind, cx, sx = 0.82) {
  if (kind === "thigh") return `translate(${cx} 344) scale(${sx} 1.3) translate(${-cx} -344)`;
  if (kind === "knee") return `translate(0 36) translate(${cx} 0) scale(${sx} 1) translate(${-cx} 0)`;
  if (kind === "shin") return `translate(${cx} 548) scale(${sx} 0.835) translate(${-cx} -508)`;
  return `translate(${cx} 0) scale(${sx} 1) translate(${-cx} 0)`;
}
function legGroups(parent, kind) {
  return [
    G(parent, `translate(${LEG_SHIFT} 0) ${legTf(kind, LEG_CX)}`),
    G(parent, `translate(${-LEG_SHIFT} 0) ${legTf(kind, 2 * AX - LEG_CX)}`)
  ];
}
function legPair(parent, spec, kind = "foot") {
  const [l, r] = legGroups(parent, kind);
  P(l, spec);
  P(r, { ...spec, pts: mirrorPts(spec.pts) });
}
function legFlat(parent, pts, fill, kind = "foot") {
  const [l, r] = legGroups(parent, kind);
  F(l, pts, fill);
  F(r, mirrorPts(pts), fill);
}
function legOne(parent, kind, right) {
  return right
    ? G(parent, `translate(${-LEG_SHIFT} 0) ${legTf(kind, 2 * AX - LEG_CX)}`)
    : G(parent, `translate(${LEG_SHIFT} 0) ${legTf(kind, LEG_CX)}`);
}

function backLeg(s, right, enemy) {
  const M = p => right ? mirrorPts(p) : p;
  const sfx = right ? "R" : "L";
  const hx = right ? 2 * AX - LEG_CX - LEG_SHIFT : LEG_CX + LEG_SHIFT;
  const thigh = G(G(s, null, "leg" + sfx, [hx, 344]), null, "thigh" + sfx, [hx, 344]);
  P(legOne(thigh, "thigh", right), { ...leg.piston, pts: M(leg.piston.pts) });
  F(legOne(thigh, "thigh", right), M(leg.pistonRing), "m1");
  P(legOne(thigh, "thigh", right), { ...leg.thigh, pts: M(leg.thigh.pts) });
  const lower = G(s, null, "shin" + sfx, [hx, 522]);
  P(legOne(lower, "shin", right), { pts: M([[162, 500], [264, 500], [280, 690], [148, 690]]), r: 1 });
  if (!enemy) for (let i = 0; i < 4; i++) F(legOne(lower, "shin", right), M([[176, 560 + i * 26], [252, 560 + i * 26], [254, 566 + i * 26], [174, 566 + i * 26]]), "a0");
  P(legOne(lower, "knee", right), { pts: M([[178, 456], [244, 456], [246, 512], [176, 512]]), mat: enemy ? "armor" : "metal", shade: "cyl", r: 1 });
  P(legOne(lower, "foot", right), { pts: M([[146, 688], [282, 688], [290, 714], [286, 744], [142, 744], [136, 714]]), mat: "metal", r: 1 });
  hook(G(lower, `translate(${hx} 744)`), "foot" + sfx);
}

function bodyGroup(parent) {
  return G(parent, `translate(${AX} 0) scale(${BODY_SX} 1) translate(${-AX} 0)`);
}

function backArmGroup(parent, right) {
  return G(bodyGroup(parent), `translate(${right ? -BACK_SHOULDER_IN : BACK_SHOULDER_IN} 0)`);
}

function headFront(body, back, enemy) {
  const s = back ? body : G(body, null, "head", [320, 120]);
  P(s, { pts: [[306, 96], [334, 96], [336, 120], [304, 120]], mat: "metal", shade: "cyl", r: 2 });
  if (!enemy) both(s, { pts: [[246, 4], [256, 4], [258, 70], [244, 70]], r: 4, shade: "cyl" });
  both(s, { pts: [[240, 56], [266, 52], [268, 98], [242, 100]], r: 2 });
  const crest = () => P(s, { pts: [[313, 12], [327, 12], [330, 24], [326, 34], [314, 34], [310, 24]], r: 2 });
  if (back && !enemy) crest();
  P(s, { pts: [[264, 102], [262, 34], [276, 22], [364, 22], [378, 34], [376, 102]], r: 3 });
  if (!back && !enemy) crest();
  if (back) {
    if (enemy) return;
    F(s, [[274, 70], [366, 70], [366, 74], [274, 74]], "a0");
    F(s, [[318, 58], [322, 58], [322, 100], [318, 100]], "a0");
    return;
  }
  const face = G(s, null, "face", [320, 76]);
  P(face, { pts: [[272, 48], [368, 48], [368, 80], [348, 80], [348, 104], [292, 104], [292, 80], [272, 80]], mat: "metal", shade: "none", r: 2 });
  F(face, [[274, 50], [320, 50], [320, 102], [294, 102], [294, 78], [274, 78]], "m2");
  F(face, [[280, 56], [312, 56], [312, 63], [280, 63]], "visor", 1);
  F(face, mirrorPts([[280, 56], [312, 56], [312, 63], [280, 63]]), "visor", 1);
}

function frontHand(parent, M, thumbFront) {
  const thumb = () => {
    P(parent, { pts: M([[112, 412], [134, 408], [142, 430], [134, 452], [118, 448], [110, 430]]), r: 4 });
    F(parent, M([[116, 430], [136, 428], [136, 431], [116, 433]]), "a0");
  };
  if (!thumbFront) thumb();
  P(parent, { pts: M([[46, 400], [129, 398], [129, 434], [46, 436]]), mat: "metal", r: 2 });
  if (lod) for (let i = 0; i < 4; i++) P(parent, { pts: M([[46 + i * 21, 422], [65 + i * 21, 422], [65 + i * 21, 478], [46 + i * 21, 478]]), shade: "cyl", r: 4 });
  for (let i = 0; i < 4; i++) {
    const x = 46 + i * 21;
    P(parent, { pts: M([[x, 428], [x + 10, 422], [x + 20, 428], [x + 20, 444], [x, 444]]), shade: "cyl", r: 3, lw: FINGER_LW });
    P(parent, { pts: M([[x, 444], [x + 20, 444], [x + 20, 463], [x, 463]]), shade: "cyl", r: 2, lw: FINGER_LW });
    P(parent, { pts: M([[x, 463], [x + 20, 463], [x + 20, 478], [x, 478]]), r: 2, lw: FINGER_LW });
  }
  if (thumbFront) thumb();
}

function frontArm(parent, mirror, names = {}, thumbFront = false, foreParent = null, flipHand = false, foreUnder = false, propBehindArm = false) {
  const M = p => mirror ? mirrorPts(p) : p;
  const sh = mirror ? [2 * AX - 100, 150] : [100, 150];
  const el = mirror ? [2 * AX - 90, 306] : [90, 306];
  const arm = G(parent, null, names.arm, sh);
  const foreTf = `translate(${mirror ? -FORE_SHIFT : FORE_SHIFT} -22)`;
  const under = foreUnder ? G(arm, foreTf, names.fore, el) : null;
  P(G(arm, `translate(${mirror ? -6 : 6} -22)`), { pts: M(elbow), mat: "metal", shade: "hcyl", r: 1 });
  const domes = G(arm, `translate(${sh[0]} 0) scale(${bulk("arms")} 1) translate(${-sh[0]} 0)`);
  P(domes, { pts: M(bicep), r: 18, shade: "dome" });
  const fore = under || G(foreParent ? G(foreParent, null, names.arm, sh) : arm, foreTf, names.fore, el);
  const fc = mirror ? 2 * AX - 89 : 89;
  if (names.hand && propBehindArm) hook(G(fore, `translate(${fc} 440)`), names.hand);
  const fa = G(fore, `translate(${fc} 0) scale(${FOREARM_SX} 1) translate(${-fc} 0)`);
  P(fa, { pts: M(forearm), r: 1 });
  F(fa, M([[30, 354], [150, 352], [150, 356], [30, 358]]), "a0");
  F(fa, M([[30, 374], [150, 372], [150, 376], [30, 378]]), "a0");
  const hand = G(fore, `translate(${mirror ? 2 * AX - 89 : 89} 440)`);
  if (names.hand && !propBehindArm) hook(hand, names.hand);
  const hc = mirror ? 2 * AX - 89 : 89;
  frontHand(fore, flipHand ? p => mirrorPts(M(p), hc) : M, thumbFront);
}

function shoulder(parent, mirror, arm) {
  const x = mirror ? 2 * AX - 100 : 100;
  const domes = G(G(parent, null, arm, [x, 150]), `translate(${x} 0) scale(${bulk("arms")} 1) translate(${-x} 0)`);
  P(domes, { pts: mirror ? mirrorPts(pauldron) : pauldron, r: 20, shade: "dome" });
}

function buildFront({ lod: low = false, rightArmFirst = false, propBehindArm = false, enemy = false } = {}) {
  return withLod(low, () => frontTree({ rightArmFirst, propBehindArm, enemy }));
}

function frontTree({ rightArmFirst, propBehindArm, enemy }) {
  const root = { k: "g", kids: [] };
  const s = G(root, null, "body", [AX, 344]);
  P(bodyGroup(s), { pts: [[248, 316], [392, 316], [398, 352], [374, 392], [320, 404], [266, 392], [242, 352]], r: 18 });
  const hipBar = bodyGroup(s);
  P(hipBar, { pts: [[198, 318], [442, 318], [442, 372], [198, 372]], mat: "chrome", shade: "hcyl", r: 6 });
  for (const x of [214, 236, 398, 420]) F(hipBar, [[x, 318], [x + 6, 318], [x + 6, 372], [x, 372]], "m1");
  legPair(s, leg.piston, "thigh");
  legFlat(s, leg.pistonRing, "m1", "thigh");
  legPair(s, leg.thigh, "thigh");
  if (!enemy) for (let i = 0; i < 3; i++) legFlat(s, [[160, 372 + i * 16], [190, 372 + i * 16], [190, 376 + i * 16], [160, 376 + i * 16]], "a0", "thigh");
  legPair(s, leg.shin, "shin");
  if (!enemy) legPair(s, { pts: leg.shinSlot, mat: "metal", shade: "none", r: 1 }, "shin");
  legPair(s, leg.foot);
  legPair(s, leg.toe);
  legPair(s, enemy ? { ...leg.knee, mat: "armor" } : leg.knee, "knee");
  const [kl, kr] = legGroups(s, "knee");
  for (const [x, y, r] of holes) {
    E(kl, x, y, r, r * 0.8, "hole");
    E(kr, 2 * AX - x, y, r, r * 0.8, "hole");
  }
  const b = bodyGroup(s);
  P(b, { pts: [[172, 196], [250, 178], [320, 172], [390, 178], [468, 196], [446, 300], [436, 322], [204, 322], [194, 300]], mat: "metal", r: 10 });
  P(b, { pts: [[300, 182], [340, 182], [340, 304], [300, 304]], mat: "chrome", shade: "cyl", r: 3 });
  for (let i = 0; i < 6; i++) {
    const y = 194 + i * 18;
    both(b, { pts: [[252, y], [300, y], [300, y + 10], [252, y + 10]], mat: "chrome", shade: "hcyl", r: 4 });
  }
  P(b, { pts: [[196, 250], [232, 250], [232, 270], [196, 270]], mat: "metal", shade: "none", r: 2 });
  F(b, [[200, 254], [228, 254], [228, 266], [200, 266]], "screen", 2);
  E(b, 214, 288, 14, 9, "m0");
  E(b, 214, 288, 9, 5, "screen", 0.7);
  P(b, { pts: [[200, 300], [440, 300], [438, 322], [202, 322]], mat: "metal", shade: "none", r: 3 });
  P(b, { pts: [[262, 318], [378, 318], [384, 340], [370, 372], [340, 398], [320, 410], [300, 398], [270, 372], [256, 340]], r: 18 });
  P(b, { pts: [[148, 132], [178, 112], [250, 106], [320, 104], [390, 106], [462, 112], [492, 132], [502, 166], [478, 196], [446, 204], [418, 238], [394, 254], [356, 258], [334, 222], [320, 214], [306, 222], [284, 258], [246, 254], [222, 238], [194, 204], [162, 196], [138, 166]], r: 16 });
  F(b, [[317, 110], [323, 110], [323, 150], [317, 150]], "m0");
  P(b, { pts: [[300, 160], [340, 160], [344, 182], [330, 196], [310, 196], [296, 182]], r: 12, shade: "dome" });
  if (!enemy) trefoil(b, 418, 150, BADGE_R, 1 / BODY_SX);
  headFront(s, false, enemy);
  const arms = bodyGroup(s);
  const left = () => frontArm(arms, false, { arm: "armL", fore: "foreL", hand: "handL" }, false, null, false, false, propBehindArm);
  const right = () => frontArm(arms, true, { arm: "armR", fore: "foreR", hand: "handR" });
  if (rightArmFirst) { right(); left(); } else { left(); right(); }
  const shoulders = bodyGroup(s);
  shoulder(shoulders, false, "armL");
  shoulder(shoulders, true, "armR");
  return root;
}

function buildBack({ leftArmBehind = false, rightForeBehind = false, thumbsBehind = false, forearmsUnder = false, lod: low = false, enemy = false } = {}) {
  return withLod(low, () => backTree({ leftArmBehind, rightForeBehind, thumbsBehind, forearmsUnder, enemy }));
}

function backDetail(b) {
  F(b, [[316, 104], [324, 104], [324, 262], [316, 262]], "a0");
  for (const side of [false, true]) {
    const M = p => side ? mirrorPts(p) : p;
    F(b, M([[220, 150], [268, 146], [268, 152], [220, 156]]), "a0");
    for (const [x, y] of [[236, 196], [278, 230]]) E(b, side ? 2 * AX - x : x, y, 4, 4, "a0");
  }
  for (const [x, y, h] of [[250, 160, 40], [268, 170, 60], [384, 150, 50], [404, 200, 34]]) F(b, [[x, y], [x + 4, y], [x + 3, y + h], [x + 1, y + h]], "a0");
}

function backTree({ leftArmBehind, rightForeBehind, thumbsBehind, forearmsUnder, enemy }) {
  const root = { k: "g", kids: [] };
  const s = G(root, null, "body", [AX, 344]);
  if (leftArmBehind) frontArm(backArmGroup(s, false), false, { arm: "armL", fore: "foreL", hand: "handL" }, !thumbsBehind);
  const behindRight = rightForeBehind ? backArmGroup(s, true) : null;
  P(bodyGroup(s), { pts: [[198, 318], [442, 318], [442, 372], [198, 372]], mat: "chrome", shade: "hcyl", r: 6 });
  backLeg(s, false, enemy);
  backLeg(s, true, enemy);
  const b = bodyGroup(s);
  P(b, { pts: [[248, 316], [392, 316], [398, 352], [374, 392], [320, 404], [266, 392], [242, 352]], r: 18 });
  P(b, { pts: [[172, 196], [468, 196], [446, 300], [436, 322], [204, 322], [194, 300]], mat: "metal", r: 10 });
  P(b, { pts: [[148, 132], [178, 112], [250, 106], [320, 104], [390, 106], [462, 112], [492, 132], [502, 166], [478, 196], [446, 204], [418, 238], [394, 254], [356, 262], [320, 266], [284, 262], [246, 254], [222, 238], [194, 204], [162, 196], [138, 166]], r: 16 });
  if (!enemy) backDetail(b);
  headFront(s, true, enemy);
  if (!leftArmBehind) frontArm(backArmGroup(s, false), false, { arm: "armL", fore: "foreL", hand: "handL" }, !thumbsBehind, null, false, forearmsUnder);
  frontArm(backArmGroup(s, true), true, { arm: "armR", fore: "foreR", hand: "handR" }, !rightForeBehind && !thumbsBehind, behindRight, rightForeBehind, forearmsUnder);
  shoulder(backArmGroup(s, false), false, "armL");
  shoulder(backArmGroup(s, true), true, "armR");
  hook(G(s, `translate(330 236) rotate(${-0.95 * 180 / Math.PI}) translate(-40 -60)`), "back");
  return root;
}

function sideLeg(parent, names, extra, enemy) {
  const sx = 0.88 * bulk("sideLegs");
  const hip = G(parent, null, names.hip, [300, 344], extra);
  const th = G(hip, legTf("thigh", SIDE_AX, sx));
  P(th, { pts: [[278, 342], [314, 342], [314, 440], [278, 440]], mat: "chrome", shade: "cyl", r: 1 });
  P(th, { pts: [[246, 338], [278, 338], [278, 432], [314, 432], [314, 338], [342, 338], [346, 452], [334, 468], [258, 468], [246, 452]], r: 1 });
  const knee = G(hip, null, names.knee, [300, 522]);
  const sh = G(knee, legTf("shin", SIDE_AX, sx));
  P(sh, { pts: [[256, 500], [340, 500], [354, 690], [240, 690]], r: 1 });
  if (!enemy) P(sh, { pts: [[298, 540], [312, 540], [316, 660], [298, 660]], mat: "metal", shade: "none", r: 1 });
  const ankle = G(knee, null, names.ankle, [300, 700]);
  const ft = G(ankle, legTf("foot", SIDE_AX, 0.88));
  P(ft, { pts: [[204, 688], [384, 688], [402, 712], [398, 744], [202, 744]], mat: "metal", r: 1 });
  P(ft, { pts: [[300, 688], [384, 688], [396, 706], [300, 706]], r: 1 });
  if (names.heel) hook(G(ankle, "translate(220 744)"), names.heel);
  if (names.toe) hook(G(ankle, "translate(380 744)"), names.toe);
  const kn = G(knee, legTf("knee", SIDE_AX, sx));
  E(kn, 300, 486, 30, 30, "m1");
  E(kn, 294, 480, 12, 12, "m3");
  P(kn, { pts: [[300, 448], [340, 452], [362, 478], [362, 510], [344, 534], [318, 532], [310, 500]], mat: enemy ? "armor" : "chrome", r: 1 });
}

function sideHand(parent) {
  P(parent, { pts: [[342, 410], [366, 406], [374, 428], [366, 448], [350, 444], [340, 428]], r: 4 });
  P(parent, { pts: [[270, 398], [353, 396], [353, 434], [270, 436]], mat: "metal", r: 2 });
  if (lod) for (let i = 0; i < 4; i++) P(parent, { pts: [[270 + i * 21, 422], [289 + i * 21, 422], [289 + i * 21, 478], [270 + i * 21, 478]], shade: "cyl", r: 4 });
  for (let i = 0; i < 4; i++) {
    const x = 270 + i * 21;
    P(parent, { pts: [[x, 428], [x + 10, 422], [x + 20, 428], [x + 20, 444], [x, 444]], shade: "cyl", r: 3, lw: FINGER_LW });
    P(parent, { pts: [[x, 444], [x + 20, 444], [x + 20, 463], [x, 463]], shade: "cyl", r: 2, lw: FINGER_LW });
    P(parent, { pts: [[x, 463], [x + 20, 463], [x + 20, 478], [x, 478]], r: 2, lw: FINGER_LW });
  }
}

function sideArm(parent, names, extra) {
  const arm = G(parent, "translate(2 -4)", names.arm, [300, 150], extra);
  P(arm, { pts: [[288, 274], [334, 274], [334, 294], [288, 294]], mat: "metal", shade: "cyl", r: 1 });
  const lower = G(arm, "translate(0 -22) rotate(-18 311 288)", names.fore, [311, 288]);
  if (names.hand && extra?.propBehindArm) hook(G(lower, "translate(312 438)"), names.hand);
  const fa = G(lower, `translate(312 0) scale(${FOREARM_SX} 1) translate(-312 0)`);
  P(fa, { pts: [[262, 290], [358, 286], [366, 302], [366, 392], [354, 402], [270, 404], [258, 390]], r: 1 });
  F(fa, [[264, 352], [366, 350], [366, 354], [264, 356]], "a0");
  F(fa, [[264, 372], [366, 370], [366, 374], [264, 376]], "a0");
  const hand = G(lower, "translate(312 438)");
  if (names.hand && !extra?.propBehindArm) hook(hand, names.hand);
  sideHand(lower);
  const bulbs = G(arm, `translate(${SS.cx} 0) scale(${bulk("arms")} 1) translate(${-SS.cx} 0) ${SIDE_SHOULDER_TF}`);
  P(bulbs, { pts: [[276, 196], [346, 196], [364, 220], [360, 257], [340, 279], [308, 286], [280, 278], [264, 254], [264, 217]], r: 18, shade: "dome" });
  P(bulbs, { pts: [[248, 106], [292, 96], [336, 102], [362, 126], [370, 164], [358, 196], [330, 212], [292, 216], [256, 206], [234, 182], [230, 146], [236, 122]], r: 22, shade: "dome" });
}

function buildSide({ farLimbs = false, badge = false, propBehindArm = false, lod: low = false, enemy = false } = {}) {
  return withLod(low, () => sideTree({ farLimbs, badge: badge && !enemy, propBehindArm, enemy }));
}

function sideTree({ farLimbs, badge, propBehindArm, enemy }) {
  const root = { k: "g", kids: [] };
  const s = G(root, null, "body", [SIDE_AX, 344]);
  if (farLimbs) {
    const far = { dim: 0.55 };
    sideArm(G(s, "translate(-20 0)"), { arm: "armFar", fore: "foreFar", hand: "handFar" }, far);
    sideLeg(G(s, "translate(-24 0)"), { hip: "hipFar", knee: "kneeFar", ankle: "ankleFar", heel: "heelFar", toe: "toeFar" }, far, enemy);
  }
  const lowerTorso = G(s, SIDE_TORSO_TF);
  P(lowerTorso, { pts: [[222, 316], [398, 316], [398, 372], [222, 372]], mat: "chrome", shade: "hcyl", r: 2 });
  P(lowerTorso, { pts: [[214, 236], [390, 236], [378, 322], [226, 322]], mat: "metal", r: 2 });
  for (let i = 0; i < 4; i++) P(lowerTorso, { pts: [[300, 244 + i * 18], [380, 244 + i * 18], [380, 254 + i * 18], [300, 254 + i * 18]], mat: "chrome", shade: "hcyl", r: 4 });
  P(lowerTorso, { pts: [[350, 318], [392, 318], [400, 344], [390, 380], [366, 404], [352, 400]], r: 2 });
  P(lowerTorso, { pts: [[216, 316], [264, 316], [268, 352], [256, 392], [234, 404], [214, 394], [206, 352]], r: 6 });
  sideLeg(s, { hip: "hipNear", knee: "kneeNear", ankle: "ankleNear", heel: "heelNear", toe: "toeNear" }, undefined, enemy);
  const upperTorso = G(s, SIDE_TORSO_TF, "chest", [SIDE_AX, 344]);
  P(upperTorso, { pts: [[194, 112], [406, 112], [388, 330], [212, 330]], mat: "metal", r: 2 });
  const sideChestPlate = [[352, 104], [400, 104], [412, 118], [412, 212], [402, 240], [386, 248], [368, 236], [352, 220]];
  P(upperTorso, { pts: mirrorPts(sideChestPlate, SIDE_AX), r: 12 });
  hook(G(upperTorso, `translate(218 170) scale(${1 / SIDE_TORSO_SX} 1) rotate(30)`), "back");
  P(upperTorso, { pts: sideChestPlate, r: 12 });
  if (badge) trefoil(upperTorso, 400, 150, BADGE_R, 0.5 / SIDE_TORSO_SX, 0.68);
  const head = G(s, "translate(-28 0)", "head", [320, 156]);
  P(head, { pts: [[300, 100], [336, 100], [340, 160], [304, 160]], mat: "metal", shade: "none", r: 4 });
  P(head, { pts: [[312, 96], [336, 96], [338, 120], [310, 120]], mat: "metal", shade: "cyl", r: 2 });
  P(head, { pts: [[282, 102], [280, 34], [292, 22], [374, 22], [388, 34], [388, 104]], r: 3 });
  if (!enemy) P(head, { pts: [[300, 24], [304, 12], [382, 12], [388, 24], [388, 34], [376, 24]], r: 2 });
  P(head, { pts: [[356, 48], [388, 48], [388, 104], [372, 104], [372, 80], [356, 80]], mat: "metal", shade: "none", r: 2 });
  F(head, [[368, 56], [388, 56], [388, 63], [368, 63]], "visor", 1);
  P(head, { pts: [[300, 56], [328, 52], [330, 98], [302, 100]], r: 2 });
  if (!enemy) P(head, { pts: [[308, 4], [318, 4], [320, 70], [306, 70]], r: 4, shade: "cyl" });
  sideArm(s, { arm: "arm", fore: "fore", hand: "hand" }, propBehindArm ? { propBehindArm } : undefined);
  return root;
}

function bands(g, colors, stops) {
  g.addColorStop(0, colors[0]);
  stops.forEach((s, i) => { g.addColorStop(s, colors[i]); g.addColorStop(s, colors[i + 1]); });
  g.addColorStop(1, colors[colors.length - 1]);
  return g;
}

function baseFill(ctx, node, simple, c0, c1, c2, c3) {
  const key = (simple ? "s" : "f") + c0 + c1 + c2 + c3;
  if (node.fillKey === key) return node.fill;
  const { spec: { shade = "box" }, box: [x0, y0, x1, y1] } = node;
  const w = x1 - x0, h = y1 - y0;
  let fill = c1;
  if (shade === "box") {
    const a = 0.09 * w / h, c = w / (1 + a * a);
    fill = bands(ctx.createLinearGradient(x0, y0, x0 + c, y0 + c * a), [c2, c1, c0], [0.355, 0.805]);
  } else if (shade === "cyl") {
    const g = ctx.createLinearGradient(x0, 0, x1, 0);
    fill = simple ? bands(g, [c2, c1, c0], [0.3, 0.75]) : bands(g, [c2, c3, c2, c1, c0], [0.12, 0.2, 0.3, 0.75]);
  } else if (shade === "hcyl") {
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    fill = simple ? bands(g, [c2, c1, c0], [0.32, 0.72]) : bands(g, [c2, c3, c2, c1, c0], [0.14, 0.22, 0.32, 0.72]);
  } else if (shade === "dome") fill = bands(ctx.createRadialGradient(0.36, 0.34, 0.29, 0.44, 0.44, 0.5), [c2, c1, c0], [0, 1]);
  node.fill = fill;
  node.fillKey = key;
  return fill;
}

function bottomBand(node) {
  if (node.band !== undefined) return node.band;
  const [x0, y0, x1, y1] = node.box;
  const w = x1 - x0, h = y1 - y0;
  const b = 0.04 * h / w, c = h / (1 + b * b);
  const dx = -c * b, dy = c, cut = 0.88 * (dx * dx + dy * dy);
  node.band = polyPath(clipHalf(flatten(node.spec.pts, node.r), p => (p[0] - x0) * dx + (p[1] - y0) * dy - cut));
  return node.band;
}

function lineWidth(ctx, lineW) {
  const t = ctx.getTransform();
  return lineW / Math.sqrt(Math.abs(t.a * t.d - t.b * t.c));
}

function unitPath(node) {
  const [x0, y0, x1, y1] = node.box;
  const p = new Path2D();
  p.addPath(node.path, new DOMMatrix().scale(1 / (x1 - x0), 1 / (y1 - y0)).translate(-x0, -y0));
  return p;
}

function fillUnit(ctx, node) {
  const [x0, y0, x1, y1] = node.box;
  node.unitPath ||= unitPath(node);
  ctx.save();
  ctx.translate(x0, y0);
  ctx.scale(x1 - x0, y1 - y0);
  ctx.fill(node.unitPath);
  ctx.restore();
}

function highlight(node) {
  const [x0, y0, x1, y1] = node.box;
  const w = x1 - x0, h = y1 - y0;
  const { shade = "box" } = node.spec;
  let shape = null;
  if (shade === "box" && w > 24 && h > 24) shape = [[x0 + w * 0.1, y0 + h * 0.08], [x0 + w * 0.22, y0 + h * 0.08], [x0 + w * 0.15, y0 + h * 0.4], [x0 + w * 0.06, y0 + h * 0.4]];
  if (shade === "dome") {
    const cx = x0 + w * 0.3, cy = y0 + h * 0.26, rx = w * 0.09, ry = h * 0.06;
    shape = Array.from({ length: 24 }, (_, i) => [cx + rx * Math.cos(i * Math.PI / 12), cy + ry * Math.sin(i * Math.PI / 12)]);
  }
  return shape && polyPath(clipPoly(flatten(node.spec.pts, node.r), shape));
}

function drawHighlight(ctx, node, c3) {
  if (node.hl === undefined) node.hl = highlight(node);
  if (!node.hl) return;
  ctx.fillStyle = c3;
  ctx.fill(node.hl);
}

function drawPart(ctx, node, pal, lineW, simple) {
  const { spec, path } = node;
  const { mat = "armor", shade = "box", line = true, lw = 1 } = spec;
  const [c0, c1, c2, c3, cl] = MAT[mat].map(k => pal[k]);
  ctx.fillStyle = baseFill(ctx, node, simple, c0, c1, c2, c3);
  if (shade === "dome") fillUnit(ctx, node);
  else ctx.fill(path);
  if (!simple) {
    const band = shade === "box" && bottomBand(node);
    if (band) {
      ctx.fillStyle = c0;
      ctx.fill(band);
    }
    drawHighlight(ctx, node, c3);
  }
  if (line && lineW) {
    ctx.strokeStyle = cl;
    ctx.lineJoin = "round";
    ctx.lineWidth = lineWidth(ctx, lineW * lw);
    ctx.stroke(path);
  }
}

function drawTrefoil(ctx, r, pal, lineW, outer = 0.84) {
  ctx.fillStyle = pal.badge;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  if (lineW) {
    ctx.strokeStyle = pal.aLine;
    ctx.lineWidth = lineWidth(ctx, lineW);
    ctx.stroke();
  }
  ctx.fillStyle = pal.trefoil;
  ctx.beginPath(); ctx.arc(0, 0, r * 0.17, 0, Math.PI * 2); ctx.fill();
  for (let i = 0; i < 3; i++) {
    const a0 = -Math.PI / 2 + i * 2 * Math.PI / 3 - Math.PI / 6, a1 = a0 + Math.PI / 3;
    ctx.beginPath();
    ctx.arc(0, 0, r * outer, a0, a1);
    ctx.arc(0, 0, r * 0.3, a1, a0, true);
    ctx.fill();
  }
}

function shadeColor(hex, brightness, saturate) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const s = saturate, k = brightness;
  const out = [
    (0.213 + 0.787 * s) * r + (0.715 - 0.715 * s) * g + (0.072 - 0.072 * s) * b,
    (0.213 - 0.213 * s) * r + (0.715 + 0.285 * s) * g + (0.072 - 0.072 * s) * b,
    (0.213 - 0.213 * s) * r + (0.715 - 0.715 * s) * g + (0.072 + 0.928 * s) * b
  ].map(v => Math.round(Math.min(255, Math.max(0, v * k))));
  return "#" + ((1 << 24) | (out[0] << 16) | (out[1] << 8) | out[2]).toString(16).slice(1);
}

const shaded = new WeakMap();

function shade(pal, { brightness = 1, saturate = 1 } = {}) {
  if (brightness === 1 && saturate === 1) return pal;
  if (!shaded.has(pal)) shaded.set(pal, new Map());
  const memo = shaded.get(pal), key = brightness + "," + saturate;
  const sig = Object.values(pal).join();
  const hit = memo.get(key);
  if (hit && hit.sig === sig) return hit.out;
  const out = {};
  for (const k in pal) out[k] = shadeColor(pal[k], brightness, saturate);
  memo.set(key, { sig, out });
  return out;
}

function joint(v) {
  if (!v) return null;
  if (typeof v === "number") return { dx: 0, dy: 0, rot: v, sx: 1, sy: 1 };
  return { dx: 0, dy: 0, rot: 0, sx: 1, sy: 1, ...v };
}

function render(ctx, node, { pal = PALETTE, pose = {}, hooks = {}, lineW = 1.4, simple = false } = {}) {
  if (node.k === "g") {
    ctx.save();
    if (node.m) ctx.transform(node.m.a, node.m.b, node.m.c, node.m.d, node.m.e, node.m.f);
    if (node.dim) pal = shade(pal, { brightness: node.dim });
    const j = node.name != null ? joint(pose[node.name]) : null;
    if (j?.tint) pal = shade(pal, j.tint);
    if (j) {
      ctx.translate(j.dx + node.pivot[0], j.dy + node.pivot[1]);
      ctx.rotate(j.rot * Math.PI / 180);
      ctx.scale(j.sx, j.sy);
      ctx.translate(-node.pivot[0], -node.pivot[1]);
    }
    for (const kid of node.kids) render(ctx, kid, { pal, pose, hooks, lineW, simple });
    ctx.restore();
  } else if (node.k === "part") {
    drawPart(ctx, node, pal, lineW, simple);
  } else if (node.k === "flat") {
    ctx.fillStyle = pal[node.fill] || node.fill;
    ctx.fill(node.path);
  } else if (node.k === "ellipse") {
    ctx.save();
    ctx.globalAlpha *= node.opacity;
    ctx.fillStyle = pal[node.fill] || node.fill;
    ctx.beginPath(); ctx.ellipse(node.cx, node.cy, node.rx, node.ry, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  } else if (node.k === "trefoil") {
    drawTrefoil(ctx, node.r, pal, lineW, node.outer);
  } else if (node.k === "hook" && hooks[node.name]) {
    hooks[node.name](ctx, pal);
  }
}

function locate(node, name, pose = {}, m = new DOMMatrix()) {
  if (node.k === "hook") return node.name === name ? m : null;
  if (node.k !== "g") return null;
  let mm = node.m ? m.multiply(node.m) : m;
  const j = node.name != null ? joint(pose[node.name]) : null;
  if (j) mm = mm.translate(j.dx + node.pivot[0], j.dy + node.pivot[1]).rotate(j.rot).scale(j.sx, j.sy).translate(-node.pivot[0], -node.pivot[1]);
  for (const kid of node.kids) {
    const r = locate(kid, name, pose, mm);
    if (r) return r;
  }
  return null;
}

const SEEDED_PASSES = [[12, 3], [3, 1], [1, 0.25]];
const FULL_PASSES = [[4, 1], [1, 0.25]];
const SEED_TOLERANCE = 0.5;

function solve(root, hook, pose, keys, ranges, target, seed = null) {
  const hit = (a, b) => {
    const pt = locate(root, hook, { ...pose, [keys[0]]: a, [keys[1]]: b }).transformPoint(new DOMPoint(0, 0));
    return Math.hypot(pt.x - target.x, pt.y - target.y);
  };
  const refine = (best, passes) => {
    for (const [range, step] of passes) {
      const [, a0, b0] = best;
      for (let a = a0 - range; a <= a0 + range; a += step) for (let b = b0 - range; b <= b0 + range; b += step) {
        const d = hit(a, b);
        if (d < best[0]) best = [d, a, b];
      }
    }
    return best;
  };
  const full = () => {
    let best = [Infinity, 0, 0];
    for (let a = ranges[0][0]; a <= ranges[0][1]; a += 4) for (let b = ranges[1][0]; b <= ranges[1][1]; b += 4) {
      const d = hit(a, b);
      if (d < best[0]) best = [d, a, b];
    }
    return refine(best, FULL_PASSES);
  };
  let best = seed ? refine([hit(seed[keys[0]], seed[keys[1]]), seed[keys[0]], seed[keys[1]]], SEEDED_PASSES) : null;
  if (!best || best[0] > SEED_TOLERANCE) best = full();
  return { [keys[0]]: best[1], [keys[1]]: best[2] };
}

const LEVELS = Object.entries(CFG.levels);

window.XBOT = { locate, solve, shade, PALETTE, AX, SIDE_AX, FOOT_Y, mirrorPts, buildFront, buildBack, buildSide, render, LEVELS };
})();
