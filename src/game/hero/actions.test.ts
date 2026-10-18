import { describe, expect, it } from "vitest";
import { damage } from "./hero";
import { cfg, game, run, runUntil, tick, type Game } from "./testWorld";

const kinds = (g: Game, kind: string) => g.events.filter((e) => e.kind === kind);

const fire = (g: Game, x: number) => g.world.projectiles.push({ x, y: 12.6, vx: -8, r: 0.15 });

function hidden(): Game {
  const g = game();
  run(g, 0.7, ["hide"]);
  return g;
}

describe("kneel and duck", () => {
  it("kneels at the item for one pickup, then ducks there", () => {
    const g = game({ x: 9.5, y: 14 });
    tick(g, ["down"]);
    expect(g.hero.state).toBe("kneel");
    run(g, 0.7);
    expect(kinds(g, "pickup")).toHaveLength(0);
    run(g, 0.2);
    expect(kinds(g, "pickup")).toHaveLength(1);
    runUntil(g, (h) => h.state === "idle");
    expect(g.world.props.find((p) => p.kind === "item")?.taken).toBe(true);
    tick(g, ["down"]);
    expect(g.hero.state).toBe("duck");
    run(g, 0.5, ["down"]);
    expect(g.hero.state).toBe("duck");
    tick(g);
    expect(g.hero.state).toBe("idle");
    expect(kinds(g, "pickup")).toHaveLength(1);
  });

  it("calls the lift instead of ducking on it", () => {
    const g = game({ x: 18.5, y: 4 });
    g.world.lift.y = 4;
    tick(g);
    tick(g, ["down"], ["down"]);
    expect(g.hero.state).toBe("idle");
    expect(g.world.lift.target).toBe(14);
  });
});

describe("use", () => {
  it("uses the panel, emits use and flips it on", () => {
    const g = game({ x: 21.5, y: 14 });
    tick(g, [], ["useItem"]);
    expect(g.hero.state).toBe("use");
    expect(kinds(g, "use")).toEqual([{ kind: "use", x: 21.5, y: 14 }]);
    expect(g.world.props.find((p) => p.kind === "panel")?.on).toBe(true);
    runUntil(g, (h) => h.state === "idle");
    expect(g.hero.state).toBe("idle");
  });

  it("ignores useItem away from the panel", () => {
    const g = game();
    tick(g, [], ["useItem"]);
    expect(g.hero.state).toBe("idle");
  });
});

describe("hide", () => {
  it("hides after the front switch while held and turns back on release", () => {
    const g = game();
    run(g, 0.1, ["hide"]);
    expect(g.hero.state).toBe("hide");
    expect(g.hero.hidden).toBe(false);
    run(g, 0.1, ["hide"]);
    expect(g.hero.hidden).toBe(true);
    run(g, 1, ["hide"]);
    expect(g.hero.state).toBe("hide");
    expect(g.hero.hidden).toBe(true);
    run(g, 0.4);
    expect(g.hero.state).toBe("hide");
    expect(g.hero.hidden).toBe(true);
    run(g, 0.1);
    expect(g.hero.hidden).toBe(false);
    runUntil(g, (h) => h.state === "idle");
    expect(g.hero.state).toBe("idle");
    expect(g.hero.time).toBeLessThan(0.1);
  });

  it("does nothing on a moving lift", () => {
    const g = game({ x: 18.5, y: 14 });
    tick(g);
    tick(g, [], ["up"]);
    run(g, 0.5, ["hide"]);
    expect([...g.seen]).toEqual(["idle"]);
    expect(g.hero.hidden).toBe(false);
  });
});

describe("projectiles", () => {
  it("hit a standing hero and are removed", () => {
    const g = game();
    fire(g, 9);
    run(g, 0.5);
    expect(g.hero.energy).toBe(75);
    expect(g.seen.has("hit")).toBe(true);
    expect(g.world.projectiles).toHaveLength(0);
  });

  it("pass over a ducked hero", () => {
    const g = game();
    run(g, 0.3, ["down"]);
    expect(g.hero.state).toBe("duck");
    fire(g, 9);
    run(g, 0.5, ["down"]);
    expect(g.hero.energy).toBe(100);
    expect(g.world.projectiles[0]!.x).toBeLessThan(6);
  });

  it("fly through a hidden hero", () => {
    const g = hidden();
    fire(g, 9);
    run(g, 0.5, ["hide"]);
    expect(g.hero.energy).toBe(100);
    expect(g.world.projectiles[0]!.x).toBeLessThan(6);
  });
});

