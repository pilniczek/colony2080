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

function bbox(pts) {
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}

function mirrorPts(pts, ax = AX) {
  return pts.map(([x, y]) => [2 * ax - x, y]).reverse();
}

function G(parent, tf, name, pivot, extra = {}) {
  const n = { k: "g", m: tf ? parseTf(tf) : null, name, pivot, kids: [], ...extra };
  parent.kids.push(n);
  return n;
}

function P(parent, spec) {
  const { pts, r = 4 } = spec;
  parent.kids.push({ k: "part", spec, path: new Path2D(roundedPath(pts, r)), box: bbox(pts) });
}

function F(parent, pts, fill, r = 0) {
  parent.kids.push({ k: "flat", path: new Path2D(roundedPath(pts, r)), fill });
}

function E(parent, cx, cy, rx, ry, fill, opacity = 1) {
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
function bodyGroup(parent) {
  return G(parent, `translate(${AX} 0) scale(${BODY_SX} 1) translate(${-AX} 0)`);
}

function headFront(s, back) {
  P(s, { pts: [[306, 96], [334, 96], [336, 120], [304, 120]], mat: "metal", shade: "cyl", r: 2 });
  both(s, { pts: [[246, 4], [256, 4], [258, 70], [244, 70]], r: 4, shade: "cyl" });
  both(s, { pts: [[240, 56], [266, 52], [268, 98], [242, 100]], r: 2 });
  if (back) P(s, { pts: [[313, 12], [327, 12], [330, 30], [310, 30]], r: 2 });
  P(s, { pts: [[264, 102], [262, 34], [276, 22], [364, 22], [378, 34], [376, 102]], r: 3 });
  if (!back) P(s, { pts: [[313, 12], [327, 12], [330, 30], [326, 46], [314, 46], [310, 30]], r: 2 });
  if (back) {
    F(s, [[274, 70], [366, 70], [366, 74], [274, 74]], "a0");
    F(s, [[318, 58], [322, 58], [322, 100], [318, 100]], "a0");
    return;
  }
  P(s, { pts: [[272, 48], [368, 48], [368, 80], [348, 80], [348, 104], [292, 104], [292, 80], [272, 80]], mat: "metal", shade: "none", r: 2 });
  F(s, [[274, 50], [320, 50], [320, 102], [294, 102], [294, 78], [274, 78]], "m2");
  F(s, [[280, 56], [312, 56], [312, 63], [280, 63]], "visor", 1);
  F(s, mirrorPts([[280, 56], [312, 56], [312, 63], [280, 63]]), "visor", 1);
}

function frontHand(parent, M, thumbFront) {
  const thumb = () => {
    P(parent, { pts: M([[112, 412], [134, 408], [142, 430], [134, 452], [118, 448], [110, 430]]), r: 4 });
    F(parent, M([[116, 430], [136, 428], [136, 431], [116, 433]]), "a0");
  };
  if (!thumbFront) thumb();
  P(parent, { pts: M([[44, 400], [134, 398], [136, 434], [44, 436]]), mat: "metal", r: 2 });
  for (let i = 0; i < 4; i++) {
    const x = 46 + i * 21;
    P(parent, { pts: M([[x, 422], [x + 19, 422], [x + 19, 437], [x, 437]]), r: 2 });
    P(parent, { pts: M([[x + 1, 437], [x + 18, 437], [x + 18, 456], [x + 1, 456]]), shade: "cyl", r: 2 });
    F(parent, M([[x + 1, 456], [x + 18, 456], [x + 18, 459], [x + 1, 459]]), "m0");
    P(parent, { pts: M([[x + 2, 459], [x + 17, 459], [x + 17, 472], [x + 10, 478], [x + 2, 472]]), shade: "cyl", r: 3 });
  }
  if (thumbFront) thumb();
}

function frontArm(parent, mirror, names = {}, thumbFront = false, foreParent = null, flipHand = false) {
  const M = p => mirror ? mirrorPts(p) : p;
  const sh = mirror ? [2 * AX - 100, 150] : [100, 150];
  const el = mirror ? [2 * AX - 90, 306] : [90, 306];
  const arm = G(parent, null, names.arm, sh);
  P(G(arm, `translate(${mirror ? -6 : 6} -22)`), { pts: M(elbow), mat: "metal", shade: "hcyl", r: 1 });
  P(arm, { pts: M(bicep), r: 18, shade: "dome" });
  P(arm, { pts: M(pauldron), r: 20, shade: "dome" });
  const fore = G(foreParent ? G(foreParent, null, names.arm, sh) : arm, `translate(${mirror ? -FORE_SHIFT : FORE_SHIFT} -22)`, names.fore, el);
  const fc = mirror ? 2 * AX - 89 : 89;
  const fa = G(fore, `translate(${fc} 0) scale(${FOREARM_SX} 1) translate(${-fc} 0)`);
  P(fa, { pts: M(forearm), r: 1 });
  F(fa, M([[30, 354], [150, 352], [150, 356], [30, 358]]), "a0");
  F(fa, M([[30, 374], [150, 372], [150, 376], [30, 378]]), "a0");
  const hand = G(fore, `translate(${mirror ? 2 * AX - 89 : 89} 440)`);
  if (names.hand) hook(hand, names.hand);
  const hc = mirror ? 2 * AX - 89 : 89;
  frontHand(fore, flipHand ? p => mirrorPts(M(p), hc) : M, thumbFront);
}

function buildFront() {
  const root = { k: "g", kids: [] };
  const s = G(root, null, "body", [AX, 344]);
  P(bodyGroup(s), { pts: [[248, 316], [392, 316], [398, 352], [374, 392], [320, 404], [266, 392], [242, 352]], r: 18 });
  const hipBar = bodyGroup(s);
  P(hipBar, { pts: [[198, 318], [442, 318], [442, 372], [198, 372]], mat: "chrome", shade: "hcyl", r: 6 });
  for (const x of [214, 236, 398, 420]) F(hipBar, [[x, 318], [x + 6, 318], [x + 6, 372], [x, 372]], "m1");
  legPair(s, leg.piston, "thigh");
  legFlat(s, leg.pistonRing, "m1", "thigh");
  legPair(s, leg.thigh, "thigh");
  for (let i = 0; i < 3; i++) legFlat(s, [[160, 372 + i * 16], [190, 372 + i * 16], [190, 376 + i * 16], [160, 376 + i * 16]], "a0", "thigh");
  legPair(s, leg.shin, "shin");
  legPair(s, { pts: leg.shinSlot, mat: "metal", shade: "none", r: 1 }, "shin");
  legPair(s, leg.foot);
  legPair(s, leg.toe);
  legPair(s, leg.knee, "knee");
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
  trefoil(b, 418, 150, BADGE_R, 1 / BODY_SX);
  F(b, [[196, 222], [226, 226], [226, 230], [196, 226]], "a0");
  headFront(s, false);
  const arms = bodyGroup(s);
  frontArm(arms, false, { arm: "armL", fore: "foreL", hand: "handL" });
  frontArm(arms, true, { arm: "armR", fore: "foreR", hand: "handR" });
  return root;
}

function buildBack({ leftArmBehind = false, rightForeBehind = false } = {}) {
  const root = { k: "g", kids: [] };
  const s = G(root, null, "body", [AX, FOOT_Y]);
  if (leftArmBehind) frontArm(bodyGroup(s), false, { arm: "armL", fore: "foreL", hand: "handL" }, true);
  const behindRight = rightForeBehind ? bodyGroup(s) : null;
  P(bodyGroup(s), { pts: [[198, 318], [442, 318], [442, 372], [198, 372]], mat: "chrome", shade: "hcyl", r: 6 });
  legPair(s, leg.piston, "thigh");
  legFlat(s, leg.pistonRing, "m1", "thigh");
  legPair(s, leg.thigh, "thigh");
  legPair(s, { pts: [[162, 500], [264, 500], [280, 690], [148, 690]], r: 1 }, "shin");
  for (let i = 0; i < 4; i++) legFlat(s, [[176, 560 + i * 26], [252, 560 + i * 26], [254, 566 + i * 26], [174, 566 + i * 26]], "a0", "shin");
  legPair(s, { pts: [[178, 456], [244, 456], [246, 512], [176, 512]], mat: "metal", shade: "cyl", r: 1 }, "knee");
  legPair(s, { pts: [[146, 688], [282, 688], [290, 714], [286, 744], [142, 744], [136, 714]], mat: "metal", r: 1 });
  const b = bodyGroup(s);
  P(b, { pts: [[248, 316], [392, 316], [398, 352], [374, 392], [320, 404], [266, 392], [242, 352]], r: 18 });
  P(b, { pts: [[172, 196], [468, 196], [446, 300], [436, 322], [204, 322], [194, 300]], mat: "metal", r: 10 });
  P(b, { pts: [[148, 132], [178, 112], [250, 106], [320, 104], [390, 106], [462, 112], [492, 132], [502, 166], [478, 196], [446, 204], [418, 238], [394, 254], [356, 262], [320, 266], [284, 262], [246, 254], [222, 238], [194, 204], [162, 196], [138, 166]], r: 16 });
  F(b, [[316, 104], [324, 104], [324, 262], [316, 262]], "a0");
  for (const side of [false, true]) {
    const M = p => side ? mirrorPts(p) : p;
    F(b, M([[220, 150], [268, 146], [268, 152], [220, 156]]), "a0");
    F(b, M([[210, 240], [262, 250], [262, 256], [210, 246]]), "a0");
    for (const [x, y] of [[236, 196], [278, 230]]) E(b, side ? 2 * AX - x : x, y, 4, 4, "a0");
  }
  for (const [x, y, h] of [[250, 160, 40], [268, 170, 60], [384, 150, 50], [404, 200, 34]]) F(b, [[x, y], [x + 4, y], [x + 3, y + h], [x + 1, y + h]], "a0");
  headFront(s, true);
  const arms = bodyGroup(s);
  if (!leftArmBehind) frontArm(arms, false, { arm: "armL", fore: "foreL", hand: "handL" }, true);
  frontArm(arms, true, { arm: "armR", fore: "foreR", hand: "handR" }, !rightForeBehind, behindRight, rightForeBehind);
  return root;
}

function sideLeg(parent, names, extra) {
  const hip = G(parent, null, names.hip, [300, 344], extra);
  const th = G(hip, legTf("thigh", 296, 0.88));
  P(th, { pts: [[278, 342], [314, 342], [314, 440], [278, 440]], mat: "chrome", shade: "cyl", r: 1 });
  P(th, { pts: [[246, 338], [278, 338], [278, 432], [314, 432], [314, 338], [342, 338], [346, 452], [334, 468], [258, 468], [246, 452]], r: 1 });
  const knee = G(hip, null, names.knee, [300, 522]);
  const sh = G(knee, legTf("shin", 296, 0.88));
  P(sh, { pts: [[256, 500], [340, 500], [354, 690], [240, 690]], r: 1 });
  P(sh, { pts: [[298, 540], [312, 540], [316, 660], [298, 660]], mat: "metal", shade: "none", r: 1 });
  const ankle = G(knee, null, names.ankle, [300, 700]);
  const ft = G(ankle, legTf("foot", 300, 0.88));
  P(ft, { pts: [[204, 688], [384, 688], [402, 712], [398, 744], [202, 744]], mat: "metal", r: 1 });
  P(ft, { pts: [[300, 688], [384, 688], [396, 706], [300, 706]], r: 1 });
  if (names.heel) hook(G(ankle, "translate(220 744)"), names.heel);
  if (names.toe) hook(G(ankle, "translate(380 744)"), names.toe);
  const kn = G(knee, legTf("knee", 300, 0.88));
  E(kn, 300, 486, 30, 30, "m1");
  E(kn, 294, 480, 12, 12, "m3");
  P(kn, { pts: [[300, 448], [340, 452], [362, 478], [362, 510], [344, 534], [318, 532], [310, 500]], mat: "chrome", r: 1 });
}

function sideHand(parent) {
  P(parent, { pts: [[352, 410], [376, 406], [384, 428], [376, 448], [360, 444], [350, 428]], r: 4 });
  P(parent, { pts: [[278, 398], [364, 396], [366, 434], [278, 436]], mat: "metal", r: 2 });
  for (let i = 0; i < 4; i++) {
    const x = 280 + i * 21;
    P(parent, { pts: [[x, 422], [x + 19, 422], [x + 19, 437], [x, 437]], r: 2 });
    P(parent, { pts: [[x + 1, 437], [x + 18, 437], [x + 18, 456], [x + 1, 456]], shade: "cyl", r: 2 });
    F(parent, [[x + 1, 456], [x + 18, 456], [x + 18, 459], [x + 1, 459]], "m0");
    P(parent, { pts: [[x + 2, 459], [x + 17, 459], [x + 17, 472], [x + 10, 478], [x + 2, 472]], shade: "cyl", r: 3 });
  }
}

function sideArm(parent, names, extra) {
  const arm = G(parent, "translate(2 -4)", names.arm, [300, 150], extra);
  P(arm, { pts: [[288, 274], [334, 274], [334, 294], [288, 294]], mat: "metal", shade: "cyl", r: 1 });
  const bulbs = G(arm, SIDE_SHOULDER_TF);
  P(bulbs, { pts: [[276, 196], [346, 196], [364, 220], [360, 257], [340, 279], [308, 286], [280, 278], [264, 254], [264, 217]], r: 18, shade: "dome" });
  P(bulbs, { pts: [[248, 106], [292, 96], [336, 102], [362, 126], [370, 164], [358, 196], [330, 212], [292, 216], [256, 206], [234, 182], [230, 146], [236, 122]], r: 22, shade: "dome" });
  const lower = G(arm, "translate(0 -22) rotate(-18 311 306)", names.fore, [311, 306]);
  const fa = G(lower, `translate(312 0) scale(${FOREARM_SX} 1) translate(-312 0)`);
  P(fa, { pts: [[262, 308], [358, 304], [366, 320], [366, 392], [354, 402], [270, 404], [258, 390]], r: 1 });
  F(fa, [[264, 352], [366, 350], [366, 354], [264, 356]], "a0");
  F(fa, [[264, 372], [366, 370], [366, 374], [264, 376]], "a0");
  const hand = G(lower, "translate(322 446)");
  if (names.hand) hook(hand, names.hand);
  sideHand(lower);
}

function buildSide({ farLimbs = false, badge = false } = {}) {
  const root = { k: "g", kids: [] };
  const s = G(root, null, "body", [SIDE_AX, 344]);
  if (farLimbs) {
    const far = { filter: "brightness(0.55)" };
    sideArm(G(s, "translate(-20 0)"), { arm: "armFar", fore: "foreFar", hand: "handFar" }, far);
    sideLeg(G(s, "translate(-24 0)"), { hip: "hipFar", knee: "kneeFar", ankle: "ankleFar", heel: "heelFar", toe: "toeFar" }, far);
  }
  const lowerTorso = G(s, SIDE_TORSO_TF);
  P(lowerTorso, { pts: [[222, 316], [398, 316], [398, 372], [222, 372]], mat: "chrome", shade: "hcyl", r: 2 });
  P(lowerTorso, { pts: [[214, 236], [390, 236], [378, 322], [226, 322]], mat: "metal", r: 2 });
  for (let i = 0; i < 4; i++) P(lowerTorso, { pts: [[300, 244 + i * 18], [380, 244 + i * 18], [380, 254 + i * 18], [300, 254 + i * 18]], mat: "chrome", shade: "hcyl", r: 4 });
  P(lowerTorso, { pts: [[350, 318], [392, 318], [400, 344], [390, 380], [366, 404], [352, 400]], r: 2 });
  P(lowerTorso, { pts: [[216, 316], [264, 316], [268, 352], [256, 392], [234, 404], [214, 394], [206, 352]], r: 6 });
  sideLeg(s, { hip: "hipNear", knee: "kneeNear", ankle: "ankleNear", heel: "heelNear", toe: "toeNear" });
  const upperTorso = G(s, SIDE_TORSO_TF);
  P(upperTorso, { pts: [[194, 112], [406, 112], [388, 330], [212, 330]], mat: "metal", r: 2 });
  const sideChestPlate = [[352, 104], [400, 104], [412, 118], [412, 212], [402, 240], [386, 248], [368, 236], [352, 220]];
  P(upperTorso, { pts: mirrorPts(sideChestPlate, SIDE_AX), r: 12 });
  hook(upperTorso, "back");
  P(upperTorso, { pts: sideChestPlate, r: 12 });
  if (badge) trefoil(upperTorso, 400, 160, BADGE_R, 0.5 / SIDE_TORSO_SX, 0.68);
  const head = G(s, "translate(-28 0)");
  P(head, { pts: [[300, 100], [336, 100], [340, 160], [304, 160]], mat: "metal", shade: "none", r: 4 });
  P(head, { pts: [[312, 96], [336, 96], [338, 120], [310, 120]], mat: "metal", shade: "cyl", r: 2 });
  P(head, { pts: [[282, 102], [280, 34], [292, 22], [374, 22], [388, 34], [388, 104]], r: 3 });
  P(head, { pts: [[300, 24], [304, 12], [382, 12], [388, 24]], r: 2 });
  P(head, { pts: [[356, 48], [388, 48], [388, 104], [372, 104], [372, 80], [356, 80]], mat: "metal", shade: "none", r: 2 });
  F(head, [[368, 56], [388, 56], [388, 63], [368, 63]], "visor", 1);
  P(head, { pts: [[300, 56], [328, 52], [330, 98], [302, 100]], r: 2 });
  P(head, { pts: [[308, 4], [318, 4], [320, 70], [306, 70]], r: 4, shade: "cyl" });
  sideArm(s, { arm: "arm", fore: "fore", hand: "hand" });
  return root;
}

function drawPart(ctx, node, pal, lineW) {
  const { spec, path, box } = node;
  const { mat = "armor", shade = "box", line = true } = spec;
  const [c0, c1, c2, c3, cl] = MAT[mat].map(k => pal[k]);
  const [x0, y0, x1, y1] = box;
  const w = x1 - x0, h = y1 - y0;
  ctx.save();
  ctx.clip(path);
  ctx.fillStyle = c1;
  ctx.fill(path);
  const poly = (fill, pts) => {
    ctx.fillStyle = fill;
    ctx.beginPath();
    pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.fill();
  };
  const rect = (fill, x, y, rw, rh) => { ctx.fillStyle = fill; ctx.fillRect(x, y, rw, rh); };
  const ell = (fill, cx, cy, rx, ry) => { ctx.fillStyle = fill; ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); };
  if (shade === "box") {
    poly(c2, [[x0 - 2, y0 - 2], [x0 + w * 0.36, y0 - 2], [x0 + w * 0.26, y1 + 2], [x0 - 2, y1 + 2]]);
    poly(c0, [[x1 - w * 0.2, y0 - 2], [x1 + 2, y0 - 2], [x1 + 2, y1 + 2], [x1 - w * 0.28, y1 + 2]]);
    poly(c0, [[x0 - 2, y1 - h * 0.12], [x1 + 2, y1 - h * 0.08], [x1 + 2, y1 + 2], [x0 - 2, y1 + 2]]);
    if (w > 24 && h > 24) poly(c3, [[x0 + w * 0.1, y0 + h * 0.08], [x0 + w * 0.22, y0 + h * 0.08], [x0 + w * 0.15, y0 + h * 0.4], [x0 + w * 0.06, y0 + h * 0.4]]);
  } else if (shade === "dome") {
    rect(c0, x0 - 2, y0 - 2, w + 4, h + 4);
    ell(c1, x0 + w * 0.44, y0 + h * 0.44, w * 0.5, h * 0.5);
    ell(c2, x0 + w * 0.36, y0 + h * 0.34, w * 0.3, h * 0.28);
    ell(c3, x0 + w * 0.3, y0 + h * 0.26, w * 0.09, h * 0.06);
  } else if (shade === "cyl") {
    rect(c2, x0 - 2, y0 - 2, w * 0.3 + 2, h + 4);
    rect(c3, x0 + w * 0.12, y0 - 2, w * 0.08, h + 4);
    rect(c0, x1 - w * 0.25, y0 - 2, w * 0.25 + 2, h + 4);
  } else if (shade === "hcyl") {
    rect(c2, x0 - 2, y0 - 2, w + 4, h * 0.32 + 2);
    rect(c3, x0 - 2, y0 + h * 0.14, w + 4, h * 0.08);
    rect(c0, x0 - 2, y1 - h * 0.28, w + 4, h * 0.28 + 2);
  }
  ctx.restore();
  if (line && lineW) {
    ctx.strokeStyle = cl;
    ctx.lineJoin = "round";
    ctx.lineWidth = lineW / Math.sqrt(Math.abs(ctx.getTransform().a * ctx.getTransform().d - ctx.getTransform().b * ctx.getTransform().c));
    ctx.stroke(path);
  }
}

