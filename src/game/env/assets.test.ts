import { describe, expect, it } from "vitest";
import objects from "@config/levels/mesto/objects.json";
import tasks from "@config/levels/mesto/tasks.json";
import world from "@config/levels/mesto/world.json";
import { assetList, ASSETS, isAssetId } from "./assets";

interface WorldProp {
  kind: string;
  id?: string;
  asset?: string;
  state?: number;
}

interface TaskRow {
  object: string;
  state?: number;
  sets?: Record<string, number>;
}

const props = world.props as WorldProp[];
const rows = tasks.tasks as TaskRow[];
const stateCount = (asset: string): number => Math.max(1, objects.objects.find((o) => o.id === asset)?.states.length ?? 1);
const assetOf = (id: string): string | undefined => props.find((p) => p.id === id)?.asset;
const STATELESS_GATES = ["metroTunnel"];
const ART_OF: Record<string, string> = { damagedLift: "liftPanel" };

describe("ASSETS", () => {
  it("has every collected asset under its id and nothing else", () => {
    expect(Object.keys(ASSETS).sort()).toEqual(assetList.map((a) => a.id).sort());
    for (const a of assetList) expect(isAssetId(a.id)).toBe(true);
  });
  it("rejects unknown ids", () => {
    expect(isAssetId("nope")).toBe(false);
  });
  it("registers every mesto prop and scenery asset", () => {
    const used = [world.sky, ...world.backdrop.map((s) => s.asset), ...world.dressing.map((s) => s.asset), ...props.flatMap((p) => (p.asset ? [p.asset] : []))];
    for (const id of used) expect(isAssetId(id), id).toBe(true);
  });
  it("draws every mesto object and gate with its own asset", () => {
    for (const p of props) {
      if (p.kind === "item" || STATELESS_GATES.includes(p.id ?? "")) continue;
      expect(p.asset, p.id).toBe(ART_OF[p.id ?? ""] ?? p.id);
    }
  });
  it("keeps every prop, task and gate state inside its asset's states", () => {
    for (const p of props) if (p.asset) expect(p.state ?? 0, p.id).toBeLessThan(stateCount(p.asset));
    for (const t of rows) {
      const asset = assetOf(t.object);
      if (t.state !== undefined) {
        expect(asset, t.object).toBeDefined();
        expect(t.state, t.object).toBeLessThan(stateCount(asset!));
      }
      for (const [gate, state] of Object.entries(t.sets ?? {})) {
        const gateAsset = assetOf(gate);
        if (gateAsset) expect(state, gate).toBeLessThan(stateCount(gateAsset));
      }
    }
  });
});
