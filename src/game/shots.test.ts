import { describe, expect, it } from "vitest";
import { cfg, clips, game, run, tick, type Game } from "./hero/testWorld";
import { spikeUnit } from "./hero/look";
import { fireEnemy, heroMuzzle, SPARK_LIFE } from "./shots";

const TARGET_TOP = 14 - 1.51;

const armed = (x: number, facing: 1 | -1 = 1): Game => {
  const g = game({ x, y: 14, weapon: "gun" });
  g.hero.facing = facing;
  return g;
};

const bullets = (g: Game) => g.world.projectiles.filter((p) => p.tag === "hero");

const fire = (g: Game, seconds: number): void => {
  tick(g, ["shoot"], ["shoot"]);
  run(g, seconds, ["shoot"]);
};

describe("hero muzzle", () => {
  it("shoots under the top of the target, 14 spike px below it", () => {
    const g = armed(10.5);
    tick(g, ["shoot"], ["shoot"]);
    const top = TARGET_TOP;
    const below = ((heroMuzzle(g.hero, clips, cfg)[1] - top) * cfg.cellPx) / spikeUnit(cfg);
    expect(below).toBeGreaterThan(12);
    expect(below).toBeLessThan(16);
  });

  it("sits ahead of the hero at gun height and mirrors with facing", () => {
    const right = armed(10.5);
    tick(right, ["shoot"], ["shoot"]);
    const left = armed(10.5, -1);
    tick(left, ["shoot"], ["shoot"]);
    const [rx, ry] = heroMuzzle(right.hero, clips, cfg);
    const [lx, ly] = heroMuzzle(left.hero, clips, cfg);
    expect(rx - 10.5).toBeGreaterThan(cfg.box.width / 2);
    expect(ry).toBeGreaterThan(14 - cfg.box.height);
    expect(ry).toBeLessThan(14);
    expect(lx - 10.5).toBeCloseTo(-(rx - 10.5), 9);
    expect(ly).toBeCloseTo(ry, 9);
  });

  it("drops when ducked", () => {
    const stand = armed(10.5);
    tick(stand, ["shoot"], ["shoot"]);
    const duck = armed(10.5);
    run(duck, 0.5, ["down"]);
    tick(duck, ["down", "shoot"], ["shoot"]);
    expect(duck.hero.state).toBe("duckAttack");
    expect(heroMuzzle(duck.hero, clips, cfg)[1]).toBeGreaterThan(heroMuzzle(stand.hero, clips, cfg)[1]);
  });
});

