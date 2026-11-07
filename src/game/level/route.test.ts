import movementJson from "@config/hero/movement.json";
import { describe, expect, it } from "vitest";
import { loadMovement } from "../hero/config";
import { hitShootable } from "../shots";
import { loadMesto } from "./mesto";
import { loadMission } from "./missions";
import { id, reachable, reachOf, route, type Ride } from "./reach";
import { onGround, pickUp, showItem, stepApproaches, type Prop, type SandboxWorld } from "./sandboxLevel";
import { openTask, runUse } from "./tasks";
import { openGraph } from "./testMissions";

const cfg = loadMovement(movementJson);

type Spot = [number, number];

type Step = { use: string; with?: string } | { pick: string } | { shoot: string; from?: Spot } | { punch: string; from: Spot } | { approach: string };

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

const JESKYNE: Step[] = [
  { use: "bankLever2" },
  { use: "bankLever3" },
  { use: "bankLever4" },
  { pick: "rod" },
  { use: "liftLock", with: "rod" },
  { shoot: "stalactite", from: [58, 20] },
  { pick: "entryCard" },
  { use: "caveCardDoor", with: "entryCard" },
  { approach: "exitAirlock" },
];

const JESKYNE_KEYS: Step[] = [
  ...JESKYNE.slice(0, 6),
  { punch: "stoneBlocks", from: [83, 23] },
  { pick: "orangeKey" },
  { shoot: "explosiveTank", from: [99, 21] },
  { pick: "blueKey" },
  { use: "doorLever3" },
  { pick: "yellowKey" },
  { use: "doorLever4" },
  { use: "keySlots", with: "yellowKey" },
  { use: "keySlots", with: "orangeKey" },
  { use: "keySlots", with: "blueKey" },
  ...JESKYNE.slice(6),
];

const name = (step: Step): string => Object.entries(step).map((e) => e.join(" ")).join(" ");

const targetOf = (step: Step, prop: Prop): Prop => ("from" in step && step.from ? { kind: "spot", x: step.from[0], y: step.from[1] } : prop);

const idOf = (step: Step): string | undefined =>
  "use" in step ? step.use : "shoot" in step ? step.shoot : "punch" in step ? step.punch : "approach" in step ? step.approach : undefined;

function propOf(world: SandboxWorld, step: Step): Prop {
  const prop =
    "pick" in step
      ? world.props.find((p) => ((p.kind === "item" && p.item === step.pick) || (p.kind === "weapon" && p.asset === step.pick)) && onGround(p, { blaster: null }, world.flags))
      : world.props.find((p) => p.id === idOf(step));
  if (!prop) throw new Error(`no prop for ${name(step)}`);
  return prop;
}

function act(world: SandboxWorld, step: Step, prop: Prop): void {
  if ("pick" in step) {
    if (prop.item) pickUp(world, prop.item);
    prop.taken = true;
  } else if ("shoot" in step || "punch" in step) {
    for (let hit = 0; hit < (prop.shootable?.hits ?? 0); hit++) hitShootable(world, prop, "punch" in step ? "punch" : "shot");
  } else if ("approach" in step) {
    stepApproaches(world, { x: prop.x, y: prop.y! }, cfg.box.height);
  } else {
    if (step.with) showItem(world, step.with);
    expect(world.inventory.shown, name(step)).toBe(step.with ?? world.inventory.shown);
    runUse(world, prop);
  }
}

function runs(world: SandboxWorld, step: Step, prop: Prop): boolean {
  if ("pick" in step) return onGround(prop, { blaster: null }, world.flags);
  if ("shoot" in step || "punch" in step) return !!prop.shootable && (prop.state ?? 0) !== prop.shootable.state && onGround(prop, { blaster: null }, world.flags);
  if ("approach" in step) return !!prop.approach && !world.flags.has(prop.approach.gives);
  if (prop.toggle) return (prop.state ?? 0) === 0;
  if (step.with && !world.inventory.items.includes(step.with)) return false;
  const shown = world.inventory.shown;
  if (step.with) showItem(world, step.with);
  const task = openTask(world, prop);
  world.inventory.shown = shown;
  return task !== undefined;
}

function finishesInEveryOrder(mission: "vesnice" | "jeskyne", order: Step[]): boolean {
  const fresh = loadMission(mission);
  const [x, y] = fresh.spawn;
  const replay = (done: Step[]): SandboxWorld => {
    const world = loadMission(mission);
    for (const step of done) act(world, step, propOf(world, step));
    return world;
  };
  const propFor = (world: SandboxWorld, step: Step): Prop | undefined => world.props.find((p) => ("pick" in step ? (p.item ?? p.asset) === step.pick : p.id === idOf(step)));
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
    for (const step of order.filter((s) => !done.includes(s))) {
      const prop = propFor(world, step);
      const next = prop && r.nodesAt(targetOf(step, prop)).map((n) => area.get(n)).find((ride) => ride !== undefined);
      if (!prop || !next || !runs(world, step, prop)) continue;
      moved = true;
      if (!finishes([...done, step], next)) ok = false;
    }
    seen.set(key, moved && ok);
    return moved && ok;
  };
  return finishes([], { row: y, col: Math.floor(x), ys: fresh.lifts.map((l) => l.y) });
}