function drawTrefoil(ctx, r, pal, lineW, outer = 0.84) {
  ctx.fillStyle = pal.badge;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  if (lineW) {
    const t = ctx.getTransform();
    ctx.strokeStyle = pal.aLine;
    ctx.lineWidth = lineW / Math.sqrt(Math.abs(t.a * t.d - t.b * t.c));
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

function render(ctx, node, { pal = PALETTE, pose = {}, hooks = {}, lineW = 2.2 } = {}) {
  if (node.k === "g") {
    ctx.save();
    if (node.m) ctx.transform(node.m.a, node.m.b, node.m.c, node.m.d, node.m.e, node.m.f);
    if (node.filter) ctx.filter = node.filter;
    const ang = node.name != null ? pose[node.name] : null;
    if (ang) {
      ctx.translate(node.pivot[0], node.pivot[1]);
      ctx.rotate(ang * Math.PI / 180);
      ctx.translate(-node.pivot[0], -node.pivot[1]);
    }
    for (const kid of node.kids) render(ctx, kid, { pal, pose, hooks, lineW });
    ctx.restore();
  } else if (node.k === "part") {
    drawPart(ctx, node, pal, lineW);
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
    hooks[node.name](ctx);
  }
}

function locate(node, name, pose = {}, m = new DOMMatrix()) {
  if (node.k === "hook") return node.name === name ? m : null;
  if (node.k !== "g") return null;
  let mm = node.m ? m.multiply(node.m) : m;
  const ang = node.name != null ? pose[node.name] : null;
  if (ang) mm = mm.translate(node.pivot[0], node.pivot[1]).rotate(ang).translate(-node.pivot[0], -node.pivot[1]);
  for (const kid of node.kids) {
    const r = locate(kid, name, pose, mm);
    if (r) return r;
  }
  return null;
}

const LEVELS = Object.entries(CFG.levels);

window.XBOT = { locate, PALETTE, AX, SIDE_AX, FOOT_Y, mirrorPts, buildFront, buildBack, buildSide, render, LEVELS };
})();
