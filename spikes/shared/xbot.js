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
    if (op === "translate") m.multiplySelf(new DOMMatrix([1, 0, 0, 1, a[0], a[1] || 0]));
    else if (op === "scale") m.multiplySelf(new DOMMatrix([a[0], 0, 0, a.length > 1 ? a[1] : a[0], 0, 0]));
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

function bbox(pts) {
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}

function mirrorPts(pts, ax = AX) {
  return pts.map(([x, y]) => [2 * ax - x, y]).reverse();
}

let lod = null;

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
function capsule([x1, y1, r1], [x2, y2, r2], neck, steps = 10) {
  const dir = Math.atan2(y2 - y1, x2 - x1);
  const top = Math.asin(neck / 2 / r1), bottom = Math.PI - Math.asin(neck / 2 / r2);
  const arc = (x, y, r, from, to) => Array.from({ length: steps + 1 }, (_, i) => {
    const a = from + (to - from) * i / steps;
    return [x + r * Math.cos(a), y + r * Math.sin(a)];
  });
  return [...arc(x1, y1, r1, dir + top, dir + 2 * Math.PI - top), ...arc(x2, y2, r2, dir - bottom, dir + bottom)];
}
const upperArm = capsule([100, 148, 46], [100, 236, 46], 56);
const sideUpperArm = capsule([300, 156, 62], [314, 240, 48], 60);
const elbow = [[60, 296], [128, 296], [128, 316], [60, 316]];
const FRONT_HAND_DY = 16;
const ELBOW_R = [2 * AX - 100, 236];
const ELBOW_DROP = 10;
const SIDE_FORE_TURN = 18;
const JAB_DROP = 10;
const JAB_NEAR = 1.3;
const GUARD_DROP = -60;
const SIDE_SUPPORT_LIFT = 10;
const forearm = [[35, 306], [138, 304], [143, 318], [141, 408], [133, 420], [49, 422], [35, 403]];

const PR = CFG.proportions;
const LEG_SHIFT = PR.legShift;
const LEG_CX = PR.legCenterX;
const BODY_SX = PR.bodyScaleX;
const FORE_SHIFT = PR.forearmShift;
const SHOULDER_IN = PR.shoulderIn;
const BADGE_R = PR.badgeRadius;
const FOREARM_SX = PR.forearmScaleX;
const FORE_S = PR.forearmScale;
const HOLD_TF = `scale(${1 / FORE_S})`;
const SUPPORT_TF = `translate(${ELBOW_R[0]} ${ELBOW_R[1] + ELBOW_DROP}) scale(${FORE_S} ${-FORE_S}) translate(-88 -434)`;
const SIDE_FORE_TF = `translate(0 -22) rotate(${-SIDE_FORE_TURN} 311 288) translate(311 288) scale(${FORE_S}) translate(-311 -288)`;
const JAB_TF = `translate(${ELBOW_R[0]} ${ELBOW_R[1] + JAB_DROP}) scale(${-FORE_S * JAB_NEAR} ${FORE_S * JAB_NEAR}) translate(-88 -434)`;
const ELBOW_L = [100, 236];
const GUARD_TF = `translate(${ELBOW_L[0]} ${ELBOW_L[1] + GUARD_DROP}) scale(${FORE_S}) translate(-88 -434)`;
const SIDE_SUPPORT = [312, 438];
const SIDE_ELBOW = [311, 288];
const SIDE_FORE_YAW = 45;
const ARMED_ARM_BACK = 15;
const GRIP_HOLD = 19;
const YAW_K = Math.cos(SIDE_FORE_YAW * Math.PI / 180);
const SIDE_YAW_TF = `translate(${SIDE_ELBOW[0]} ${SIDE_ELBOW[1]}) scale(1 ${YAW_K}) translate(${-SIDE_ELBOW[0]} ${-SIDE_ELBOW[1]})`;
const SIDE_SUPPORT_YAWED = [SIDE_SUPPORT[0], SIDE_ELBOW[1] + (SIDE_SUPPORT[1] - SIDE_ELBOW[1]) * YAW_K];
const sideSupportTf = ([x, y]) => `translate(${x} ${y - SIDE_SUPPORT_LIFT / FORE_S}) scale(1 -1) translate(-88 -434)`;
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

