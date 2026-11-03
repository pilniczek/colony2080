import movementJson from "@config/hero/movement.json";
import { describe, expect, it } from "vitest";
import { loadMovement } from "../hero/config";
import { hitShootable } from "../shots";
import { loadMesto } from "./mesto";
import { loadMission } from "./missions";
import { reachable, reachOf, route, type Ride } from "./reach";
import { onGround, pickUp, showItem, type Prop, type SandboxWorld } from "./sandboxLevel";
import { openTask, runUse } from "./tasks";

const cfg = loadMovement(movementJson);

type Step = { use: string; with?: string } | { pick: string } | { shoot: string };

const ORDER: Step[] = [
  { use: "dyingRebel" },
  { pick: "crowbar" },
  { use: "wireBox" },
  { use: "switchboard", with: "wires" },
  { use: "trainDoor", with: "crowbar" },
  { use: "tapValveWheel" },
  { use: "corpse" },
  { use: "barDoor", with: "holoPlan" },
  { shoot: "crashedShip" },
  { pick: "shipPart" },
  { use: "barDoor", with: "shipPart" },
  { use: "codeLock", with: "decoder" },
  { pick: "controller" },
  { use: "damagedLift", with: "controller" },
  { use: "cardDoor", with: "card" },
  { use: "acidTank", with: "tapHandle" },
  { shoot: "shootGuard" },
  { pick: "craneKey" },
  { use: "crane", with: "craneKey" },
];

const VESNICE: Step[] = [
  { use: "fuseBox" },
  { pick: "smallKey" },
  { pick: "toaster" },
  { shoot: "radioGuard" },
  { pick: "walkieTalkie" },
  { use: "projectileCrate" },
  { use: "electricCabinet", with: "smallKey" },
  { use: "brokenTeleport" },
  { use: "targetTeleport", with: "navCircuit" },
  { use: "fuseBox", with: "fuse" },
  { use: "bridgeGuardPost", with: "walkieTalkie" },
  { pick: "dynamite" },
  { pick: "detonator" },
  { use: "cannon", with: "projectile" },
  { use: "dynamiteWall", with: "dynamite" },
  { use: "dynamiteWall", with: "detonator" },
];

const name = (step: Step): string => Object.entries(step).map((e) => e.join(" ")).join(" ");

function propOf(world: SandboxWorld, step: Step): Prop {
  const prop =
    "pick" in step
      ? world.props.find((p) => ((p.kind === "item" && p.item === step.pick) || (p.kind === "weapon" && p.asset === step.pick)) && onGround(p, { blaster: null }, world.flags))
      : world.props.find((p) => p.id === ("use" in step ? step.use : step.shoot));
  if (!prop) throw new Error(`no prop for ${name(step)}`);
  return prop;
}

function act(world: SandboxWorld, step: Step, prop: Prop): void {
  if ("pick" in step) {
    if (prop.item) pickUp(world, prop.item);
    prop.taken = true;
  } else if ("shoot" in step) {
    for (let hit = 0; hit < (prop.shootable?.hits ?? 0); hit++) hitShootable(world, prop);
  } else {
    if (step.with) showItem(world, step.with);
    expect(world.inventory.shown, name(step)).toBe(step.with ?? world.inventory.shown);
    runUse(world, prop);
  }
}

function walkThrough(world: SandboxWorld, order: Step[]): void {
  const [x, y] = world.spawn;
  let at: Ride = { row: y, col: Math.floor(x), ys: world.lifts.map((l) => l.y) };
  const done: string[] = [];
  for (const step of order) {
    const prop = propOf(world, step);
    const next = route(world, cfg, at, (r) => r.nodesAt(prop));
    expect(next, `reach ${name(step)} after ${done.join(", ")}`).not.toBeNull();
    at = next!;
    const before = [world.flags.size, world.inventory.items.length, prop.taken, prop.state].join();
    act(world, step, prop);
    expect([world.flags.size, world.inventory.items.length, prop.taken, prop.state].join() !== before, `${name(step)} does something`).toBe(true);
    done.push(name(step));
  }
  expect(world.complete).toBe(true);
}

describe("mesto route", () => {
  it("completes mesto in one pickup and use order, each object reachable from the last by floors and lifts", () => {
    walkThrough(loadMesto(), ORDER);
  });

  it("reaches the E-Blaster once the metro is open", () => {
    const world = loadMesto();
    const [x, y] = world.spawn;
    const at: Ride = { row: y, col: Math.floor(x), ys: world.lifts.map((l) => l.y) };
    const blaster = world.props.find((p) => p.kind === "weapon")!;
    expect(route(world, cfg, at, (r) => r.nodesAt(blaster))).toBeNull();
    pickUp(world, "wires");
    runUse(world, world.props.find((p) => p.id === "switchboard")!);
    pickUp(world, "crowbar");
    runUse(world, world.props.find((p) => p.id === "trainDoor")!);
    expect(route(world, cfg, at, (r) => r.nodesAt(blaster))).not.toBeNull();
  });

  it("keeps the metro west side, the controller and the floors above the damaged lift out of reach at the start", () => {
    const world = loadMesto();
    const [x, y] = world.spawn;
    const at: Ride = { row: y, col: Math.floor(x), ys: world.lifts.map((l) => l.y) };
    const reachable = (id: string): boolean => {
      const prop = world.props.find((p) => p.id === id || p.item === id)!;
      return route(world, cfg, at, (r) => r.nodesAt(prop)) !== null;
    };
    expect(["tapValveWheel", "corpse", "controller", "cardDoor", "acidTank", "craneKey", "crane"].filter(reachable)).toEqual([]);
    expect(["dyingRebel", "crowbar", "wireBox", "switchboard", "barDoor", "codeLock", "damagedLift"].every(reachable)).toBe(true);
  });
});

