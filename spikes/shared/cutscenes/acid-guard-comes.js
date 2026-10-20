(() => {
const { kit } = window.CUTSCENES;
const { LINE_W, asset } = kit;
const ENV = window.ENV;
const CFG = window.C28_CONFIG.cutscenes.acidGuardComes;
const S = CFG.stage;
const { width: W, height: H, horizon: HORIZON, tower: TOWER, guard: G } = S;
const palette = { ...CFG.palette };
const at = kit.track(CFG.tracks);
const GUARD = asset("acidGuardFront");
const WALK = 2, IDLE = 0, FIRING = 1;
const STOP = CFG.tracks.guardX[1][0];
const HIT = 0.09;

const pick = kit.random(S.seed);
const clouds = Array.from({ length: S.clouds }, () => {
  const y = pick() * (HORIZON - 120);
  return { x: -200 + pick() * 2000, y, w: 260 + pick() * 520, h: 30 + pick() * 50, lit: y / HORIZON };
});
const backdrop = kit.stillLayer();

function drawSky(c) {
  kit.rowFill(c, g => {
    const sky = g.createLinearGradient(0, -200, 0, HORIZON);
    sky.addColorStop(0, palette.skyTop);
    sky.addColorStop(0.45, palette.skyMid);
    sky.addColorStop(0.78, palette.skyGlow);
    sky.addColorStop(0.88, palette.skyHot);
    sky.addColorStop(1, palette.skyLow);
    g.fillStyle = sky;
    g.fillRect(-1000, -400, 3600, HORIZON + 400);
    const floor = g.createLinearGradient(0, HORIZON, 0, H + 200);
    floor.addColorStop(0, palette.floorFar);
    floor.addColorStop(1, palette.floorNear);
    g.fillStyle = floor;
    g.fillRect(-1000, HORIZON, 3600, H + 400);
  });
  for (const k of clouds) kit.cloud(c, k.x, k.y, k.w, k.h, 0.5 * k.lit, palette.cloudLit, palette.cloud);
  for (let i = 0; i < 9; i++) {
    const y = HORIZON + 14 + i * i * 4.4;
    c.globalAlpha = 0.25;
    kit.rect(c, -1000, y, 3600, 2 + i * 0.6, palette.streak);
  }
  c.globalAlpha = 1;
}

function drawTower(c) {
  const { x, w, top, rungs, bar } = TOWER;
  const step = (HORIZON - top) / rungs;
  for (const lx of [x, x + w]) kit.rect(c, lx - bar / 2, top, bar, HORIZON - top + 20, palette.silhouette);
  for (let i = 0; i <= rungs; i++) {
    const y = top + i * step;
    kit.rect(c, x, y - bar / 4, w, bar / 2, palette.silhouette);
    if (i < rungs) {
      kit.stroke(c, [[x, y], [x + w, y + step]], palette.silhouette, bar * 0.6);
      kit.stroke(c, [[x + w, y], [x, y + step]], palette.silhouette, bar * 0.6);
    }
  }
}

function drawBuilding(c) {
  kit.poly(c, S.building, palette.silhouette);
  const [a, b] = S.building;
  kit.stroke(c, [a, b], palette.edge, 4);
}

function drawBackdrop(c) {
  drawSky(c);
  drawTower(c);
  drawBuilding(c);
}

function guardLook(t) {
  if (t < STOP) return { state: WALK, t };
  const fired = t - G.fireFrom;
  if (fired < 0 || fired >= G.burst * G.bursts) return { state: IDLE, t };
  return { state: FIRING, t: fired % G.burst };
}

function hitAge(t) {
  const fired = t - G.fireFrom;
  if (fired < 0 || fired >= G.burst * G.bursts) return null;
  const age = fired % G.burst;
  return age < HIT ? age : null;
}

function drawGuard(c, t) {
  const x = at("guardX", t), y = at("guardY", t), k = at("guardScale", t);
  kit.shadow(c, x, y + 4, 34 * k, 5 * k, 0.45, palette.shadow);
  const look = guardLook(t);
  c.save();
  c.translate(x, y);
  c.scale(k, k);
  ENV.draw(c, GUARD, { state: look.state, t: look.t, lines: LINE_W / k });
  c.restore();
}

function render(c, w, h, t) {
  c.save();
  kit.fitStage(c, w, h, W, H);
  const hit = hitAge(t);
  const kick = hit === null ? 0 : 1 - hit / HIT;
  kit.camera(c, W, H, at("camX", t) + Math.sin(t * 97) * 14 * kick, at("camY", t) + Math.cos(t * 83) * 10 * kick, at("camZ", t));
  backdrop(c, [], drawBackdrop);
  drawGuard(c, t);
  c.restore();
  const flash = Math.max(at("flash", t), 0.35 * kick);
  if (flash > 0) {
    c.save();
    c.globalAlpha = flash;
    c.fillStyle = palette.flash;
    c.fillRect(0, 0, w, h);
    c.restore();
  }
}

window.CUTSCENES.acidGuardComes = { name: CFG.title, camera: CFG.camera, duration: CFG.duration, palette, render, ref: kit.filmRef("acidGuardComes", CFG.duration) };
})();
