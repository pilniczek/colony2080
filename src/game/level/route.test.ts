import movementJson from "@config/hero/movement.json";
import { describe, expect, it } from "vitest";
import { loadMovement } from "../hero/config";
import { hitShootable } from "../shots";
import { loadMesto } from "./mesto";
import { route, type Ride } from "./reach";
import { pickUp, type Prop, type SandboxWorld } from "./sandboxLevel";
import { runUse } from "./tasks";

const cfg = loadMovement(movementJson);

type Step = { use: string } | { pick: string } | { shoot: string };

const ORDER: Step[] = [
  { use: "dyingRebel" },
  { pick: "crowbar" },
  { use: "wireBox" },
  { use: "switchboard" },
  { use: "trainDoor" },
  { use: "tapValveWheel" },
  { use: "corpse" },
  { use: "barDoor" },
  { shoot: "crashedShip" },
  { use: "crashedShip" },
  { use: "barDoor" },
  { use: "codeLock" },
  { pick: "controller" },
  { use: "damagedLift" },
  { use: "cardDoor" },
  { use: "acidTank" },
  { pick: "craneKey" },
  { use: "crane" },
];

const name = (step: Step): string => Object.entries(step)[0]!.join(" ");

function propOf(world: SandboxWorld, step: Step): Prop {
  const prop =
    "pick" in step
      ? world.props.find((p) => p.kind === "item" && p.item === step.pick && !p.taken)
      : world.props.find((p) => p.id === ("use" in step ? step.use : step.shoot));
  if (!prop) throw new Error(`no prop for ${name(step)}`);
  return prop;
}

function act(world: SandboxWorld, step: Step, prop: Prop): void {
  if ("pick" in step) {
    pickUp(world, prop.item!);
    prop.taken = true;
  } else if ("shoot" in step) {
    for (let hit = 0; hit < (prop.shootable?.hits ?? 0); hit++) hitShootable(world, prop);
  } else runUse(world, prop);
}

describe("mesto route", () => {
  it("completes mesto in one pickup and use order, each object reachable from the last by floors and lifts", () => {
    const world = loadMesto();
    const [x, y] = world.spawn;
    let at: Ride = { row: y, col: Math.floor(x), ys: world.lifts.map((l) => l.y) };
    const done: string[] = [];
    for (const step of ORDER) {
      const prop = propOf(world, step);
      const next = route(world, cfg, at, (r) => r.nodesAt(prop));
      expect(next, `reach ${name(step)} after ${done.join(", ")}`).not.toBeNull();
      at = next!;
      const flags = world.flags.size;
      const held = world.inventory.items.length;
      act(world, step, prop);
      expect(world.flags.size !== flags || world.inventory.items.length !== held, `${name(step)} does something`).toBe(true);
      done.push(name(step));
    }
    expect(world.complete).toBe(true);
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
