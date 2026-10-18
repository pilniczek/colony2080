import { describe, expect, it } from "vitest";
import { hudSvg, type HudIcons, type HudState } from "./svg";

const icons: HudIcons = { gun: { url: "gun.png", w: 35, h: 14 }, fist: { url: "fist.png", w: 20, h: 15 } };
const base: HudState = { weapon: 0, bonus: false, ammo: 350, bonusAmmo: 0, life: 50, reserve: 100, shields: 3, item: "" };
const count = (svg: string, text: string): number => svg.split(text).length - 1;

describe("hudSvg", () => {
  it("lights only the active weapon slot", () => {
    const svg = hudSvg(320, base, icons);
    expect(count(svg, 'fill="url(#lampOn)"')).toBe(1);
    expect(count(svg, 'fill="url(#lampOff)"')).toBe(1);
  });

  it("shows the bonus slot and its lamp only when the bonus weapon is owned", () => {
    expect(hudSvg(320, base, icons)).not.toContain("N:012");
    const svg = hudSvg(320, { ...base, bonus: true, bonusAmmo: 12, weapon: 2 }, icons);
    expect(svg).toContain("N:012");
    expect(count(svg, 'fill="url(#lampOff)"')).toBe(2);
  });

  it("lights one shield light per shield", () => {
    expect(count(hudSvg(320, base, icons), 'fill="url(#shieldOn)"')).toBe(3);
  });

  it("shows the ammo counter, badge and item text", () => {
    const svg = hudSvg(320, { ...base, item: "PACIDLO" }, icons);
    expect(svg).toContain("N:350");
    expect(svg).toContain("C2080");
    expect(svg).toContain("PACIDLO");
  });
});
