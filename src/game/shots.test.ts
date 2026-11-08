import cameraJson from "@config/camera.json";
import sandbox from "@config/levels/sandbox.json";
import { describe, expect, it } from "vitest";
import { createFog, loadFog } from "./fog";
import { cfg, clips, game, objectLevel, run, tick, withoutItems, type Game } from "./hero/testWorld";
import { bonusAmmo } from "./hero/hero";
import { createRigs, heroLook, spikeUnit } from "./hero/look";
import { FLYER_HALF, type Enemy } from "./level/enemy";
import { resetWorld } from "./level/sandboxLevel";
import { BONUS_LOW, BONUS_LOW_TEXT, fireBeam, heroMuzzle, SPARK_LIFE, toasterSight, warnLowBonus } from "./shots";
import { loadMesto } from "./level/mesto";
import { loadMission } from "./level/missions";
import { holdPoses } from "./robot/gun";
import { FLAME_LIFE, FLAME_STEPS } from "./robot/flamethrower";

const TARGET_TOP = 14 - 1.51;

const armed = (x: number, facing: 1 | -1 = 1): Game => {
  const g = withoutItems(game({ x, y: 14, weapon: "gun" }));
  g.hero.facing = facing;
  return g;
};

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
    const stand = armed(11.5);
    tick(stand, ["shoot"], ["shoot"]);
    const duck = armed(11.5);
    run(duck, 0.5, ["down"]);
    tick(duck, ["down", "shoot"], ["shoot"]);
    expect(duck.hero.state).toBe("duckAttack");
    expect(heroMuzzle(duck.hero, clips, cfg)[1]).toBeGreaterThan(heroMuzzle(stand.hero, clips, cfg)[1]);
  });
});

describe("hero shots", () => {
  const target = (heroX: number, facing: 1 | -1, enemyX: number): { g: Game; enemy: Enemy } => {
    const g = game({ x: heroX, y: 4, weapon: "gun" });
    g.hero.facing = facing;
    const enemy = g.world.enemies[0]!;
    Object.assign(enemy.body, { x: enemyX, facing });
    enemy.patrol = [enemyX, enemyX];
    return { g, enemy };
  };
  const shots = (g: Game) => g.events.filter((e) => e.kind === "shot");

  it("hit the nearest enemy ahead at once with a spark on its near face", () => {
    for (const [heroX, facing] of [[9.5, -1], [1.5, 1]] as const) {
      const { g, enemy } = target(heroX, facing, 4.5);
      tick(g, ["shoot"], ["shoot"]);
      expect(enemy.body.energy).toBeCloseTo(sandbox.enemies[0]!.hits - cfg.shot.damage, 9);
      expect(g.world.sparks).toHaveLength(1);
      expect(g.world.sparks[0]!.x).toBeCloseTo(4.5 - (facing * cfg.box.width) / 2, 9);
    }
  });

  it("hit an enemy whose near face is in range though its centre is not", () => {
    for (const [gap, hit] of [[-0.05, true], [0.05, false]] as const) {
      const { g, enemy } = target(1.5, 1, 1.5 + cfg.sightCells + cfg.box.width / 2 + gap);
      tick(g, ["shoot"], ["shoot"]);
      expect(enemy.body.energy < sandbox.enemies[0]!.hits).toBe(hit);
    }
  });

  const hovering = (spotY: number): { g: Game; flyer: Enemy } => {
    const g = game({ x: 37.5, y: 14, weapon: "gun" });
    g.hero.facing = 1;
    const flyer = g.world.enemies[4]!;
    flyer.spot = [45.5, spotY];
    flyer.patrol = [45.5, 45.5];
    Object.assign(flyer.body, { x: 45.5, y: spotY - flyer.flight!.lift, facing: 1 });
    return { g, flyer };
  };

  it("hit a flyer hovering above the hero floor with a spark on its hull", () => {
    const { g, flyer } = hovering(14);
    tick(g, ["shoot"], ["shoot"]);
    expect(flyer.flight!.lift).toBeGreaterThan(sandbox.enemies[4]!.flight!.aimLift + 1);
    expect(flyer.body.energy).toBeCloseTo(sandbox.enemies[4]!.hits - cfg.shot.damage, 9);
    expect(g.world.sparks[0]!.y).toBeCloseTo(flyer.body.y + FLYER_HALF[1], 9);
  });

  it("miss a flyer of the floor above", () => {
    const { g, flyer } = hovering(4);
    fire(g, 0.3);
    expect(flyer.body.energy).toBe(sandbox.enemies[4]!.hits);
  });

  it("fires 12 shots in 1 s", () => {
    const { g, enemy } = target(9.5, -1, 4.5);
    enemy.body.energy = 1000;
    fire(g, 59 / 60);
    expect(1000 - enemy.body.energy).toBeCloseTo(12 * cfg.shot.damage, 9);
  });

  it("spends one ammo per shot", () => {
    const g = armed(10.5, -1);
    expect(g.hero.ammo).toBe(cfg.ammo);
    fire(g, 59 / 60);
    expect(g.hero.ammo).toBe(cfg.ammo - 12);
  });

  it("stops firing on the last round and holsters the gun", () => {
    const g = armed(10.5, -1);
    g.hero.ammo = 1;
    tick(g, ["shoot"], ["shoot"]);
    for (let i = 0; i < 30; i++) {
      expect(i === 0 || g.hero.fireTime === null).toBe(true);
      tick(g, ["shoot"]);
    }
    expect(g.hero.ammo).toBe(0);
    expect(shots(g)).toHaveLength(1);
    run(g, 2);
    expect(g.hero).toMatchObject({ weapon: "fists", state: "idle" });
  });

  it("keeps fists when the gun is picked with no ammo", () => {
    const g = game({ x: 10.5, y: 14, weapon: "fists" });
    g.hero.ammo = 0;
    tick(g, [], ["weapon2"]);
    run(g, 2);
    expect(g.hero).toMatchObject({ weapon: "fists", state: "idle" });
    g.hero.ammo = 5;
    tick(g, [], ["weapon2"]);
    run(g, 2);
    expect(g.hero.weapon).toBe("gun");
  });

  it("fires none with fists", () => {
    const g = game({ x: 10.5, y: 14, weapon: "fists" });
    fire(g, 0.5);
    expect(shots(g)).toHaveLength(0);
  });

  it("never hits the hero", () => {
    const g = armed(10.5);
    fire(g, 1);
    expect(g.hero.energy).toBe(cfg.energy.max);
    expect(g.hero.hitAge).toBeNull();
  });

  it("spark on the wall face", () => {
    const g = armed(2.5, -1);
    fire(g, 0.3);
    expect(g.world.sparks.length).toBeGreaterThan(0);
    for (const s of g.world.sparks) expect(s.x).toBe(1);
  });

  it("spark on the wall at point blank", () => {
    const g = armed(1.4, -1);
    tick(g, ["shoot"], ["shoot"]);
    expect(g.world.sparks).toMatchObject([{ x: 1 }]);
  });

  it("leave no spark past the sight range", () => {
    const g = armed(2.5);
    fire(g, 1);
    expect(shots(g).length).toBeGreaterThan(0);
    expect(g.world.sparks).toHaveLength(0);
  });

  it("pass through props the hero walks through", () => {
    const g = armed(19.5);
    fire(g, 1);
    expect(g.world.sparks).toHaveLength(0);
  });

  it("pass through props at point blank", () => {
    const g = armed(15.3);
    tick(g, ["shoot"], ["shoot"]);
    expect(shots(g)).toHaveLength(1);
    expect(g.world.sparks).toHaveLength(0);
  });
});

