import { describe, expect, it } from "vitest";
import { damage, kill } from "./hero";
import { cfg, game, run, runUntil, RUNNING, tick, type Game } from "./testWorld";

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
  it("hides on the press frame while held and steps out on release", () => {
    const g = game();
    tick(g, ["hide"]);
    expect(g.hero).toMatchObject({ state: "hide", hidden: true });
    run(g, 1, ["hide"]);
    expect(g.hero).toMatchObject({ state: "hide", hidden: true });
    tick(g);
    expect(g.hero).toMatchObject({ state: "idle", hidden: false });
  });

  it("hides at once from walk or run with the arrow still held and walks on after release", () => {
    for (const running of [false, true]) {
      const g = game({ x: 10.5, y: 14 });
      g.hero.running = running;
      run(g, 0.3, ["moveRight"]);
      tick(g, ["moveRight", "hide"]);
      expect(g.hero).toMatchObject({ state: "hide", hidden: true });
      const x = g.hero.x;
      run(g, 0.5, ["moveRight", "hide"]);
      expect(g.hero).toMatchObject({ state: "hide", x });
      tick(g, ["moveRight"]);
      tick(g, ["moveRight"]);
      expect(g.hero.state).toBe(running ? "run" : "walk");
    }
  });

  it("hides at once while shooting and stops the fire", () => {
    for (const held of [["shoot"], ["shoot", "moveRight"]]) {
      const g = game({ x: 10.5, y: 14, weapon: "gun" });
      tick(g, held, ["shoot"]);
      run(g, 0.3, held);
      tick(g, [...held, "hide"]);
      expect(g.hero).toMatchObject({ state: "hide", hidden: true, fireTime: null });
      const fired = g.events.filter((e) => e.kind === "shot").length;
      run(g, 0.5, [...held, "hide"]);
      expect(g.events.filter((e) => e.kind === "shot")).toHaveLength(fired);
    }
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
    expect(g.hero.hitAge).not.toBeNull();
    expect([...g.seen]).toEqual(["idle"]);
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

describe("dead body", () => {
  const lethal = (g: Game) => {
    g.hero.energy = cfg.energy.hit;
    g.events.push(...damage(g.hero, cfg));
  };

  it("falls to the floor when killed mid-jump", () => {
    const g = game();
    tick(g, [], ["up"]);
    run(g, 0.2);
    expect(g.hero.onGround).toBe(false);
    lethal(g);
    run(g, 1);
    expect(g.hero).toMatchObject({ state: "jumpDeath", y: 14, onGround: true, vx: 0 });
    expect(kinds(g, "died")).toHaveLength(1);
  });

  it("keeps flying when killed in a running jump, then slides to rest", () => {
    const g = game({ x: 3, y: 14 });
    run(g, 0.3, ["moveRight", RUNNING]);
    tick(g, ["moveRight", RUNNING], ["up"]);
    run(g, 0.1, ["moveRight", RUNNING]);
    const vx = g.hero.vx;
    lethal(g);
    expect(g.hero.state).toBe("jumpDeath");
    tick(g);
    expect(g.hero.vx).toBe(vx);
    runUntil(g, (h) => h.onGround);
    const landX = g.hero.x;
    run(g, cfg.deathSlide * 0.5);
    expect(g.hero.vx).toBeGreaterThan(0);
    expect(g.hero.vx).toBeLessThan(vx);
    run(g, cfg.deathSlide);
    expect(g.hero.vx).toBe(0);
    expect(g.hero.x - landX).toBeGreaterThan(0.3);
    expect(g.hero.x - landX).toBeLessThan((vx * cfg.deathSlide) / 2 + 0.01);
  });

  it("rides a moving lift", () => {
    const g = game({ x: 18.5, y: 14 });
    tick(g);
    tick(g, [], ["up"]);
    run(g, 0.5);
    lethal(g);
    run(g, 1.4);
    expect(g.hero.state).toBe("death");
    expect(g.hero.y).toBeCloseTo(g.world.lift.y, 6);
    expect(g.world.lift.y).toBeLessThan(10);
    expect(kinds(g, "died")).toHaveLength(1);
  });

  it("falls off the ladder", () => {
    const g = game({ x: 3.4, y: 14 });
    tick(g, [], ["up"]);
    run(g, 2, ["up"]);
    expect(g.hero.state).toBe("ladder");
    lethal(g);
    run(g, 1);
    expect(g.hero).toMatchObject({ state: "death", y: 14, onGround: true });
    expect(kinds(g, "died")).toHaveLength(1);
  });

  it("stops below the pit and still respawns", () => {
    const g = game({ x: 29.5, y: 14 });
    runUntil(g, (h) => h.state === "fallDeath");
    run(g, 1);
    expect(g.hero.y).toBe(g.world.grid.height + 2);
    expect(kinds(g, "died")).toHaveLength(1);
    run(g, 1.1);
    expect(g.hero.state).toBe("idle");
  });
});

describe("kill", () => {
  it("kills a hidden hero", () => {
    const g = hidden();
    expect(kill(g.hero).map((e) => e.kind)).toEqual(["died"]);
    expect(g.hero).toMatchObject({ state: "death", energy: 0 });
  });

  it("ignores a dead hero", () => {
    const g = game();
    kill(g.hero);
    expect(kill(g.hero)).toEqual([]);
  });
});

describe("damage", () => {
  it("is ignored while hidden", () => {
    const g = hidden();
    expect(damage(g.hero, cfg)).toEqual([]);
    expect(g.hero.energy).toBe(100);
  });

  it("keeps the state and starts hitAge, then death with died after four hits, then respawns", () => {
    const g = game();
    run(g, 0.5);
    const events = [damage(g.hero, cfg), damage(g.hero, cfg), damage(g.hero, cfg)].flat();
    expect(g.hero.state).toBe("idle");
    expect(g.hero.hitAge).toBe(0);
    expect(events).toEqual([]);
    expect(damage(g.hero, cfg).map((e) => e.kind)).toEqual(["died"]);
    expect(g.hero.state).toBe("death");
    expect(g.hero.energy).toBe(0);
    run(g, cfg.respawnMs / 1000 + 0.1);
    expect(g.hero.state).toBe("idle");
    expect(g.hero.energy).toBe(cfg.energy.max);
    expect(g.hero.hitAge).toBeNull();
  });

  it("keeps a lethal fall lethal when hit mid-fall", () => {
    const g = game({ x: 22, y: 4 });
    runUntil(g, (h) => h.state === "fall", ["moveRight"]);
    runUntil(g, (h) => h.y > 8);
    damage(g.hero, cfg);
    expect(g.hero.state).toBe("fall");
    expect(g.hero.energy).toBe(75);
    runUntil(g, (h) => h.onGround);
    expect(g.hero.state).toBe("fallDeath");
  });

  it("ages the hit with every update across state changes and a holster", () => {
    const g = game({ x: 7.5, y: 14, weapon: "gun" });
    run(g, 0.2, ["moveRight"]);
    damage(g.hero, cfg);
    run(g, 0.1, ["moveRight"]);
    tick(g);
    expect(g.hero.state).toBe("idle");
    tick(g, [], ["weapon2"]);
    expect(g.hero.state).toBe("weaponSwitch");
    run(g, 0.2);
    expect(g.hero.hitAge).toBeCloseTo(20 / 60, 9);
  });

  const committed: [string, () => Game, string[]][] = [
    ["punch", () => { const g = game(); tick(g, ["shoot"], ["shoot"]); run(g, 0.1, ["shoot"]); return g; }, ["shoot"]],
    ["gun fire", () => { const g = game({ x: 7.5, y: 14, weapon: "gun" }); tick(g, ["shoot"], ["shoot"]); run(g, 0.1, ["shoot"]); return g; }, ["shoot"]],
    ["jump", () => { const g = game(); tick(g, [], ["up"]); run(g, 0.1); return g; }, []],
    ["ladder", () => { const g = game({ x: 3.4, y: 14 }); tick(g, [], ["up"]); run(g, 0.5, ["up"]); return g; }, ["up"]],
    ["use", () => { const g = game({ x: 21.5, y: 14 }); tick(g, [], ["useItem"]); run(g, 0.1); return g; }, []],
    ["runJump", () => { const g = game({ x: 7.5, y: 14, state: "run" }); tick(g, ["moveRight", RUNNING], ["up"]); run(g, 0.1); return g; }, []],
    ["kneel", () => { const g = game({ x: 9.5, y: 14 }); tick(g, ["down"]); run(g, 0.3); return g; }, []],
  ];

  for (const [name, start, held] of committed) {
    it(`never interrupts ${name}`, () => {
      const plain = start();
      const g = start();
      const { state, time } = g.hero;
      damage(g.hero, cfg);
      expect(g.hero).toMatchObject({ state, time, hitAge: 0, energy: 75 });
      for (let i = 0; i < 30; i++) {
        tick(plain, held);
        tick(g, held);
        const { state: s, time: t, x, y, vx, vy } = plain.hero;
        expect(g.hero).toMatchObject({ state: s, time: t, x, y, vx, vy });
      }
      expect(kinds(g, "shot")).toEqual(kinds(plain, "shot"));
      expect(kinds(g, "punch")).toEqual(kinds(plain, "punch"));
      expect(kinds(g, "pickup")).toEqual(kinds(plain, "pickup"));
    });
  }
});

describe("attack", () => {
  it("walks both ways while shooting the gun without a break in the fire", () => {
    const plain = game({ x: 10.5, y: 14, weapon: "gun" });
    tick(plain, ["shoot"], ["shoot"]);
    run(plain, 59 / 60, ["shoot"]);
    const g = game({ x: 10.5, y: 14, weapon: "gun" });
    tick(g, ["shoot"], ["shoot"]);
    run(g, 0.3, ["shoot"]);
    tick(g, ["shoot", "moveLeft"]);
    expect(g.hero).toMatchObject({ state: "walk", facing: -1 });
    run(g, 0.2, ["shoot", "moveLeft"]);
    expect(g.hero.x).toBeLessThan(10.5);
    tick(g, ["shoot", "moveRight"]);
    expect(g.hero).toMatchObject({ state: "walk", facing: 1 });
    run(g, 0.2, ["shoot", "moveRight"]);
    tick(g, ["shoot"]);
    expect(g.hero.state).toBe("attack");
    run(g, 59 / 60 - 0.7 - 3 / 60, ["shoot"]);
    expect(kinds(g, "shot")).toHaveLength(kinds(plain, "shot").length);
  });

  it("starts shooting while walking without stopping", () => {
    const g = game({ x: 10.5, y: 14, weapon: "gun" });
    run(g, 0.3, ["moveRight"]);
    const x = g.hero.x;
    tick(g, ["moveRight", "shoot"], ["shoot"]);
    expect(g.hero.state).toBe("walk");
    expect(kinds(g, "shot")).toHaveLength(1);
    run(g, 59 / 60, ["moveRight", "shoot"]);
    expect(g.hero.state).toBe("walk");
    expect(g.hero.x - x).toBeGreaterThan(0.5);
    expect(kinds(g, "shot")).toHaveLength(12);
  });

  it("shoots while running", () => {
    const g = game({ x: 7.5, y: 14, weapon: "gun" });
    g.hero.running = true;
    run(g, 0.3, ["moveRight"]);
    tick(g, ["moveRight", "shoot"], ["shoot"]);
    run(g, 0.5, ["moveRight", "shoot"]);
    expect(g.hero.state).toBe("run");
    expect(kinds(g, "shot").length).toBeGreaterThan(5);
  });

  it("stops shooting on release and keeps walking", () => {
    const g = game({ x: 10.5, y: 14, weapon: "gun" });
    tick(g, ["moveRight", "shoot"], ["shoot"]);
    run(g, 0.3, ["moveRight", "shoot"]);
    const fired = kinds(g, "shot").length;
    run(g, 0.5, ["moveRight"]);
    expect(g.hero).toMatchObject({ state: "walk", fireTime: null });
    expect(kinds(g, "shot")).toHaveLength(fired);
  });

  it("turns in place while duck shooting", () => {
    const g = game({ x: 10.5, y: 14, weapon: "gun" });
    run(g, 0.5, ["down"]);
    tick(g, ["down", "shoot"], ["shoot"]);
    tick(g, ["down", "shoot", "moveLeft"]);
    expect(g.hero).toMatchObject({ state: "duckAttack", facing: -1, x: 10.5 });
  });

  it("jumps on Up while shooting and keeps the fire cadence in the air and after landing", () => {
    const plain = game({ x: 10.5, y: 14, weapon: "gun" });
    tick(plain, ["shoot"], ["shoot"]);
    run(plain, 1.5, ["shoot"]);
    const g = game({ x: 10.5, y: 14, weapon: "gun" });
    tick(g, ["shoot"], ["shoot"]);
    run(g, 0.2, ["shoot"]);
    tick(g, ["shoot"], ["up"]);
    expect(g.hero.state).toBe("standJump");
    const seen = new Set<string>();
    for (let i = 0; i < 1.5 * 60 - 13; i++) {
      tick(g, ["shoot"]);
      seen.add(g.hero.state);
    }
    expect(seen.has("standJump")).toBe(true);
    expect(g.hero.state).toBe("attack");
    expect(kinds(g, "shot")).toHaveLength(kinds(plain, "shot").length);
  });

  it("starts firing in the air on a shoot press and stops on release", () => {
    const g = game({ x: 10.5, y: 14, weapon: "gun" });
    tick(g, [], ["up"]);
    tick(g, ["shoot"], ["shoot"]);
    expect(g.hero.state).toBe("standJump");
    expect(kinds(g, "shot")).toHaveLength(1);
    expect(g.world.projectiles.filter((p) => p.tag === "hero")).toHaveLength(1);
    run(g, 0.2, ["shoot"]);
    const fired = kinds(g, "shot").length;
    expect(fired).toBeGreaterThan(1);
    run(g, 2);
    expect(kinds(g, "shot")).toHaveLength(fired);
    expect(g.hero.state).toBe("idle");
  });

  it("shoots during a running jump and lands running and shooting", () => {
    const g = game({ x: 7.5, y: 14, state: "run", weapon: "gun" });
    tick(g, ["moveRight", RUNNING], ["up"]);
    tick(g, ["moveRight", "shoot"], ["shoot"]);
    expect(g.hero.state).toBe("runJump");
    expect(g.hero.vx).toBeCloseTo(cfg.jump.runSpeed, 9);
    runUntil(g, (h) => h.onGround, ["moveRight", "shoot"]);
    expect(g.hero.state).toBe("run");
    expect(g.hero.fireTime).not.toBeNull();
    expect(kinds(g, "shot").length).toBeGreaterThan(3);
  });

  it("duck jumps on Up while duck shooting", () => {
    const g = game({ x: 10.5, y: 14, weapon: "gun" });
    run(g, 0.5, ["down"]);
    tick(g, ["down", "shoot"], ["shoot"]);
    tick(g, ["down", "shoot"], ["up"]);
    expect(g.hero.state).toBe("duckJump");
  });

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

  it("starts attack on the landing frame from a shoot press just before touchdown", () => {
    const g = game();
    tick(g, [], ["up"]);
    runUntil(g, (h) => h.vy > 0 && h.y > 13.7);
    tick(g, [], ["shoot"]);
    expect(g.hero.state).toBe("standJump");
    runUntil(g, (h) => h.onGround);
    expect(g.hero.state).toBe("attack");
    expect(g.hero.time).toBe(0);
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
    expect(g.hero).toMatchObject({ state: "walk", facing: -1 });
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