describe("hero bullets", () => {
  it("spawns one bullet per shot at the muzzle flying the facing way", () => {
    for (const facing of [1, -1] as const) {
      const g = armed(10.5, facing);
      tick(g, ["shoot"], ["shoot"]);
      const [b] = bullets(g);
      const [mx, my] = heroMuzzle(g.hero, clips, cfg);
      expect(bullets(g)).toHaveLength(1);
      expect(b).toMatchObject({ vx: facing * cfg.shot.speed, r: cfg.shot.radius, y: my });
      expect(b!.x).toBeCloseTo(mx, 9);
    }
  });

  it("fires 12 bullets in 1 s", () => {
    const g = armed(10.5, -1);
    const spawned = new Set<object>();
    const count = () => bullets(g).forEach((b) => spawned.add(b));
    tick(g, ["shoot"], ["shoot"]);
    count();
    for (let i = 0; i < 59; i++) {
      tick(g, ["shoot"]);
      count();
    }
    expect(spawned.size).toBe(12);
  });

  it("spends one ammo per bullet", () => {
    const g = armed(10.5, -1);
    expect(g.hero.ammo).toBe(cfg.ammo);
    fire(g, 59 / 60);
    expect(g.hero.ammo).toBe(cfg.ammo - 12);
  });

  it("stops firing on the last round and holsters the gun", () => {
    const g = armed(10.5, -1);
    g.hero.ammo = 1;
    const spawned = new Set<object>();
    tick(g, ["shoot"], ["shoot"]);
    for (let i = 0; i < 30; i++) {
      bullets(g).forEach((b) => spawned.add(b));
      expect(i === 0 || g.hero.fireTime === null).toBe(true);
      tick(g, ["shoot"]);
    }
    expect(g.hero.ammo).toBe(0);
    expect(spawned.size).toBe(1);
    run(g, 2);
    expect(g.hero).toMatchObject({ weapon: "fists", state: "idle" });
  });

  it("keeps fists when the gun is picked with no ammo", () => {
    const g = game({ x: 10.5, y: 14, weapon: "fists" });
    g.hero.ammo = 0;
    tick(g, [], ["weapon1"]);
    run(g, 2);
    expect(g.hero).toMatchObject({ weapon: "fists", state: "idle" });
    g.hero.ammo = 5;
    tick(g, [], ["weapon1"]);
    run(g, 2);
    expect(g.hero.weapon).toBe("gun");
  });

  it("fires none with fists", () => {
    const g = game({ x: 10.5, y: 14, weapon: "fists" });
    fire(g, 0.5);
    expect(bullets(g)).toHaveLength(0);
  });

  it("never hits the hero", () => {
    const g = armed(10.5);
    fire(g, 1);
    expect(g.hero.energy).toBe(cfg.energy.max);
    expect(g.hero.hitAge).toBeNull();
  });

  it("stops at a wall with a spark on the wall face", () => {
    const g = armed(2.5, -1);
    fire(g, 0.3);
    expect(bullets(g)).toHaveLength(0);
    expect(g.world.sparks.length).toBeGreaterThan(0);
    for (const s of g.world.sparks) expect(s.x).toBe(1);
  });

  it("sparks on the wall at point blank", () => {
    const g = armed(1.4, -1);
    tick(g, ["shoot"], ["shoot"]);
    expect(bullets(g)).toHaveLength(0);
    expect(g.world.sparks).toMatchObject([{ x: 1 }]);
  });

  it("vanishes without a spark at the sight range", () => {
    const g = armed(2.5);
    fire(g, 1);
    expect(bullets(g).length).toBeGreaterThan(0);
    expect(bullets(g).every((b) => b.x <= 2.5 + cfg.sightCells)).toBe(true);
    expect(g.world.sparks).toHaveLength(0);
  });

  it("gives enemy bullets the same range", () => {
    const g = game({ x: 30.5, y: 14 });
    const [enemy] = g.world.enemies;
    Object.assign(enemy!.body, { x: 20.5, y: 14, facing: 1 });
    fireEnemy(g.world, cfg, clips, enemy!, 1);
    expect(g.world.projectiles).toHaveLength(1);
    run(g, 1);
    expect(g.world.projectiles).toHaveLength(0);
    expect(g.hero.energy).toBe(cfg.energy.max);
    expect(g.world.sparks).toHaveLength(0);
  });

  it("passes through props the hero walks through", () => {
    const g = armed(19.5);
    fire(g, 3);
    const passed = (kind: string) => g.world.props.find((p) => p.kind === kind)!.x;
    expect(bullets(g).some((b) => b.x > passed("barrel"))).toBe(true);
    const enemy = g.world.enemies[0]!.body.x;
    expect(g.world.sparks.every((s) => s.x === 47 || Math.abs(s.x - enemy) < cfg.box.width)).toBe(true);
  });

  it("passes through props at point blank", () => {
    const g = armed(15.3);
    tick(g, ["shoot"], ["shoot"]);
    expect(bullets(g)).toHaveLength(1);
    expect(g.world.sparks).toHaveLength(0);
  });

});

describe("sparks", () => {
  it("age and expire", () => {
    const g = armed(2.5, -1);
    tick(g, ["shoot"], ["shoot"]);
    run(g, 0.1);
    expect(g.world.sparks.length).toBeGreaterThan(0);
    run(g, SPARK_LIFE + 0.05);
    expect(g.world.sparks).toHaveLength(0);
  });
});
