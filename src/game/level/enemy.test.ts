import sandbox from "@config/levels/sandbox.json";
import { describe, expect, it } from "vitest";
import { cfg, clips, dt, game, run, tick, type Game } from "../hero/testWorld";
import { TileGrid } from "../../engine/world/tiles";
import { createEnemy, ENEMY_SHOT, FLYER_HALF, hitEnemy, isDead, updateEnemy, type Enemy, type EnemyJson } from "./enemy";

const PATROL = { left: 1 + cfg.box.width / 2, right: 11 - cfg.box.width / 2 };

const kill = (g: Game): void => {
  for (let i = 0; i < sandbox.enemies[0]!.hits; i++) hitEnemy(g.world.enemies[0]!);
};

const enemyShots = (g: Game) => g.world.projectiles.filter((p) => p.tag === ENEMY_SHOT);

const facingRight = (g: Game, x: number): void => {
  Object.assign(g.world.enemies[0]!.body, { x, facing: 1 });
};

describe("sandbox enemy", () => {
  it("starts walking on the top platform with full hits", () => {
    const [enemy] = game().world.enemies as [Enemy];
    expect(enemy.body).toMatchObject({ x: sandbox.enemies[0]!.x, y: sandbox.enemies[0]!.y, facing: sandbox.enemies[0]!.facing, state: "walk", weapon: "gun" });
    expect(enemy.body.energy).toBe(sandbox.enemies[0]!.hits);
    expect(isDead(enemy)).toBe(false);
  });

  it("walks edge to edge and never leaves the platform", () => {
    const g = game();
    let [min, max] = [Infinity, -Infinity];
    const faced = new Set<number>();
    for (let i = 0; i < 30 / dt; i++) {
      tick(g);
      const { x, y, facing } = g.world.enemies[0]!.body;
      [min, max] = [Math.min(min, x), Math.max(max, x)];
      faced.add(facing);
      expect(y).toBe(sandbox.enemies[0]!.y);
    }
    expect(min).toBeGreaterThanOrEqual(PATROL.left - 1e-9);
    expect(max).toBeLessThanOrEqual(PATROL.right + 1e-9);
    expect(min).toBeLessThan(PATROL.left + 0.1);
    expect(max).toBeGreaterThan(PATROL.right - 0.1);
    expect(faced).toEqual(new Set([1, -1]));
  });

  it("stops and shoots a hero it sees ahead on its floor", () => {
    const g = game({ x: 9.5, y: 4 });
    facingRight(g, 5.5);
    tick(g);
    const x = g.world.enemies[0]!.body.x;
    expect(g.world.enemies[0]!.body.state).toBe("attack");
    expect(enemyShots(g)).toHaveLength(1);
    expect(enemyShots(g)[0]!.vx).toBeCloseTo(cfg.shot.speed, 9);
    run(g, 1.1);
    expect(g.world.enemies[0]!.body.x).toBe(x);
    expect(g.hero.energy).toBeLessThan(cfg.energy.max);
  });

  it("fires bursts of burst.shots in burst.ms with pauseMs standing between them", () => {
    const g = game({ x: 9.5, y: 4 });
    facingRight(g, 5.5);
    const [enemy] = g.world.enemies as [Enemy];
    const { burst, pauseMs } = sandbox.enemies[0]!;
    const times: number[] = [];
    for (let i = 0; i < 2 / dt; i++) {
      const shots = updateEnemy(enemy, g.world.grid, null, g.hero, clips, cfg, dt);
      for (let s = 0; s < shots; s++) times.push(i * dt);
      if (i * dt > burst.ms / 1000 + 0.05 && i * dt < (burst.ms + pauseMs) / 1000 - 0.05) expect(enemy.body.state).toBe("idle");
    }
    const end = burst.ms / 1000 + dt;
    const first = times.filter((t) => t <= end);
    expect(first).toHaveLength(burst.shots);
    const second = times.filter((t) => t > end);
    expect(second[0]! - first.at(-1)!).toBeGreaterThanOrEqual(pauseMs / 1000 - dt);
    expect(enemy.body.x).toBe(5.5);
  });

  it("hits a hero standing closer than its muzzle", () => {
    for (const gap of [0.2, 0.5, 0.8]) {
      const g = game({ x: 5.5 + gap, y: 4 });
      facingRight(g, 5.5);
      run(g, 0.5);
      expect(g.hero.energy).toBeLessThan(cfg.energy.max);
    }
  });

  it("does not see a hero behind it, hidden or on another floor", () => {
    const behind = game({ x: 2.5, y: 4 });
    facingRight(behind, 5.5);
    const hidden = game({ x: 9.5, y: 4, state: "hide" });
    hidden.hero.hidden = true;
    facingRight(hidden, 5.5);
    const below = game({ x: 9.5, y: 14 });
    facingRight(below, 5.5);
    for (let i = 0; i < 10; i++) {
      tick(behind);
      tick(hidden, ["hide"]);
      tick(below);
    }
    for (const g of [behind, hidden, below]) {
      expect(g.world.enemies[0]!.body.state).toBe("walk");
      expect(enemyShots(g)).toHaveLength(0);
    }
  });

  it("walks on when the hero hides", () => {
    const g = game({ x: 9.5, y: 4 });
    facingRight(g, 5.5);
    run(g, 0.15);
    expect(g.world.enemies[0]!.body.state).toBe("attack");
    tick(g, ["hide"]);
    tick(g, ["hide"]);
    expect(g.world.enemies[0]!.body).toMatchObject({ state: "walk", fireTime: null });
  });

  it("dies on the last hit and flashes on each hit", () => {
    const g = game();
    for (let i = 1; i < sandbox.enemies[0]!.hits; i++) expect(hitEnemy(g.world.enemies[0]!)).toBe(true);
    expect(isDead(g.world.enemies[0]!)).toBe(false);
    expect(g.world.enemies[0]!.body.hitAge).toBe(0);
    hitEnemy(g.world.enemies[0]!);
    expect(isDead(g.world.enemies[0]!)).toBe(true);
    expect(hitEnemy(g.world.enemies[0]!)).toBe(false);
  });

  it("stays put while dead and comes back walking with full hits 5 s after death", () => {
    const g = game();
    kill(g);
    const x = g.world.enemies[0]!.body.x;
    for (let i = 0; i < 4.9 / dt; i++) updateEnemy(g.world.enemies[0]!, g.world.grid, null, g.hero, clips, cfg, dt);
    expect(isDead(g.world.enemies[0]!)).toBe(true);
    expect(g.world.enemies[0]!.body.x).toBe(x);
    for (let i = 0; i < 0.2 / dt; i++) updateEnemy(g.world.enemies[0]!, g.world.grid, null, g.hero, clips, cfg, dt);
    expect(isDead(g.world.enemies[0]!)).toBe(false);
    expect(g.world.enemies[0]!.body).toMatchObject({ energy: sandbox.enemies[0]!.hits, hitAge: null, state: "walk", facing: sandbox.enemies[0]!.facing });
    expect(Math.abs(g.world.enemies[0]!.body.x - sandbox.enemies[0]!.x)).toBeLessThan(0.2);
  });

  it("takes hero bullets on its floor with a spark where they hit", () => {
    const g = game({ x: 9.5, y: 4, weapon: "gun" });
    g.hero.facing = -1;
    Object.assign(g.world.enemies[0]!.body, { x: 4.5, facing: -1 });
    tick(g, ["shoot"], ["shoot"]);
    run(g, 0.5, ["shoot"]);
    const [enemy] = g.world.enemies as [Enemy];
    expect(enemy.body.energy).toBeLessThan(sandbox.enemies[0]!.hits);
    expect(g.world.sparks.some((s) => Math.abs(s.x - enemy.body.x) < cfg.box.width)).toBe(true);
  });

  it("turns to the hero reactMs after a hit from behind and starts shooting", () => {
    const g = game({ x: 7.5, y: 4, weapon: "gun" });
    g.hero.facing = -1;
    Object.assign(g.world.enemies[0]!.body, { x: 4.5, facing: -1 });
    tick(g, ["shoot"], ["shoot"]);
    const [enemy] = g.world.enemies as [Enemy];
    while (enemy.body.hitAge === null) tick(g, ["shoot"]);
    const react = sandbox.enemies[0]!.reactMs / 1000;
    run(g, react - 2 * dt);
    expect(enemy.body).toMatchObject({ facing: -1, state: "walk" });
    expect(enemyShots(g)).toHaveLength(0);
    run(g, 2 * dt);
    expect(enemy.body).toMatchObject({ facing: 1, state: "attack" });
    expect(enemyShots(g)).toHaveLength(1);
  });

  it("walks on the way it turned when the hero is out of sight", () => {
    const g = game({ x: 3.5 + cfg.sightCells + 1, y: 4 });
    const [enemy] = g.world.enemies as [Enemy];
    Object.assign(enemy.body, { x: 3.5, facing: -1 });
    hitEnemy(enemy);
    for (let i = 0; i < sandbox.enemies[0]!.reactMs / 1000 / dt + 1; i++) updateEnemy(enemy, g.world.grid, null, g.hero, clips, cfg, dt);
    const x = enemy.body.x;
    for (let i = 0; i < 0.5 / dt; i++) updateEnemy(enemy, g.world.grid, null, g.hero, clips, cfg, dt);
    expect(enemy.body).toMatchObject({ facing: 1, state: "walk" });
    expect(enemy.body.x).toBeGreaterThan(x);
  });

  it("takes 16 hero bullets to destroy", () => {
    const g = game({ x: 9.5, y: 4, weapon: "gun" });
    g.hero.facing = -1;
    const [enemy] = g.world.enemies as [Enemy];
    Object.assign(enemy.body, { x: 4.5, facing: -1 });
    enemy.patrol = [4.5, 4.5];
    tick(g, ["shoot"], ["shoot"]);
    let hits = 0;
    while (!isDead(enemy)) {
      const before = enemy.body.energy;
      tick(g, ["shoot"]);
      if (enemy.body.energy < before) hits++;
    }
    expect(hits).toBe(16);
  });

  it("takes punches in reach with a spark on its face and dies when they add up to its hits", () => {
    const g = game({ x: 5.5 + cfg.punch.reach - 0.05, y: 4 });
    g.hero.facing = -1;
    Object.assign(g.world.enemies[0]!.body, { x: 5.5, facing: 1, state: "attack" });
    g.world.enemies[0]!.patrol = [5.5, 5.5];
    tick(g, ["shoot"], ["shoot"]);
    while (!g.events.some((e) => e.kind === "punch")) tick(g, ["shoot"]);
    const [enemy] = g.world.enemies as [Enemy];
    expect(enemy.body.energy).toBe(sandbox.enemies[0]!.hits - cfg.punch.damage);
    expect(enemy.body.hitAge).not.toBeNull();
    expect(g.world.sparks.some((s) => Math.abs(s.x - enemy.body.x) < cfg.box.width)).toBe(true);
    while (!isDead(enemy)) tick(g, ["shoot"]);
    expect(g.events.filter((e) => e.kind === "punch")).toHaveLength(Math.ceil(sandbox.enemies[0]!.hits / cfg.punch.damage));
  });

  it("takes no punch out of reach", () => {
    const g = game({ x: 5.5 + cfg.punch.reach + 0.05, y: 4 });
    g.hero.facing = -1;
    Object.assign(g.world.enemies[0]!.body, { x: 5.5, facing: 1, state: "attack" });
    g.world.enemies[0]!.patrol = [5.5, 5.5];
    tick(g, ["shoot"], ["shoot"]);
    run(g, 0.3, ["shoot"]);
    expect(g.world.enemies[0]!.body.energy).toBe(sandbox.enemies[0]!.hits);
  });

  it("stays dead for a minute when respawnMs is null", () => {
    const g = game();
    const enemy = g.world.enemies[1]!;
    expect(enemy.respawnMs).toBeNull();
    for (let i = 0; i < sandbox.enemies[1]!.hits; i++) hitEnemy(enemy);
    expect(isDead(enemy)).toBe(true);
    const x = enemy.body.x;
    for (let i = 0; i < 60 / dt; i++) updateEnemy(enemy, g.world.grid, null, g.hero, clips, cfg, dt);
    expect(isDead(enemy)).toBe(true);
    expect(enemy.body.x).toBe(x);
  });

  it("keeps patrols off lift shafts and out of the right strip", () => {
    const { enemies, lifts } = game().world;
    for (const e of enemies.slice(1).filter((e) => !e.flight)) {
      const [left, right] = e.patrol;
      expect(right).toBeLessThan(40);
      for (const l of lifts.filter((l) => l.top === e.spot[1] || l.bottom === e.spot[1])) {
        expect(right <= l.x || left >= l.x + l.w).toBe(true);
      }
    }
  });

  it("stops its patrol at a middle lift stop", () => {
    const grid = new TileGrid(["..........", "##########"]);
    const shaft = { x: 6, w: 2, top: 0, bottom: 2, stops: [0, 1, 2] };
    const enemy = createEnemy({ ...(sandbox.enemies[0] as EnemyJson), x: 1.5, y: 1, facing: 1 }, grid, [shaft]);
    expect(enemy.patrol[1]).toBeCloseTo(6 - 0.35, 9);
  });

  it("keeps a configured patrol inside the walkable floor", () => {
    const grid = new TileGrid(["..........", "##########"]);
    const base = { ...sandbox.enemies[0]!, x: 3.5, y: 1, facing: 1 as const };
    expect(createEnemy({ ...base, patrol: [2, 6] }, grid).patrol).toEqual([2 + 0.35, 6 - 0.35]);
    expect(createEnemy({ ...base, patrol: [-5, 40] }, grid).patrol).toEqual([0.35, 10 - 0.35]);
  });

  it("does not see the hero at spawn", () => {
    const g = game();
    run(g, 0.1);
    expect(g.world.enemies.every((e) => e.body.state === "walk")).toBe(true);
  });
});

