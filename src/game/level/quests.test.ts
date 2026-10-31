import { describe, expect, it } from "vitest";
import { loadMesto } from "./mesto";
import { pickUp } from "./sandboxLevel";
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
    expect(activeQuests(mesto.quests, mesto)).toEqual(["Find a way out of the city.", "Bring the bar man a plan of the way out."]);
    pickUp(mesto, "holoPlan");
    runUse(mesto, door);
    expect(activeQuests(mesto.quests, mesto)).toEqual(["Find a way out of the city.", "Bring the bar man the ship part."]);
  });

  it("drops find the bar man when the first bar door use already trades the plan", () => {
    const mesto = loadMesto();
    mesto.flags.add("flag:rebelTalked");
    pickUp(mesto, "holoPlan");
    runUse(mesto, mesto.props.find((p) => p.id === "barDoor")!);
    expect(activeQuests(mesto.quests, mesto)).toEqual(["Find a way out of the city.", "Bring the bar man the ship part."]);
  });

  it("asks mesto to repair the lift panel once a use of the dead panel fails, until it is repaired", () => {
    const mesto = loadMesto();
    const panel = mesto.props.find((p) => p.id === "damagedLift")!;
    runUse(mesto, panel);
    expect(activeQuests(mesto.quests, mesto)).toContain("Repair the lift panel.");
    mesto.flags.add("flag:upperFloorsOpen");
    expect(activeQuests(mesto.quests, mesto)).not.toContain("Repair the lift panel.");
  });
});
