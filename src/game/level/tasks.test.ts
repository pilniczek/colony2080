import tasksJson from "@config/levels/mesto/tasks.json";
import { describe, expect, it } from "vitest";
import { cfg, objectLevel } from "../hero/testWorld";
import { loadSandbox, pickUp, resetWorld, showItem, useShown, type SandboxWorld } from "./sandboxLevel";
import { loadMesto } from "./mesto";
import { loadTasks, pickAll, runUse } from "./tasks";

const world = (): SandboxWorld => loadSandbox(objectLevel);
const prop = (w: SandboxWorld, id: string) => w.props.find((p) => p.id === id)!;
const use = (w: SandboxWorld, id: string) => runUse(w, prop(w, id));

describe("inventory", () => {
  it("uses the shown item and shows the one picked before", () => {
    const w = world();
    pickUp(w, "wires");
    pickUp(w, "crowbar");
    expect(useShown(w)).toBe("crowbar");
    expect(w.inventory).toEqual({ items: ["wires"], shown: "wires" });
    expect(useShown(w)).toBe("wires");
    expect(w.inventory).toEqual({ items: [], shown: null });
    expect(useShown(w)).toBeNull();
  });

  it("uses the shown item, wherever it sits", () => {
    const w = world();
    pickUp(w, "wires");
    pickUp(w, "crowbar");
    pickUp(w, "card");
    showItem(w, "wires");
    expect(useShown(w)).toBe("wires");
    expect(w.inventory).toEqual({ items: ["crowbar", "card"], shown: "card" });
  });

  it("never holds an item twice", () => {
    const w = world();
    pickUp(w, "wires");
    pickUp(w, "crowbar");
    pickUp(w, "wires");
    expect(w.inventory).toEqual({ items: ["wires", "crowbar"], shown: "wires" });
  });

  it("picks every item of the mission once: ground, hidden and task items", () => {
    const w = loadMesto();
    const expected = [
      ...w.props.filter((p) => p.kind === "item").map((p) => p.item!),
      ...w.tasks.flatMap((t) => t.gives).filter((t) => t.startsWith("item:")).map((t) => t.slice(5)),
    ];
    expect(pickAll(w)).toBe(new Set(expected).size);
    expect(new Set(w.inventory.items)).toEqual(new Set(expected));
    expect(w.inventory.items).toContain("wires");
    expect(w.props.filter((p) => p.kind === "item").every((p) => p.taken)).toBe(true);
    expect(w.props.filter((p) => p.kind === "weapon").some((p) => p.taken)).toBe(false);
    expect(pickAll(w)).toBe(0);
    expect(w.inventory.items).toHaveLength(new Set(expected).size);
  });

  it("shows any held item without reordering", () => {
    const w = world();
    pickUp(w, "wires");
    pickUp(w, "crowbar");
    showItem(w, "wires");
    expect(w.inventory).toEqual({ items: ["wires", "crowbar"], shown: "wires" });
  });

  it("ignores an item it does not hold", () => {
    const w = world();
    pickUp(w, "wires");
    showItem(w, "card");
    expect(w.inventory.shown).toBe("wires");
  });
});

describe("runUse", () => {
  it("uses the shown item and keeps it unless the task consumes it", () => {
    const w = world();
    pickUp(w, "wires");
    pickUp(w, "crowbar");
    use(w, "switchboard");
    expect(w.subtitle).toEqual({ text: "Something is missing here.", age: 0 });
    expect(w.inventory).toEqual({ items: ["wires", "crowbar"], shown: "crowbar" });
    expect(prop(w, "switchboard").state ?? 0).toBe(0);
    w.flags.add("flag:metroPowered");
    use(w, "trainDoor");
    expect(w.inventory).toEqual({ items: ["wires", "crowbar"], shown: "crowbar" });
    expect(prop(w, "trainDoor").state).toBe(2);
    expect(w.flags.has("flag:metroOpen")).toBe(true);
  });

  it("uses an older item once it is shown", () => {
    const w = world();
    pickUp(w, "wires");
    pickUp(w, "crowbar");
    showItem(w, "wires");
    use(w, "switchboard");
    expect(w.inventory).toEqual({ items: ["crowbar", "card", "holoPlan"], shown: "holoPlan" });
    expect(prop(w, "switchboard").state).toBe(1);
  });

  it("gives items and flags and changes state", () => {
    const w = world();
    pickUp(w, "wires");
    use(w, "switchboard");
    expect(w.inventory).toEqual({ items: ["card", "holoPlan"], shown: "holoPlan" });
    expect(w.flags.has("flag:metroPowered")).toBe(true);
    expect(prop(w, "switchboard").state).toBe(1);
    expect(prop(w, "gate").state).toBe(1);
    expect(w.subtitle).toEqual({ text: "Power is back.", age: 0 });
  });

  it("hints and changes nothing without the needed item", () => {
    const w = world();
    use(w, "switchboard");
    expect(w.subtitle?.text).toBe("Something is missing here.");
    expect(w.flags.size).toBe(0);
    expect(w.inventory.items).toEqual([]);
    pickUp(w, "wires");
    use(w, "switchboard");
    use(w, "switchboard");
    expect(w.subtitle?.text).toBe("Nothing more to do here.");
    expect(w.inventory.items).toEqual(["card", "holoPlan"]);
  });

  it("blocks cells while the object is in a solid state", () => {
    const w = world();
    for (const row of [5, 6, 7]) expect(w.grid.solid(10, row)).toBe(true);
    expect(w.grid.wall(10, 6)).toBe(false);
    expect(w.grid.solid(10, 4)).toBe(false);
    pickUp(w, "wires");
    use(w, "switchboard");
    for (const row of [5, 6, 7]) expect(w.grid.solid(10, row)).toBe(false);
  });

  it("reset restores objects, flags, inventory and blocks", () => {
    const w = world();
    pickUp(w, "wires");
    use(w, "switchboard");
    pickUp(w, "craneKey");
    use(w, "crane");
    resetWorld(w, cfg);
    expect(w.flags.size).toBe(0);
    expect(w.inventory).toEqual({ items: [], shown: null });
    expect(prop(w, "switchboard").state ?? 0).toBe(0);
    expect(prop(w, "gate").state).toBe(0);
    expect(w.grid.solid(10, 6)).toBe(true);
    expect(w.subtitle).toBeNull();
    expect(w.complete).toBe(false);
    pickUp(w, "wires");
    use(w, "switchboard");
    expect(prop(w, "switchboard").state).toBe(1);
  });

  it("completes the level", () => {
    const w = world();
    expect(w.complete).toBe(false);
    pickUp(w, "craneKey");
    use(w, "crane");
    expect(w.complete).toBe(true);
    expect(w.subtitle?.text).toBe("Level complete");
  });
});