function armGroup(parent, right) {
  return G(bodyGroup(parent), `translate(${right ? -SHOULDER_IN : SHOULDER_IN} 0)`);
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

function frontHand(parent, M, thumbBehind) {
  profileHand(parent, p => M(mirrorPts(p, HAND_AX).map(([x, y]) => [x, y + FRONT_HAND_DY])), thumbBehind);
}

function frontArm(parent, mirror, names = {}, thumbFront = false, foreParent = null, flipHand = false, propBehindArm = false, hold = null) {
  const M = p => mirror ? mirrorPts(p) : p;
  const sh = mirror ? [2 * AX - 100, 150] : [100, 150];
  const el = mirror ? [2 * AX - 90, 306] : [90, 306];
  const arm = G(parent, null, names.arm, sh);
  const foreTf = `translate(${mirror ? -FORE_SHIFT : FORE_SHIFT} -22) translate(${el[0]} ${el[1]}) scale(${FORE_S}) translate(${-el[0]} ${-el[1]})`;
  const support = hold === "cup" || hold === "jab" || hold === "guard";
  if (!support) P(G(arm, `translate(${mirror ? -6 : 6} -22)`), { pts: M(elbow), mat: "metal", shade: "hcyl", r: 1 });
  const fore = G(foreParent ? G(foreParent, null, names.arm, sh) : arm, foreTf, names.fore, el);
  const fc = mirror ? 2 * AX - 89 : 89;
  if (names.hand && propBehindArm) hook(G(fore, `translate(${fc} ${440 + FRONT_HAND_DY}) ${HOLD_TF}${hold === "gunGrip" ? ` scale(1 ${1 / BODY_SX}) translate(${GRIP_HOLD} 0)` : ""}`), names.hand);
  if (!support) {
    const fa = G(fore, `translate(${fc} 0) scale(${FOREARM_SX} 1) translate(${-fc} 0)`);
    P(fa, { pts: M(forearm), r: 1 });
    F(fa, M([[38, 359], [141, 357], [141, 362], [38, 364]]), "a0");
    F(fa, M([[38, 384], [141, 381], [141, 386], [38, 388]]), "a0");
  }
  const hand = G(fore, `translate(${mirror ? 2 * AX - 89 : 89} ${440 + FRONT_HAND_DY}) ${HOLD_TF}`);
  if (names.hand && !propBehindArm) hook(hand, names.hand);
  const hc = mirror ? 2 * AX - 89 : 89;
  if (hold === "gunGrip") heldHand(fore, hold, "back", `${mirror ? `translate(${2 * AX} 0) scale(-1 1) ` : ""}translate(0 ${FRONT_HAND_DY})`);
  else if (hold === "jab" || hold === "guard") {
    const wrist = hold === "jab" ? G(G(arm, null, "supportR", ELBOW_R), JAB_TF) : G(G(arm, null, "supportL", ELBOW_L), GUARD_TF);
    forearmEnd(wrist);
    heldHand(wrist, "fist", "tips", null);
  } else if (support) {
    const wrist = G(G(arm, null, "supportR", ELBOW_R), SUPPORT_TF);
    hook(G(wrist, "translate(88 434)"), "support");
    supportWrist(wrist);
  }
  else frontHand(fore, flipHand ? p => mirrorPts(M(p), hc) : M, thumbFront && !flipHand);
}

function shoulder(parent, mirror, name) {
  const x = mirror ? 2 * AX - 100 : 100;
  const domes = G(parent, null, name, [x, 150]);
  P(domes, { pts: mirror ? mirrorPts(upperArm) : upperArm, r: 2, shade: "dome" });
}

function buildFront({ lod: low = false, rightArmFirst = false, propBehindArm = false, enemy = false, armed = false, fists = false } = {}) {
  return withLod(low, () => frontTree({ rightArmFirst, propBehindArm, enemy, armed, fists }));
}

function frontTree({ rightArmFirst, propBehindArm, enemy, armed, fists }) {
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
  const left = () => frontArm(armGroup(s, false), false, { arm: "armL", fore: "foreL", hand: "handL" }, false, null, false, propBehindArm, armed ? "gunGrip" : fists ? "guard" : null);
  const right = () => frontArm(armGroup(s, true), true, { arm: "armR", fore: "foreR", hand: "handR" }, false, null, false, false, armed ? "cup" : fists ? "jab" : null);
  if (fists) {
    shoulder(armGroup(s, false), false, "armL");
    left();
    shoulder(armGroup(s, true), true, "armR");
    right();
    return root;
  }
  if (armed) {
    shoulder(armGroup(s, true), true, "armR");
    right();
    shoulder(armGroup(s, false), false, "armL");
    left();
    cupFingertips(G(G(G(armGroup(s, true), null, "armR", [2 * AX - 100, 150]), null, "supportR", ELBOW_R), SUPPORT_TF));
    return root;
  }
  if (rightArmFirst) { right(); left(); } else { left(); right(); }
  shoulder(armGroup(s, false), false, "armL");
  shoulder(armGroup(s, true), true, "armR");
  return root;
}

function buildBack({ leftArmBehind = false, rightForeBehind = false, lod: low = false, enemy = false } = {}) {
  return withLod(low, () => backTree({ leftArmBehind, rightForeBehind, enemy }));
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

function backTree({ leftArmBehind, rightForeBehind, enemy }) {
  const root = { k: "g", kids: [] };
  const s = G(root, null, "body", [AX, 344]);
  if (leftArmBehind) frontArm(armGroup(s, false), false, { arm: "armL", fore: "foreL", hand: "handL" }, true);
  const behindRight = rightForeBehind ? armGroup(s, true) : null;
  P(bodyGroup(s), { pts: [[198, 318], [442, 318], [442, 372], [198, 372]], mat: "chrome", shade: "hcyl", r: 6 });
  backLeg(s, false, enemy);
  backLeg(s, true, enemy);
  const b = bodyGroup(s);
  P(b, { pts: [[248, 316], [392, 316], [398, 352], [374, 392], [320, 404], [266, 392], [242, 352]], r: 18 });
  P(b, { pts: [[172, 196], [468, 196], [446, 300], [436, 322], [204, 322], [194, 300]], mat: "metal", r: 10 });
  P(b, { pts: [[148, 132], [178, 112], [250, 106], [320, 104], [390, 106], [462, 112], [492, 132], [502, 166], [478, 196], [446, 204], [418, 238], [394, 254], [356, 262], [320, 266], [284, 262], [246, 254], [222, 238], [194, 204], [162, 196], [138, 166]], r: 16 });
  if (!enemy) backDetail(b);
  headFront(s, true, enemy);
  if (!leftArmBehind) frontArm(armGroup(s, false), false, { arm: "armL", fore: "foreL", hand: "handL" }, true);
  frontArm(armGroup(s, true), true, { arm: "armR", fore: "foreR", hand: "handR" }, !rightForeBehind, behindRight, rightForeBehind);
  shoulder(armGroup(s, false), false, "armL");
  shoulder(armGroup(s, true), true, "armR");
  hook(G(s, `translate(330 236) rotate(${-0.95 * 180 / Math.PI}) translate(-40 -60)`), "back");
  return root;
}

function sideLeg(parent, names, extra, enemy) {
  const sx = PR.sideLegScaleX;
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

const SIDE_HAND_DX = 224;

function sideHand(parent) {
  robotHand(parent, p => p.map(([x, y]) => [x + SIDE_HAND_DX, y]));
}

function sideArm(parent, names, extra, hold = null) {
  const arm = G(parent, "translate(2 -4)", names.arm, [300, 150], extra);
  P(arm, { pts: [[288, 274], [334, 274], [334, 294], [288, 294]], mat: "metal", shade: "cyl", r: 1 });
  const [wx, wy] = hold === "cup" ? SIDE_SUPPORT_YAWED : SIDE_SUPPORT;
  const handTf = `translate(${wx} ${wy}) ${HOLD_TF}${hold === "gunGrip" ? ` translate(${GRIP_HOLD} 0)` : ""}`;
  if (names.hand && extra?.propBehindArm) hook(G(G(arm, SIDE_FORE_TF, names.fore, SIDE_ELBOW), handTf), names.hand);
  P(G(arm, SIDE_SHOULDER_TF), { pts: sideUpperArm, r: 2, shade: "dome" });
  const lower = G(arm, SIDE_FORE_TF, names.fore, SIDE_ELBOW);
  const fa = G(hold === "cup" ? G(lower, SIDE_YAW_TF) : lower, `translate(312 0) scale(${FOREARM_SX} 1) translate(-312 0)`);
  P(fa, { pts: [[262, 290], [358, 286], [366, 302], [366, 392], [354, 402], [270, 404], [258, 390]], r: 1 });
  F(fa, [[264, 352], [366, 350], [366, 354], [264, 356]], "a0");
  F(fa, [[264, 372], [366, 370], [366, 374], [264, 376]], "a0");
  const hand = G(lower, handTf);
  if (names.hand && !extra?.propBehindArm) hook(hand, names.hand);
  if (hold === "cup") supportWrist(G(G(lower, null, "supportFar", SIDE_SUPPORT_YAWED), sideSupportTf(SIDE_SUPPORT_YAWED)));
  else if (hold) heldHand(lower, hold, "back", `translate(${SIDE_HAND_DX} 0)`);
  else sideHand(lower);
}

function buildSide({ farLimbs = false, badge = false, propBehindArm = false, lod: low = false, enemy = false, armed = false, fists = false } = {}) {
  return withLod(low, () => sideTree({ farLimbs, badge: badge && !enemy, propBehindArm, enemy, armed, fists }));
}

function sideTree({ farLimbs, badge, propBehindArm, enemy, armed, fists }) {
  const root = { k: "g", kids: [] };
  const s = G(root, null, "body", [SIDE_AX, 344]);
  if (farLimbs) {
    const far = { dim: 0.55 };
    sideArm(G(s, "translate(-20 0)"), { arm: "armFar", fore: "foreFar", hand: "handFar" }, far, armed ? "cup" : fists ? "fist" : null);
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
  sideArm(armed ? G(s, `translate(${-ARMED_ARM_BACK} ${GRIP_HOLD})`) : s, { arm: "arm", fore: "fore", hand: "hand" }, propBehindArm ? { propBehindArm } : undefined, armed ? "gunGrip" : fists ? "fist" : null);
  if (farLimbs && armed) {
    const lower = G(G(G(s, "translate(-20 0)"), "translate(2 -4)", "armFar", [300, 150]), SIDE_FORE_TF, "foreFar", SIDE_ELBOW);
    cupFingertips(G(G(lower, null, "supportFar", SIDE_SUPPORT_YAWED), sideSupportTf(SIDE_SUPPORT_YAWED)));
  }
  return root;
}

const BOX_STRIPES = [[2, -Infinity, 0.355], [0, 0.805, Infinity]];

const STRIPES = {
  box: { full: BOX_STRIPES, simple: BOX_STRIPES },
  cyl: {
    full: [[2, -Infinity, 0.3], [3, 0.12, 0.2], [0, 0.75, Infinity]],
    simple: [[2, -Infinity, 0.3], [0, 0.75, Infinity]]
  },
  hcyl: {
    full: [[2, -Infinity, 0.32], [3, 0.14, 0.22], [0, 0.72, Infinity]],
    simple: [[2, -Infinity, 0.32], [0, 0.72, Infinity]]
  }
};

const DOME_STEPS = 48;

function ring(cx, cy, rx, ry, steps) {
  return Array.from({ length: steps }, (_, i) => [cx + rx * Math.cos(i * 2 * Math.PI / steps), cy + ry * Math.sin(i * 2 * Math.PI / steps)]);
}

function along(shade, [x0, y0, x1, y1]) {
  const w = x1 - x0, h = y1 - y0;
  if (shade === "cyl") return p => (p[0] - x0) / w;
  if (shade === "hcyl") return p => (p[1] - y0) / h;
  const a = 0.09 * w / h, c = w / (1 + a * a);
  const len = c * c * (1 + a * a);
  return p => ((p[0] - x0) * c + (p[1] - y0) * c * a) / len;
}

function stripe(poly, t, lo, hi) {
  const above = lo === -Infinity ? poly : clipHalf(poly, p => t(p) - lo);
  return hi === Infinity ? above : clipHalf(above, p => hi - t(p));
}

function bottomBand(poly, [x0, y0, x1, y1]) {
  const w = x1 - x0, h = y1 - y0;
  const b = 0.04 * h / w, c = h / (1 + b * b);
  const dx = -c * b, dy = c, cut = 0.88 * (dx * dx + dy * dy);
  return clipHalf(poly, p => (p[0] - x0) * dx + (p[1] - y0) * dy - cut);
}

function highlight(shade, [x0, y0, x1, y1]) {
  const w = x1 - x0, h = y1 - y0;
  if (shade === "dome") return ring(x0 + w * 0.3, y0 + h * 0.26, w * 0.09, h * 0.06, 24);
  if (shade !== "box" || w <= 24 || h <= 24) return null;
  return [[x0 + w * 0.1, y0 + h * 0.08], [x0 + w * 0.22, y0 + h * 0.08], [x0 + w * 0.15, y0 + h * 0.4], [x0 + w * 0.06, y0 + h * 0.4]];
}

function toneShapes(node, simple) {
  const { spec: { shade = "box" }, box } = node;
  if (shade === "none") return [];
  const poly = flatten(node.spec.pts, node.r);
  const [x0, y0, x1, y1] = box;
  const w = x1 - x0, h = y1 - y0;
  const shapes = shade === "dome"
    ? [
      [1, clipPoly(poly, ring(x0 + w * 0.44, y0 + h * 0.44, w * 0.5, h * 0.5, DOME_STEPS))],
      [2, clipPoly(poly, ring(x0 + w * 0.36, y0 + h * 0.34, w * 0.29, h * 0.29, DOME_STEPS))]
    ]
    : STRIPES[shade][simple ? "simple" : "full"].map(([tone, lo, hi]) => [tone, stripe(poly, along(shade, box), lo, hi)]);
  if (simple) return shapes;
  if (shade === "box") shapes.push([0, bottomBand(poly, box)]);
  const hl = highlight(shade, box);
  if (hl) shapes.push([3, clipPoly(poly, hl)]);
  return shapes;
}

function tonePaths(shapes) {
  const merged = [];
  for (const [tone, pts] of shapes) {
    if (pts.length < 3) continue;
    const last = merged[merged.length - 1];
    if (last && last[0] === tone) last[1].push(pts);
    else merged.push([tone, [pts]]);
  }
  return merged.map(([tone, polys]) => [tone, new Path2D(polys.map(pts => "M" + pts.map(p => p.join(",")).join("L") + "Z").join(""))]);
}

function shadeBands(node, simple) {
  node.tones ??= {};
  return node.tones[simple ? "simple" : "full"] ??= tonePaths(toneShapes(node, simple));
}

function unitScale({ a, b, c, d }) {
  return Math.sqrt(Math.abs(a * d - b * c));
}

function drawPart(ctx, node, pal, lineW, simple) {
  const { spec, path } = node;
  const { mat = "armor", shade = "box", line = true, lw = 1 } = spec;
  const [c0, c1, c2, c3, cl] = MAT[mat].map(k => pal[k]);
  const tones = [c0, c1, c2, c3];
  ctx.fillStyle = shade === "dome" ? c0 : c1;
  ctx.fill(path);
  for (const [tone, band] of shadeBands(node, simple)) {
    ctx.fillStyle = tones[tone];
    ctx.fill(band);
  }
  if (line && lineW) {
    ctx.strokeStyle = cl;
    ctx.lineJoin = "round";
    ctx.lineWidth = lineW * lw;
    ctx.stroke(path);
  }
}

function drawTrefoil(ctx, r, pal, lineW, outer = 0.84) {
  ctx.fillStyle = pal.badge;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  if (lineW) {
    ctx.strokeStyle = pal.aLine;
    ctx.lineWidth = lineW;
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
  drawNode(ctx, node, pal, { pose, hooks, lineW, simple }, unitScale(ctx.getTransform()));
}

function drawNode(ctx, node, pal, st, unit) {
  if (node.k === "g") {
    ctx.save();
    if (node.m) ctx.transform(node.m.a, node.m.b, node.m.c, node.m.d, node.m.e, node.m.f);
    if (node.dim) pal = shade(pal, { brightness: node.dim });
    const j = node.name != null ? joint(st.pose[node.name]) : null;
    if (j?.tint) pal = shade(pal, j.tint);
    if (j) {
      ctx.translate(j.dx + node.pivot[0], j.dy + node.pivot[1]);
      ctx.rotate(j.rot * Math.PI / 180);
      ctx.scale(j.sx, j.sy);
      ctx.translate(-node.pivot[0], -node.pivot[1]);
    }
    const inner = unit * (node.m ? unitScale(node.m) : 1) * (j ? Math.sqrt(Math.abs(j.sx * j.sy)) : 1);
    for (const kid of node.kids) drawNode(ctx, kid, pal, st, inner);
    ctx.restore();
  } else if (node.k === "part") {
    drawPart(ctx, node, pal, st.lineW / unit, st.simple);
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
    drawTrefoil(ctx, node.r, pal, st.lineW / unit, node.outer);
  } else if (node.k === "hook" && st.hooks[node.name]) {
    st.hooks[node.name](ctx, pal);
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

const hookPaths = new WeakMap();

function findPath(node, hook, path) {
  if (node.k === "hook") return node.name === hook ? path : null;
  if (node.k !== "g") return null;
  for (const kid of node.kids) {
    const found = findPath(kid, hook, [...path, node]);
    if (found) return found;
  }
  return null;
}

function hookPath(root, hook) {
  let paths = hookPaths.get(root);
  if (!paths) hookPaths.set(root, paths = new Map());
  if (!paths.has(hook)) paths.set(hook, findPath(root, hook, []));
  return paths.get(hook);
}

function armReach(root, hook, pose, keys) {
  const path = hookPath(root, hook);
  if (!path) return null;
  const links = [];
  let m = new DOMMatrix();
  for (const node of path) {
    if (node.m) m = m.multiply(node.m);
    const key = keys.indexOf(node.name);
    if (key >= 0) {
      links.push({ m: m.translate(node.pivot[0], node.pivot[1]), key });
      m = new DOMMatrix().translate(-node.pivot[0], -node.pivot[1]);
      continue;
    }
    const j = node.name != null ? joint(pose[node.name]) : null;
    if (j) m = m.translate(j.dx + node.pivot[0], j.dy + node.pivot[1]).rotate(j.rot).scale(j.sx, j.sy).translate(-node.pivot[0], -node.pivot[1]);
  }
  const tip = m.transformPoint(new DOMPoint(0, 0));
  return (a, b) => {
    const ra = a * Math.PI / 180, rb = b * Math.PI / 180;
    const cos = [Math.cos(ra), Math.cos(rb)], sin = [Math.sin(ra), Math.sin(rb)];
    let x = tip.x, y = tip.y;
    for (let i = links.length - 1; i >= 0; i--) {
      const { m: l, key } = links[i];
      const rx = cos[key] * x - sin[key] * y, ry = sin[key] * x + cos[key] * y;
      x = l.a * rx + l.c * ry + l.e;
      y = l.b * rx + l.d * ry + l.f;
    }
    return [x, y];
  };
}

function solve(root, hook, pose, keys, ranges, target, seed = null) {
  const reach = armReach(root, hook, pose, keys);
  const hit = (a, b) => {
    if (!reach) return Infinity;
    const [x, y] = reach(a, b);
    return Math.hypot(x - target.x, y - target.y);
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

const HAND_AX = 87.5;
const HAND_VIEWS = ["palm", "back", "thumb", "little", "tips"];
const HAND_POSES = ["open", "fist", "carry", "cup", "grip", "pinch", "gunGrip"];
const HAND = { x0: 46, x1: 130, top: 398, bottom: 470, thick: 34 };
const FINGER = { w: 20, pitch: 21, thick: 18, base: 462, seg: [30, 24, 18] };
const THUMB = { w: 20, thick: 18, seg: [24, 20] };
const HAND_FACE = [HAND.x0 + HAND.x1 - HAND.thick, HAND.x0 + HAND.x1 + HAND.thick].map(v => v / 2);
const fingerX = i => HAND.x0 + i * FINGER.pitch;
const fingerY = k => FINGER.base + FINGER.seg.slice(0, k).reduce((a, b) => a + b, 0);

function bar([x, y], deg, len, w, ext = 0) {
  const [e0, e1] = Array.isArray(ext) ? ext : [ext, ext];
  const a = deg * Math.PI / 180, dx = Math.sin(a), dy = Math.cos(a), nx = dy * w / 2, ny = -dx * w / 2;
  const s = [x - dx * e0, y - dy * e0], e = [x + dx * (len + e1), y + dy * (len + e1)];
  return { pts: [[s[0] + nx, s[1] + ny], [e[0] + nx, e[1] + ny], [e[0] - nx, e[1] - ny], [s[0] - nx, s[1] - ny]], end: [x + dx * len, y + dy * len] };
}

function chain(parent, M, from, angles, lens, w, spec = {}, pads = false) {
  let at = from;
  angles.forEach((deg, k) => {
    const b = bar(at, deg, lens[k], w, w / 2);
    P(parent, { pts: M(b.pts), r: w / 3, lw: FINGER_LW, ...spec });
    if (pads) P(parent, { pts: M(bar(at, deg, lens[k] - 4, w - 6, [k ? w / 2 - 5 : w / 2, w / 2 - 5]).pts), mat: "metal", shade: "cyl", r: 4, lw: FINGER_LW });
    at = b.end;
  });
}

function thumbWedge(from, deg, len, w) {
  const [, eo, ei] = bar(from, deg, len, w).pts;
  const a = deg * Math.PI / 180, dx = Math.sin(a), dy = Math.cos(a);
  const edge = HAND.x1 - 2, top = from[1] - 14;
  const outer = Math.max(edge + 2, eo[0] - dx * (eo[1] - top) / dy);
  return [[edge, top], [outer, top], eo, ei, [edge, ei[1]]];
}

function inset(pts, k) {
  const c = pts.reduce(([x, y], p) => [x + p[0] / pts.length, y + p[1] / pts.length], [0, 0]);
  return pts.map(p => [c[0] + (p[0] - c[0]) * k, c[1] + (p[1] - c[1]) * k]);
}

function handThumb(parent, M, from, angles, w = THUMB.w, pads = false, wedge = false) {
  if (!wedge) return chain(parent, M, from, angles, THUMB.seg, w, { shade: "cyl" }, pads);
  const edge = HAND.x1 - 2, joint = bar(from, angles[0], THUMB.seg[0], 0).end;
  const reach = Math.min(bar(from, angles[0], THUMB.seg[0], w).pts[2][0], ...bar(joint, angles[1], THUMB.seg[1], w, [w / 2, 0]).pts.map(p => p[0]));
  from = [from[0] + Math.max(0, edge - reach), from[1]];
  const root = thumbWedge(from, angles[0], THUMB.seg[0], w);
  P(parent, { pts: M(root), shade: "cyl", r: 3, lw: FINGER_LW });
  if (pads) P(parent, { pts: M(inset(root, 0.6)), mat: "metal", shade: "cyl", r: 3, lw: FINGER_LW });
  if (angles.length > 1) chain(parent, M, bar(from, angles[0], THUMB.seg[0], 0).end, angles.slice(1), THUMB.seg.slice(1), w, { shade: "cyl" }, pads);
}

let bareHand = false;

function handStub(parent) {
  if (bareHand) return;
  const fa = G(parent, `translate(89 0) scale(${FOREARM_SX} 1) translate(-89 0)`);
  P(fa, { pts: [[26, 344], [150, 342], [150, 394], [140, 404], [42, 406], [26, 390]], r: 1 });
  F(fa, [[30, 374], [150, 372], [150, 376], [30, 378]], "a0");
}

function forearmEnd(parent) {
  if (bareHand) return;
  P(parent, { pts: [[34, 365], [142, 365], [142, 469], [34, 469]], r: 8 });
}

function backPlate(parent, M = p => p) {
  P(parent, { pts: M([[HAND.x0, HAND.top + 2], [HAND.x1, HAND.top], [HAND.x1, HAND.bottom - 2], [HAND.x0, HAND.bottom]]), r: 2 });
  P(parent, { pts: M([[HAND.x0 + 7, HAND.top + 9], [HAND.x1 - 7, HAND.top + 8], [HAND.x1 - 7, HAND.bottom - 12], [HAND.x0 + 7, HAND.bottom - 11]]), shade: "cyl", r: 6 });
}

function backFingers(parent, M = p => p) {
  const [y1, y2, y3] = [1, 2, 3].map(fingerY);
  if (lod) P(parent, { pts: M([[HAND.x0, FINGER.base], [HAND.x1 - 1, FINGER.base], [HAND.x1 - 1, y3], [HAND.x0, y3]]), shade: "cyl", r: 4 });
  for (let i = 0; i < 4; i++) {
    const x = fingerX(i);
    P(parent, { pts: M([[x, FINGER.base + 6], [x + 10, FINGER.base], [x + 20, FINGER.base + 6], [x + 20, y1], [x, y1]]), shade: "cyl", r: 3, lw: FINGER_LW });
    P(parent, { pts: M([[x, y1], [x + 20, y1], [x + 20, y2], [x, y2]]), shade: "cyl", r: 2, lw: FINGER_LW });
    P(parent, { pts: M([[x, y2], [x + 20, y2], [x + 20, y3], [x, y3]]), r: 2, lw: FINGER_LW });
  }
}

function profileHand(parent, S, thumbBehind) {
  const [y1, y2, y3] = [1, 2, 3].map(fingerY);
  const fx = HAND_FACE[1] - 2 - FINGER.thick;
  const thumb = () => handThumb(parent, S, THUMB_SIDE, [-14, -4], THUMB.thick);
  if (thumbBehind) thumb();
  profilePlate(parent, S);
  P(parent, { pts: S([[fx, FINGER.base], [fx + FINGER.thick, FINGER.base - 6], [fx + FINGER.thick, y1], [fx, y1]]), shade: "cyl", r: 3, lw: FINGER_LW });
  P(parent, { pts: S([[fx, y1], [fx + FINGER.thick, y1], [fx + FINGER.thick, y2], [fx, y2]]), shade: "cyl", r: 2, lw: FINGER_LW });
  P(parent, { pts: S([[fx, y2], [fx + FINGER.thick, y2], [fx + FINGER.thick, y3 - 4], [fx + 9, y3], [fx, y3 - 4]]), r: 3, lw: FINGER_LW });
  for (const [t, u] of [[FINGER.base + 2, y1 - 2], [y1 + 1, y2 - 2], [y2 + 1, y3 - 5]]) P(parent, { pts: S([[fx - 4, t], [fx + 6, t], [fx + 6, u], [fx - 4, u]]), mat: "metal", shade: "cyl", r: 4, lw: FINGER_LW });
  if (!thumbBehind) thumb();
}

function robotHand(parent, M) {
  backPlate(parent, M);
  backFingers(parent, M);
  handThumb(parent, M, THUMB_BASE, THUMB_OPEN, THUMB.w, false, true);
}

function palmPlate(parent, M, padBottom) {
  P(parent, { pts: [[HAND.x0, HAND.top], [HAND.x1, HAND.top], [HAND.x1, HAND.bottom], [HAND.x0, HAND.bottom]], r: 3 });
  P(parent, { pts: M([[HAND.x0 + 8, HAND.top + 6], [HAND.x1 - 8, HAND.top + 6], [HAND.x1 - 8, padBottom], [HAND.x0 + 8, padBottom]]), mat: "metal", shade: "none", r: 6 });
}

function profilePlate(parent, S) {
  const [a, b] = HAND_FACE;
  P(parent, { pts: S([[a + 3, HAND.top], [b, HAND.top], [b, HAND.bottom], [a + 3, HAND.bottom]]), r: 3 });
  P(parent, { pts: S([[a - 2, HAND.top + 6], [a + 6, HAND.top + 6], [a + 6, HAND.bottom - 2], [a - 2, HAND.bottom - 2]]), mat: "metal", shade: "cyl", r: 4 });
}

function sectionPlate(parent) {
  P(parent, { pts: [[HAND.x0, 400], [HAND.x1, 400], [HAND.x1, 400 + HAND.thick], [HAND.x0, 400 + HAND.thick]], r: 3 });
  P(parent, { pts: [[HAND.x0 + 4, 400 + HAND.thick - 6], [HAND.x1 - 4, 400 + HAND.thick - 6], [HAND.x1 - 4, 400 + HAND.thick + 2], [HAND.x0 + 4, 400 + HAND.thick + 2]], mat: "metal", shade: "cyl", r: 4 });
}

const THUMB_BASE = [124, 424];
const THUMB_SIDE = [HAND_FACE[0] + 12, THUMB_BASE[1]];
const THUMB_OPEN = [30, 14];

function openHand(s, view) {
  const M = p => p;
  const W = p => mirrorPts(p, HAND_AX);
  const [y1, y2, y3] = [1, 2, 3].map(fingerY);
  if (view === "back" || view === "palm") {
    const S = view === "palm" ? W : M;
    handStub(s);
    if (view === "back") backPlate(s);
    else palmPlate(s, M, HAND.bottom - 6);
    if (view === "back") backFingers(s);
    else for (let i = 0; i < 4; i++) {
      const x = fingerX(i);
      P(s, { pts: [[x, FINGER.base - 4], [x + 20, FINGER.base - 4], [x + 20, y3], [x, y3]], r: 4, lw: FINGER_LW });
      for (const [a, b] of [[FINGER.base - 1, y1 - 2], [y1 + 1, y2 - 2], [y2 + 1, y3 - 3]]) P(s, { pts: [[x + 3, a], [x + 17, a], [x + 17, b], [x + 3, b]], mat: "metal", shade: "cyl", r: 4, lw: FINGER_LW });
    }
    handThumb(s, S, THUMB_BASE, THUMB_OPEN, THUMB.w, view === "palm", true);
  } else if (view === "thumb" || view === "little") {
    handStub(s);
    profileHand(s, view === "thumb" ? W : M, view === "little");
  } else {
    forearmEnd(s);
    sectionPlate(s);
    for (let i = 0; i < 4; i++) {
      const x = fingerX(i);
      P(s, { pts: [[x, 402], [x + 20, 402], [x + 20, 402 + FINGER.thick], [x, 402 + FINGER.thick]], shade: "cyl", r: 6, lw: FINGER_LW });
    }
    P(s, { pts: [[HAND.x1 - 2, 416], [HAND.x1 + 18, 416], [HAND.x1 + 18, 416 + THUMB.thick], [HAND.x1 - 2, 416 + THUMB.thick]], shade: "cyl", r: 6 });
  }
}

const BACK_THUMB = [[HAND.x1 - 6, 420], [HAND.x1 + 7, 422], [HAND.x1 + 7, 458], [HAND.x1 - 6, 460]];

function fistThumb(dx = 0) {
  return [[-4, 0], [8, 0], [14, 38], [-8, 38], [-9, 18]].map(([x, y]) => [HAND.x1 + dx + x, THUMB_BASE[1] - 11 + y]);
}

function fist(s, view) {
  const M = p => p;
  const W = p => mirrorPts(p, HAND_AX);
  const [s1, s2] = FINGER.seg;
  const knuckle = FINGER.base;
  const bottom = knuckle + FINGER.thick;
  const pip = knuckle + FINGER.thick / 2;
  if (view === "back") {
    handStub(s);
    P(s, { pts: BACK_THUMB, shade: "cyl", r: 6, lw: FINGER_LW });
    backPlate(s);
    for (let i = 0; i < 4; i++) {
      const x = fingerX(i);
      P(s, { pts: [[x, knuckle + 4], [x + 20, knuckle + 4], [x + 20, bottom], [x, bottom]], shade: "cyl", r: 6, lw: FINGER_LW });
      P(s, { pts: [[x, knuckle - 8], [x + 20, knuckle - 8], [x + 20, knuckle + 10], [x, knuckle + 10]], shade: "cyl", r: 7, lw: FINGER_LW });
    }
  } else if (view === "palm") {
    handStub(s);
    palmPlate(s, M, HAND.bottom - 6);
    for (let i = 0; i < 4; i++) {
      const x = fingerX(i);
      P(s, { pts: [[x, pip - s2], [x + 20, pip - s2], [x + 20, pip], [x, pip]], shade: "cyl", r: 3, lw: FINGER_LW });
      P(s, { pts: [[x, knuckle], [x + 20, knuckle], [x + 20, bottom], [x, bottom]], shade: "cyl", r: 7, lw: FINGER_LW });
    }
    P(s, { pts: W(fistThumb(-4)), shade: "cyl", r: 6, lw: FINGER_LW });
    chain(s, W, bar(THUMB_BASE, -5, THUMB.seg[0], 0).end, [-90], [THUMB.seg[1]], THUMB.w, { shade: "cyl" });
  } else if (view === "thumb" || view === "little") {
    const S = view === "thumb" ? W : M;
    const joint = [HAND_FACE[1] - 2 - FINGER.thick / 2, pip];
    const front = [joint[0] - s1, pip];
    const thumb = () => {
      const end = bar(THUMB_SIDE, -53, THUMB.seg[0], 0).end;
      chain(s, S, THUMB_SIDE, [-53], [THUMB.seg[0]], THUMB.thick, { shade: "cyl" });
      if (view === "little") P(s, { pts: S([[end[0] - 13, end[1] - 6], [end[0] + 5, end[1] - 6], [end[0] + 5, end[1] + 12], [end[0] - 13, end[1] + 12]]), shade: "cyl", r: 6 });
    };
    handStub(s);
    if (view === "little") thumb();
    profilePlate(s, S);
    chain(s, S, front, [180], [s2], FINGER.thick, { shade: "cyl" });
    chain(s, S, joint, [-90], [s1], FINGER.thick, { shade: "cyl" });
    if (view === "thumb") thumb();
  } else {
    forearmEnd(s);
    sectionPlate(s);
    const face = 400 + HAND.thick;
    handThumb(s, M, [130, face + FINGER.thick - 2], [-60, -90], THUMB.thick);
    for (let i = 0; i < 4; i++) {
      const x = fingerX(i);
      P(s, { pts: [[x, 404], [x + 20, 404], [x + 20, face], [x, face]], shade: "cyl", r: 3, lw: FINGER_LW });
      P(s, { pts: [[x, face - 2], [x + 20, face - 2], [x + 20, face + FINGER.thick], [x, face + FINGER.thick]], shade: "cyl", r: 7, lw: FINGER_LW });
    }
  }
}

function itemAt(parent, tf) {
  hook(G(parent, tf), "item");
}

function slab(parent, pts) {
  P(parent, { pts, mat: "chrome", shade: "cyl", r: 4 });
}

const PALM_MID = (HAND.top + 8 + HAND.bottom) / 2;
const CARRY_TF = `translate(88 ${PALM_MID}) scale(6) translate(-9 6.5)`;

const REST_AT = {
  palm: `translate(${HAND_AX} ${PALM_MID}) rotate(90)`,
  thumb: `translate(${2 * HAND_AX - HAND_FACE[0] + 2} ${PALM_MID}) rotate(90)`,
  tips: `translate(88 436) rotate(180)`
};

function carry(s, view, rest) {
  if (rest) {
    openHand(s, view);
    if (REST_AT[view]) hook(G(s, REST_AT[view]), "rest");
    return;
  }
  if (view === "back") itemAt(s, `translate(88 ${PALM_MID}) scale(-6 6) translate(-9 6.5)`);
  openHand(s, view);
  const a = HAND_FACE[0];
  if (view === "palm") itemAt(s, CARRY_TF);
  else if (view === "little") slab(s, [[a - 28, PALM_MID - 38], [a - 2, PALM_MID - 38], [a - 2, PALM_MID + 38], [a - 28, PALM_MID + 38]]);
  else if (view === "thumb") slab(s, mirrorPts([[a - 28, PALM_MID - 38], [a - 2, PALM_MID - 38], [a - 2, PALM_MID + 38], [a - 28, PALM_MID + 38]], HAND_AX));
  else if (view === "tips") slab(s, [[22, 436], [154, 436], [154, 462], [22, 462]]);
}

const CUP = [-30, -75, -125];
const CUP_THUMB = [28, 4];

function cup(s, view) {
  const M = p => p;
  const W = p => mirrorPts(p, HAND_AX);
  const [s1, s2, s3] = FINGER.seg;
  const tip = FINGER.base + Math.round(s1 * Math.cos(CUP[0] * Math.PI / 180));
  if (view === "back" || view === "palm") {
    const S = view === "palm" ? W : M;
    handStub(s);
    if (view === "back") backPlate(s);
    else {
      palmPlate(s, M, HAND.bottom - 6);
      itemAt(s, `translate(88 ${PALM_MID}) scale(3) translate(-7 3.5)`);
    }
    for (let i = 0; i < 4; i++) {
      const x = fingerX(i);
      P(s, { pts: [[x, FINGER.base - 4], [x + 20, FINGER.base - 4], [x + 20, tip], [x, tip]], shade: "cyl", r: 3, lw: FINGER_LW });
      if (view === "palm") {
        P(s, { pts: [[x + 3, FINGER.base - 1], [x + 17, FINGER.base - 1], [x + 17, tip - 3], [x + 3, tip - 3]], mat: "metal", shade: "cyl", r: 4, lw: FINGER_LW });
        P(s, { pts: [[x, tip - 12], [x + 20, tip - 12], [x + 20, tip + 10], [x, tip + 10]], shade: "cyl", r: 7, lw: FINGER_LW });
      } else P(s, { pts: [[x, tip - 4], [x + 20, tip - 4], [x + 20, tip + 10], [x, tip + 10]], shade: "cyl", r: 7, lw: FINGER_LW });
    }
    handThumb(s, S, THUMB_BASE, CUP_THUMB, THUMB.w, view === "palm", true);
  } else if (view === "thumb" || view === "little") {
    const S = view === "thumb" ? W : M;
    const thumb = () => handThumb(s, S, THUMB_SIDE, [-30, -50], THUMB.thick);
    handStub(s);
    if (view === "little") thumb();
    profilePlate(s, S);
    itemAt(s, `${view === "thumb" ? `translate(${2 * HAND_AX} 0) scale(-1 1) ` : ""}translate(${HAND_FACE[0] - 9} ${PALM_MID}) scale(2.4) rotate(90) translate(-7 3.5)`);
    chain(s, S, [HAND_FACE[1] - 2 - FINGER.thick / 2, FINGER.base], CUP, [s1, s2, s3], FINGER.thick, { shade: "cyl" });
    if (view === "thumb") thumb();
  } else {
    supportWrist(s);
    cupFingertips(s);
  }
}

function supportWrist(s) {
  forearmEnd(s);
  sectionPlate(s);
}

function cupFingertips(s) {
  const face = 400 + HAND.thick;
  for (let i = 0; i < 4; i++) {
    const x = fingerX(i);
    P(s, { pts: [[x, 404], [x + 20, 404], [x + 20, face + 10], [x, face + 10]], shade: "cyl", r: 7, lw: FINGER_LW });
  }
  P(s, { pts: [[HAND.x1 - 2, 420], [HAND.x1 + 18, 420], [HAND.x1 + 18, 420 + THUMB.thick], [HAND.x1 - 2, 420 + THUMB.thick]], shade: "cyl", r: 6 });
}

const GRIP_K = 16;
const GRIP_R = 0.9 * GRIP_K;
const GRIP_C = [HAND_FACE[0] - GRIP_R, PALM_MID + 6];
const GRIP_CURL = [-60, -110, -160];
const TRIGGER_CURL = [-25, -75, -115];
const gripTf = y => `translate(88 ${y}) scale(${GRIP_K}) translate(-13 1.5)`;

const CROWBAR = {
  r: GRIP_R,
  across: (s, M, y) => itemAt(s, gripTf(y)),
  section: (s, S, [cx, cy], r) => P(s, { pts: S([[cx - r, cy - r], [cx + r, cy - r], [cx + r, cy + r], [cx - r, cy + r]]), mat: "chrome", shade: "cyl", r }),
  side: () => {},
  end: () => {}
};

const WEAPON_GRIP = [[16, -24], [-14, -24], [-34, 52], [-6, 52]];

const PISTOL_R = 11;
const PISTOL_SLIDE = { x0: HAND.x1, x1: HAND.x1 + 24, top: 404, muzzle: 566 };

const PISTOL = {
  r: PISTOL_R,
  trigger: true,
  across: (s, M, y, tips = false) => {
    const { x0, x1, top, muzzle } = PISTOL_SLIDE;
    P(s, { pts: M([[HAND.x0 - 22, y - PISTOL_R - 12], [x0 + 4, y - PISTOL_R + 2], [x0 + 6, y + PISTOL_R + 4], [HAND.x0 - 20, y + PISTOL_R - 12]]), mat: "metal", shade: "cyl", r: 5 });
    if (tips) return;
    P(s, { pts: M([[x0 - 24, y + PISTOL_R - 2], [x0, y + PISTOL_R - 2], [x0, y + PISTOL_R + 30], [x0 - 24, y + PISTOL_R + 30]]), mat: "metal", shade: "cyl", r: 9 });
    F(s, M([[x0 - 18, y + PISTOL_R + 3], [x0 - 4, y + PISTOL_R + 3], [x0 - 4, y + PISTOL_R + 24], [x0 - 18, y + PISTOL_R + 24]]), "m0", 6);
    P(s, { pts: M([[x0 - 13, y + PISTOL_R + 2], [x0 - 8, y + PISTOL_R + 2], [x0 - 10, y + PISTOL_R + 18], [x0 - 14, y + PISTOL_R + 16]]), mat: "metal", shade: "cyl", r: 2 });
    P(s, { pts: M([[x0, top], [x1, top], [x1, muzzle], [x0, muzzle]]), mat: "chrome", shade: "cyl", r: 4 });
    F(s, M([[x0 + 3, top + 30], [x1 - 3, top + 30], [x1 - 3, top + 34], [x0 + 3, top + 34]]), "m1");
    F(s, M([[x0 + 3, muzzle - 8], [x1 - 3, muzzle - 8], [x1 - 3, muzzle - 4], [x0 + 3, muzzle - 4]]), "m1");
  },
  section: (s, S, [cx, cy], r) => P(s, { pts: S([[cx - r, cy - r], [cx + r, cy - r], [cx + r, cy + r], [cx - r, cy + r]]), mat: "metal", shade: "cyl", r: 5 }),
  side: (s, S, [cx]) => {
    const { top, muzzle } = PISTOL_SLIDE;
    P(s, { pts: S([[cx - PISTOL_R, top], [cx + PISTOL_R, top], [cx + PISTOL_R, muzzle], [cx - PISTOL_R, muzzle]]), mat: "chrome", shade: "cyl", r: 4 });
    F(s, S([[cx - PISTOL_R - 2, top + 30], [cx + PISTOL_R + 2, top + 30], [cx + PISTOL_R + 2, top + 34], [cx - PISTOL_R - 2, top + 34]]), "m1");
  },
  end: (s, depth) => {
    const { x0, x1 } = PISTOL_SLIDE;
    const mx = (x0 + x1) / 2;
    P(s, { pts: [[x0, depth - PISTOL_R - 4], [x1, depth - PISTOL_R - 4], [x1, depth + PISTOL_R + 4], [x0, depth + PISTOL_R + 4]], mat: "chrome", shade: "cyl", r: 4 });
    E(s, mx, depth, 8, 8, "mLine");
    E(s, mx, depth, 6.5, 6.5, "m0");
    E(s, mx - 1.5, depth - 1.5, 2.5, 2.5, "m2", 0.6);
  }
};

const BARE_GUN = { ...CROWBAR, r: PISTOL_R, trigger: true, across: () => {}, section: () => {} };

function heldHand(parent, pose, view, tf) {
  const g = G(parent, tf);
  bareHand = true;
  try {
    if (pose === "gunGrip") grip(g, view, BARE_GUN);
    else if (pose === "fist") fist(g, view);
    else cup(g, view);
  } finally {
    bareHand = false;
  }
}

function grip(s, view, rod = CROWBAR) {
  const M = p => p;
  const W = p => mirrorPts(p, HAND_AX);
  const knuckle = FINGER.base;
  const R = rod.r;
  const [cx, cy] = [HAND_FACE[0] - R, GRIP_C[1]];
  const near = cy + R + FINGER.thick / 2 + 4;
  const trigger = !!rod.trigger;
  const curled = trigger ? 3 : 4;
  const pull = cy + R + 14;
  const ix = fingerX(3);
  const px = fingerX(0);
  if (view === "back") {
    rod.across(s, M, cy);
    handStub(s);
    if (!rod.trigger) P(s, { pts: BACK_THUMB, shade: "cyl", r: 6, lw: FINGER_LW });
    backPlate(s);
    if (trigger) P(s, { pts: [[ix, knuckle + 4], [ix + 20, knuckle + 4], [ix + 20, pull + 12], [ix, pull + 12]], shade: "cyl", r: 7, lw: FINGER_LW });
    for (let i = 0; i < curled; i++) {
      const x = fingerX(i);
      P(s, { pts: [[x, knuckle + 4], [x + 20, knuckle + 4], [x + 20, near], [x, near]], shade: "cyl", r: 6, lw: FINGER_LW });
      P(s, { pts: [[x, knuckle - 8], [x + 20, knuckle - 8], [x + 20, knuckle + 10], [x, knuckle + 10]], shade: "cyl", r: 7, lw: FINGER_LW });
    }
  } else if (view === "palm") {
    handStub(s);
    palmPlate(s, M, HAND.bottom - 6);
    for (let i = 4 - curled; i < 4; i++) {
      const x = fingerX(i);
      P(s, { pts: [[x, knuckle - 4], [x + 20, knuckle - 4], [x + 20, near - 8], [x, near - 8]], shade: "cyl", r: 3, lw: FINGER_LW });
    }
    rod.across(s, W, cy);
    for (let i = 4 - curled; i < 4; i++) {
      const x = fingerX(i);
      P(s, { pts: [[x, cy - 4], [x + 20, cy - 4], [x + 20, near], [x, near]], shade: "cyl", r: 7, lw: FINGER_LW });
    }
    if (trigger) {
      P(s, { pts: [[px, knuckle - 4], [px + 20, knuckle - 4], [px + 20, pull], [px, pull]], shade: "cyl", r: 3, lw: FINGER_LW });
      P(s, { pts: [[px + 3, knuckle - 1], [px + 17, knuckle - 1], [px + 17, pull - 3], [px + 3, pull - 3]], mat: "metal", shade: "cyl", r: 4, lw: FINGER_LW });
      P(s, { pts: [[px, pull - 4], [px + 20, pull - 4], [px + 20, pull + 12], [px, pull + 12]], shade: "cyl", r: 7, lw: FINGER_LW });
    }
    P(s, { pts: W(fistThumb(-4)), shade: "cyl", r: 6, lw: FINGER_LW });
    chain(s, W, bar(THUMB_BASE, -5, THUMB.seg[0], 0).end, [-90], [THUMB.seg[1]], THUMB.w, { shade: "cyl" });
  } else if (view === "thumb" || view === "little") {
    const S = view === "thumb" ? W : M;
    const thumb = () => chain(s, S, THUMB_SIDE, [-95, -60], THUMB.seg, THUMB.thick, { shade: "cyl" });
    handStub(s);
    if (view === "little") {
      rod.side(s, S, [cx, cy]);
      thumb();
    }
    const index = () => chain(s, S, [HAND_FACE[1] - 2 - FINGER.thick / 2, knuckle], TRIGGER_CURL, FINGER.seg, FINGER.thick, { shade: "cyl" });
    if (trigger && view === "little") index();
    profilePlate(s, S);
    rod.section(s, S, [cx, cy], R);
    chain(s, S, [HAND_FACE[1] - 2 - FINGER.thick / 2, knuckle], GRIP_CURL, FINGER.seg, FINGER.thick, { shade: "cyl" });
    if (trigger && view === "thumb") index();
    if (view === "thumb" && trigger) {
      thumb();
      rod.side(s, S, [cx, cy]);
    } else if (view === "thumb") {
      rod.side(s, S, [cx, cy]);
      thumb();
    }
  } else {
    forearmEnd(s);
    sectionPlate(s);
    const depth = 400 + HAND_FACE[1] - cx - 10;
    rod.across(s, M, depth, true);
    handThumb(s, M, [130, depth + 10], [-60, -90], THUMB.thick);
    for (let i = 0; i < 4; i++) {
      const x = fingerX(i);
      P(s, { pts: [[x, 404], [x + 20, 404], [x + 20, depth + R], [x, depth + R]], shade: "cyl", r: 7, lw: FINGER_LW });
    }
    rod.end(s, depth);
  }
}

const PINCH_INDEX = [-60, -150, -200];
const PINCH_THUMB = [-15, -10];
const PINCH_AT = [70, 478];
const PINCH_PIVOT = [HAND.x1 - 2, THUMB_BASE[1] - 11];
const PINCH_TIP = [HAND.x1 - 1, THUMB_BASE[1] + 24];
const PINCH_TILT = 12;
const PINCH_EDGE = HAND.x1 - 1;
const PINCH_K = 6;
const PINCH_KEY = [2.2, -2.6, 7.6];
const keyEdge = x => [[x - 3, PINCH_AT[1] - PINCH_KEY[0] * PINCH_K], [x + 3, PINCH_AT[1] - PINCH_KEY[0] * PINCH_K], [x + 3, PINCH_AT[1] + PINCH_KEY[2] * PINCH_K], [x - 3, PINCH_AT[1] + PINCH_KEY[2] * PINCH_K]];

function pinchThumb(s, M) {
  const a = PINCH_TILT * Math.PI / 180, [ox, oy] = PINCH_PIVOT;
  const turn = ([x, y]) => [ox + (x - ox) * Math.cos(a) + (y - oy) * Math.sin(a), oy - (x - ox) * Math.sin(a) + (y - oy) * Math.cos(a)];
  P(s, { pts: M(fistThumb(-4).map(turn)), shade: "cyl", r: 6, lw: FINGER_LW });
  chain(s, M, turn(PINCH_TIP), [PINCH_TILT], [THUMB.seg[1]], THUMB.w, { shade: "cyl" });
}

function pinch(s, view) {
  const M = p => p;
  const W = p => mirrorPts(p, HAND_AX);
  const [s1, s2] = FINGER.seg;
  const knuckle = FINGER.base;
  const bottom = knuckle + FINGER.thick;
  const pip = knuckle + FINGER.thick / 2;
  if (view === "back") {
    handStub(s);
    pinchThumb(s, M);
    backPlate(s);
    for (let i = 0; i < 4; i++) {
      const x = fingerX(i);
      P(s, { pts: [[x, knuckle + 4], [x + 20, knuckle + 4], [x + 20, bottom + (i === 3 ? 6 : 0)], [x, bottom + (i === 3 ? 6 : 0)]], shade: "cyl", r: 6, lw: FINGER_LW });
      P(s, { pts: [[x, knuckle - 8], [x + 20, knuckle - 8], [x + 20, knuckle + 10], [x, knuckle + 10]], shade: "cyl", r: 7, lw: FINGER_LW });
    }
    slab(s, keyEdge(PINCH_EDGE));
  } else if (view === "palm") {
    handStub(s);
    palmPlate(s, M, HAND.bottom - 6);
    for (let i = 0; i < 4; i++) {
      const x = fingerX(i);
      P(s, { pts: [[x, pip - s2], [x + 20, pip - s2], [x + 20, pip], [x, pip]], shade: "cyl", r: 3, lw: FINGER_LW });
      P(s, { pts: [[x, knuckle], [x + 20, knuckle], [x + 20, bottom + (i === 0 ? 6 : 0)], [x, bottom + (i === 0 ? 6 : 0)]], shade: "cyl", r: 7, lw: FINGER_LW });
    }
    slab(s, keyEdge(2 * HAND_AX - PINCH_EDGE));
    pinchThumb(s, W);
  } else if (view === "thumb" || view === "little") {
    const S = view === "thumb" ? W : M;
    const joint = [HAND_FACE[1] - 2 - FINGER.thick / 2, pip];
    const fingers = () => {
      chain(s, S, [joint[0] - s1, pip], [180], [s2], FINGER.thick, { shade: "cyl" });
      chain(s, S, joint, [-90], [s1], FINGER.thick, { shade: "cyl" });
    };
    const index = () => chain(s, S, [joint[0], knuckle], PINCH_INDEX, FINGER.seg, FINGER.thick, { shade: "cyl" });
    const key = () => itemAt(s, `${view === "thumb" ? `translate(${2 * HAND_AX} 0) scale(-1 1) ` : ""}translate(${PINCH_AT[0]} ${PINCH_AT[1]}) rotate(90) scale(${PINCH_K}) translate(${-PINCH_KEY[0]} ${-PINCH_KEY[1]})`);
    const thumb = () => chain(s, S, THUMB_SIDE, PINCH_THUMB, THUMB.seg, THUMB.thick, { shade: "cyl" });
    handStub(s);
    if (view === "little") {
      thumb();
      key();
      profilePlate(s, S);
      index();
      fingers();
    } else {
      profilePlate(s, S);
      fingers();
      index();
      key();
      thumb();
    }
  } else {
    forearmEnd(s);
    sectionPlate(s);
    const face = 400 + HAND.thick;
    for (let i = 0; i < 4; i++) {
      const x = fingerX(i);
      P(s, { pts: [[x, 404], [x + 20, 404], [x + 20, face], [x, face]], shade: "cyl", r: 3, lw: FINGER_LW });
      P(s, { pts: [[x, face - 2], [x + 20, face - 2], [x + 20, face + FINGER.thick], [x, face + FINGER.thick]], shade: "cyl", r: 7, lw: FINGER_LW });
    }
    const depth = 400 + HAND_FACE[1] - PINCH_AT[0];
    const half = PINCH_KEY[0] * PINCH_K;
    slab(s, [[HAND.x1 - 2, depth - half], [HAND.x1 + 4, depth - half], [HAND.x1 + 4, depth + half], [HAND.x1 - 2, depth + half]]);
    P(s, { pts: [[HAND.x1 + 2, depth - THUMB.thick / 2], [HAND.x1 + 22, depth - THUMB.thick / 2], [HAND.x1 + 22, depth + THUMB.thick / 2], [HAND.x1 + 2, depth + THUMB.thick / 2]], shade: "cyl", r: 6 });
  }
}

const HAND_BUILDERS = { open: openHand, fist, carry, cup, grip, pinch, gunGrip: (s, view) => grip(s, view, PISTOL) };

const PALM_UP = { palm: "rotate(90 88 470)", back: "rotate(90 88 470)", thumb: "rotate(-90 88 470)", little: "rotate(90 88 470)", tips: "rotate(180 88 434)" };

const FINGERS_LEFT = { ...PALM_UP, tips: "rotate(-90 88 434)" };
const GUN_UP = { ...FINGERS_LEFT, back: "rotate(-90 88 470)" };

const REST_UP = { ...PALM_UP, palm: "rotate(-90 88 470)" };

function buildHand({ view = "back", pose = "open", rest = false } = {}) {
  const root = { k: "g", kids: [] };
  const up = rest && pose === "carry" ? REST_UP[view] : (pose === "carry" || pose === "cup") ? PALM_UP[view] : (pose === "grip" || pose === "pinch") ? FINGERS_LEFT[view] : pose === "gunGrip" ? GUN_UP[view] : null;
  const hand = G(up ? G(root, up) : root, null, "hand", [89, 400]);
  if (pose === "carry") carry(hand, view, rest);
  else HAND_BUILDERS[pose](hand, view);
  return root;
}

window.XBOT = { SIDE_FORE_TURN, WEAPON_GRIP, GAME_LINE: CFG.gameLod.lineW, locate, solve, shade, PALETTE, AX, SIDE_AX, FOOT_Y, buildFront, buildBack, buildSide, buildHand, HAND_VIEWS, HAND_POSES, render, LEVELS };
})();
