import movementJson from "@config/hero/movement.json";
import sandbox from "@config/levels/sandbox.json";
import { describe, expect, it } from "vitest";
import { loadMovement } from "../hero/config";
import { game, objectLevel, run } from "../hero/testWorld";
import { loadMesto, mestoJson } from "./mesto";
import { MISSIONS, type MissionId } from "./missionIds";
import { loadMission, missionJson } from "./missions";
import { id, inShaft, reachOf, stopId, stopsAt } from "./reach";
import { loadSandbox, type SandboxWorld } from "./sandboxLevel";
import { openGraph, opened, variant } from "./testMissions";

const PROBED_JUMP_CELLS: [number, number][] = [[-1, 3], [0, 4], [3, 6], [7, 7]];
const cfg = loadMovement(movementJson);
const { fallDeathCells } = cfg;
const world = loadSandbox(sandbox);
const { grid, lifts } = world;
const { runs, runAt, landings, ladders, jumpCells, strict, generous, graph, reach } = reachOf(world, cfg);

type Stop = "top" | "bottom";

function liftBypasses(w: SandboxWorld): string[] {
  const r = reachOf(w, cfg);
  const g = r.graph(r.generous);
  return w.lifts.flatMap((l, i) =>
    l.stops.flatMap((a) =>
      l.stops.filter((b) => b !== a && r.reach(g, stopId(i, a), i).has(stopId(i, b))).map((b) => `lift ${i} ${a} to ${b}`),
    ),
  );
}

describe("sandbox reachability", () => {
  const conservative = graph(strict);
  const permissive = graph(generous);
  const spawn = id(runAt(world.spawn[1], Math.floor(world.spawn[0]))!);

  it("bounds the generous jump by the probed run jump reach", () => {
    for (const [drop, cells] of PROBED_JUMP_CELLS) expect(jumpCells(drop), `drop ${drop}`).toBeGreaterThanOrEqual(cells);
  });

  it("reaches every floor from the spawn by walking, short jumps, ladders, lifts and survivable drops", () => {
    const from = reach(conservative, spawn);
    expect(runs.filter((r) => !from.has(id(r)))).toEqual([]);
  });

  it("gets back to the spawn floor from every floor", () => {
    expect(runs.filter((r) => !reach(conservative, id(r)).has(spawn))).toEqual([]);
  });

  it("joins the two stops of each lift only through that lift, counting long jumps and ladder drop-offs", () => {
    lifts.forEach((l, i) => {
      expect(reach(permissive, stopId(i, l.top), i).has(stopId(i, l.bottom)), `lift ${i} top to bottom`).toBe(false);
      expect(reach(permissive, stopId(i, l.bottom), i).has(stopId(i, l.top)), `lift ${i} bottom to top`).toBe(false);
    });
  });

  it("starts each lift at the stop the spawn reaches without it", () => {
    lifts.forEach((l, i) => {
      const json = sandbox.lifts[i]!;
      const start: Stop = "start" in json && json.start === "top" ? "top" : "bottom";
      expect(l.y).toBe(l[start]);
      expect(reach(conservative, spawn, i).has(stopId(i, l[start])), `lift ${i}`).toBe(true);
    });
  });

  it("changes floors in the lower half only by lift, with no survivable drop off any edge", () => {
    for (const r of runs.filter((run) => run.row > 15)) {
      for (const c of [r.col - 1, r.col + r.w]) {
        if (grid.solid(c, r.row - 1) || grid.solid(c, r.row) || lifts.some((l) => stopsAt(l, r.row) && inShaft(l, c))) continue;
        expect(landings(c, r.row, fallDeathCells), `${id(r)} edge ${c}`).toEqual([]);
      }
    }
  });

  it("keeps ladders rare: the original one plus at most one in the lower half", () => {
    const all = ladders();
    expect(all.filter((l) => l.top < 16)).toEqual([{ col: 3, top: 4, end: 14 }]);
    expect(all.filter((l) => l.top >= 16).length).toBeLessThanOrEqual(1);
  });

  it("gives the lower half at least two lifts and three platforms", () => {
    expect(lifts.filter((l) => l.bottom > 15).length).toBeGreaterThanOrEqual(2);
    expect(runs.filter((r) => r.row > 15 && r.row < 28).length).toBeGreaterThanOrEqual(3);
  });

  it("leaves room for three enemy patrols of six flat cells off lift decks in the lower half", () => {
    const stretches = runs
      .filter((r) => r.row > 15)
      .flatMap((r) => {
        const out: number[] = [];
        let len = 0;
        for (let c = r.col; c <= r.col + r.w; c++) {
          const free = c < r.col + r.w && !lifts.some((l) => stopsAt(l, r.row) && inShaft(l, c));
          if (free) len++;
          if (free || !len) continue;
          out.push(len);
          len = 0;
        }
        return out;
      });
    expect(stretches.filter((len) => len >= 6).length).toBeGreaterThanOrEqual(3);
  });

  it("puts the E-Blaster on a floor the spawn reaches, off the right strip and every lift deck", () => {
    const prop = world.props.find((p) => p.kind === "weapon")!;
    const row = prop.y ?? world.spawn[1];
    const col = Math.floor(prop.x);
    const floor = runAt(row, col);
    expect(floor).toBeDefined();
    expect(reach(conservative, spawn).has(id(floor!))).toBe(true);
    expect(col < 40).toBe(true);
    expect(lifts.some((l) => stopsAt(l, row) && inShaft(l, col))).toBe(false);
  });

  it("keeps lift shafts apart horizontally", () => {
    const spans = lifts.map((l) => [l.x, l.x + l.w] as const).sort((a, b) => a[0] - b[0]);
    for (let i = 1; i < spans.length; i++) expect(spans[i]![0]).toBeGreaterThanOrEqual(spans[i - 1]![1]);
  });
});

