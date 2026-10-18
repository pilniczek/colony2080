import { describe, expect, it } from "vitest";
import { cfg, clips, game, run, tick, type Game } from "./hero/testWorld";
import { heroMuzzle, SPARK_LIFE } from "./shots";

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
    fire(g, 59 / 60);
    expect(bullets(g).length + g.world.sparks.length).toBe(12);
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

  it("stops at the hanging bag with a spark on its face", () => {
    const g = armed(11.5);
    fire(g, 0.5);
    const bag = g.world.props.find((p) => p.kind === "bag")!;
    expect(bullets(g).every((b) => b.x < bag.x)).toBe(true);
    expect(g.world.sparks.length).toBeGreaterThan(0);
    for (const s of g.world.sparks) expect(s.x).toBeLessThan(bag.x);
    for (const s of g.world.sparks) expect(s.x).toBeGreaterThan(bag.x - 0.5);
  });

  it("stops at the target with a spark on its face", () => {
    const g = armed(14.5);
    fire(g, 1.5);
    const target = g.world.props.find((p) => p.kind === "target")!;
    expect(bullets(g).every((b) => b.x < target.x)).toBe(true);
    expect(g.world.sparks.length).toBeGreaterThan(0);
    for (const s of g.world.sparks) expect(s.x).toBeLessThan(target.x);
    for (const s of g.world.sparks) expect(s.x).toBeGreaterThan(target.x - 1);
  });

  it("lets emitter bullets through to the hero", () => {
    const g = armed(26.5);
    g.world.emitter.on = true;
    run(g, 4);
    expect(g.hero.energy).toBeLessThan(cfg.energy.max);
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
