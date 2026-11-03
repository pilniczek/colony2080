import { describe, expect, it } from "vitest";
import { cfg, game, run, tick, type Game } from "../hero/testWorld";
import { guardLook } from "./guards";
import { missionJson } from "./missions";

const vesnice = () => ({ ...missionJson("vesnice"), enemies: [] });
const guardOf = (g: Game) => g.world.props.find((p) => p.id === "radioGuard")!;

describe("vesnice walkie-talkie guard", () => {
  it("fires bursts at a hero on its right and hurts him", () => {
    const g = game({ x: 66.5, y: 23 }, vesnice());
    tick(g);
    run(g, 1);
    expect(g.hero.energy).toBeLessThan(cfg.energy.max);
  });

  it("shows its firing art while it fires", () => {
    const g = game({ x: 66.5, y: 23 }, vesnice());
    tick(g);
    expect(guardLook(guardOf(g))).toEqual({ state: 1, t: expect.any(Number) });
  });

  it("stays as a wreck and stops firing once down", () => {
    const g = game({ x: 66.5, y: 23 }, vesnice());
    const guard = guardOf(g);
    guard.state = guard.shootable!.state;
    run(g, 1);
    expect(g.hero.energy).toBe(cfg.energy.max);
    expect(guardLook(guard)).toBeNull();
  });
});