describe("lift reach rule", () => {
  it("joins the stops of each sandbox lift only through that lift", () => {
    expect(liftBypasses(world)).toEqual([]);
  });

  it("joins the stops of each mesto lift only through that lift, deadly shaft drops aside", () => {
    expect(liftBypasses(loadMesto())).toEqual(["lift 14 10 to 16"]);
  });

  it("holds the hero on each mesto bottom stop while the deck is away", () => {
    const mesto = loadMesto();
    for (const lift of mesto.lifts) {
      const g = game({ x: lift.x + lift.w / 2, y: lift.bottom }, mestoJson());
      g.world.lifts.find((l) => l.x === lift.x)!.y = lift.top;
      run(g, 0.5);
      expect(g.hero.y, `lift ${lift.x}`).toBe(lift.bottom);
    }
  });
});

describe("one-way floors", () => {
  const stair = {
    ...objectLevel,
    rows: ["#........#", "#........#", "#..===...#", "#....===.#", "#..===...#", "#....===.#", "#..===...#", "##########"],
    spawn: [1.5, 7],
    props: [],
    tasks: { tasks: [] },
  };

  it("climbs a stack of one-way ledges one row apart", () => {
    const w = loadSandbox(stair);
    const r = reachOf(w, cfg);
    const from = r.reach(r.graph(r.strict), id(r.runAt(7, 1)!));
    expect(r.runs.map(id).filter((n) => !from.has(n))).toEqual([]);
    expect(r.runs.map(id)).toEqual(expect.arrayContaining(["2,3", "3,5", "4,3", "5,5", "6,3", "7,1"]));
  });

  it("never jumps down through a one-way floor", () => {
    const shelf = {
      ...stair,
      rows: ["#..........#", "#..........#", "#..|.......#", "#==========#", "#..........#", "#..........#", "#..........#", "#....###...#", "############"],
      spawn: [1.5, 3],
    };
    const r = reachOf(loadSandbox(shelf), cfg);
    const g = r.graph(r.generous);
    expect(g.get("3,1")!.map((e) => e.to)).toContain("3,4");
    expect(r.reach(g, "3,1").has("7,5")).toBe(false);
  });

  it("lands on a one-way ledge when dropping down", () => {
    const w = loadSandbox(stair);
    expect(reachOf(w, cfg).landings(4, 1, fallDeathCells)).toEqual(["2,3"]);
  });
});

