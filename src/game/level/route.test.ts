import movementJson from "@config/hero/movement.json";
import { describe, expect, it } from "vitest";
import { loadMovement } from "../hero/config";
import { hitShootable } from "../shots";
import { loadMesto } from "./mesto";
import { loadMission } from "./missions";
import { route, type Ride } from "./reach";
import { onGround, pickUp, showItem, type Prop, type SandboxWorld } from "./sandboxLevel";
import type { ItemId } from "../items";
import { runUse } from "./tasks";

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
  { use: "smoulderingRemains" },
  { pick: "toaster" },
  { shoot: "bridgeGuard" },
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

  it("fits the fuse before the teleport repair as in the original, linking the teleports only once both are done", () => {
    for (const fuseFirst of [true, false]) {
      const world = loadMission("vesnice");
      const prop = (id: string) => world.props.find((p) => p.id === id)!;
      runUse(world, prop("fuseBox"));
      pickUp(world, "fuse");
      pickUp(world, "navCircuit");
      const steps: [string, ItemId][] = [["fuseBox", "fuse"], ["targetTeleport", "navCircuit"]];
      for (const [id, item] of fuseFirst ? steps : steps.reverse()) {
        expect(world.flags.has("flag:teleportLinked"), `${id} before`).toBe(false);
        showItem(world, item);
        runUse(world, prop(id));
      }
      expect([...world.flags].filter((f) => ["flag:powerOn", "flag:teleportRepaired", "flag:teleportLinked"].includes(f)).sort()).toEqual(["flag:powerOn", "flag:teleportLinked", "flag:teleportRepaired"]);
      expect(world.inventory.items).not.toContain("fuse");
      expect(world.inventory.items).not.toContain("navCircuit");
      for (const id of ["fuseBox", "targetTeleport"]) {
        runUse(world, prop(id));
        expect(world.subtitle?.text, id).toBe("Nothing more to do here.");
      }
    }
  });

  it("opens the bridge gap while the power is off, so the hero falls into the bridgeGap hazard", () => {
    const world = loadMission("vesnice");
    expect(world.grid.oneWay(50, 41)).toBe(true);
    runUse(world, world.props.find((p) => p.id === "fuseBox")!);
    for (let col = 45; col <= 56; col++) expect(world.grid.oneWay(col, 41), `${col}`).toBe(false);
    expect(world.grid.oneWay(44, 41)).toBe(true);
    expect(world.hazards.find((h) => h.id === "bridgeGap")).toMatchObject({ kind: "death", row: 41 });
  });
});