function walkThrough(world: SandboxWorld, order: Step[]): void {
  const [x, y] = world.spawn;
  let at: Ride = { row: y, col: Math.floor(x), ys: world.lifts.map((l) => l.y) };
  const done: string[] = [];
  for (const step of order) {
    const prop = propOf(world, step);
    const next = route(world, cfg, at, (r) => r.nodesAt(targetOf(step, prop)));
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
    expect(finishesInEveryOrder("vesnice", VESNICE)).toBe(true);
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

function walkGenerous(world: SandboxWorld, order: Step[]): void {
  let at: Prop = { kind: "spot", x: world.spawn[0], y: world.spawn[1] };
  const done: string[] = [];
  for (const step of order) {
    const prop = propOf(world, step);
    const { r, g } = openGraph(world);
    const area = r.reach(g, r.nodesAt(at)[0]!);
    const target = targetOf(step, prop);
    expect(r.nodesAt(target).some((n) => area.has(n)), `reach ${name(step)} after ${done.join(", ")}`).toBe(true);
    at = target;
    act(world, step, prop);
    done.push(name(step));
  }
  expect(world.complete).toBe(true);
}

describe("jeskyne route", () => {
  const prop = (world: SandboxWorld, id: string): Prop => world.props.find((p) => p.id === id)!;

  it("completes jeskyne in one pickup and use order, each object reachable from the last by floors and lifts", () => {
    walkThrough(loadMission("jeskyne"), JESKYNE);
  });

  it("reaches the level end from every state any order of uses can reach", () => {
    expect(finishesInEveryOrder("jeskyne", JESKYNE)).toBe(true);
  }, 600000);

  it("completes jeskyne the long way round: three keys open the key doors, running jumps cross the chasm", () => {
    walkGenerous(loadMission("jeskyne"), JESKYNE_KEYS);
  });

  it("opens the way from the key doors down to floor 51 only with all three keys in the slots", () => {
    const world = loadMission("jeskyne");
    for (const lever of ["bankLever2", "bankLever3", "bankLever4"]) runUse(world, prop(world, lever));
    const slots: Ride = { row: 37, col: 59, ys: world.lifts.map((l) => (l.x === 72 ? 37 : l.y)) };
    const floor51 = (r: ReturnType<typeof reachOf>) => r.runs.filter((run) => run.row === 51 && run.col === 71).map(id);
    world.flags.add("flag:liftLock");
    hitShootable(world, prop(world, "stalactite"));
    expect(route(world, cfg, slots, floor51)).toBeNull();
    for (const key of ["yellowKey", "orangeKey", "blueKey"] as const) {
      pickUp(world, key);
      showItem(world, key);
      runUse(world, prop(world, "keySlots"));
    }
    expect(prop(world, "keyDoors").state).toBe(2);
    expect(world.inventory.items).toEqual([]);
    expect(route(world, cfg, slots, floor51)).not.toBeNull();
  });

  it("opens lever door 1 only with the leftmost lever down and the three right ones up", () => {
    const world = loadMission("jeskyne");
    const door = prop(world, "leverDoor1");
    for (const lever of ["bankLever2", "bankLever3", "bankLever4"]) runUse(world, prop(world, lever));
    expect(door.state).toBe(2);
    expect(world.grid.solid(26, 19)).toBe(false);
    runUse(world, prop(world, "bankLever1"));
    expect(door.state).toBe(0);
    expect(world.grid.solid(26, 19)).toBe(true);
  });

  it("warns before the drop from floor 28 only without the rod", () => {
    const world = loadMission("jeskyne");
    const edge = prop(world, "dropWarning");
    pickUp(world, "rod");
    stepApproaches(world, { x: edge.x, y: edge.y! }, cfg.box.height);
    expect(world.subtitle).toBeNull();
    const bare = loadMission("jeskyne");
    stepApproaches(bare, { x: edge.x, y: edge.y! - 0.5 }, cfg.box.height);
    expect(bare.subtitle?.text).toBe(edge.approach!.subtitle);
  });

  it("shows the explosive tank and its blocker only once the stalactite falls on the crystal", () => {
    const world = loadMission("jeskyne");
    expect(world.grid.solid(103, 19)).toBe(false);
    expect(world.grid.solid(63, 27)).toBe(true);
    hitShootable(world, prop(world, "stalactite"));
    expect(prop(world, "crystal").state).toBe(1);
    expect(world.grid.solid(63, 27)).toBe(false);
    expect(world.grid.solid(103, 19)).toBe(true);
  });
});