describe("hazards and teleports", () => {
  const pit = {
    ...objectLevel,
    rows: ["#..........#", "#..........#", "#..........#", "#..........#", "#..........#", "#..........#", "#.##...###.#", "############"],
    spawn: [3.5, 6],
    props: [],
    tasks: { tasks: [] },
  };
  const ledge = {
    ...pit,
    rows: ["#..........#", "#..........#", "#..........#", "####.......#", "#..........#", "#..........#", "#.......####", "############"],
    spawn: [1.5, 3],
  };
  const jumpsFrom = (w: SandboxWorld, run: string): string[] => {
    const r = reachOf(w, cfg);
    return r.graph(r.generous).get(run)!.map((e) => e.to);
  };

  it("never lands in a death hazard", () => {
    const r = reachOf(loadSandbox({ ...pit, hazards: [{ id: "lava", kind: "death", col: 1, row: 6, w: 1, h: 1 }] }), cfg);
    expect(r.landings(1, 3, fallDeathCells)).toEqual([]);
    expect(r.runs.map(id)).not.toContain("7,1");
  });

  it("never drops through a death hazard", () => {
    const r = reachOf(loadSandbox({ ...pit, hazards: [{ id: "gap", kind: "death", col: 1, row: 4, w: 1, h: 1 }] }), cfg);
    expect(r.landings(1, 3, fallDeathCells)).toEqual([]);
    expect(r.runs.map(id)).toContain("7,1");
  });

  it("never jumps down through a death hazard", () => {
    expect(jumpsFrom(loadSandbox(ledge), "3,1")).toContain("6,8");
    const chasm = loadSandbox({ ...ledge, hazards: [{ id: "chasm", kind: "death", col: 7, row: 4, w: 2, h: 1 }] });
    expect(jumpsFrom(chasm, "3,1")).not.toContain("6,8");
  });

  it("keeps damage hazard floors walkable", () => {
    const w = loadSandbox({ ...pit, hazards: [{ id: "fire", kind: "damage", col: 1, row: 6, w: 1, h: 1 }] });
    expect(reachOf(w, cfg).landings(1, 3, fallDeathCells)).toEqual(["7,1"]);
  });

  it("links a teleport pad to its target floor", () => {
    const rows = ["#......|...#", "#......|...#", "#......#####", ...pit.rows.slice(3)];
    const w = loadSandbox({ ...pit, rows, teleports: [{ id: "pad", from: [3, 5], col: 2, w: 2, to: [9, 1] }] });
    const r = reachOf(w, cfg);
    const g = r.graph(r.generous);
    expect(g.get("6,2")!.map((e) => e.to)).toContain("2,8");
    expect(r.reach(g, "2,8").has("6,2")).toBe(false);
  });

  it("links a conditioned teleport pad only once its flag is set", () => {
    const rows = ["#......|...#", "#......|...#", "#......#####", ...pit.rows.slice(3)];
    const json = { ...pit, rows, teleports: [{ id: "pad", from: [3, 5] as [number, number], col: 2, w: 2, to: [9, 1] as [number, number], enabledBy: "flag:padFixed" }] };
    expect(jumpsFrom(loadSandbox(json), "6,2")).not.toContain("2,8");
    const fixed = loadSandbox(json);
    fixed.flags.add("flag:padFixed");
    expect(jumpsFrom(fixed, "6,2")).toContain("2,8");
  });
});

