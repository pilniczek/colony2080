import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { useSandbox } from "../store";
import type { SandboxCommands } from "./Panel";
import { Recorder } from "./Recorder";

const noop = (): void => undefined;
const commands: SandboxCommands = {
  step: noop,
  startRecording: noop,
  stopRecording: noop,
  replay: noop,
  setWeapon: noop,
  hit: noop,
  kill: noop,
  setAmmo: noop,
  setBlaster: noop,
  setShields: noop,
  setFog: noop,
  playFilm: noop,
};

const markup = (blaster: number | null): string => {
  Object.assign(useSandbox.getInitialState(), { blaster, ammo: 30 });
  return renderToStaticMarkup(createElement(Recorder, { commands }));
};

const button = (html: string, label: string): string => html.match(new RegExp(`<button[^>]*>${label}</button>`))?.[0] ?? "";

describe("run section", () => {
  it("shows the Blaster button after Gun", () => {
    const html = markup(10);
    expect(html.indexOf(">Blaster<")).toBeGreaterThan(html.indexOf(">Gun<"));
  });

  it("disables the Blaster button without the E-Blaster or its ammo", () => {
    expect(button(markup(null), "Blaster")).toContain("disabled");
    expect(button(markup(0), "Blaster")).toContain("disabled");
    expect(button(markup(10), "Blaster")).not.toContain("disabled");
  });

  it("puts the blaster ammo input under ammo", () => {
    const html = markup(null);
    expect(html.indexOf("<span>blaster ammo</span>")).toBeGreaterThan(html.indexOf("<span>ammo</span>"));
    expect(html.indexOf("<span>blaster ammo</span>")).toBeLessThan(html.indexOf("<span>shields</span>"));
  });
});
