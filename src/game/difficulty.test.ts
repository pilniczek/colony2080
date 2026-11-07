import { describe, expect, it } from "vitest";
import { ASSISTS, canToggle, costOf, CUSTOM, difficultyOk, PRESETS, presetPicks, reachable, START_DIFFICULTY, switched, tierOf, toggled } from "./difficulty";
import { tr } from "./i18n";

const custom = (assists: string[]) => ({ level: CUSTOM.id, assists });

describe("difficulty", () => {
  it("prices every assist 1, 2, 3 or 5 and starts on NORMAL", () => {
    for (const a of ASSISTS) expect([1, 2, 3, 5]).toContain(a.cost);
    expect(START_DIFFICULTY).toEqual(presetPicks("normal"));
    expect(difficultyOk(START_DIFFICULTY)).toBe(true);
  });

  it("makes every reachable preset cost its points and contain the preset below it", () => {
    const open = PRESETS.filter((l) => reachable(l.id));
    for (const l of open) expect(costOf(l.picks)).toBe(l.points);
    open.slice(1).forEach((l, i) => expect(l.picks.every((id) => open[i]!.picks.includes(id))).toBe(true));
  });

  it("keeps HARD out of reach while a locked assist is missing from it", () => {
    expect(reachable("hard")).toBe(false);
    expect(switched(presetPicks("normal"), 1)).toEqual(custom(presetPicks("normal").assists));
    expect(switched(custom([]), -1)).toEqual(presetPicks("normal"));
    expect(switched(presetPicks("story"), -1)).toEqual(presetPicks("story"));
  });

  it("toggles only in CUSTOM, never a locked assist, with no cap", () => {
    expect(canToggle(presetPicks("story"), "fogOff")).toBe(false);
    expect(toggled(presetPicks("story"), "fogOff")).toEqual(presetPicks("story"));
    const all = ASSISTS.reduce((d, a) => toggled(d, a.id), custom(["hideAnywhere"]));
    expect(all.assists).toEqual(ASSISTS.map((a) => a.id));
    expect(toggled(all, "hideAnywhere")).toBe(all);
  });

  it("names the highest preset the CUSTOM points reach", () => {
    expect(tierOf(["hideAnywhere"]).id).toBe("hard");
    expect(tierOf(["hideAnywhere", "fogOff"]).id).toBe("normal");
    expect(tierOf(["hideAnywhere", "fogOff", "strongPunches"]).id).toBe("normal");
    expect(tierOf(["hideAnywhere", "fogOff", "strongPunches", "moreAmmo"]).id).toBe("easy");
    expect(tierOf(ASSISTS.map((a) => a.id)).id).toBe("story");
  });

  it("refuses unknown or unreachable levels, presets with other picks, unknown, repeated or missing locked assists", () => {
    expect(difficultyOk({ level: "insane", assists: ["hideAnywhere"] })).toBe(false);
    expect(difficultyOk(presetPicks("hard"))).toBe(false);
    expect(difficultyOk({ level: "normal", assists: ["hideAnywhere"] })).toBe(false);
    expect(difficultyOk(custom(["hideAnywhere", "godMode"]))).toBe(false);
    expect(difficultyOk(custom(["hideAnywhere", "fogOff", "fogOff"]))).toBe(false);
    expect(difficultyOk(custom(["fogOff"]))).toBe(false);
    expect(difficultyOk(custom(["hideAnywhere", "fogOff"]))).toBe(true);
  });

  it("has Czech for every level and assist label", () => {
    for (const { label } of [...ASSISTS, ...PRESETS, CUSTOM]) expect(tr(label, "cs")).not.toBe(label);
  });
});
