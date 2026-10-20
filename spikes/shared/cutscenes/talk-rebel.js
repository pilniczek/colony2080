(() => {
const { kit } = window.CUTSCENES;
const CFG = window.C28_CONFIG.cutscenes.talkRebel;
const { drawFace, scatter, poly, rect } = window.CUTSCENES.rebelShot.art;
const W = CFG.stage.width, H = CFG.stage.height;
const palette = { ...CFG.palette };
const at = (name, t) => kit.sample(CFG.tracks, name, t);
const BLADES = scatter(51, 900, -300, 1900, -300, 1200);
const POOL = [[880, 300], [1010, 250], [1180, 290], [1330, 380], [1420, 520], [1380, 700], [1460, 860], [1300, 1000], [1060, 980], [900, 860], [820, 640]];
const POOL_WET = [[960, 380], [1100, 340], [1260, 420], [1320, 560], [1240, 700], [1290, 840], [1120, 900], [980, 760], [930, 560]];

function grass(ctx) {
  rect(ctx, -400, -400, 2400, 1700, palette.grass);
  const tones = [palette.grassDark, palette.grassLight, palette.straw];
  for (let i = 0; i < tones.length; i++) {
    ctx.strokeStyle = tones[i];
    ctx.lineWidth = 4 + i;
    ctx.beginPath();
    for (let j = i; j < BLADES.length; j += tones.length) {
      const [x, y, a, b] = BLADES[j];
      const len = 30 + a * 50;
      ctx.moveTo(x, y);
      ctx.lineTo(x + len * (0.8 + b * 0.3), y - len * 0.55);
    }
    ctx.stroke();
  }
}

function pool(ctx, spread) {
  ctx.save();
  ctx.translate(1100, 680);
  ctx.scale(spread, spread);
  ctx.translate(-1100, -600);
  poly(ctx, POOL, palette.blood);
  poly(ctx, POOL_WET, palette.bloodWet);
  ctx.restore();
}

function render(ctx, w, h, t) {
  ctx.save();
  rect(ctx, 0, 0, w, h, "#000");
  const s = Math.min(w / W, h / H);
  ctx.translate((w - W * s) / 2, (h - H * s) / 2);
  ctx.scale(s, s);
  ctx.beginPath();
  ctx.rect(0, 0, W, H);
  ctx.clip();
  const z = at("camZ", t);
  ctx.translate(W / 2 - at("camX", t) * z, H / 2 - at("camY", t) * z);
  ctx.scale(z, z);
  grass(ctx);
  pool(ctx, at("spread", t));
  const cough = at("cough", t);
  const talk = at("talk", t) * (0.25 + 0.75 * Math.abs(Math.sin(t * 9) * Math.sin(t * 3.1 + 1)));
  const blink = Math.max(0, 1 - Math.abs(((t + 0.8) % 3.7) - 0.1) * 12);
  drawFace(ctx, 720, 540 - cough * 18, 2.5, at("tilt", t) + cough * 5, {
    turn: 0.2, mouth: Math.min(1, talk * 0.55 + cough), lids: Math.min(1, at("lids", t) + blink * (1 - at("lids", t))),
    look: at("look", t), brow: 1 + cough, blood: 1
  });
  ctx.restore();
}

window.CUTSCENES.talkRebel = {
  name: CFG.title,
  camera: CFG.camera,
  duration: CFG.duration,
  palette,
  render,
  ref: kit.filmRef("talkRebel", CFG.duration)
};
})();