const GATED: Record<MissionId, { byTask: Record<string, string[]>; never: Record<string, string[]> }> = {
  mesto: {
    byTask: {
      "metro tunnel gate, wireSwitchboard opens it (report 13: tunnel)": ["70,21", "70,28", "75,21", "75,28"],
      "water pipe gate, takeTapHandle opens it (report 13: water)": ["70,13", "75,13"],
      "plasma barrier, unlockPlasma opens it (report 13: plasma)": ["44,78", "44,85", "51,78", "51,85"],
      "lift 9 needs flag:upperFloorsOpen from repairLift (report 13: lift 10 repaired)": ["23,19", "23,36", "30,29", "30,36", "30,58"],
      "card door and acid guard, openDoor and useAcidTank open them (report 13: card door, lift 14 after acid)": [
        ...["10,31", "10,55", "16,27", "16,55", "16,125", "23,50", "23,87", "23,101", "23,107", "30,75", "30,87"],
        ...["30,107", "30,112"],
      ],
      "behind the shoot guard, the E-Blaster wrecks it (world.json shootGuard)": ["16,19"],
    },
    never: {
      "border wall top beside the map edge (levelmap.py borderFills)": ["39,0"],
      "west roof wall top under the open sky (levelmap.py patches)": ["11,18"],
    },
  },
  vesnice: {
    byTask: {
      "middle floors behind the barrier col 99: the pulled fuse turns it off (report 14 M22), teleport 3 links once the target is repaired and the power is back": [
        ...["23,63", "23,74", "32,63", "32,83", "41,59", "41,92", "50,73", "50,135", "59,78", "59,87", "59,116", "59,120", "68,81"],
      ],
      "behind the bridge guard col 62, the toaster beam takes him down (report 14 marker 5)": ["23,59"],
      "west of the bridge: the walkie-talkie calls the guard post away from its col 58 code wall, and the bridge planks gap while the power is off (report 14 code wall, M22)": ["41,23"],
      "west of the barricade col 22, the cannon shot blasts it (report 14 M24); floor 50 west by lift 9, wall 14 floor by teleport 13": ["41,15", "41,21", "50,15", "32,30"],
    },
    never: {
      "past the marker 14 wall col 29 that the dynamite blows to end the level (report 14 tasks)": ["32,7"],
      "wall tops nobody reaches: the original rock and crate block masses and wall 14 col 29 (levelmap.py patches)": [
        ...["12,90", "13,153", "14,117", "15,50", "15,87", "15,120", "16,54", "16,121", "16,151", "17,55", "17,122", "18,56", "18,86"],
        ...["18,123", "18,148", "24,0", "24,102", "25,49", "27,29", "27,46", "27,107"],
      ],
    },
  },
  jungle: {
    byTask: {
      "row 20 east of the spike pit and its stair to the puzzle ledge: grenade rubble, M33 (report 15 task 5)": [
        ...["14,100", "15,101", "16,100", "17,104", "18,101", "19,103", "20,61"],
      ],
      "row 11 jeep ledge: waterfall steps after the stone puzzle, M34 (report 15 task 6)": ["11,76"],
      "spike pit floor under row 20, a long jump from the M33 rubble drops into it (report 15 hazards)": ["21,45"],
    },
    never: {
      "past the spawn ledge wall tables (112,19) col 116 and (124,19) col 131 (report 15 wall tables)": ["25,104", "25,132"],
      "wall tops under the open sky: pillar col 107, tree col 75, spawn ledge walls cols 116 and 131, border walls cols 21 and 148, rock col 82 (levelmap.py borderFills, patches)": [
        ...["4,107", "6,75", "11,0", "20,116", "20,131", "35,148", "39,82"],
      ],
      "floor tiles not on the report 15 floor flowchart: 2+ rows up or 8+ cells across from a reached floor": [
        ...["13,37", "16,37", "16,39", "16,70", "25,49", "28,65", "28,84", "30,97", "37,122"],
        ...["37,127", "38,120"],
      ],
    },
  },
  jeskyne: {
    byTask: {
      "behind lift 1, the rod unlocks it (report 16 lift lock)": ["20,44", "29,49", "44,44", "51,71"],
      "model differs from report 16 dead end 4 [inferred]: wall columns stop falls, so these open only with the rod": [
        ...["48,122", "49,117", "50,118", "51,116", "52,95", "52,120", "53,91", "53,117", "54,90", "54,120", "55,92", "55,116", "56,90"],
        ...["56,116", "57,93", "58,92", "59,87", "59,110", "60,88", "60,108", "61,86", "61,110", "62,88", "62,109", "63,16", "63,87"],
        ...["63,111", "64,64", "64,86", "64,110", "65,88", "65,105", "66,86", "66,97", "67,62", "74,21", "74,45", "74,50", "74,53"],
        ...["74,56", "74,63", "74,66", "74,69", "74,76", "74,93", "46,81", "53,85"],
      ],
      "east of the crystal on floor 29, the stalactite shot loads M42 (report 16 shots)": [
        ...["15,92", "16,126", "17,128", "18,126", "19,127", "20,125", "21,86", "21,99", "21,101", "22,133", "23,71", "23,135", "24,134"],
        ...["25,133", "26,135", "27,133", "28,134", "29,64", "29,135", "30,131", "31,122", "32,119", "33,117", "34,119", "35,118"],
        ...["36,117", "37,58", "37,120", "38,119", "39,92", "39,126", "40,88", "40,126", "24,63", "24,92"],
      ],
    },
    never: {
      "marker 13 energy ledge under floor 63, an exact jump (report 16 dead end 2)": ["72,16"],
      "rock tops nobody reaches: hanging wall columns 76 and 89, the col 96 wall and the alcove over the east ledge stair (levelmap.py patches)": [
        ...["17,137", "39,76", "48,89", "61,96"],
      ],
    },
  },
};

