import { chromium } from "playwright";
const ASSISTS = ["hideAnywhere", "halfDamage", "specialDrops", "lateEnemies", "strongPunches", "fogOff", "extraShield", "moreAmmo", "noFallDeath", "healthBars"];
const BASE = ["hideAnywhere", "lateEnemies"];
const PORT = process.argv[2] ?? "5199";
const b = await chromium.launch();

async function start(picks) {
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  await p.goto(`http://localhost:${PORT}/game.html`, { waitUntil: "networkidle" });
  await p.waitForFunction(() => window.__run);
  await p.waitForTimeout(1500);
  const k = async (key, n = 1) => { for (let i = 0; i < n; i++) { await p.keyboard.press(key); await p.waitForTimeout(60); } };
  await k("ArrowUp", 2); await k("Enter"); await k("ArrowRight", 3);
  let cursor = 0;
  for (const [i, id] of ASSISTS.entries()) {
    if (picks.includes(id) === BASE.includes(id)) continue;
    await k("ArrowDown", i + 1 - cursor); cursor = i + 1; await k("Enter");
  }
  await k("ArrowDown", 11 - cursor); await k("Enter");
  await k("ArrowDown", 2); await k("Enter");
  for (let i = 0; i < 40 && (await p.evaluate(() => window.__run().world.cutscene !== null || window.__run().world.subtitle === undefined)); i++) { await k("Enter"); await p.waitForTimeout(250); }
  await p.waitForFunction(() => window.__run().world.cutscene === null);
  await p.waitForTimeout(500);
  await p.evaluate(() => { const { world } = window.__run(); for (const prop of world.props) if (prop.approach) world.flags.add(prop.approach.gives); });
  const d = await p.evaluate(() => window.__run().world.difficulty);
  if (d.level !== "custom" || [...d.assists].sort().join() !== [...picks].sort().join()) throw new Error("difficulty not set: " + JSON.stringify(d));
  return p;
}

const facts = (p) => p.evaluate(() => {
  const { world, hero } = window.__run();
  return { ammo: hero.ammo, shields: hero.shields, energy: hero.energy, fog: world.fog !== null, sightMs: [...new Set(world.enemies.map((e) => e.sightMs))] };
});

async function faceWalker(p, gap) {
  return p.evaluate((gap) => {
    const { world, hero } = window.__run();
    const i = world.enemies.findIndex((e) => !e.flight && e.kind === "walker" && e.deadAge === null);
    const e = world.enemies[i];
    window.__teleport(e.body.x - gap, e.body.y);
    Object.assign(hero, { facing: 1, fallFrom: e.body.y, energy: 100 });
    Object.assign(e, { facing: -1 });
    Object.assign(e.body, { facing: -1 });
    return i;
  }, gap);
}

async function damageTaken(p) {
  await faceWalker(p, 4);
  const t0 = Date.now();
  let first = null;
  for (let ms = 0; ms < 3000; ms += 25) {
    await p.waitForTimeout(25);
    const e = await p.evaluate(() => window.__run().hero.energy);
    if (first === null && e < 100) first = Date.now() - t0;
  }
  return { lost: 100 - (await p.evaluate(() => window.__run().hero.energy)), firstHitMs: first };
}

async function punchDamage(p) {
  await p.keyboard.press("Digit1"); await p.waitForTimeout(200);
  const i = await faceWalker(p, 1.2);
  const before = await p.evaluate((i) => window.__run().world.enemies[i].body.energy, i);
  for (let n = 0; n < 2; n++) { await p.keyboard.press("KeyC"); await p.waitForTimeout(700); }
  const after = await p.evaluate((i) => window.__run().world.enemies[i].body.energy, i);
  return { perPunch: (before - after) / 2 };
}

async function longFall(p) {
  const spot = await p.evaluate(() => {
    const { world, hero } = window.__run();
    const g = world.grid;
    for (let y = 20; y < g.height; y++) for (let x = 2; x < g.width - 2; x++) {
      if (!g.solid(x, y) || g.solid(x, y - 1)) continue;
      let clear = 0;
      while (clear < 14 && y - 1 - clear >= 0 && !g.solid(x, y - 1 - clear) && !g.oneWay(x, y - 1 - clear) && !g.ladderAt(x + 0.5, y - 1 - clear)) clear++;
      if (clear < 14 || g.solid(x - 1, y - 1) || g.solid(x + 1, y - 1)) continue;
      if (world.props.some((q) => (q.repels || q.fires || q.cutscene || q.kind !== "gate") && Math.abs(q.x - x) < 8)) continue;
      if (world.enemies.some((e) => Math.abs(e.body.x - x) < 10 && Math.abs(e.body.y - y) < 3)) continue;
      window.__teleport(x + 0.5, y - 12);
      Object.assign(hero, { fallFrom: y - 12, state: "fall", time: 0, onGround: false });
      return [x, y];
    }
    return null;
  });
  await p.waitForTimeout(2500);
  return { spot, after: await p.evaluate(() => window.__run().hero.state) };
}

async function dropFromFlyer(p) {
  await p.evaluate(() => {
    const e = window.__run().world.enemies.find((e) => e.flight);
    e.body.energy = 0; e.deadAge = 0;
  });
  await p.waitForTimeout(300);
  return p.evaluate(() => window.__run().world.drops.length);
}

const out = [];
const ab = async (name, assist, measure) => {
  const res = [];
  for (const picks of [BASE.filter((a) => a !== assist), [...new Set([...BASE, assist])]]) {
    const p = await start(picks);
    res.push(await measure(p));
    await p.close();
  }
  out.push(name + "\n  A off: " + JSON.stringify(res[0]) + "\n  B on : " + JSON.stringify(res[1]));
};
const only = process.env.ONLY?.split(",");
const abSel = (name, ...rest) => (only && !only.includes(name) ? Promise.resolve() : ab(name, ...rest));
await abSel("EXTRA SHIELD", "extraShield", (p) => facts(p).then((f) => ({ shields: f.shields })));
await abSel("MORE AMMO", "moreAmmo", (p) => facts(p).then((f) => ({ ammo: f.ammo })));
await abSel("FOG OFF", "fogOff", (p) => facts(p).then((f) => ({ fog: f.fog })));
await abSel("SLOWER ENEMY REACTION", "lateEnemies", async (p) => ({ sightMs: (await facts(p)).sightMs, ...(await damageTaken(p)) }));
await abSel("HALF DAMAGE TAKEN", "halfDamage", damageTaken);
await abSel("STRONGER PUNCHES", "strongPunches", punchDamage);
await abSel("NO FALL DEATH", "noFallDeath", async (p) => ({ afterFall: await longFall(p) }));
await abSel("ENEMIES DROP ENERGY", "specialDrops", async (p) => ({ drops: await dropFromFlyer(p) }));
console.log(out.join("\n"));
await b.close();