describe("vesnice route", () => {
  it("completes vesnice in one pickup and use order, each object reachable from the last by floors, lifts and teleports", () => {
    walkThrough(loadMission("vesnice"), VESNICE);
  });

  it("keeps the fuse until the teleport is repaired, then fits it and links the teleports", () => {
    const world = loadMission("vesnice");
    const prop = (id: string) => world.props.find((p) => p.id === id)!;
    runUse(world, prop("fuseBox"));
    pickUp(world, "fuse");
    pickUp(world, "navCircuit");
    showItem(world, "fuse");
    runUse(world, prop("fuseBox"));
    expect(world.subtitle?.text).toBe("The power can't come back yet. The teleport has to work first.");
    expect(prop("fuseBox").state).toBe(1);
    expect(world.inventory.items).toContain("fuse");
    showItem(world, "navCircuit");
    runUse(world, prop("targetTeleport"));
    expect(world.flags.has("flag:teleportLinked")).toBe(false);
    showItem(world, "fuse");
    runUse(world, prop("fuseBox"));
    expect([...world.flags].filter((f) => ["flag:powerOn", "flag:teleportRepaired", "flag:teleportLinked"].includes(f)).sort()).toEqual(["flag:powerOn", "flag:teleportLinked", "flag:teleportRepaired"]);
    expect(world.inventory.items).not.toContain("fuse");
    expect(world.inventory.items).not.toContain("navCircuit");
    for (const id of ["fuseBox", "targetTeleport"]) {
      runUse(world, prop(id));
      expect(world.subtitle?.text, id).toBe("Nothing more to do here.");
    }
  });

  it("reaches the level end from every state any order of uses can reach", () => {
    const fresh = loadMission("vesnice");
    const [x, y] = fresh.spawn;
    const replay = (done: Step[]): SandboxWorld => {
      const world = loadMission("vesnice");
      for (const step of done) act(world, step, propOf(world, step));
      return world;
    };
    const runs = (world: SandboxWorld, step: Step, prop: Prop): boolean => {
      if ("pick" in step) return onGround(prop, { blaster: null }, world.flags);
      if ("shoot" in step) return !!prop.shootable && (prop.state ?? 0) !== prop.shootable.state;
      if (step.with && !world.inventory.items.includes(step.with)) return false;
      const shown = world.inventory.shown;
      if (step.with) showItem(world, step.with);
      const task = openTask(world, prop);
      world.inventory.shown = shown;
      return task !== undefined;
    };
    const propFor = (world: SandboxWorld, step: Step): Prop | undefined =>
      world.props.find((p) => ("pick" in step ? (p.item ?? p.asset) === step.pick : p.id === ("use" in step ? step.use : step.shoot)));
    const seen = new Map<string, boolean>();
    const finishes = (done: Step[], at: Ride): boolean => {
      const world = replay(done);
      if (world.complete) return true;
      const area = reachable(world, cfg, at);
      const key = `${done.map(name).sort().join(";")}@${[...area.keys()].sort().join(";")}`;
      const known = seen.get(key);
      if (known !== undefined) return known;
      seen.set(key, true);
      const r = reachOf(world, cfg);
      let moved = false;
      let ok = true;
      for (const step of VESNICE.filter((s) => !done.includes(s))) {
        const prop = propFor(world, step);
        const next = prop && r.nodesAt(prop).map((n) => area.get(n)).find((ride) => ride !== undefined);
        if (!prop || !next || !runs(world, step, prop)) continue;
        moved = true;
        if (!finishes([...done, step], next)) ok = false;
      }
      seen.set(key, moved && ok);
      return moved && ok;
    };
    expect(finishes([], { row: y, col: Math.floor(x), ys: fresh.lifts.map((l) => l.y) })).toBe(true);
  }, 600000);

  it("opens the bridge gap while the power is off, so the hero falls into the bridgeGap hazard", () => {
    const world = loadMission("vesnice");
    expect(world.grid.oneWay(50, 41)).toBe(true);
    runUse(world, world.props.find((p) => p.id === "fuseBox")!);
    for (let col = 45; col <= 56; col++) expect(world.grid.oneWay(col, 41), `${col}`).toBe(false);
    expect(world.grid.oneWay(44, 41)).toBe(true);
    expect(world.hazards.find((h) => h.id === "bridgeGap")).toMatchObject({ kind: "death", row: 41 });
  });
});
