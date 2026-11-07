import tasksJson from "@config/levels/mesto/tasks.json";
import { describe, expect, it } from "vitest";
import { cfg, objectLevel } from "../hero/testWorld";
import { loadSandbox, onGround, pickUp, resetWorld, showItem, stepApproaches, useShown, type SandboxWorld } from "./sandboxLevel";
import { loadMesto } from "./mesto";
import { loadMission } from "./missions";
import { loadQuests } from "./quests";
import { applyBlocks, loadTasks, openBlockers, pickAll, runUse } from "./tasks";

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
    showItem(w, "crowbar");
    expect(useShown(w)).toBe("crowbar");
    expect(w.inventory).toEqual({ items: ["wires", "card"], shown: "wires" });
  });

  it("shows the next listed item, else the previous one, after a use", () => {
    const w = world();
    pickUp(w, "wires");
    pickUp(w, "crowbar");
    showItem(w, "wires");
    expect(useShown(w)).toBe("wires");
    expect(w.inventory).toEqual({ items: ["crowbar"], shown: "crowbar" });
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

  it("opens every movement blocker of the mission: gates, doors and locked lifts", () => {
    const w = loadMesto();
    const blockers = w.props.filter((p) => p.solidStates?.includes(p.state ?? 0));
    const locked = w.lifts.filter((l) => l.enabledBy !== undefined && !w.flags.has(l.enabledBy));
    expect(blockers.length).toBeGreaterThan(0);
    expect(locked.length).toBeGreaterThan(0);
    expect(openBlockers(w)).toBe(blockers.length + locked.length);
    expect(prop(w, "cardDoor").state).toBe(1);
    expect(prop(w, "metroTunnel").state).toBe(1);
    for (const p of blockers) {
      expect(p.solidStates).not.toContain(p.state);
      expect(w.grid.solid(p.cells!.col, p.cells!.row)).toBe(false);
    }
    for (const l of locked) expect(w.flags.has(l.enabledBy!)).toBe(true);
    expect(openBlockers(w)).toBe(0);
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
  it("uses the shown item and drops it once no open task needs it", () => {
    const w = world();
    pickUp(w, "wires");
    pickUp(w, "crowbar");
    use(w, "switchboard");
    expect(w.subtitle).toEqual({ text: "Crowbar didn't work, maybe something else might be useful here.", age: 0 });
    expect(w.inventory).toEqual({ items: ["wires", "crowbar"], shown: "crowbar" });
    expect(prop(w, "switchboard").state ?? 0).toBe(0);
    w.flags.add("flag:metroPowered");
    use(w, "trainDoor");
    expect(w.inventory).toEqual({ items: ["wires"], shown: "wires" });
    expect(prop(w, "trainDoor").state).toBe(2);
    expect(w.flags.has("flag:metroOpen")).toBe(true);
  });

  it("keeps a used item another open task still needs", () => {
    const w = world();
    w.tasks.push({ ...w.tasks.find((t) => t.id === "openTrainDoor")!, id: "openCrane", object: "crane", state: 1, sets: undefined });
    pickUp(w, "crowbar");
    w.flags.add("flag:metroPowered");
    use(w, "trainDoor");
    expect(w.inventory).toEqual({ items: ["crowbar"], shown: "crowbar" });
    use(w, "crane");
    expect(w.inventory).toEqual({ items: [], shown: null });
  });

  it("drops the holoplan once the bar man takes it", () => {
    const w = loadMesto();
    pickUp(w, "holoPlan");
    runUse(w, w.props.find((p) => p.id === "barDoor")!);
    expect(w.flags.has("task:tradeHoloPlan")).toBe(true);
    expect(w.inventory.items).toEqual(["shipPlan"]);
  });

  it("never puts a spent item back on the ground", () => {
    const w = loadMesto();
    const crowbar = w.props.find((p) => p.item === "crowbar")!;
    crowbar.taken = true;
    pickUp(w, "crowbar");
    w.flags.add("flag:metroPowered");
    runUse(w, w.props.find((p) => p.id === "trainDoor")!);
    expect(w.inventory.items).not.toContain("crowbar");
    expect(onGround(crowbar, { blaster: null }, w.flags)).toBe(false);
  });

  it("never gives back a spent item", () => {
    const w = world();
    pickUp(w, "wires");
    use(w, "switchboard");
    pickAll(w);
    expect(w.inventory.items).not.toContain("wires");
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

  it("hints and only marks the try and the refusal without the needed item", () => {
    const w = world();
    use(w, "switchboard");
    expect(w.subtitle?.text).toBe("Something is missing here.");
    expect([...w.flags]).toEqual(["flag:tried:switchboard", "flag:refused:switchboard"]);
    expect(w.inventory.items).toEqual([]);
    pickUp(w, "wires");
    use(w, "switchboard");
    use(w, "switchboard");
    expect(w.subtitle?.text).toBe("Nothing more to do here.");
    expect(w.inventory.items).toEqual(["card", "holoPlan"]);
  });

  it("says the first hint whose flag is still missing before the task hint", () => {
    const w = loadMission("vesnice");
    use(w, "fuseBox");
    pickUp(w, "fuse");
    use(w, "fuseBox");
    expect(w.subtitle?.text).toBe("The power can't come back yet. The teleport has to work first.");
    expect(w.inventory.items).toContain("fuse");
    w.flags.add("flag:teleportRepaired");
    w.inventory.shown = null;
    use(w, "fuseBox");
    expect(w.subtitle?.text).toBe("A fuse is missing. The power plant is down.");
  });

  it("tells what the quest needs from a mission object", () => {
    const w = loadMesto();
    use(w, "barDoor");
    expect(w.subtitle?.text).toBe(w.tasks.find((t) => t.id === "tradeHoloPlan")!.hint);
    pickUp(w, "crowbar");
    use(w, "barDoor");
    expect(w.subtitle?.text).toBe("Crowbar didn't work, maybe something else might be useful here.");
  });

  it("gives every mission task that needs something a hint", () => {
    const needy = [loadMesto(), loadMission("vesnice"), loadMission("jungle")].flatMap((w) => w.tasks.filter((t) => t.requires.length));
    expect(needy.filter((t) => !t.hint).map((t) => t.id)).toEqual([]);
  });

  it("asks the jungle jeep for fuel until it is fueled, then winches the tree away to end the level", () => {
    const w = loadMission("jungle");
    use(w, "jeep");
    expect(w.subtitle?.text).toBe("The jeep's tank is empty.");
    pickUp(w, "canister");
    use(w, "jeep");
    expect(w.flags.has("flag:jeepFueled")).toBe(true);
    expect(w.inventory.items).toEqual([]);
    expect(w.complete).toBe(false);
    use(w, "jeep");
    expect(w.complete).toBe(true);
  });

  it("lays the jungle boulder rubble on the spikes as a floor and slides the waterfall steps out", () => {
    const w = loadMission("jungle");
    const solid = (cells: [number, number][]) => cells.map(([col, row]) => w.grid.solid(col, row));
    const floors: [number, number][] = [[54, 20], [59, 20], [98, 13], [96, 12]];
    expect(solid(floors)).toEqual([false, false, false, false]);
    pickUp(w, "grenade");
    use(w, "boulder");
    use(w, "stonePuzzle");
    expect(solid(floors)).toEqual([true, true, true, true]);
    expect(solid([[53, 20], [60, 20]])).toEqual([false, false]);
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

  it("waits on no item a task can spend in any quest", () => {
    const used = new Set(loadTasks(tasksJson).flatMap((t) => t.requires).filter((t) => t.startsWith("item:")));
    const quests = loadQuests(tasksJson);
    for (const q of quests) for (const t of [...q.after, ...(q.any ?? []), q.until ?? ""]) expect(used.has(t), `${q.text}: ${t}`).toBe(false);
  });

  it("consumes only the ship part the bar man trades", () => {
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

describe("lever combination", () => {
  const lever = (id: string, x: number) => ({ kind: "object", id, x, width: 1, state: 0, toggle: { subtitle: "The lever moved." } });
  const door = { kind: "gate", id: "door", x: 2, width: 1, state: 0, solidStates: [0], cells: { col: 2, row: 5, w: 1, h: 3 }, combo: { levers: { leverA: 0, leverB: 1, leverC: 1 }, open: 2, closed: 0, gives: ["flag:doorOpen"], subtitle: "The door opened." } };
  const levers = () => loadSandbox({ ...objectLevel, props: [lever("leverA", 6), lever("leverB", 8), lever("leverC", 10), door] });

  it("flips a lever between its two states on every use", () => {
    const w = levers();
    use(w, "leverA");
    expect(prop(w, "leverA").state).toBe(1);
    expect(w.subtitle?.text).toBe("The lever moved.");
    use(w, "leverA");
    expect(prop(w, "leverA").state).toBe(0);
  });

  it("opens the gate once its levers match the combination, and closes it when they no longer do", () => {
    const w = levers();
    use(w, "leverB");
    expect(prop(w, "door").state).toBe(0);
    expect(w.grid.solid(2, 6)).toBe(true);
    use(w, "leverC");
    expect(prop(w, "door").state).toBe(2);
    expect(w.grid.solid(2, 6)).toBe(false);
    expect(w.flags.has("flag:doorOpen")).toBe(true);
    expect(w.subtitle?.text).toBe("The door opened.");
    use(w, "leverA");
    expect(prop(w, "door").state).toBe(0);
    expect(w.grid.solid(2, 6)).toBe(true);
    use(w, "leverA");
    expect(prop(w, "door").state).toBe(2);
  });

  it("rejects a combination lever that does not toggle", () => {
    expect(() => loadSandbox({ ...objectLevel, props: [lever("leverA", 6), { ...lever("leverB", 8), toggle: undefined }, lever("leverC", 10), door] })).toThrow("door: leverB is not a toggle");
  });

  it("rejects sets naming an unknown prop", () => {
    const shot = { kind: "gate", id: "rock", x: 4, width: 1, shootable: { hits: 1, state: 1, sets: { nowhere: 1 } } };
    expect(() => loadSandbox({ ...objectLevel, props: [shot] })).toThrow("rock: unknown prop nowhere");
  });

  it("rejects an unknown shootable by", () => {
    const shot = { kind: "gate", id: "rock", x: 4, width: 1, shootable: { hits: 1, state: 1, by: "kick" } };
    expect(() => loadSandbox({ ...objectLevel, props: [shot] })).toThrow("rock: unknown shootable by: kick");
  });

  it("lets the cheat open a combination gate", () => {
    const w = levers();
    openBlockers(w);
    expect(prop(w, "door").state).toBe(2);
  });
});

describe("hidden blockers", () => {
  const hidden = { kind: "gate", id: "tank", x: 12, width: 1, state: 0, solidStates: [0], shownBy: "flag:shown", cells: { col: 12, row: 5, w: 1, h: 3 } };

  it("block only once their shownBy flag holds", () => {
    const w = loadSandbox({ ...objectLevel, props: [hidden] });
    expect(w.grid.solid(12, 6)).toBe(false);
    w.flags.add("flag:shown");
    applyBlocks(w);
    expect(w.grid.solid(12, 6)).toBe(true);
  });

  it("block while hidden when they repel, since the zone shows them before the hero reaches their cells", () => {
    const w = loadMesto();
    const guard = prop(w, "acidGuard");
    expect(w.flags.has(guard.shownBy!)).toBe(false);
    expect(w.grid.solid(guard.cells!.col, guard.cells!.row)).toBe(true);
  });
});

describe("approach without a film", () => {
  const spot = (approach: object) => loadSandbox({ ...objectLevel, props: [{ kind: "object", id: "edge", x: 14, y: 8, width: 1, approach }] });

  it("says its subtitle once when the hero comes near", () => {
    const w = spot({ cells: 2, gives: "flag:warned", subtitle: "Careful." });
    stepApproaches(w, { x: 11, y: 8 }, cfg.box.height);
    expect(w.subtitle).toBeNull();
    stepApproaches(w, { x: 13, y: 8 }, cfg.box.height);
    expect(w.subtitle?.text).toBe("Careful.");
    expect(w.cutscene).toBeNull();
    w.subtitle = null;
    stepApproaches(w, { x: 13, y: 8 }, cfg.box.height);
    expect(w.subtitle).toBeNull();
  });

  it("says it for a jumping hero too", () => {
    const w = spot({ cells: 2, gives: "flag:warned", subtitle: "Careful." });
    stepApproaches(w, { x: 13, y: 7 }, cfg.box.height);
    expect(w.subtitle?.text).toBe("Careful.");
  });

  it("stays silent while one of its unless tokens holds", () => {
    const w = spot({ cells: 2, gives: "flag:warned", subtitle: "Careful.", unless: ["item:crowbar", "flag:safe"] });
    pickUp(w, "crowbar");
    pickUp(w, "wires");
    stepApproaches(w, { x: 13, y: 8 }, cfg.box.height);
    expect(w.subtitle).toBeNull();
    useShown(w);
    useShown(w);
    w.flags.add("flag:safe");
    stepApproaches(w, { x: 13, y: 8 }, cfg.box.height);
    expect(w.subtitle).toBeNull();
    w.flags.delete("flag:safe");
    stepApproaches(w, { x: 13, y: 8 }, cfg.box.height);
    expect(w.flags.has("flag:warned")).toBe(true);
  });

  it("ends the level and moves props by its sets", () => {
    const w = loadSandbox({ ...objectLevel, props: [{ kind: "object", id: "edge", x: 14, y: 8, width: 1, approach: { cells: 2, gives: "flag:levelComplete", sets: { gate: 2 } } }, ...objectLevel.props] });
    stepApproaches(w, { x: 14, y: 8 }, cfg.box.height);
    expect(w.complete).toBe(true);
    expect(prop(w, "gate").state).toBe(2);
    expect(w.grid.solid(10, 6)).toBe(false);
  });
});
