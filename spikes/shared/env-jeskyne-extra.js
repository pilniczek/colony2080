(() => {
const { define, P, G } = window.ENV;
const { rng, flat, shape, line, disc, glow } = P;
const simple = () => window.ENV.simple;
const ROD = ["#0c140c", "#1c2c1c", "#2c4430", "#4a6650"];
const CLAMP = ["#141c12", "#2a3622", "#3e4c34", "#64725a", "#080a06"];
const STONE = ["#3a3a32", "#5a5a50", "#7c7c70", "#a8a898", "#14140e"];
const MOSS = ["#2c3a1c", "#46582a", "#6a7c3c"];
const CHAIN = ["#2c2a24", "#5a5448", "#8a8270", "#0e0c08"];
const TOP = -84;
const BAR = { x: -15, y: -46, w: 30, h: 8 };
const BLOCK = { x: -11, y: -31, w: 22, h: 17 };

const fadingRod = (ctx, x, y0, y1) => {
  const steps = simple() ? 3 : 6;
  const seg = (y0 - y1) / steps;
  for (let i = 0; i < steps; i++) {
    ctx.save();
    ctx.globalAlpha = 1 - i / steps;
    const y = y0 - (i + 1) * seg;
    flat(ctx, x - 1.6, y, 3.2, seg + 0.2, ROD[1]);
    flat(ctx, x - 1.1, y, 0.9, seg + 0.2, ROD[3]);
    flat(ctx, x + 0.6, y, 1, seg + 0.2, ROD[0]);
    ctx.restore();
  }
};
const link = (ctx, x, y, side) => {
  if (side) {
    flat(ctx, x - 0.8, y, 1.6, 5, CHAIN[1], CHAIN[3]);
    flat(ctx, x - 0.4, y + 0.6, 0.5, 3.8, CHAIN[2]);
    return;
  }
  ctx.save();
  ctx.lineWidth = 1.3;
  ctx.strokeStyle = P.color(CHAIN[3]);
  ctx.beginPath();
  ctx.ellipse(x, y + 2.5, 2.2, 3, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 0.7;
  ctx.strokeStyle = P.color(CHAIN[2]);
  ctx.beginPath();
  ctx.ellipse(x, y + 2.5, 1.9, 2.7, 0, Math.PI * 0.8, Math.PI * 1.6);
  ctx.stroke();
  ctx.restore();
};
const chain = (ctx, x, y0, y1) => {
  let side = false;
  for (let y = y0; y < y1 - 1; y += 4.2) {
    link(ctx, x, y, side);
    side = !side;
  }
};
const clampBar = (ctx, seed) => {
  const { x, y, w, h } = BAR;
  flat(ctx, x, y, w, h, CLAMP[2], CLAMP[4]);
  flat(ctx, x + 0.6, y + 0.6, w - 1.2, 1.3, CLAMP[3]);
  flat(ctx, x + 0.6, y + h - 1.8, w - 1.2, 1.2, CLAMP[0]);
  flat(ctx, x - 2, y + 2, 2.4, h - 4, CLAMP[1], CLAMP[4]);
  flat(ctx, x + w - 0.4, y + 2, 2.4, h - 4, CLAMP[1], CLAMP[4]);
  flat(ctx, -4, y + 2.4, 8, 3.2, CLAMP[4]);
  flat(ctx, -3.2, y + 3, 6.4, 0.8, CLAMP[1]);
  if (!simple()) for (const rx of [x + 3, x + w - 3]) {
    disc(ctx, rx, y + h / 2, 1.1, CLAMP[0], CLAMP[4]);
    flat(ctx, rx - 0.6, y + h / 2 - 0.8, 0.6, 0.6, CLAMP[3]);
  }
  G.grain(ctx, G.rectRegion(ctx, x, y, w, h), seed, 1.1);
  G.inside(ctx, G.rectRegion(ctx, x - 2, y, w + 4, h + 10), () => G.drips(ctx, x, y + h - 1, w, 9, seed + 1, 3));
  G.rustPatch(ctx, x + w * 0.72, y + h * 0.55, 3, 1.4, seed + 2);
  G.chips(ctx, x, y + 0.4, w, seed + 3, G.DUST);
};
const stonePts = (seed) => {
  const r = rng(seed);
  const { x, y, w, h } = BLOCK;
  return [[x + 1, y + r()], [x + w * 0.5, y - 0.6], [x + w - 1, y + r() * 1.2], [x + w + 0.4, y + h * 0.5], [x + w - 1.2, y + h], [x + w * 0.4, y + h + 0.6], [x + 0.6, y + h - 0.5], [x - 0.5, y + h * 0.45]];
};
const counterweight = (ctx, seed) => {
  const { x, y, w, h } = BLOCK;
  const pts = stonePts(seed);
  shape(ctx, pts, STONE[1], STONE[4]);
  G.inside(ctx, G.polyRegion(ctx, pts), () => {
    flat(ctx, x, y, w, 3, STONE[2]);
    flat(ctx, x + w - 4, y, 4, h, STONE[0]);
    const r = rng(seed + 1);
    for (let i = 0; i < (simple() ? 3 : 7); i++) {
      const cx = x + 2 + r() * (w - 4), cy = y + 3 + r() * (h - 6);
      line(ctx, [[cx, cy], [cx + 2 + r() * 3, cy + (r() - 0.5) * 4]], STONE[4], 0.6);
    }
    for (let i = 0; i < 4; i++) {
      const mx = x + r() * w, my = y + h * (0.55 + r() * 0.45);
      shape(ctx, [[mx - 3, my], [mx, my - 2 - r() * 2], [mx + 3.5, my - 0.5], [mx + 2, my + 2], [mx - 2, my + 1.6]], MOSS[i % 2 ? 1 : 0]);
    }
    shape(ctx, [[x, y - 1], [x + w * 0.4, y - 1], [x + w * 0.3, y + 3.5], [x + w * 0.1, y + 2.4], [x, y + 4.5]], MOSS[2]);
    G.grain(ctx, G.polyRegion(ctx, pts), seed + 2, 1.2);
    G.dirt(ctx, x, y, w, h, seed + 3, 0.5);
  });
  flat(ctx, x - 0.6, y + 5, w + 1.2, 2.6, CLAMP[1], CLAMP[4]);
  flat(ctx, x - 0.6, y + 5, w + 1.2, 0.7, CLAMP[3]);
  G.inside(ctx, G.rectRegion(ctx, x - 1, y + 5, w + 2, 12), () => G.drips(ctx, x, y + 7, w, 8, seed + 4, 2));
  disc(ctx, 0, y - 1.5, 2.2, CLAMP[1], CLAMP[4]);
  disc(ctx, 0, y - 1.5, 0.9, CLAMP[4]);
};

define({
  id: "shaftHead",
  box: [-18, TOP, 18, 0],
  draw(ctx) {
    const seed = 7100;
    for (const x of [-7, 0, 7]) fadingRod(ctx, x, BAR.y + 1, TOP);
    if (!simple()) glow(ctx, 0, BAR.y - 10, 16, "#2c4430", 0.25);
    chain(ctx, -7, BAR.y + BAR.h, 0);
    chain(ctx, 7, BAR.y + BAR.h, 0);
    chain(ctx, 0, BAR.y + BAR.h, BLOCK.y - 3);
    clampBar(ctx, seed);
    counterweight(ctx, seed + 10);
  },
});
})();
