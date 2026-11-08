(() => {
const ENV_PAL = window.ENV.PALETTE;
const COLORS = {
  o0: "#2a2a1e", o1: "#484830", o2: "#606048", o3: "#9c9c84", oLine: "#141410",
  t0: "#3c3c30", t1: "#606054", t2: "#848478", t3: "#b4b4a8",
  r0: "#4a1a12", r1: "#783024", r2: "#c03c24", r3: "#e4704c",
  l0: "#2c4048", l1: "#466a78", l2: "#6c909c", l3: "#a8ccd4",
  y0: ENV_PAL.y0, y1: ENV_PAL.y1, y2: ENV_PAL.y2, y3: ENV_PAL.y3
};
const MAT = { o: ["o0", "o1", "o2", "o3", "oLine"], t: ["t0", "t1", "t2", "t3", "oLine"], r: ["r0", "r1", "r2", "r3", "oLine"], l: ["l0", "l1", "l2", "l3", "oLine"], y: ["y0", "y1", "y2", "y3", "oLine"] };

const BARREL = { x: 60, length: 150 };
const WARHEAD = 26;

const buildParts = length => [
  { name: "flare", x: -112, y: -74, w: 14, h: 66, mat: "t", tone: 0 },
  { name: "tubeBack", x: -98, y: -64, w: BARREL.x + 98, h: 46, mat: "t", tone: 1 },
  { name: "magazine", x: -82, y: -84, w: 64, h: 76, mat: "o", tone: 1 },
  { name: "magazineTop", x: -82, y: -84, w: 64, h: 12, mat: "o", tone: 2 },
  { name: "hazard", x: -76, y: -66, w: 34, h: 6, mat: "y", tone: 2 },
  { name: "grip", x: -16, y: -14, w: 30, h: 46, mat: "o", tone: 0 },
  { name: "trigger", x: -20, y: -22, w: 44, h: 10, mat: "t", tone: 0 },
  { name: "sight", x: 14, y: -90, w: 44, h: 26, mat: "t", tone: 2 },
  { name: "lens", x: 54, y: -88, w: 9, h: 11, mat: "l", tone: 2 },
  { name: "tube", x: BARREL.x, y: -64, w: length, h: 46, mat: "t", tone: 1 },
  { name: "tubeTop", x: BARREL.x, y: -64, w: length, h: 8, mat: "t", tone: 3 },
  { name: "foreGrip", x: BARREL.x + 18, y: -18, w: 22, h: 36, mat: "o", tone: 0 },
  { name: "ring", x: BARREL.x + length - 18, y: -68, w: 18, h: 54, mat: "o", tone: 1 }
];

function warhead(ctx, length, simple, { pal, lineW, loaded }) {
  if (!loaded) return;
  const tone = k => pal[k] ?? COLORS[k];
  const x = BARREL.x + length;
  const cone = (pts, fill) => {
    ctx.fillStyle = fill;
    ctx.beginPath();
    pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
    ctx.closePath();
    ctx.fill();
  };
  cone([[x, -56], [x + WARHEAD, -41], [x, -26]], tone("r2"));
  if (!simple) cone([[x, -56], [x + WARHEAD, -41], [x, -48]], tone("r3"));
  if (!lineW) return;
  const t = ctx.getTransform();
  ctx.strokeStyle = tone("oLine");
  ctx.lineWidth = lineW / Math.sqrt(Math.abs(t.a * t.d - t.b * t.c));
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(x, -56);
  ctx.lineTo(x + WARHEAD, -41);
  ctx.lineTo(x, -26);
  ctx.closePath();
  ctx.stroke();
}

const MUZZLE = [BARREL.x + BARREL.length + WARHEAD, -41];
const core = window.GUN.model({ buildParts, mat: MAT, colors: COLORS, after: warhead, barrel: BARREL, muzzle: MUZZLE });

const SHOT = { cycle: 24, empty: 4, hz: 32 };
const RANGE = 12 * 24;
const HUD_ROCKET = { nose: 9.5, scale: 0.7 };

function shot(ctx, length, tick) {
  const age = tick % SHOT.cycle;
  ctx.save();
  if (age < 2) {
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = ENV_PAL.a2;
    ctx.beginPath();
    ctx.ellipse(3, 0, 8, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  window.ENEMIES.rocketFlight(ctx, [0, 0], age / SHOT.hz, length + 0.35 * window.ENV.TILE);
  ctx.restore();
}

function hudShot(ctx) {
  ctx.save();
  ctx.translate(HUD_ROCKET.nose, 0);
  ctx.scale(HUD_ROCKET.scale, HUD_ROCKET.scale);
  window.ENEMIES.missile(ctx, 0, 0, 0);
  ctx.restore();
}

const loadedAt = tick => tick % SHOT.cycle >= SHOT.empty;

window.ROCKET_LAUNCHER = { ...core, SHOT, loadedAt, RANGE, shot, hudShot };
})();