describe("damage", () => {
  it("is ignored while hidden", () => {
    const g = hidden();
    expect(damage(g.hero, cfg)).toEqual([]);
    expect(g.hero.energy).toBe(100);
  });

  it("enters hit, then death with died after four hits, then respawns", () => {
    const g = game();
    const events = [damage(g.hero, cfg), damage(g.hero, cfg), damage(g.hero, cfg)].flat();
    expect(g.hero.state).toBe("hit");
    expect(events).toEqual([]);
    expect(damage(g.hero, cfg).map((e) => e.kind)).toEqual(["died"]);
    expect(g.hero.state).toBe("death");
    expect(g.hero.energy).toBe(0);
    run(g, cfg.respawnMs / 1000 + 0.1);
    expect(g.hero.state).toBe("idle");
    expect(g.hero.energy).toBe(cfg.energy.max);
  });

  it("keeps a lethal fall lethal when hit mid-fall", () => {
    const g = game({ x: 10, y: 4 });
    runUntil(g, (h) => h.state === "fall", ["moveRight"]);
    runUntil(g, (h) => h.y > 8);
    damage(g.hero, cfg);
    expect(g.hero.state).toBe("fall");
    expect(g.hero.energy).toBe(75);
    runUntil(g, (h) => h.onGround);
    expect(g.hero.state).toBe("fallDeath");
    expect(g.seen.has("hit")).toBe(false);
  });

  it("keeps the jump when hit mid-jump", () => {
    const g = game();
    tick(g, [], ["up"]);
    run(g, 0.6);
    expect(g.hero.onGround).toBe(false);
    damage(g.hero, cfg);
    expect(g.hero.state).toBe("standJump");
    expect(g.hero.energy).toBe(75);
    runUntil(g, (h) => h.state === "idle");
    expect(g.seen.has("land")).toBe(true);
    expect(g.seen.has("hit")).toBe(false);
  });

  it("commits to hit and returns to idle", () => {
    const g = game();
    damage(g.hero, cfg);
    run(g, 0.5, ["moveRight"]);
    expect(g.hero.state).toBe("hit");
    expect(g.hero.x).toBe(7.5);
    run(g, 0.2);
    expect(g.hero.state).toBe("idle");
  });
});

describe("attack", () => {
  it("fires 12 shots in 1 s with the gun held and stands still", () => {
    const g = game({ x: 7.5, y: 14, weapon: "gun" });
    tick(g, ["shoot"], ["shoot"]);
    expect(g.hero.state).toBe("attack");
    run(g, 59 / 60, ["shoot"]);
    expect(kinds(g, "shot")).toHaveLength(12);
    expect(g.hero.x).toBe(7.5);
    tick(g);
    expect(g.hero.state).toBe("idle");
  });

  it("starts attack right after landing from a shoot press 100 ms before land ends", () => {
    const g = game();
    tick(g, [], ["up"]);
    runUntil(g, (h) => h.state === "land");
    runUntil(g, (h) => h.time >= 0.4 - 1e-9);
    tick(g, [], ["shoot"]);
    runUntil(g, (h) => h.state !== "land");
    expect(g.hero.state).toBe("idle");
    tick(g);
    expect(g.hero.state).toBe("attack");
  });

  it("commits a punch until cancelAt, punching once at the jab peak", () => {
    const g = game();
    tick(g, [], ["shoot"]);
    expect(g.hero.state).toBe("attack");
    run(g, 0.3, ["moveLeft"]);
    expect(g.hero.state).toBe("attack");
    expect(g.hero.facing).toBe(1);
    expect(g.hero.x).toBe(7.5);
    expect(kinds(g, "punch")).toHaveLength(1);
    run(g, 0.1, ["moveLeft"]);
    expect(g.hero.state).toBe("turn");
  });

  it("punches again each loop while shoot is held", () => {
    const g = game();
    tick(g, ["shoot"], ["shoot"]);
    run(g, 1.4, ["shoot"]);
    expect(g.hero.state).toBe("attack");
    expect(kinds(g, "punch")).toHaveLength(3);
  });

  it("duck attacks from duck and returns to duck", () => {
    const g = game({ x: 7.5, y: 14, weapon: "gun" });
    run(g, 0.3, ["down"]);
    tick(g, ["down", "shoot"], ["shoot"]);
    expect(g.hero.state).toBe("duckAttack");
    expect(kinds(g, "shot")).toHaveLength(1);
    tick(g, ["down"]);
    expect(g.hero.state).toBe("duck");
  });
});

describe("weapon switch", () => {
  it("draws the gun with weapon1 at the clip's gun time", () => {
    const g = game();
    tick(g, [], ["weapon1"]);
    expect(g.hero.state).toBe("weaponSwitch");
    run(g, 0.1);
    expect(g.hero.weapon).toBe("fists");
    runUntil(g, (h) => h.state === "idle");
    expect(g.hero.weapon).toBe("gun");
  });

  it("holsters with weapon2 by playing the switch reversed", () => {
    const g = game({ x: 7.5, y: 14, weapon: "gun" });
    tick(g, [], ["weapon2"]);
    expect(g.hero.state).toBe("weaponSwitch");
    run(g, 0.8);
    expect(g.hero.weapon).toBe("gun");
    run(g, 0.1);
    expect(g.hero.weapon).toBe("fists");
    runUntil(g, (h) => h.state === "idle");
    expect(g.hero.weapon).toBe("fists");
  });

  it("switches once on a simultaneous weapon1 and weapon2 press", () => {
    const g = game();
    tick(g, [], ["weapon1", "weapon2", "weapon3"]);
    expect(g.hero.state).toBe("weaponSwitch");
    expect(g.buffer.size).toBe(0);
    runUntil(g, (h) => h.state === "idle");
    expect(g.hero.weapon).toBe("gun");
  });

  it("ignores the slot already selected and weapon3", () => {
    const g = game();
    tick(g, [], ["weapon2", "weapon3"]);
    expect(g.hero.state).toBe("idle");
  });
});