describe("enemy shots", () => {
  const facing = (heroX: number, enemyX: number): { g: Game; enemy: Enemy } => {
    const g = game({ x: heroX, y: 4 });
    const enemy = g.world.enemies[0]!;
    Object.assign(enemy.body, { x: enemyX, facing: heroX > enemyX ? 1 : -1 });
    enemy.patrol = [enemyX, enemyX];
    return { g, enemy };
  };

  it("hit the hero on the tick they fire", () => {
    const { g, enemy } = facing(9.5, 5.5);
    enemy.sightMs = 0;
    tick(g);
    expect(g.hero.energy).toBe(cfg.energy.max - cfg.energy.hit);
    expect(g.world.heroHits).toBe(0);
  });

  it("hit a hero the enemy sees at the edge of its range and none beyond", () => {
    for (const [d, hit] of [[8.8, true], [cfg.sightCells, true], [cfg.sightCells + 0.1, false]] as const) {
      const { g } = facing(1.5 + d, 1.5);
      run(g, 1);
      expect(g.hero.energy < cfg.energy.max).toBe(hit);
    }
  });

  it("leave no spark", () => {
    const { g } = facing(9.5, 5.5);
    run(g, 0.5);
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

describe("shootable props", () => {
  const ship = { kind: "object", id: "crashedShip", x: 10, y: 8, width: 4, height: 3, shootable: { hits: 3, state: 1, gives: ["flag:hullOpen"], subtitle: "The hull cover is open." } };
  const decoy = { kind: "object", id: "decoy", x: 6, y: 8, width: 1, height: 3 };
  const shooter = (props: unknown[], facing: 1 | -1 = 1, y = 8): Game => {
    const g = game({ x: facing > 0 ? 3.5 : 16.5, y, weapon: "gun" }, { ...objectLevel, props });
    g.hero.facing = facing;
    return g;
  };
  const shipOf = (g: Game) => g.world.props.find((p) => p.id === "crashedShip")!;

  it("takes a hero shot at once with a spark on its face", () => {
    const g = shooter([ship]);
    tick(g, ["shoot"], ["shoot"]);
    expect(shipOf(g).hitsTaken).toBe(1);
    expect(g.world.sparks[0]!.x).toBeCloseTo(8, 9);
  });

  it("switches the prop state at its hit count", () => {
    const g = shooter([ship]);
    fire(g, 0.5);
    expect(shipOf(g).hitsTaken).toBe(3);
    expect(shipOf(g).state).toBe(1);
    expect(g.world.flags.has("flag:hullOpen")).toBe(true);
    expect(g.world.subtitle?.text).toBe("The hull cover is open.");
  });

  it("keeps the state closed before the last hit", () => {
    const g = shooter([{ ...ship, shootable: { ...ship.shootable, hits: 50 } }]);
    tick(g, ["shoot"], ["shoot"]);
    run(g, 0.3);
    expect(shipOf(g).state).toBeUndefined();
    expect(g.world.flags.has("flag:hullOpen")).toBe(false);
  });

  it("lets shots pass other props", () => {
    const g = shooter([decoy, ship]);
    tick(g, ["shoot"], ["shoot"]);
    run(g, 0.3);
    expect(g.world.props.find((p) => p.id === "decoy")!.hitsTaken).toBeUndefined();
    expect(shipOf(g).hitsTaken).toBe(1);
  });

  it("ignores shots above or below it", () => {
    for (const y of [4, 12]) {
      const g = shooter([{ ...ship, y, height: 1 }]);
      fire(g, 0.3);
      expect(shipOf(g).hitsTaken).toBeUndefined();
    }
  });

  it("is not hit through fog", () => {
    const g = shooter([ship]);
    g.world.fog = createFog(loadFog(cameraJson), cfg, g.hero, g.world.grid);
    const fog = g.world.fog;
    for (let row = 0; row < fog.height; row++) fog.seen.fill(0, row * fog.width + 7, (row + 1) * fog.width);
    tick(g, ["shoot"], ["shoot"]);
    expect(shipOf(g).hitsTaken).toBeUndefined();
    expect(g.world.sparks).toHaveLength(0);
  });

  it("is hit from the right side too", () => {
    const g = shooter([ship], -1);
    tick(g, ["shoot"], ["shoot"]);
    run(g, 0.5);
    expect(shipOf(g).hitsTaken).toBe(1);
  });

  const films = { shot: "hullCover", punch: "pickCrowbar" } as const;
  const puncher = (props: unknown[]): Game => game({ x: 7, y: 8, weapon: "fists" }, { ...objectLevel, props });
  const punch = (g: Game): void => {
    tick(g, ["shoot"], ["shoot"]);
    run(g, 0.2, ["shoot"]);
  };

  it("breaks at its hit count under fists too", () => {
    const g = puncher([{ ...ship, shootable: { ...ship.shootable, hits: 1 } }]);
    punch(g);
    expect(shipOf(g).state).toBe(1);
    expect(g.world.flags.has("flag:hullOpen")).toBe(true);
  });

  it("plays its punch film when punched and its shot film when shot", () => {
    const punched = puncher([{ ...ship, shootable: { ...ship.shootable, hits: 1, cutscene: films } }]);
    punch(punched);
    expect(punched.world.cutscene?.id).toBe("pickCrowbar");
    const shot = shooter([{ ...ship, shootable: { ...ship.shootable, hits: 1, cutscene: films } }]);
    tick(shot, ["shoot"], ["shoot"]);
    expect(shot.world.cutscene?.id).toBe("hullCover");
  });

  it("takes no punch when only a beam breaks it", () => {
    const g = puncher([{ ...ship, shootable: { ...ship.shootable, by: "beam" } }]);
    punch(g);
    expect(shipOf(g).hitsTaken).toBeUndefined();
  });

  const crystal = { kind: "gate", id: "crystal", x: 15.5, y: 8, width: 1, height: 3, state: 0, solidStates: [0], cells: { col: 15, row: 5, w: 1, h: 3 } };
  const tank = { kind: "gate", id: "tank", x: 17.5, y: 8, width: 1, state: 0, solidStates: [0], shownBy: "flag:stalactiteShot", cells: { col: 17, row: 5, w: 1, h: 3 } };

  it("moves other props by its sets when it breaks and rebuilds their blockers", () => {
    const g = shooter([{ ...ship, shootable: { ...ship.shootable, hits: 1, gives: ["flag:stalactiteShot"], sets: { crystal: 1 } } }, crystal, tank]);
    expect(g.world.grid.solid(15, 6)).toBe(true);
    expect(g.world.grid.solid(17, 6)).toBe(false);
    tick(g, ["shoot"], ["shoot"]);
    expect(g.world.props.find((p) => p.id === "crystal")!.state).toBe(1);
    expect(g.world.grid.solid(15, 6)).toBe(false);
    expect(g.world.grid.solid(17, 6)).toBe(true);
  });

  const blocks = { kind: "gate", id: "stoneBlocks", x: 12.5, y: 8, width: 1, height: 2, state: 0, solidStates: [0], cells: { col: 12, row: 6, w: 1, h: 2 }, shootable: { hits: 3, state: 2, by: "punch", gives: ["flag:blocksBroken"] } };
  const blocksOf = (g: Game) => g.world.props.find((p) => p.id === "stoneBlocks")!;

  it("takes only punches when fists alone break it", () => {
    const shot = shooter([blocks]);
    fire(shot, 0.5);
    expect(blocksOf(shot).hitsTaken).toBeUndefined();
    const g = game({ x: 9, y: 8, weapon: "fists" }, { ...objectLevel, props: [blocks] });
    run(g, 1, ["moveRight"]);
    expect(g.hero.x).toBeLessThan(12);
    for (let i = 0; i < 3; i++) {
      punch(g);
      run(g, 0.3);
    }
    expect(blocksOf(g).state).toBe(2);
    expect(g.world.flags.has("flag:blocksBroken")).toBe(true);
    expect(g.world.grid.solid(12, 7)).toBe(false);
  });

  it("lets the beam pass a punch-only prop", () => {
    const g = shooter([blocks]);
    g.hero.blaster = 100;
    g.hero.weapon = "blaster";
    fire(g, 0.3);
    expect(blocksOf(g).hitsTaken).toBeUndefined();
  });

  it("takes no shot while its shownBy flag does not hold", () => {
    const hidden = { ...ship, shownBy: "flag:shown", shootable: { ...ship.shootable, hits: 1 } };
    const g = shooter([hidden]);
    fire(g, 0.3);
    expect(shipOf(g).hitsTaken).toBeUndefined();
    g.world.flags.add("flag:shown");
    fire(g, 0.3);
    expect(shipOf(g).state).toBe(1);
  });
});

describe("blaster beam", () => {
  const open = `#${".".repeat(28)}#`;
  const walled = `#${".".repeat(18)}#${".".repeat(9)}#`;
  const solid = "#".repeat(30);
  const beamLevel = (enemies: [number, number][], props: unknown[] = []) => ({
    rows: [solid, open, open, open, solid, walled, walled, walled, walled, solid, solid],
    spawn: [3.5, 9],
    sky: "skyBackground",
    backdrop: [],
    dressing: [],
    lifts: [],
    props,
    enemies: enemies.map(([x, y]) => ({ x, y, facing: -1, hits: 7, respawnMs: null, reactMs: 250, burst: { shots: 9, ms: 280 }, pauseMs: 400 })),
  });
  const blaster = (x: number, enemies: [number, number][] = [], facing: 1 | -1 = 1, props: unknown[] = []): Game => {
    const g = game({ x, y: 9, weapon: "blaster", state: "attack" }, beamLevel(enemies, props));
    Object.assign(g.hero, { facing, blaster: cfg.blaster.ammo, fireTime: 0, onGround: true });
    return g;
  };
  const zap = (g: Game, times = 1): void => {
    for (let i = 0; i < times; i++) fireBeam(g.world, g.hero, [{ kind: "beam", x: g.hero.x, y: g.hero.y }], clips, cfg);
  };
  const energy = (g: Game) => g.world.enemies.map((e) => e.body.energy);

  it("starts at the muzzle and reaches sightCells from the hero", () => {
    for (const facing of [1, -1] as const) {
      const from = facing > 0 ? 3.5 : 15.5;
      const g = blaster(from, [], facing);
      zap(g);
      const [x, y] = heroMuzzle(g.hero, clips, cfg);
      expect(g.world.beam).toMatchObject({ x, y, facing, end: from + facing * cfg.sightCells });
    }
  });

  it("ends at the first wall face", () => {
    const g = blaster(15.5);
    zap(g);
    expect(g.world.beam!.end).toBe(19);
  });

  it("ends at the first covered fog cell", () => {
    const g = blaster(3.5);
    g.world.fog = createFog(loadFog(cameraJson), cfg, g.hero, g.world.grid);
    const fog = g.world.fog;
    for (let row = 0; row < fog.height; row++) fog.seen.fill(0, row * fog.width + 8, (row + 1) * fog.width);
    zap(g);
    expect(g.world.beam!.end).toBe(8);
  });

  it("damages every live enemy in range on the floor, one spark each", () => {
    const g = blaster(3.5, [[7.5, 9], [10.5, 9], [16.5, 9]]);
    zap(g);
    expect(energy(g)).toEqual([7 - cfg.blaster.damage, 7 - cfg.blaster.damage, 7]);
    expect(g.world.sparks).toHaveLength(2);
    expect(g.world.sparks.map((s) => s.y)).toEqual([g.world.beam!.y, g.world.beam!.y]);
  });

  it("spares an enemy behind a wall and one on another floor", () => {
    const g = blaster(15.5, [[22.5, 9], [17.5, 4]]);
    zap(g);
    expect(energy(g)).toEqual([7, 7]);
    expect(g.world.sparks).toHaveLength(0);
  });

  it("moves on to the next enemy once one dies", () => {
    const g = blaster(3.5, [[6.5, 9], [9.5, 9]]);
    const [near, far] = g.world.enemies;
    near!.body.energy = cfg.blaster.damage * 1.5;
    zap(g, 2);
    expect(near!.deadAge).not.toBeNull();
    const dead = near!.body.energy;
    g.world.sparks = [];
    zap(g, 3);
    expect(near!.body.energy).toBe(dead);
    expect(g.world.sparks).toHaveLength(3);
    expect(far!.body.energy).toBeCloseTo(7 - 5 * cfg.blaster.damage, 9);
  });

  it("starts the hit reaction on the first touch only", () => {
    const g = blaster(3.5, [[8.5, 9]]);
    const [enemy] = g.world.enemies;
    zap(g);
    expect(enemy!.body.hitAge).toBe(0);
    expect(enemy!.alertAge).toBe(0);
    Object.assign(enemy!.body, { hitAge: 0.1 });
    enemy!.alertAge = null;
    zap(g);
    expect(enemy!.body.hitAge).toBe(0.1);
    expect(enemy!.alertAge).toBeNull();
    expect(enemy!.body.energy).toBeCloseTo(7 - 2 * cfg.blaster.damage, 9);
  });

  it("hits an enemy closer than the muzzle", () => {
    for (const facing of [1, -1] as const) {
      const g = blaster(10.5, [[10.5 + facing * 0.3, 9]], facing);
      zap(g);
      expect(facing * (heroMuzzle(g.hero, clips, cfg)[0] - 10.5)).toBeGreaterThan(0.3);
      expect(energy(g)).toEqual([7 - cfg.blaster.damage]);
    }
  });

  it("hits an enemy whose near face is in range though its centre is not", () => {
    const g = blaster(3.5, [[3.5 + cfg.sightCells + 0.2, 9]]);
    zap(g);
    expect(energy(g)).toEqual([7 - cfg.blaster.damage]);
  });

  it("hits a standing enemy on every beam tick of a stand jump that crosses its body", () => {
    for (const step of [0, 1]) {
      const level = beamLevel([[7.5, 9 - step]]);
      if (step) level.rows[8] = `${level.rows[8]!.slice(0, 6)}###${level.rows[8]!.slice(9)}`;
      const g = game({ x: 3.5, y: 9, weapon: "blaster", state: "idle" }, level);
      Object.assign(g.hero, { blaster: cfg.blaster.ammo, onGround: true });
      const [enemy] = g.world.enemies;
      enemy!.body.energy = 1000;
      tick(g, ["shoot"], ["shoot"]);
      tick(g, ["shoot", "up"], ["up"]);
      expect(g.hero.state).toBe("standJump");
      let crossing = 0;
      while (g.hero.state === "standJump") {
        const [before, events] = [enemy!.body.energy, g.events.length];
        tick(g, ["shoot"]);
        const ticks = g.events.slice(events).filter((e) => e.kind === "beam").length;
        const { y } = enemy!.body;
        const inside = g.world.beam!.y >= y - cfg.box.height && g.world.beam!.y <= y;
        if (ticks && inside) crossing++;
        expect(before - enemy!.body.energy).toBeCloseTo(inside ? ticks * cfg.blaster.damage : 0, 9);
      }
      expect(crossing).toBeGreaterThan(step ? 10 : 3);
    }
  });

  it("restarts the hit reaction when an enemy comes back into the beam", () => {
    const g = blaster(3.5, [[8.5, 9]]);
    const [enemy] = g.world.enemies;
    zap(g);
    enemy!.body.x = 16.5;
    zap(g);
    expect(g.world.beamHits.has(enemy!)).toBe(false);
    Object.assign(enemy!.body, { x: 8.5, hitAge: 0.1 });
    enemy!.alertAge = null;
    zap(g);
    expect(enemy!.body.hitAge).toBe(0);
    expect(enemy!.alertAge).toBe(0);
  });

  it("is cleared by a world reset", () => {
    const g = blaster(3.5, [[8.5, 9]]);
    zap(g);
    resetWorld(g.world, cfg);
    expect(g.world.beam).toBeNull();
    expect(g.world.beamHits.size).toBe(0);
  });

  it("hits a standing enemy from a duck", () => {
    const g = blaster(3.5, [[8.5, 9]]);
    g.hero.state = "duckAttack";
    zap(g);
    expect(energy(g)).toEqual([7 - cfg.blaster.damage]);
  });

  it("ends at a live shootable prop and counts each tick as a hit", () => {
    const target = { kind: "object", id: "target", x: 7, y: 9, width: 1, height: 3, shootable: { hits: 50, state: 1 } };
    const g = blaster(3.5, [[10.5, 9]], 1, [target]);
    zap(g, 2);
    expect(g.world.beam!.end).toBe(6.5);
    expect(g.world.props[0]!.hitsTaken).toBe(2);
    expect(energy(g)).toEqual([7]);
  });

  it("reaches past a shootable prop its tick broke", () => {
    const target = { kind: "object", id: "target", x: 7, y: 9, width: 1, height: 3, shootable: { hits: 1, state: 1 } };
    const g = blaster(3.5, [], 1, [target]);
    zap(g);
    expect(g.world.props[0]!.state).toBe(1);
    expect(g.world.beam!.end).toBe(3.5 + cfg.sightCells);
  });

  it("clears the beam and its hits once the hero stops firing", () => {
    const g = blaster(3.5, [[8.5, 9]]);
    zap(g);
    expect(g.world.beamHits.size).toBe(1);
    g.hero.fireTime = null;
    fireBeam(g.world, g.hero, [], clips, cfg);
    expect(g.world.beam).toBeNull();
    expect(g.world.beamHits.size).toBe(0);
  });

  it("stays on between ticks while fire is held and reacts once", () => {
    const g = blaster(3.5, [[8.5, 9]]);
    Object.assign(g.hero, { state: "idle", fireTime: null });
    const [enemy] = g.world.enemies;
    tick(g, ["shoot"], ["shoot"]);
    for (let i = 0; i < 20; i++) {
      expect(g.world.beam).not.toBeNull();
      tick(g, ["shoot"]);
    }
    expect(enemy!.body.hitAge).toBeCloseTo(20 / 60, 9);
    expect(enemy!.body.energy).toBeCloseTo(7 - 11 * cfg.blaster.damage, 9);
    expect(g.world.beam!.tick).toBe(10);
    tick(g);
    expect(g.world.beam).toBeNull();
  });
});

describe("toaster fireball", () => {
  const open = `#${".".repeat(28)}#`;
  const solid = "#".repeat(30);
  const level = (enemies: number[]) => ({
    rows: [solid, open, open, open, solid],
    spawn: [3.5, 4],
    sky: "skyBackground",
    backdrop: [],
    dressing: [],
    lifts: [],
    props: [],
    enemies: enemies.map((x) => ({ x, y: 4, facing: -1, hits: 7, respawnMs: null, reactMs: 250, burst: { shots: 9, ms: 280 }, pauseMs: 400 })),
  });
  const toaster = (enemies: number[] = []): Game => {
    const g = game({ x: 3.5, y: 4, weapon: "blaster", state: "attack" }, level(enemies));
    g.world.bonus = "toaster";
    Object.assign(g.hero, { facing: 1, blaster: cfg.toaster.ammo, fireTime: 0, onGround: true });
    return g;
  };
  const ticks = (g: Game, n: number): number[] => {
    const frames: number[] = [];
    for (let i = 0; i < n; i++) {
      fireBeam(g.world, g.hero, [{ kind: "beam", x: g.hero.x, y: g.hero.y }], clips, cfg);
      frames.push(g.world.beam!.tick);
    }
    return frames;
  };

  it("draws frames 1 to 6 then a blank tick and spends 1 ammo per fireball", () => {
    const g = toaster();
    expect(ticks(g, 14)).toEqual([1, 2, 3, 4, 5, 6, 0, 1, 2, 3, 4, 5, 6, 0]);
    expect(g.hero.blaster).toBe(cfg.toaster.ammo - 2);
  });

  it("hits every live enemy in range from the hit frame, restarts the cycle and spends 1 ammo per fireball", () => {
    const g = toaster([7.5, 8.5]);
    expect(ticks(g, 3)).toEqual([1, 2, 3]);
    expect(g.world.enemies.map((e) => e.body.energy)).toEqual([7 - cfg.toaster.damage, 7 - cfg.toaster.damage]);
    expect(g.world.beam!.cycle).toBe(0);
    ticks(g, 3);
    expect(g.world.enemies.every((e) => e.body.energy <= 0)).toBe(true);
    expect(g.hero.blaster).toBe(cfg.toaster.ammo - 2);
  });

  it("misses an enemy past its range", () => {
    const g = toaster([3.5 + cfg.toaster.range + 1.5]);
    ticks(g, 7);
    expect(g.world.enemies[0]!.body.energy).toBe(7);
  });

  it("puts its sight at the range end, or at the first wall when nearer", () => {
    const rigs = createRigs(true);
    const aim = (g: Game) => toasterSight(g.world, g.hero, heroLook(g.hero, clips, rigs, holdPoses(rigs.side, rigs.armedFront ?? rigs.front)), rigs, cfg);
    const g = toaster();
    expect(aim(g).end).toBeCloseTo(3.5 + cfg.toaster.range, 9);
    g.hero.x = 26.5;
    expect(aim(g).end).toBeCloseTo(29, 9);
  });

  it("lets a fireball finish its flight after fire is released", () => {
    const g = toaster([7.5]);
    ticks(g, 1);
    g.hero.fireTime = null;
    const tick = 1 / cfg.blaster.tickHz;
    const frames: number[] = [];
    for (let i = 0; i < 4; i++) {
      fireBeam(g.world, g.hero, [], clips, cfg, tick);
      frames.push(g.world.beam?.cycle ?? -1);
    }
    expect(frames).toEqual([2, -1, -1, -1]);
    expect(g.world.enemies[0]!.body.energy).toBe(7 - cfg.toaster.damage);
  });

  it("ends a missed flight at the cycle end after fire is released", () => {
    const g = toaster();
    ticks(g, 2);
    g.hero.fireTime = null;
    const tick = 1 / cfg.blaster.tickHz;
    const frames: number[] = [];
    for (let i = 0; i < 6; i++) {
      fireBeam(g.world, g.hero, [], clips, cfg, tick);
      frames.push(g.world.beam?.cycle ?? -1);
    }
    expect(frames).toEqual([3, 4, 5, 6, -1, -1]);
    expect(g.hero.blaster).toBe(cfg.toaster.ammo - 1);
  });

  it("gives its own ammo on pickup", () => {
    const g = toaster();
    expect(bonusAmmo(g.world, cfg)).toBe(250);
    g.world.bonus = "blaster";
    expect(bonusAmmo(g.world, cfg)).toBe(cfg.blaster.ammo);
  });
});

describe("flamethrower", () => {
  const open = `#${".".repeat(28)}#`;
  const solid = "#".repeat(30);
  const level = (enemies: number[], rows = [solid, open, open, open, solid]) => ({
    rows,
    spawn: [3.5, 4],
    sky: "skyBackground",
    backdrop: [],
    dressing: [],
    lifts: [],
    props: [],
    enemies: enemies.map((x) => ({ x, y: 4, facing: -1, hits: 7, respawnMs: null, reactMs: 250, burst: { shots: 9, ms: 280 }, pauseMs: 400 })),
  });
  const flamer = (enemies: number[] = [], rows?: string[]): Game => {
    const g = game({ x: 3.5, y: 4, weapon: "blaster", state: "attack" }, level(enemies, rows));
    g.world.bonus = "flamethrower";
    Object.assign(g.hero, { facing: 1, blaster: cfg.flamethrower.ammo, fireTime: 0, onGround: true, vx: 0 });
    return g;
  };
  const beamTicks = (g: Game, n: number): void => {
    for (let i = 0; i < n; i++) fireBeam(g.world, g.hero, [{ kind: "beam", x: g.hero.x, y: g.hero.y }], clips, cfg);
  };
  const flightTicks = (g: Game, n: number): void => {
    g.hero.fireTime = null;
    for (let i = 0; i < n; i++) fireBeam(g.world, g.hero, [], clips, cfg, 1 / cfg.blaster.tickHz);
  };
  const flames = (g: Game) => g.world.beam?.flames ?? [];

  it("lets out one flame per 2 ticks for 1 ammo each, each living 26 ticks", () => {
    const g = flamer();
    beamTicks(g, 40);
    expect(g.hero.blaster).toBe(cfg.flamethrower.ammo - 20);
    expect(flames(g)).toHaveLength(13);
    expect(Math.max(...flames(g).map((f) => f.age))).toBe(FLAME_LIFE);
  });

  it("flies a flame 88 px along the original step table, then drops it", () => {
    const g = flamer();
    beamTicks(g, 1);
    const from = flames(g)[0]!.x - FLAME_STEPS[0]! / 24;
    flightTicks(g, FLAME_LIFE - 1);
    expect(flames(g)[0]!.x - from).toBeCloseTo(88 / 24, 9);
    flightTicks(g, 1);
    expect(g.world.beam).toBeNull();
  });

  it("flies twice as far while the hero walks the same way", () => {
    const g = flamer();
    beamTicks(g, 1);
    const x = flames(g)[0]!.x;
    g.hero.vx = 1;
    flightTicks(g, 1);
    expect(flames(g)[0]!.x - x).toBeCloseTo((2 * FLAME_STEPS[1]!) / 24, 9);
  });

  it("burns an enemy within one column of a flame for 0.2 a flame each tick, not one past its reach", () => {
    const near = flamer([6.5]);
    beamTicks(near, 12);
    expect(near.world.enemies[0]!.body.energy).toBeLessThan(7);
    const far = flamer([11.5]);
    beamTicks(far, 60);
    expect(far.world.enemies[0]!.body.energy).toBe(7);
  });

  it("kills a 7 hit enemy with 35 flame ticks", () => {
    const g = flamer([6.5]);
    let hits = 0;
    while (g.world.enemies[0]!.body.energy > 0 && hits < 200) {
      const before = g.world.enemies[0]!.body.energy;
      beamTicks(g, 1);
      hits += Math.round((before - Math.max(0, g.world.enemies[0]!.body.energy)) / cfg.flamethrower.damage);
    }
    expect(hits).toBeGreaterThanOrEqual(34);
    expect(hits).toBeLessThanOrEqual(35);
  });

  it("stops a flame at a wall", () => {
    const g = flamer([], [solid, "#....#" + ".".repeat(23) + "#", "#....#" + ".".repeat(23) + "#", "#....#" + ".".repeat(23) + "#", solid]);
    beamTicks(g, 1);
    flightTicks(g, FLAME_LIFE);
    expect(g.world.beam).toBeNull();
    const g2 = flamer([], [solid, "#....#" + ".".repeat(23) + "#", "#....#" + ".".repeat(23) + "#", "#....#" + ".".repeat(23) + "#", solid]);
    beamTicks(g2, 1);
    flightTicks(g2, 6);
    expect(flames(g2).every((f) => f.x < 5)).toBe(true);
  });

  it("keeps burning after fire is released until the last flame dies", () => {
    const g = flamer([6.5]);
    beamTicks(g, 4);
    const energy = g.world.enemies[0]!.body.energy;
    flightTicks(g, 10);
    expect(g.world.enemies[0]!.body.energy).toBeLessThan(energy);
    expect(g.hero.blaster).toBe(cfg.flamethrower.ammo - 2);
    flightTicks(g, FLAME_LIFE);
    expect(g.world.beam).toBeNull();
  });

  it("roars on the first flame and every soundTicks ticks while fire is held", () => {
    const g = flamer();
    g.world.sounds = [];
    beamTicks(g, cfg.flamethrower.soundTicks + 1);
    expect(g.world.sounds.filter((s) => s.id === "flame")).toEqual([
      { id: "flame", rate: 6500, vol: 63, bus: "world" },
      { id: "flame", rate: 6500, vol: 63, bus: "world" },
    ]);
  });

  it("gives 500 ammo on pickup and is the jungle bonus weapon", () => {
    const g = flamer();
    expect(bonusAmmo(g.world, cfg)).toBe(500);
    expect(loadMission("jungle").bonus).toBe("flamethrower");
  });
});

describe("low bonus weapon ammo warning", () => {
  const mesto = (blaster: number) => {
    const world = loadMesto();
    const hero = { blaster } as Game["hero"];
    return { world, hero };
  };

  it("warns once when the ammo drops below the limit while a beam-only obstacle stands", () => {
    const { world, hero } = mesto(cfg.blaster.lowWarn);
    warnLowBonus(world, hero, cfg);
    expect(world.flags.has(BONUS_LOW)).toBe(false);
    hero.blaster = cfg.blaster.lowWarn - 1;
    warnLowBonus(world, hero, cfg);
    expect(world.subtitle?.text).toBe(BONUS_LOW_TEXT.blaster);
    world.subtitle = null;
    warnLowBonus(world, hero, cfg);
    expect(world.subtitle).toBeNull();
  });

  it("warns with the toaster limit and text when the toaster is held", () => {
    const world = loadMission("vesnice");
    const hero = { blaster: cfg.toaster.lowWarn - 1 } as Game["hero"];
    world.bonus = "toaster";
    warnLowBonus(world, hero, cfg);
    expect(world.subtitle?.text).toBe(BONUS_LOW_TEXT.toaster);
  });

  it("stays quiet once every beam-only obstacle is down", () => {
    const { world, hero } = mesto(10);
    for (const p of world.props) if (p.shootable?.by === "beam") p.state = p.shootable.state;
    warnLowBonus(world, hero, cfg);
    expect(world.flags.has(BONUS_LOW)).toBe(false);
  });
});
