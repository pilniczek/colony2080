(() => {
const { kit } = window.CUTSCENES;
const { buildSide, render: renderBot, SIDE_AX, FOOT_Y } = window.XBOT;
const CFG = window.C28_CONFIG.cutscenes.hullCoverPunch;
const S = CFG.stage;
const palette = { ...CFG.palette };
const STANCE = { hipNear: -16, kneeNear: 10, ankleNear: 2.8, hipFar: 14, kneeFar: 6, ankleFar: -15.4 };
const GUARD = { arm: -38, fore: -92, armFar: -30, foreFar: -96 };
const JAB = { arm: -88, fore: 12 };
const JAB_FAR = { armFar: -84, foreFar: 6 };
const side = buildSide({ farLimbs: true, fists: true });

const mix = (a, b, k) => a + (b - a) * k;

function punchPose(raise, jab, jabFar, lunge) {
  const pose = { body: { rot: 2 * raise, dx: lunge } };
  for (const key in STANCE) pose[key] = mix(kit.STAND[key], STANCE[key], raise);
  pose.arm = mix(GUARD.arm * raise, JAB.arm, jab);
  pose.fore = mix(GUARD.fore * raise, JAB.fore, jab);
  pose.armFar = mix(GUARD.armFar * raise, JAB_FAR.armFar, jabFar);
  pose.foreFar = mix(GUARD.foreFar * raise, JAB_FAR.foreFar, jabFar);
  return pose;
}

function punch(ctx, t, { view: V, at, hits }) {
  const jab = at("jab", t), jabFar = at("jabFar", t);
  const pose = punchPose(at("raise", t), jab, jabFar, S.lunge * Math.max(jab, jabFar));
  const m = new DOMMatrix().translate(V.x, V.floorY).scale(V.scale).translate(-SIDE_AX, -FOOT_Y);
  kit.shadow(ctx, V.x, V.floorY, 200 * V.scale, 22 * V.scale, 0.4, palette.shadow);
  ctx.save();
  ctx.transform(m.a, m.b, m.c, m.d, m.e, m.f);
  renderBot(ctx, side, { pose, lineW: kit.lineFor(ctx, V.scale) });
  ctx.restore();
  if (at("hits", t) >= 0.5) hits(Math.floor(t / S.sparkSeconds));
}

let render = null;
const draw = (ctx, w, h, t) => (render ||= window.CUTSCENES.hullCoverScene(CFG, palette, punch))(ctx, w, h, t);

window.CUTSCENES.hullCoverPunch = { name: CFG.title, camera: CFG.camera, duration: CFG.duration, palette, render: draw };
})();