describe("sandbox flyer", () => {
  const json = sandbox.enemies[4]!;
  const flight = json.flight!;
  const floor = json.y;
  const flyerOf = (g: Game): Enemy => g.world.enemies[4]!;
  const liftOf = (e: Enemy): number => floor - e.body.y;
  const shotsAt = (g: Game) => enemyShots(g);

  it("hovers at the right end of the spawn floor, patrolling right of the lift shaft", () => {
    const e = flyerOf(game());
    expect(e.flight).not.toBeNull();
    expect(e.body).toMatchObject({ x: json.x, facing: -1, state: "walk" });
    expect(liftOf(e)).toBeCloseTo(flight.hoverLift, 9);
    expect(e.patrol[0]).toBeCloseTo(37 + FLYER_HALF[0], 9);
    expect(e.patrol[1]).toBeCloseTo(47 - FLYER_HALF[0], 9);
  });

  it("cruises edge to edge at speedScale times the walk speed on its hover wave", () => {
    const g = game();
    const e = flyerOf(g);
    const walk = clips.walk!;
    const speed = ((walk.travel ?? 0) / walk.duration) * flight.speedScale;
    const x = e.body.x;
    tick(g);
    expect(x - e.body.x).toBeCloseTo(speed * dt, 9);
    let [min, max] = [Infinity, -Infinity];
    for (let i = 0; i < 30 / dt; i++) {
      tick(g);
      [min, max] = [Math.min(min, e.body.x), Math.max(max, e.body.x)];
      expect(Math.abs(liftOf(e) - flight.hoverLift)).toBeLessThanOrEqual(flight.wave.cells + 1e-9);
    }
    expect(min).toBeLessThan(e.patrol[0] + 0.1);
    expect(max).toBeGreaterThan(e.patrol[1] - 0.1);
    expect(shotsAt(g)).toHaveLength(0);
  });

  it("dives to aimLift when it sees the hero and fires bursts that hit a standing hero", () => {
    const g = game({ x: 39.5, y: floor });
    const e = flyerOf(g);
    tick(g);
    expect(liftOf(e)).toBeLessThan(flight.hoverLift);
    expect(shotsAt(g)).toHaveLength(0);
    const dive = (flight.hoverLift - flight.aimLift) / flight.climb;
    run(g, dive + 0.05);
    expect(liftOf(e)).toBeCloseTo(flight.aimLift, 9);
    expect(e.body.state).toBe("attack");
    run(g, 1);
    expect(g.hero.energy).toBeLessThan(cfg.energy.max);
  });

  it("stops closeCells from the hero while it dives", () => {
    const g = game({ x: 37.5, y: floor });
    const e = flyerOf(g);
    e.body.x = 41.5;
    run(g, 1);
    expect(e.body.x - g.hero.x).toBeGreaterThanOrEqual(flight.closeCells - 0.1);
    expect(e.body.x - g.hero.x).toBeLessThanOrEqual(flight.closeCells + 0.1);
  });

  it("stays at gun height and flies on when the hero hides or leaves", () => {
    const g = game({ x: 39.5, y: floor });
    const e = flyerOf(g);
    run(g, 0.6);
    expect(e.body.state).toBe("attack");
    run(g, 1.5, ["hide"]);
    expect(e.body.state).toBe("walk");
    expect(liftOf(e)).toBeCloseTo(flight.aimLift, 9);
    Object.assign(g.hero, { x: 7.5, hidden: false, state: "idle" });
    for (let i = 0; i < 10 / dt; i++) {
      tick(g);
      expect(liftOf(e)).toBeCloseTo(flight.aimLift, 9);
    }
  });

  it("dives on to gun height when the hero hides during the dive", () => {
    const g = game({ x: 39.5, y: floor });
    const e = flyerOf(g);
    run(g, 0.2);
    expect(liftOf(e)).toBeGreaterThan(flight.aimLift);
    let last = liftOf(e);
    for (let i = 0; i < 1.5 / dt; i++) {
      tick(g, ["hide"]);
      expect(liftOf(e)).toBeLessThanOrEqual(last + 1e-9);
      last = liftOf(e);
    }
    expect(liftOf(e)).toBeCloseTo(flight.aimLift, 9);
  });

  it("hovers again after it respawns", () => {
    const g = game({ x: 39.5, y: floor });
    const e = flyerOf(g);
    run(g, 0.6);
    for (let i = 0; i < json.hits; i++) hitEnemy(e);
    g.hero.x = 7.5;
    run(g, json.respawnMs! / 1000 + 1);
    expect(isDead(e)).toBe(false);
    expect(Math.abs(liftOf(e) - flight.hoverLift)).toBeLessThanOrEqual(flight.wave.cells + 1e-9);
  });

  it("turns to a hero behind it on its floor after turnMs", () => {
    const g = game({ x: 46.5, y: floor });
    const e = flyerOf(g);
    e.body.x = 42.5;
    run(g, flight.turnMs / 1000 - 2 * dt);
    expect(e.body.facing).toBe(-1);
    run(g, 3 * dt);
    expect(e.body.facing).toBe(1);
  });

  it("flies over hero bullets while it hovers and takes them once it dives", () => {
    const g = game({ x: 37.5, y: floor, weapon: "gun" });
    const e = flyerOf(g);
    Object.assign(e.body, { x: 45.5, facing: 1 });
    e.flight!.cfg = { ...flight, turnMs: Infinity };
    g.hero.facing = 1;
    tick(g, ["shoot"], ["shoot"]);
    run(g, 0.4, ["shoot"]);
    expect(e.body.energy).toBe(json.hits);
    run(g, 1.5, ["shoot"]);
    expect(e.body.energy).toBeLessThan(json.hits);
  });

  const punchReady = (lift: number): { g: Game; e: Enemy } => {
    const g = game({ x: 40.5, y: floor });
    const e = flyerOf(g);
    Object.assign(e.body, { x: 40.5 + cfg.punch.reach, facing: -1 });
    e.patrol = [e.body.x, e.body.x];
    e.flight!.cfg = { ...flight, hoverLift: lift, aimLift: lift, wave: { cells: 0, hz: 0 }, turnMs: Infinity };
    e.flight!.lift = lift;
    e.body.y = floor - lift;
    g.hero.facing = 1;
    return { g, e };
  };

  it("takes punches once it dives and dies when they add up to its hits", () => {
    const { g, e } = punchReady(flight.aimLift);
    tick(g, ["shoot"], ["shoot"]);
    while (!g.events.some((ev) => ev.kind === "punch")) tick(g, ["shoot"]);
    expect(e.body.energy).toBe(json.hits - cfg.punch.damage);
    expect(g.world.sparks.length).toBeGreaterThan(0);
    while (!isDead(e)) tick(g, ["shoot"]);
    expect(g.events.filter((ev) => ev.kind === "punch")).toHaveLength(Math.ceil(json.hits / cfg.punch.damage));
  });

  it("takes no punch while it cruises", () => {
    const { g, e } = punchReady(flight.hoverLift);
    tick(g, ["shoot"], ["shoot"]);
    run(g, 0.6, ["shoot"]);
    expect(g.events.some((ev) => ev.kind === "punch")).toBe(true);
    expect(e.body.energy).toBe(json.hits);
  });

  it("comes back hovering at its spot after respawnMs", () => {
    const g = game({ x: 39.5, y: floor });
    const e = flyerOf(g);
    run(g, 1);
    for (let i = 0; i < json.hits; i++) hitEnemy(e);
    expect(isDead(e)).toBe(true);
    for (let i = 0; i < (json.respawnMs! + 50) / 1000 / dt; i++) updateEnemy(e, g.world.grid, null, game().hero, clips, cfg, dt);
    expect(isDead(e)).toBe(false);
    expect(liftOf(e)).toBeCloseTo(flight.hoverLift, 1);
  });
});
