import { describe, expect, it } from "vitest";
import { hudSvg, type HudIcons, type HudState } from "./svg";

const icons: HudIcons = { gun: { url: "gun.png", w: 35, h: 14 }, fist: { url: "fist.png", w: 20, h: 15 } };
const base: HudState = { weapon: 0, bonus: false, ammo: 350, bonusAmmo: 0, life: 50, reserve: 100, shields: 3, running: true, item: "" };
const count = (svg: string, text: string): number => svg.split(text).length - 1;

describe("hudSvg", () => {
  it("glows the active weapon and dims the others", () => {
    const svg = hudSvg(320, 200, base, icons);
    expect(count(svg, 'filter="url(#iconDim)"')).toBe(1);
    expect(svg).toContain('<g filter="url(#iconGlow)"><image href="gun.png"');
  });

  it("shows the bonus slot only when the bonus weapon is owned", () => {
    expect(hudSvg(320, 200, base, icons)).not.toContain("N:012");
    const svg = hudSvg(320, 200, { ...base, bonus: true, bonusAmmo: 12, weapon: 2 }, icons);
    expect(svg).toContain("N:012");
    expect(count(svg, 'filter="url(#iconDim)"')).toBe(2);
  });

  it("lights the RUN panel text only in run mode", () => {
    const lit = 'filter="url(#glow)">RUN</text>';
    expect(count(hudSvg(320, 200, base, icons), lit)).toBe(1);
    const walking = hudSvg(320, 200, { ...base, running: false }, icons);
    expect(count(walking, ">RUN</text>")).toBe(1);
    expect(count(walking, lit)).toBe(0);
  });

  it("lights one shield light per shield", () => {
    expect(count(hudSvg(320, 200, base, icons), 'fill="url(#shieldOn)"')).toBe(3);
  });

  it("shows the ammo counter, badge and item text", () => {
    const svg = hudSvg(320, 200, { ...base, item: "PACIDLO" }, icons);
    expect(svg).toContain("N:350");
    expect(svg).toContain("C2080");
    expect(svg).toContain("PACIDLO");
  });
});
