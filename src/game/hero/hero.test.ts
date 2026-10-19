import { describe, expect, it } from "vitest";
import type { Weapon } from "./config";
import { kill } from "./hero";
import { cfg, game, run, runUntil, tick, type Game } from "./testWorld";

const armed = (weapon: Weapon, blaster: number | null, ammo = cfg.ammo): Game => {
  const g = game({ x: 7.5, y: 14, weapon });
  Object.assign(g.hero, { blaster, ammo });
  return g;
};

function sandboxBlaster(): { x: number; y: number } {
  const prop = game().world.props.find((p) => p.kind === "weapon")!;
  return { x: prop.x, y: prop.y ?? game().world.spawn[1] };
}

const count = (g: Game, kind: string): number => g.events.filter((e) => e.kind === kind).length;

const hiddenSwitch = (g: Game, slot: string): { weapon: Weapon; rate: number }[] => {
  tick(g, ["hide"]);
  tick(g, ["hide"], [slot]);
  const trace = [{ weapon: g.hero.weapon, rate: g.hero.rate }];
  for (tick(g, ["hide"]); g.hero.state === "weaponSwitch"; tick(g, ["hide"])) trace.push({ weapon: g.hero.weapon, rate: g.hero.rate });
  return trace;
};

const phases = <T>(values: T[]): T[] => values.filter((v, i) => i === 0 || JSON.stringify(v) !== JSON.stringify(values[i - 1]));

describe("blaster select", () => {
  it("ignores key 3 before the pickup", () => {
    const g = armed("gun", null);
    tick(g, [], ["weapon3"]);
    expect(g.hero).toMatchObject({ state: "idle", weapon: "gun" });
  });

  it("arms the blaster at once with key 3 outside cover", () => {
    for (const from of ["fists", "gun"] as const) {
      const g = armed(from, cfg.blaster.ammo);
      tick(g, [], ["weapon3"]);
      expect(g.hero).toMatchObject({ state: "idle", weapon: "blaster", switchTo: "blaster" });
    }
  });

  it("ignores key 3 with an empty blaster", () => {
    const g = armed("gun", 0);
    tick(g, [], ["weapon3"]);
    expect(g.hero.weapon).toBe("gun");
  });
});

describe("hidden blaster switch", () => {
  it("draws the blaster from fists", () => {
    const g = armed("fists", cfg.blaster.ammo);
    const trace = hiddenSwitch(g, "weapon3");
    expect(phases(trace)).toEqual([{ weapon: "fists", rate: 1 }, { weapon: "blaster", rate: 1 }]);
    expect(g.hero).toMatchObject({ state: "hide", hidden: true, weapon: "blaster", switchTo: "blaster" });
  });

  it("holsters the gun, then draws the blaster", () => {
    const g = armed("gun", cfg.blaster.ammo);
    const trace = hiddenSwitch(g, "weapon3");
    expect(phases(trace)).toEqual([{ weapon: "gun", rate: -1 }, { weapon: "blaster", rate: 1 }]);
    expect(g.hero).toMatchObject({ state: "hide", hidden: true, weapon: "blaster" });
  });

  it("holsters the blaster, then draws the gun", () => {
    const g = armed("blaster", cfg.blaster.ammo);
    const trace = hiddenSwitch(g, "weapon1");
    expect(phases(trace)).toEqual([{ weapon: "blaster", rate: -1 }, { weapon: "gun", rate: 1 }]);
    expect(g.hero).toMatchObject({ state: "hide", hidden: true, weapon: "gun" });
  });

  it("holsters the blaster to fists", () => {
    const g = armed("blaster", cfg.blaster.ammo);
    const trace = hiddenSwitch(g, "weapon2");
    expect(phases(trace.map((t) => t.rate))).toEqual([-1]);
    expect(g.hero).toMatchObject({ state: "hide", weapon: "fists" });
  });

  it("stores the target and arms it when cut short while holstering", () => {
    const g = armed("gun", cfg.blaster.ammo);
    tick(g, ["hide"]);
    tick(g, ["hide"], ["weapon3"]);
    expect(g.hero).toMatchObject({ state: "weaponSwitch", switchTo: "blaster", rate: -1 });
    run(g, 0.1, ["hide"]);
    tick(g);
    expect(g.hero.state).not.toBe("weaponSwitch");
    expect(g.hero.weapon).toBe("blaster");
  });
});

