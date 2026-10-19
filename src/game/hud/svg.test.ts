import { describe, expect, it } from "vitest";
import { hudSvg as render, keyLabel, type HudIcons, type HudKeys, type HudState } from "./svg";

const icons: HudIcons = { gun: { url: "gun.png", w: 35, h: 14 }, fist: { url: "fist.png", w: 20, h: 15 }, items: { crowbar: { url: "crowbar.png", w: 24, h: 7 } } };
const base: HudState = { weapon: 0, bonus: false, ammo: 350, bonusAmmo: 0, life: 50, reserve: 100, shields: 3, running: true, items: [] };
const keys: HudKeys = { weapons: ["1", "2", "3"], run: "ALT" };
const hudSvg = (W: number, H: number, s: HudState, i: HudIcons): string => render(W, H, s, i, keys);
const count = (svg: string, text: string): number => svg.split(text).length - 1;

describe("hudSvg", () => {
  it("glows the active weapon and dims the others", () => {
    const svg = hudSvg(320, 200, base, icons);
    expect(count(svg, 'filter="url(#iconDim)"')).toBe(1);
    expect(svg).toContain('<g filter="url(#iconGlow)"><image href="gun.png"');
  });

  it("shows the bonus slot only when the bonus weapon is owned", () => {
    expect(hudSvg(320, 200, base, icons)).not.toContain(">012</text>");
    const svg = hudSvg(320, 200, { ...base, bonus: true, bonusAmmo: 12, weapon: 2 }, icons);
    expect(svg).toContain(">012</text>");
    expect(count(svg, 'filter="url(#iconDim)"')).toBe(2);
  });

  it("lights the RUN key only in run mode and keeps the RUN text unlit", () => {
    const litKey = /fill="#ff4a26"[^>]*>ALT</;
    const running = hudSvg(320, 200, base, icons);
    expect(running).toMatch(litKey);
    expect(running).toContain(`fill="#a8844a">RUN</text>`);
    expect(hudSvg(320, 200, { ...base, running: false }, icons)).not.toMatch(litKey);
  });

  it("lights one shield light per shield", () => {
    expect(count(hudSvg(320, 200, base, icons), 'fill="url(#shieldOn)"')).toBe(3);
  });

  it("shows the ammo counter and badge", () => {
    const svg = hudSvg(320, 200, base, icons);
    expect(svg).toContain(">350</text>");
    expect(svg).toContain("C2080");
  });

  describe("inventory slot", () => {
    const handX = (svg: string): number => Number(/<g transform="translate\(([\d.]+) 0\)"><g transform="translate\(0 2\.6\)"/.exec(svg)![1]);
    const crowbarX = (svg: string): number => Number(/<image href="crowbar\.png" x="([\d.]+)"/.exec(svg)![1]);

    it("draws the crowbar icon right of the hand when it is held", () => {
      const svg = hudSvg(320, 200, { ...base, items: ["crowbar"] }, icons);
      expect(crowbarX(svg)).toBeGreaterThan(handX(svg));
    });

    it("draws the hand alone when nothing is held", () => {
      const svg = hudSvg(320, 200, base, icons);
      expect(handX(svg)).toBeGreaterThan(0);
      expect(svg).not.toContain("crowbar.png");
    });

    it("skips a held item without an icon", () => {
      expect(hudSvg(320, 200, { ...base, items: ["unknown"] }, icons)).not.toContain("<image href=\"undefined");
    });
  });

  it("shows a key on each owned weapon slot and on the RUN panel", () => {
    const keyText = (label: string): string => `>${label}</text>`;
    const svg = hudSvg(320, 200, base, icons);
    expect(svg).toContain(keyText("1"));
    expect(svg).toContain(keyText("2"));
    expect(svg).not.toContain(keyText("3"));
    expect(svg).toContain(keyText("ALT"));
    expect(hudSvg(320, 200, { ...base, bonus: true }, icons)).toContain(keyText("3"));
  });

  it("glows red only the key of the selected weapon", () => {
    const glowing = (svg: string): string[] => [...svg.matchAll(/fill="#ff4a26"[^>]*>([^<]+)</g)].map((m) => m[1]!);
    const walking = { ...base, running: false };
    expect(glowing(hudSvg(320, 200, walking, icons))).toEqual(["1"]);
    expect(glowing(hudSvg(320, 200, { ...walking, weapon: 1 }, icons))).toEqual(["2"]);
  });
});

describe("keyLabel", () => {
  it("turns key codes into short labels", () => {
    expect(keyLabel("Digit1")).toBe("1");
    expect(keyLabel("AltLeft")).toBe("ALT");
    expect(keyLabel("KeyI")).toBe("I");
    expect(keyLabel("Escape")).toBe("ESCAPE");
  });
});