const START_CHAIN = ["28,15", "36,24", "43,20", "55,35"];

function oneWay(w: SandboxWorld, back: (spawn: string) => string): string[] {
  const { r, g, spawn, from } = openGraph(w);
  return r.runs.map(id).filter((n) => from.has(n) && !r.reach(g, n).has(back(spawn)));
}

describe("mission reach", () => {
  it.each(MISSIONS)("%s reaches every floor from the spawn except gated runs", (mission) => {
    const { r, from } = openGraph(loadMission(mission));
    const gated = [...Object.values(GATED[mission].byTask), ...Object.values(GATED[mission].never)].flat();
    expect(r.runs.map(id).filter((n) => !from.has(n) && !gated.includes(n))).toEqual([]);
    expect(gated.filter((n) => from.has(n) || !r.runs.some((run) => id(run) === n))).toEqual([]);
  });

  it.each(MISSIONS)("%s reaches every floor but the never runs once every task gate is open", (mission) => {
    const { r, from } = openGraph(opened(mission));
    const never = Object.values(GATED[mission].never).flat();
    expect(r.runs.map(id).filter((n) => !from.has(n)).sort()).toEqual([...never].sort());
  });

  it("jeskyne one-way drops match report 16", () => {
    expect(oneWay(loadMission("jeskyne"), (spawn) => spawn)).toEqual(START_CHAIN);
    const open = loadSandbox(variant(missionJson("jeskyne"), "tankShot"));
    open.flags.add(open.lifts[0]!.enabledBy!);
    const { r, from } = openGraph(open);
    const lower = r.runs.filter((run) => run.row >= 46 && from.has(id(run))).map(id);
    expect(lower.length).toBeGreaterThan(0);
    expect(oneWay(open, () => stopId(0, open.lifts[0]!.top))).toEqual(lower.filter((n) => !START_CHAIN.includes(n)));
  });
});