describe("blaster fire", () => {
  it("emits one beam per tick for 1 s of held shoot and spends 1 ammo each", () => {
    const g = armed("blaster", cfg.blaster.ammo);
    tick(g, ["shoot"], ["shoot"]);
    run(g, 59 / 60, ["shoot"]);
    expect(count(g, "beam")).toBe(cfg.blaster.tickHz);
    expect(count(g, "shot")).toBe(0);
    expect(g.hero.blaster).toBe(cfg.blaster.ammo - cfg.blaster.tickHz);
    expect(g.hero.ammo).toBe(cfg.ammo);
    expect(g.hero.state).toBe("attack");
  });

  it("switches an empty blaster to the gun, or to fists with an empty gun", () => {
    for (const [ammo, next] of [[cfg.ammo, "gun"], [0, "fists"]] as const) {
      const g = armed("blaster", 3, ammo);
      tick(g, ["shoot"], ["shoot"]);
      runUntil(g, (h) => h.blaster === 0, ["shoot"]);
      expect(g.hero.weapon).toBe("blaster");
      const beams = count(g, "beam");
      tick(g, ["shoot"]);
      expect(g.hero.weapon).toBe(next);
      expect(beams).toBe(3);
      expect(count(g, "beam")).toBe(3);
    }
  });

  it("switches an empty gun to the blaster, or to fists with an empty blaster", () => {
    for (const [blaster, next] of [[cfg.blaster.ammo, "blaster"], [0, "fists"], [null, "fists"]] as const) {
      const g = armed("gun", blaster, 2);
      tick(g, ["shoot"], ["shoot"]);
      runUntil(g, (h) => h.ammo === 0, ["shoot"]);
      tick(g);
      expect(g.hero.weapon).toBe(next);
      expect(count(g, "shot")).toBe(2);
    }
  });

  it("stops the beam while hidden", () => {
    const g = armed("blaster", cfg.blaster.ammo);
    tick(g, ["shoot"], ["shoot"]);
    run(g, 0.2, ["shoot"]);
    const before = count(g, "beam");
    run(g, 0.5, ["shoot", "hide"]);
    expect(g.hero.hidden).toBe(true);
    expect(count(g, "beam")).toBe(before);
  });

  it("keeps the blaster and its ammo on respawn", () => {
    const g = armed("blaster", 123);
    kill(g.hero);
    run(g, cfg.respawnMs / 1000 + 0.1);
    expect(g.hero).toMatchObject({ state: "idle", blaster: 123, weapon: "blaster" });
  });
});

describe("blaster pickup", () => {
  const spot = sandboxBlaster();
  const pickUpBlaster = (g: Game): void => {
    tick(g, ["down"]);
    runUntil(g, (h) => h.state === "idle");
  };

  it("kneels at the E-Blaster and takes it with full ammo, keeping the selected weapon", () => {
    for (const weapon of ["gun", "fists"] as const) {
      const g = armed(weapon, null);
      Object.assign(g.hero, spot);
      tick(g, ["down"]);
      expect(g.hero.state).toBe("kneel");
      runUntil(g, (h) => h.state === "idle");
      expect(g.hero).toMatchObject({ blaster: cfg.blaster.ammo, weapon });
      expect(g.world.subtitle?.text).toBe("Picked up E-Blaster");
    }
  });

  it("cannot take it again, not even after death and respawn", () => {
    const g = armed("gun", null);
    Object.assign(g.hero, spot);
    pickUpBlaster(g);
    g.hero.blaster = 5;
    tick(g, ["down"]);
    expect(g.hero.state).toBe("duck");
    kill(g.hero);
    run(g, cfg.respawnMs / 1000 + 0.1);
    Object.assign(g.hero, spot);
    tick(g, ["down"]);
    expect(g.hero).toMatchObject({ state: "duck", blaster: 5 });
    expect(count(g, "pickup")).toBe(1);
  });
});
