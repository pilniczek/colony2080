(() => {
const { define, P } = window.ENV;
const { color } = P;
const simple = () => window.ENV.simple;
const K = 0.075;

const shadow = (ctx, cx, w) => {
  ctx.save();
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = color("hole");
  ctx.beginPath();
  ctx.ellipse(cx, -0.3, w / 2, 0.9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

const pickup = (id, model, dx, box) => define({
  id,
  box,
  draw(ctx) {
    shadow(ctx, 12, 24);
    const t = ctx.getTransform();
    const lineW = P.lw(ctx) * Math.sqrt(Math.abs(t.a * t.d - t.b * t.c));
    ctx.save();
    ctx.scale(K, K);
    ctx.translate(dx, -52);
    window[model].draw(ctx, { lineW, simple: simple() });
    ctx.restore();
  }
});

pickup("flamestream", "FLAMESTREAM", 70, [-2, -11, 28, 0]);
pickup("laserCannon", "LASER_CANNON", 66, [-2, -13, 28, 0]);
})();
