import { describe, expect, it } from "vitest";
import { HAND_BOX, SLOT, topBar, WEAPON_W } from "./layout";
import { hudSvg as render, keyLabel, type HudIcons, type HudKeys, type HudState } from "./svg";

const ICON = { w: HAND_BOX.w, h: HAND_BOX.h };
const icons: HudIcons = { gun: { url: "gun.png", w: 35, h: 14 }, fist: { url: "fist.png", w: 20, h: 15 }, items: { crowbar: { url: "crowbar.png", ...ICON }, craneKey: { url: "craneKey.png", ...ICON }, wires: { url: "wires.png", ...ICON } } };
const base: HudState = { weapon: 0, bonus: false, ammo: 350, bonusAmmo: 0, life: 50, shields: 3, running: true, item: null };
const keys: HudKeys = { weapons: ["1", "2", "3"], run: "ALT", item: "ENTER" };
const hudSvg = (W: number, H: number, s: HudState, i: HudIcons): string => render(W, H, s, i, keys);
const count = (svg: string, text: string): number => svg.split(text).length - 1;

describe("hudSvg", () => {
  it("glows the active weapon and dims the others", () => {
    const svg = hudSvg(320, 200, base, icons);
    expect(count(svg, 'filter="url(#iconDim)"')).toBe(1);
    expect(svg).toContain('<g filter="url(#iconGlow)"><image href="gun.png"');
  });

  it("shows the bonus slot only when the bonus weapon is owned", () => {
    expect(hudSvg(320, 200, base, icons)).not.toContain(">12</text>");
    const svg = hudSvg(320, 200, { ...base, bonus: true, bonusAmmo: 12, weapon: 2 }, icons);
    expect(svg).toContain(">12</text>");
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

  it("right-aligns the ammo counter at the icon edge without leading zeros", () => {
    const { weapons } = topBar(320);
    const counter = (ammo: number): RegExpExecArray | null => new RegExp(`<text x="([\\d.]+)" y="16" text-anchor="end"[^>]*>(\\d+)</text>`).exec(hudSvg(320, 200, { ...base, ammo }, icons));
    for (const [ammo, text] of [[0, "0"], [99, "99"], [350, "350"], [109999, "109999"]] as const) {
      const m = counter(ammo)!;
      expect(m[2]).toBe(text);
      expect(Number(m[1])).toBeCloseTo(weapons[0]! + WEAPON_W[0]!, 9);
    }
  });

  describe("slot 3", () => {
    const tabLetters = (svg: string): { x: number; label: string; lit: boolean }[] =>
      [...svg.matchAll(/<text x="([\d.]+)" y="[\d.]+" text-anchor="middle"[^>]*font-size="3\.4" fill="(#[0-9a-f]+)"[^>]*>([^<]*)<\/text>/g)].map((m) => ({ x: Number(m[1]), label: m[3]!, lit: m[2] === "#ff4a26" }));
    const slotKey = (svg: string): { x: number; label: string; lit: boolean } | undefined => {
      const { weapons } = topBar(320);
      return tabLetters(svg).find((t) => t.label === "3" && Math.abs(t.x - (weapons[2]! + 17)) < 1e-6 && t.lit);
    };
    const slotKeyAny = (svg: string): boolean => {
      const { weapons } = topBar(320);
      return tabLetters(svg).some((t) => t.label === "3" && Math.abs(t.x - (weapons[2]! + 17)) < 1e-6);
    };

    it("renders the icon, counter and lit key 3 when the bonus weapon is active", () => {
      const svg = hudSvg(320, 200, { ...base, bonus: true, weapon: 2, bonusAmmo: 400 }, icons);
      expect(svg).toContain(">400</text>");
      expect(svg).toContain('fill="#7ae0ff"');
      expect(slotKey(svg)).toBeDefined();
    });

    it("leaves key 3 unlit when another weapon is active", () => {
      const svg = hudSvg(320, 200, { ...base, bonus: true, weapon: 0, bonusAmmo: 400 }, icons);
      expect(slotKeyAny(svg)).toBe(true);
      expect(slotKey(svg)).toBeUndefined();
    });

    it("renders no icon, counter or key tab without the bonus weapon", () => {
      const svg = hudSvg(320, 200, base, icons);
      expect(svg).not.toContain('fill="#7ae0ff"');
      expect(slotKeyAny(svg)).toBe(false);
      expect([...new Set(tabLetters(svg).map((t) => t.label))]).toEqual(["1", "2", "ALT", "ENTER"]);
    });
  });

  it("right-aligns the bonus counter at the blaster edge", () => {
    const { weapons } = topBar(320);
    const svg = hudSvg(320, 200, { ...base, bonus: true, bonusAmmo: 7 }, icons);
    expect(svg).toContain(`<text x="${weapons[2]! + WEAPON_W[2]!}" y="16" text-anchor="end"`);
  });

  it("shows the ammo counter and badge", () => {
    const svg = hudSvg(320, 200, base, icons);
    expect(svg).toContain(">350</text>");
    expect(svg).toContain("C2080");
  });

  describe("inventory slot", () => {
    const handX = (svg: string): number | null => {
      const m = /<g transform="translate\(([\d.]+) [\d.]+\) scale\([\d.]+\) translate\([-\d.]+ [-\d.]+\)"><g transform="translate\(0 2\.6\)"/.exec(svg);
      return m ? Number(m[1]) - HAND_BOX.w / 2 : null;
    };
    const imageX = (svg: string, file: string): number => Number(new RegExp(`<image href="${file}" x="([\\d.]+)"`).exec(svg)![1]);
    const bar = hudSvg(320, 200, base, icons);

    it("replaces the hand with the shown item and labels it with its name", () => {
      const svg = hudSvg(320, 200, { ...base, item: "craneKey" }, icons);
      expect(imageX(svg, "craneKey.png") + ICON.w / 2).toBeCloseTo(handX(bar)! + HAND_BOX.w / 2, 6);
      expect(handX(svg)).toBeNull();
      expect(svg).toContain(">crane key</text>");
      expect(svg).not.toContain(">nothing</text>");
    });

    it("centres the label in the free space right of the icon column", () => {
      const { inv, invW } = topBar(320);
      const svg = hudSvg(320, 200, { ...base, item: "craneKey" }, icons);
      const x = Number(/<text x="([\d.]+)"[^>]*>crane key<\/text>/.exec(svg)![1]);
      expect(x).toBeCloseTo((inv + SLOT.pad + SLOT.iconW + SLOT.gap + inv + invW - SLOT.pad) / 2, 6);
    });

    it("shows the icon and name of a newly drawn item", () => {
      const svg = hudSvg(320, 200, { ...base, item: "wires" }, icons);
      expect(svg).toContain('<image href="wires.png"');
      expect(svg).toContain(">wires</text>");
    });

    it("shows the hand and nothing when no item is shown", () => {
      expect(handX(bar)).toBeGreaterThan(0);
      expect(bar).toContain(">nothing</text>");
      expect(bar).not.toContain("crowbar.png");
    });
  });

  it("shows a key on each owned weapon slot and on the RUN panel", () => {
    const keyText = (label: string): string => `>${label}</text>`;
    const svg = hudSvg(320, 200, base, icons);
    expect(svg).toContain(keyText("1"));
    expect(svg).toContain(keyText("2"));
    expect(svg).not.toContain(keyText("3"));
    expect(svg).toContain(keyText("ALT"));
    expect(svg).toContain(keyText("ENTER"));
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
