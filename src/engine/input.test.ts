import { describe, expect, it } from "vitest";
import { Input, type Bindings } from "./input";

const bindings: Bindings = {
  moveLeft: ["ArrowLeft"],
  moveRight: ["ArrowRight"],
  down: ["ArrowDown"],
  pickUp: ["ArrowDown", "Enter"],
  useItem: ["Enter"],
  shoot: ["ControlLeft"],
};

function make(bufferMs = 150) {
  const clock = { t: 0 };
  const input = new Input(bindings, () => clock.t, bufferMs);
  return { input, clock };
}

type Listener = (event: unknown) => void;

function fakeTarget() {
  const listeners = new Map<string, Set<Listener>>();
  return {
    addEventListener: (type: string, fn: Listener) => {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type)!.add(fn);
    },
    removeEventListener: (type: string, fn: Listener) => {
      listeners.get(type)?.delete(fn);
    },
    dispatch: (type: string, event: object = {}) => {
      listeners.get(type)?.forEach((fn) => fn(event));
    },
    count: () => [...listeners.values()].reduce((n, s) => n + s.size, 0),
  };
}

function key(code: string, repeat = false) {
  const event = { code, repeat, prevented: false, preventDefault: () => (event.prevented = true) };
  return event;
}

describe("Input", () => {
  it("dir follows the last pressed direction still held", () => {
    const { input } = make();
    input.keyDown("ArrowRight");
    input.keyDown("ArrowLeft");
    expect(input.frame().dir).toBe(-1);
    input.keyUp("ArrowLeft");
    expect(input.frame().dir).toBe(1);
    input.keyUp("ArrowRight");
    expect(input.frame().dir).toBe(0);
  });

  it("returns whether the code is bound", () => {
    const { input } = make();
    expect(input.keyDown("KeyQ")).toBe(false);
    expect(input.keyUp("KeyQ")).toBe(false);
    expect(input.keyDown("ControlLeft")).toBe(true);
    expect(input.keyUp("ControlLeft")).toBe(true);
  });

  it("one code drives every action bound to it", () => {
    const { input } = make();
    input.keyDown("ArrowDown");
    expect([...input.frame().held].sort()).toEqual(["down", "pickUp"]);
    input.keyUp("ArrowDown");
    input.keyDown("Enter");
    expect([...input.frame().held].sort()).toEqual(["pickUp", "useItem"]);
    expect(input.consume("pickUp")).toBe(true);
    expect(input.consume("useItem")).toBe(true);
  });

  it("releaseAll empties held and dir", () => {
    const { input } = make();
    input.keyDown("ArrowLeft");
    input.keyDown("ControlLeft");
    input.releaseAll();
    const frame = input.frame();
    expect(frame.held.size).toBe(0);
    expect(frame.dir).toBe(0);
  });

  it("buffers a press until consumed or older than bufferMs", () => {
    const { input, clock } = make(150);
    input.keyDown("ControlLeft");
    input.keyUp("ControlLeft");
    clock.t = 100;
    expect(input.frame().pressed.has("shoot")).toBe(true);
    expect(input.consume("shoot")).toBe(true);
    expect(input.consume("shoot")).toBe(false);

    clock.t = 1000;
    input.keyDown("ControlLeft", 1000);
    input.keyUp("ControlLeft");
    clock.t = 1200;
    expect(input.consume("shoot")).toBe(false);
    expect(input.frame().pressed.has("shoot")).toBe(false);
  });

  it("holding a key does not re-press it", () => {
    const { input } = make();
    input.keyDown("ControlLeft");
    expect(input.consume("shoot")).toBe(true);
    input.keyDown("ControlLeft");
    expect(input.consume("shoot")).toBe(false);
  });

  it("replays a recording frame by frame and ignores live keys", () => {
    const { input } = make();
    input.startRecording();
    input.keyDown("ArrowRight");
    const a = input.frame();
    input.keyUp("ArrowRight");
    input.keyDown("ControlLeft");
    const b = input.frame();
    const record = input.stopRecording();
    expect(record.length).toBe(3);

    input.releaseAll();
    input.play(record);
    input.keyDown("ArrowLeft");
    const pa = input.frame();
    const pb = input.frame();
    expect([...pa.held]).toEqual([...a.held]);
    expect([...pb.held]).toEqual([...b.held]);
    expect(pa.dir).toBe(a.dir);
    expect(pb.dir).toBe(b.dir);
  });

  describe("attach", () => {
    it("releases everything on blur", () => {
      const { input } = make();
      const target = fakeTarget();
      input.attach(target as unknown as Window, Object.assign(fakeTarget(), { visibilityState: "visible" }));
      target.dispatch("keydown", key("ArrowLeft"));
      expect(input.frame().held.has("moveLeft")).toBe(true);
      target.dispatch("blur");
      expect(input.frame().held.size).toBe(0);
    });

    it("releases everything when the tab is hidden", () => {
      const { input } = make();
      const target = fakeTarget();
      const doc = Object.assign(fakeTarget(), { visibilityState: "visible" });
      input.attach(target as unknown as Window, doc);
      target.dispatch("keydown", key("ControlLeft"));
      doc.visibilityState = "hidden";
      doc.dispatch("visibilitychange");
      expect(input.frame().held.size).toBe(0);
    });

    it("prevents default for bound keys only and ignores repeats", () => {
      const { input } = make();
      const target = fakeTarget();
      input.attach(target as unknown as Window);
      const bound = key("Enter");
      const unbound = key("KeyQ");
      const repeat = key("ArrowLeft", true);
      target.dispatch("keydown", bound);
      target.dispatch("keydown", unbound);
      target.dispatch("keydown", repeat);
      expect(bound.prevented).toBe(true);
      expect(unbound.prevented).toBe(false);
      expect(repeat.prevented).toBe(true);
      expect(input.frame().held.has("moveLeft")).toBe(false);
    });

    it("keyup releases and detach removes listeners", () => {
      const { input } = make();
      const target = fakeTarget();
      const detach = input.attach(target as unknown as Window);
      target.dispatch("keydown", key("ControlLeft"));
      target.dispatch("keyup", key("ControlLeft"));
      expect(input.frame().held.size).toBe(0);
      detach();
      expect(target.count()).toBe(0);
    });

    it("ignores live events while playing a record", () => {
      const { input } = make();
      const target = fakeTarget();
      input.attach(target as unknown as Window);
      input.play([]);
      target.dispatch("keydown", key("ControlLeft"));
      expect(input.frame().held.size).toBe(0);
    });
  });
});
