import { describe, expect, it } from "vitest";
import { loadMesto } from "./mesto";
import { loadMission } from "./missions";
import { cfg } from "../hero/testWorld";
import { pickUp, resetWorld, showItem } from "./sandboxLevel";
import { runUse } from "./tasks";
import { activeQuests, loadQuests } from "./quests";

const quests = loadQuests({
  quests: [
    { text: "Get out.", after: [], until: "flag:out" },
    { text: "Find him.", after: ["flag:told"], until: "flag:found" },
    { text: "Use the key.", after: ["item:craneKey"], until: "flag:used" },
    { text: "Fix it.", after: [], any: ["flag:a", "flag:b"], until: "flag:fixed" },
  ],
});

const world = (flags: string[] = [], items: string[] = []) => ({ flags: new Set(flags), inventory: { items, shown: null } });

describe("quests", () => {
  it("shows a quest once its after tokens hold, until its until token holds", () => {
    expect(activeQuests(quests, world())).toEqual(["Get out."]);
    expect(activeQuests(quests, world(["flag:told"]))).toEqual(["Get out.", "Find him."]);
    expect(activeQuests(quests, world(["flag:told", "flag:found"]))).toEqual(["Get out."]);
    expect(activeQuests(quests, world([], ["craneKey"]))).toEqual(["Get out.", "Use the key."]);
    expect(activeQuests(quests, world(["flag:out"]))).toEqual([]);
  });

  it("shows a quest with any once one of its any tokens holds", () => {
    expect(activeQuests(quests, world(["flag:b"]))).toEqual(["Get out.", "Fix it."]);
    expect(activeQuests(quests, world(["flag:a", "flag:fixed"]))).toEqual(["Get out."]);
  });

  it("rejects bad tokens and missing text", () => {
    expect(() => loadQuests({ quests: [{ text: "x", after: ["told"] }] })).toThrow(/bad token/);
    expect(() => loadQuests({ quests: [{ text: "x", after: ["item:nope"] }] })).toThrow(/unknown item/);
    expect(() => loadQuests({ quests: [{ after: [] }] })).toThrow(/text/);
  });

  it("has no quests without a quests list", () => {
    expect(loadQuests({ tasks: [] })).toEqual([]);
  });

  it("gives mesto a level quest from the start and the bar man after the rebel talks", () => {
    const mesto = loadMesto();
    expect(activeQuests(mesto.quests, mesto)).toEqual(["Find a way out of the city."]);
    mesto.flags.add("flag:rebelTalked");
    expect(activeQuests(mesto.quests, mesto)).toEqual(["Find a way out of the city.", "Find the bar man."]);
  });

  it("asks mesto for a plan for the bar man once the bar door is tried, until the holo plan trade", () => {
    const mesto = loadMesto();
    mesto.flags.add("flag:rebelTalked");
    const door = mesto.props.find((p) => p.id === "barDoor")!;
    runUse(mesto, door);
    expect(activeQuests(mesto.quests, mesto)).toEqual(["Find a way out of the city.", "Bring the bar man the holoplan."]);
    pickUp(mesto, "holoPlan");
    runUse(mesto, door);
    expect(activeQuests(mesto.quests, mesto)).toEqual(["Find a way out of the city.", "Bring the bar man the ship part he wants."]);
  });

  it("drops find the bar man when the first bar door use already trades the plan", () => {
    const mesto = loadMesto();
    mesto.flags.add("flag:rebelTalked");
    pickUp(mesto, "holoPlan");
    runUse(mesto, mesto.props.find((p) => p.id === "barDoor")!);
    expect(activeQuests(mesto.quests, mesto)).toEqual(["Find a way out of the city.", "Bring the bar man the ship part he wants."]);
  });

  it("reminds every mesto hint until its task is done", () => {
    const mesto = loadMesto();
    const reminded = (token: string) => mesto.quests.some((q) => [...q.after, ...(q.any ?? [])].includes(token));
    const objects = mesto.tasks.filter((t) => t.hint !== undefined).map((t) => `flag:tried:${t.object}`);
    const lifts = mesto.lifts.filter((l) => l.hint !== undefined).map((l) => `flag:tried:${l.enabledBy!.slice("flag:".length)}`);
    expect([...objects, ...lifts].filter((token) => !reminded(token))).toEqual([]);
    expect(mesto.quests.filter((q) => q.until === undefined)).toEqual([]);
  });

  it("never shows a mesto quest for an item picked up alone", () => {
    const tokens = loadMesto().quests.flatMap((q) => [...q.after, ...(q.any ?? [])]);
    expect(tokens.filter((t) => t.startsWith("item:"))).toEqual([]);
  });

  it("asks mesto for the switchboard when the train door is tried without metro power", () => {
    const mesto = loadMesto();
    runUse(mesto, mesto.props.find((p) => p.id === "trainDoor")!);
    expect(activeQuests(mesto.quests, mesto)).toContain("Get the switchboard working.");
    mesto.flags.add("flag:metroPowered");
    expect(activeQuests(mesto.quests, mesto)).not.toContain("Get the switchboard working.");
  });

  it("keeps the show all quests cheat over a world reset", () => {
    const mesto = loadMesto();
    mesto.allQuests = true;
    resetWorld(mesto, cfg);
    expect(mesto.allQuests).toBe(true);
  });

  it("asks mesto to repair the lift panel once a use of the dead panel fails, until it is repaired", () => {
    const mesto = loadMesto();
    const panel = mesto.props.find((p) => p.id === "damagedLift")!;
    runUse(mesto, panel);
    expect(activeQuests(mesto.quests, mesto)).toContain("Repair the lift.");
    mesto.flags.add("flag:upperFloorsOpen");
    expect(activeQuests(mesto.quests, mesto)).not.toContain("Repair the lift.");
  });

  it("keeps vesnice from asking for the power right after the hero pulled the fuse, and asks once the teleport is repaired", () => {
    const vesnice = loadMission("vesnice");
    const fuseBox = vesnice.props.find((p) => p.id === "fuseBox")!;
    const now = () => activeQuests(vesnice.quests, vesnice);
    runUse(vesnice, fuseBox);
    expect(now()).toEqual(["Find a way out of the village."]);
    pickUp(vesnice, "fuse");
    runUse(vesnice, fuseBox);
    expect(now()).toEqual(["Find a way out of the village.", "Repair the damaged teleport."]);
    pickUp(vesnice, "navCircuit");
    runUse(vesnice, vesnice.props.find((p) => p.id === "targetTeleport")!);
    expect(now()).toEqual(["Find a way out of the village.", "Bring the power back to link the teleports."]);
    showItem(vesnice, "fuse");
    runUse(vesnice, fuseBox);
    expect(now()).toEqual(["Find a way out of the village."]);
  });

  it("reminds every jungle hint until its task is done and never shows a jungle quest for an item alone", () => {
    const jungle = loadMission("jungle");
    const reminded = (token: string) => jungle.quests.some((q) => [...q.after, ...(q.any ?? [])].includes(token));
    expect(jungle.tasks.filter((t) => t.hint !== undefined).map((t) => `flag:tried:${t.object}`).filter((token) => !reminded(token))).toEqual([]);
    expect(jungle.quests.filter((q) => q.until === undefined)).toEqual([]);
    expect(jungle.quests.flatMap((q) => [...q.after, ...(q.any ?? [])]).filter((t) => t.startsWith("item:"))).toEqual([]);
    expect(activeQuests(jungle.quests, jungle)).toEqual(["Find a way out of the jungle."]);
    runUse(jungle, jungle.props.find((p) => p.id === "boulder")!);
    expect(activeQuests(jungle.quests, jungle)).toEqual(["Find a way out of the jungle.", "Find a way past the boulder."]);
  });
});
