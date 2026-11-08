(() => {
const { kit } = window.CUTSCENES;
const { poly, stroke, oval } = kit;
const { XBOT } = window;
const { sky, walkPose, walker, lineFor, robots, arms } = window.CUTSCENES.repairCrane.art;
const CFG = window.C28_CONFIG.cutscenes.vesniceStart;
const ST = CFG.stage;
const W = ST.width, H = ST.height;
const WALK = CFG.walk;
const DUSK = { brightness: 0.85, saturate: 0.95 };
const palette = { ...CFG.palette };
const SKY = { palette, sun: ST.sun };
const at = kit.track(CFG.tracks);

const CLOUDS = kit.bank(17, 24, -150, 1900, -40, ST.horizon - 80, 180, 360, 16, 30);
const HILL = [[-100, 900], [-100, 640], [300, 560], [650, 522], [900, 516], [1200, 546], [1700, 620], [1700, 900]];
const RIDGE = [[-100, 600], [400, 540], [800, 560], [1200, 498], [1700, 560], [1700, 700], [-100, 700]];
const FACETS = [[[300, 560], [650, 522], [560, 600], [260, 640]], [[650, 522], [900, 516], [820, 570]], [[-100, 680], [260, 640], [180, 760], [-100, 800]]];
const CRACKS = [[[560, 600], [600, 700], [560, 820]], [[820, 570], [900, 660]], [[1200, 546], [1150, 640], [1260, 760]]];
const FRONDS = [[-40, 960, 520, 520, 18, 1], [180, 960, 300, 700, 12, 0.7]];
const backdrop = kit.stillLayer();

function frond(ctx, x, y, len, rise, leaves, k) {
  const tipX = x + len, tipY = y - rise;
  const cx = x + len * 0.2, cy = y - rise * 1.1;
  ctx.strokeStyle = palette.leaf;
  ctx.lineWidth = 8 * k;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(cx, cy, tipX, tipY);
  ctx.stroke();
  for (let i = 1; i <= leaves; i++) {
    const u = i / (leaves + 1), v = 1 - u;
    const px = v * v * x + 2 * u * v * cx + u * u * tipX;
    const py = v * v * y + 2 * u * v * cy + u * u * tipY;
    const dir = Math.atan2(2 * v * (cy - y) + 2 * u * (tipY - cy), 2 * v * (cx - x) + 2 * u * (tipX - cx));
    const side = i % 2 ? 1 : -1;
    const size = (1 - u * 0.6) * 46 * k;
    const a = dir + side * 0.9;
    oval(ctx, px + Math.cos(a) * size, py + Math.sin(a) * size, size, size * 0.32, i % 3 ? palette.leaf : palette.leafLit, a);
  }
}

function render(ctx, w, h, t) {
  ctx.save();
  kit.fitStage(ctx, w, h, W, H);
  backdrop(ctx, ["hill"], c => {
    sky(c, SKY, ST.horizon, CLOUDS);
    poly(c, RIDGE, palette.ridge);
    poly(c, HILL, palette.rock);
    for (const f of FACETS) poly(c, f, palette.rockLit);
    for (const k of CRACKS) stroke(c, k, palette.rockDark, 6);
  });
  ctx.save();
  kit.feet(ctx, at("walkerX", t), at("walkerY", t), at("walkerK", t), at("walkerK", t), XBOT.AX);
  const { lift, pose } = walkPose(WALK, arms(at, t), t, at("stride", t));
  walker(ctx, WALK, robots().front, pose, XBOT.shade(XBOT.PALETTE, DUSK), lineFor(ctx), lift);
  ctx.restore();
  ctx.save();
  ctx.translate(at("plantShift", t), -at("plantShift", t) * 0.4);
  for (const [x, y, len, rise, leaves, k] of FRONDS) frond(ctx, x, y, len, rise, leaves, k);
  ctx.restore();
  ctx.restore();
}

window.CUTSCENES.vesniceStart = {
  name: CFG.title,
  camera: CFG.camera,
  duration: CFG.duration,
  palette,
  render,
  ref: kit.filmRef("vesniceStart", CFG.duration)
};
})();