describe("loadTasks", () => {
  it("rejects unknown items and bad tokens", () => {
    const task = { id: "a", object: "o", requires: [], gives: [], subtitle: "x" };
    expect(() => loadTasks({ tasks: [{ ...task, gives: ["item:nope"] }] })).toThrow("task a: unknown item: nope");
    expect(() => loadTasks({ tasks: [{ ...task, requires: ["weapon:x"] }] })).toThrow("task a: bad token: weapon:x");
    expect(() => loadTasks({ tasks: [{ ...task, subtitle: 1 }] })).toThrow("task a: missing subtitle");
    expect(loadTasks({ tasks: [task] })[0]!.consumes).toEqual([]);
  });

  it("rejects a task that needs two items", () => {
    const task = { id: "a", object: "o", requires: ["item:wires", "item:crowbar"], consumes: ["item:wires", "item:crowbar"], gives: [], subtitle: "x" };
    expect(() => loadTasks({ tasks: [task] })).toThrow("task a: needs more than one item");
  });

  it("rejects a task that consumes an item it does not use", () => {
    const task = { id: "a", object: "o", requires: ["item:wires", "flag:f"], gives: [], subtitle: "x" };
    expect(loadTasks({ tasks: [task] })[0]!.consumes).toEqual([]);
    expect(() => loadTasks({ tasks: [{ ...task, consumes: ["item:crowbar"] }] })).toThrow("task a: consumes an item it does not use");
    expect(() => loadTasks({ tasks: [{ ...task, requires: [], consumes: ["item:wires"] }] })).toThrow("task a: consumes an item it does not use");
    expect(loadTasks({ tasks: [{ ...task, consumes: ["item:wires"] }] })[0]!.consumes).toEqual(["item:wires"]);
  });

  it("loads the mesto task web on mesto objects", () => {
    const tasks = loadTasks(tasksJson);
    const objects = new Set(tasks.map((t) => t.object));
    for (const id of ["dyingRebel", "wireBox", "switchboard", "trainDoor", "tapValveWheel", "corpse", "barDoor", "codeLock", "damagedLift", "acidTank", "cardDoor", "crane"]) {
      expect(objects.has(id), id).toBe(true);
    }
    const ids = tasks.map((t) => t.id);
    for (const gone of ["acidGuard", "shootGuard", "takeEBlaster", "getShipPart"]) expect(ids).not.toContain(gone);
    for (const t of tasks) expect(t.consumes.every((c) => t.requires.includes(c)), t.id).toBe(true);
  });

  it("keeps every used item except the ship part the bar man trades", () => {
    const tasks = loadTasks(tasksJson);
    expect(tasks.filter((t) => t.consumes.length).map((t) => t.id)).toEqual(["tradeShipPart"]);
    expect(tasks.map((t) => t.id)).not.toContain("getShipPart");
    expect(tasks.find((t) => t.id === "tradeHoloPlan")!.gives).toContain("flag:partWanted");
    expect(tasks.find((t) => t.id === "tradeShipPart")!.requires).toEqual(["item:shipPart", "flag:partWanted"]);
  });
});

describe("task cutscene", () => {
  const task = { id: "t", object: "door", requires: ["item:crowbar"], gives: [], subtitle: "Open." };

  it("keeps a known cutscene id", () => {
    expect(loadTasks({ tasks: [{ ...task, cutscene: "crowbarDoor" }] })[0]!.cutscene).toBe("crowbarDoor");
  });

  it("rejects an unknown cutscene id", () => {
    expect(() => loadTasks({ tasks: [{ ...task, cutscene: "nope" }] })).toThrow("task t: unknown cutscene: nope");
  });
});
