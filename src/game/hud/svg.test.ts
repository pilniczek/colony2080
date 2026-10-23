import { describe, expect, it } from "vitest";
import { BLASTER_BODY_W } from "./blasterIcon";
import { CONTENT_SCALE, HAND_BOX, HAND_INK_H, HIDE_W, ICON_H, MAP_W, MENU_W, MONO_ADVANCE, READOUT_SIZE, SLOT, SPEAKER_H, SPEAKER_INK, SPEAKER_INK_H, SPEAKER_SCALE, SPEAKER_W, TOGGLE_W, topBar, WEAPON_W } from "./layout";
import { applyLive, hudSvg as render, itemPlateW, keyLabel, type HudIcons, type HudKeys, type HudState } from "./svg";

const ICON = { w: HAND_BOX.w, h: HAND_BOX.h };
const icons: HudIcons = { gun: { url: "gun.png", w: 35, h: 14 }, fist: { url: "fist.png", w: 20, h: 15 }, run: { url: "run.png", w: 4, h: ICON_H }, walk: { url: "walk.png", w: 4, h: ICON_H }, items: { crowbar: { url: "crowbar.png", ...ICON }, craneKey: { url: "craneKey.png", ...ICON }, wires: { url: "wires.png", ...ICON } } };
const base: HudState = { weapon: 0, bonus: false, ammo: 350, bonusAmmo: 0, life: 50, shields: 3, running: true, soundOn: true, mapOn: true, mapOpen: false, hidden: false, menuOpen: false, item: null };
const keys: HudKeys = { weapons: ["1", "2", "3"], run: "ALT", sound: "S", hide: "X", map: "M", menu: "ESC", item: "ENTER" };
const hudSvg = (W: number, H: number, s: HudState, i: HudIcons): string => render(W, H, s, i, keys);
const count = (svg: string, text: string): number => svg.split(text).length - 1;

describe("hudSvg", () => {
  it("gives the dim and glow filters one region, so an icon keeps its outline when it lights", () => {
    const region = (svg: string, id: string): string | undefined => new RegExp(`<filter id="${id}"( x="[^"]+" y="[^"]+" width="[^"]+" height="[^"]+")`).exec(svg)?.[1];
    const svg = hudSvg(320, 200, base, icons);
    expect(region(svg, "iconDim")).toBeDefined();
    expect(region(svg, "iconDim")).toBe(region(svg, "iconGlow"));
  });

  it("glows the active weapon and dims the others", () => {
    const svg = hudSvg(320, 200, base, icons);
    expect(count(svg, 'filter="url(#iconDim)"')).toBe(3);
    expect(svg).toContain('<g filter="url(#iconGlow)"><image href="gun.png"');
  });

  it("shows the bonus slot only when the bonus weapon is owned", () => {
    expect(hudSvg(320, 200, base, icons)).not.toContain(">12</text>");
    const svg = hudSvg(320, 200, { ...base, bonus: true, bonusAmmo: 12, weapon: 2 }, icons);
    expect(svg).toContain(">12</text>");
    expect(count(svg, 'filter="url(#iconDim)"')).toBe(4);
  });

  it("shows a running figure instead of the RUN text, glowing in run mode and dimmed when walking", () => {
    const runIcon = (svg: string): string | undefined => /<g filter="url\(#(icon\w+)\)" data-icon="run"/.exec(svg)?.[1];
    const running = hudSvg(320, 200, base, icons);
    expect(running).not.toContain(">RUN</text>");
    expect(runIcon(running)).toBe("iconGlow");
    expect(runIcon(hudSvg(320, 200, { ...base, running: false }, icons))).toBe("iconDim");
  });

  it("shows the walking figure when not in run mode", () => {
    expect(hudSvg(320, 200, base, icons)).toContain('data-icon="run"><image href="run.png"');
    expect(hudSvg(320, 200, { ...base, running: false }, icons)).toContain('data-icon="run"><image href="walk.png"');
  });

  it("centres the running figure on the run slot", () => {
    const { run } = topBar(320, itemPlateW(icons));
    const m = /data-icon="run"><image href="run.png" x="([\d.]+)"/.exec(hudSvg(320, 200, base, icons))!;
    expect(Number(m[1]) + 2).toBeCloseTo(run + TOGGLE_W / 2, 9);
  });

  it("draws one grid panel for the sound, run, hide and map slots and one for the menu slot left of the weapons", () => {
    const svg = hudSvg(320, 200, base, icons);
    const panels = [...svg.matchAll(/<path d="M([\d.]+) 0\.9H([\d.]+)[^"]*" fill="#0b0806"\/>/g)].map((m) => [Number(m[1]), Number(m[2])]);
    expect(panels).toHaveLength(4);
    const { sound, map, menu, weapons } = topBar(320, itemPlateW(icons));
    expect(panels.filter(([a, b]) => a! <= sound && map + MAP_W <= b!)).toHaveLength(1);
    const menuPanels = panels.filter(([a, b]) => a! <= menu && menu + MENU_W <= b!);
    expect(menuPanels).toHaveLength(1);
    expect(menuPanels[0]![1]!).toBeLessThan(weapons[0]!);
  });

  it("bends the panel and plate edges around each key label", () => {
    const svg = hudSvg(320, 200, base, icons);
    const panelNotches = svg.match(/<path d="M[\d.]+ 0\.9H[^"]*" fill="#0b0806"\/>/g)!.join("").match(/ 11\.768\d*H/g) ?? [];
    const plateBulges = svg.match(/<path d="M[\d.]+ 0H[^"]*" fill="url\(#barMetal\)"\/>/g)!.join("").match(/ 16\.708\d*H/g) ?? [];
    expect(panelNotches).toHaveLength(8);
    expect(plateBulges).toHaveLength(8);
  });

  it("lights the S, ALT and M key tabs under their own icons per state", () => {
    const { sound, run, map } = topBar(320, itemPlateW(icons));
    const tab = (svg: string, label: string): { x: number; lit: boolean } | undefined => {
      const m = new RegExp(`<text x="([\\d.]+)" y="[\\d.]+" text-anchor="middle"[^>]*font-size="3\\.4" fill="(#ff4a26|#1a140f)"[^>]*>${label}</text>`).exec(svg);
      return m ? { x: Number(m[1]), lit: m[2] === "#ff4a26" } : undefined;
    };
    for (const [soundOn, running, mapOpen] of [[true, false, true], [false, true, false]] as const) {
      const svg = hudSvg(320, 200, { ...base, soundOn, running, mapOpen }, icons);
      expect(tab(svg, "S")).toEqual({ x: expect.closeTo(sound + SPEAKER_W / 2, 9), lit: soundOn });
      expect(tab(svg, "ALT")).toEqual({ x: expect.closeTo(run + TOGGLE_W / 2, 9), lit: running });
      expect(tab(svg, "M")).toEqual({ x: expect.closeTo(map + MAP_W / 2, 9), lit: mapOpen });
    }
  });

  it("draws the MENU label centred on the menu slot in the item name colour, glowing with ESC lit only while the menu is open", () => {
    const { menu } = topBar(320, itemPlateW(icons));
    const icon = (svg: string): RegExpExecArray => /<g(?: filter="url\(#(icon\w+)\)")? data-icon="menu"><text x="([\d.]+)"[^>]*fill="([^"]+)">MENU<\/text>/.exec(svg)!;
    const tab = (svg: string): RegExpExecArray => /<text x="([\d.]+)" y="[\d.]+" text-anchor="middle"[^>]*font-size="3\.4" fill="(#ff4a26|#1a140f)"[^>]*>ESC<\/text>/.exec(svg)!;
    const shut = hudSvg(320, 200, base, icons);
    expect(icon(shut)[1]).toBeUndefined();
    expect(icon(shut)[3]).toBe(/fill="([^"]+)">nothing<\/text>/.exec(shut)![1]);
    expect(Number(icon(shut)[2])).toBeCloseTo(menu + MENU_W / 2, 9);
    expect(Number(tab(shut)[1])).toBeCloseTo(menu + MENU_W / 2, 9);
    expect(tab(shut)[2]).toBe("#1a140f");
    const open = hudSvg(320, 200, { ...base, menuOpen: true }, icons);
    expect(icon(open)[1]).toBe("iconGlow");
    expect(tab(open)[2]).toBe("#ff4a26");
  });

  it("draws an open eye on the hide slot, crossed, glowing and with X lit only while the hero hides", () => {
    const { hide } = topBar(320, itemPlateW(icons));
    const icon = (svg: string): RegExpExecArray => /<g filter="url\(#(icon\w+)\)" data-icon="hide"><g transform="translate\(([\d.]+) /.exec(svg)!;
    const tab = (svg: string): RegExpExecArray => /<text x="([\d.]+)" y="[\d.]+" text-anchor="middle"[^>]*font-size="3\.4" fill="(#ff4a26|#1a140f)"[^>]*>X<\/text>/.exec(svg)!;
    const open = hudSvg(320, 200, base, icons);
    expect(icon(open)[1]).toBe("iconDim");
    expect(Number(icon(open)[2])).toBeCloseTo(hide + HIDE_W / 2, 9);
    expect(Number(tab(open)[1])).toBeCloseTo(hide + HIDE_W / 2, 9);
    expect(tab(open)[2]).toBe("#1a140f");
    const slash = (svg: string): boolean => /data-icon="hide">.*?M-3\.3 3\.3L3\.3 -3\.3.*?<\/g><\/g>/s.test(svg);
    expect(slash(open)).toBe(false);
    const hidden = hudSvg(320, 200, { ...base, hidden: true }, icons);
    expect(slash(hidden)).toBe(true);
    expect(icon(hidden)[1]).toBe("iconGlow");
    expect(tab(hidden)[2]).toBe("#ff4a26");
  });

  describe("map slot", () => {
    const mapIcon = (svg: string): RegExpExecArray | null => /<g filter="url\(#(icon\w+)\)" data-icon="map"( data-map="none")?><g transform="translate\(([\d.]+) /.exec(svg);

    it("draws the folded map centred on the map slot, glowing only while the map screen is open", () => {
      const { map } = topBar(320, itemPlateW(icons));
      const shut = mapIcon(hudSvg(320, 200, base, icons))!;
      expect(shut[1]).toBe("iconDim");
      expect(shut[2]).toBeUndefined();
      expect(Number(shut[3])).toBeCloseTo(map + MAP_W / 2, 9);
      expect(mapIcon(hudSvg(320, 200, { ...base, mapOpen: true }, icons))![1]).toBe("iconGlow");
    });

    it("draws a question mark instead of the map while the hero has no map", () => {
      const m = mapIcon(hudSvg(320, 200, { ...base, mapOn: false }, icons))!;
      expect(m[1]).toBe("iconDim");
      expect(m[2]).toBe(' data-map="none"');
    });
  });

  describe("sound slot", () => {
    const soundIcon = (svg: string): RegExpExecArray | null => /<g filter="url\(#(icon\w+)\)" data-icon="sound"( data-sound="off")?><g transform="translate\(([\d.]+) /.exec(svg);
    const soundTab = (svg: string): { x: number; fill: string }[] =>
      [...svg.matchAll(/<text x="([\d.]+)" y="[\d.]+" text-anchor="middle"[^>]*font-size="3\.4" fill="(#[0-9a-f]+)"[^>]*>S<\/text>/g)].map((m) => ({ x: Number(m[1]), fill: m[2]! }));

    it("draws a glowing speaker centred on the sound slot when sound is on", () => {
      const { sound } = topBar(320, itemPlateW(icons));
      const m = soundIcon(hudSvg(320, 200, base, icons))!;
      expect(m[1]).toBe("iconGlow");
      expect(m[2]).toBeUndefined();
      expect(Number(m[3])).toBeCloseTo(sound + SPEAKER_INK.left * SPEAKER_SCALE, 9);
    });

    it("draws a dimmed crossed speaker when sound is off", () => {
      const m = soundIcon(hudSvg(320, 200, { ...base, soundOn: false }, icons))!;
      expect(m[1]).toBe("iconDim");
      expect(m[2]).toBe(' data-sound="off"');
    });

    it("lights the S key tab only while sound is on", () => {
      const { sound } = topBar(320, itemPlateW(icons));
      const on = soundTab(hudSvg(320, 200, base, icons));
      const off = soundTab(hudSvg(320, 200, { ...base, soundOn: false }, icons));
      expect(on.find((t) => t.fill === "#ff4a26")?.x).toBeCloseTo(sound + SPEAKER_W / 2, 9);
      expect(off.find((t) => t.fill === "#1a140f")?.x).toBeCloseTo(sound + SPEAKER_W / 2, 9);
      expect(off.some((t) => t.fill === "#ff4a26")).toBe(false);
    });
  });

  it("lights one shield light per shield", () => {
    expect(count(hudSvg(320, 200, base, icons), 'fill="url(#shieldOn)"')).toBe(3);
  });

  it("right-aligns the ammo counter at the icon edge without leading zeros", () => {
    const { weapons } = topBar(320, itemPlateW(icons));
    const counter = (ammo: number): RegExpExecArray | null => new RegExp(`<text x="([\\d.]+)" y="[\\d.]+" text-anchor="end"[^>]*>(\\d+)</text>`).exec(hudSvg(320, 200, { ...base, ammo }, icons));
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
      const { weapons } = topBar(320, itemPlateW(icons));
      return tabLetters(svg).find((t) => t.label === "3" && Math.abs(t.x - (weapons[2]! + (BLASTER_BODY_W * CONTENT_SCALE) / 2)) < 1e-6 && t.lit);
    };
    const slotKeyAny = (svg: string): boolean => {
      const { weapons } = topBar(320, itemPlateW(icons));
      return tabLetters(svg).some((t) => t.label === "3" && Math.abs(t.x - (weapons[2]! + (BLASTER_BODY_W * CONTENT_SCALE) / 2)) < 1e-6);
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
      expect([...new Set(tabLetters(svg).map((t) => t.label))]).toEqual(["ESC", "1", "2", "S", "ALT", "X", "M", "ENTER"]);
    });
  });

  it("right-aligns the bonus counter at the blaster edge", () => {
    const { weapons } = topBar(320, itemPlateW(icons));
    const svg = hudSvg(320, 200, { ...base, bonus: true, bonusAmmo: 7 }, icons);
    expect(svg).toMatch(new RegExp(`<text x="${weapons[2]! + WEAPON_W[2]!}" y="[\\d.]+" text-anchor="end"`));
  });

  it("shows the ammo counter and badge", () => {
    const svg = hudSvg(320, 200, base, icons);
    expect(svg).toContain(">350</text>");
    expect(svg).toContain("C2080");
  });

  describe("icon sizes", () => {
    const svg = hudSvg(320, 200, base, icons);
    const scaleOf = (re: RegExp): number => Number(re.exec(svg)![1]);
    const hand = scaleOf(/translate\([\d.]+ [\d.]+\) scale\(([\d.]+)\) translate\([-\d.]+ [-\d.]+\)"><g fill=/);
    const sound = scaleOf(/data-icon="sound"[^>]*><g transform="translate\([\d.]+ [\d.]+\) scale\(([\d.]+)\)"/);

    it("draws the hand at icon height and the speaker smaller", () => {
      expect(ICON_H).toBeCloseTo(0.9 * 0.8 * CONTENT_SCALE * HAND_INK_H, 6);
      expect(hand * HAND_INK_H).toBeCloseTo(ICON_H, 6);
      expect(sound * SPEAKER_INK_H).toBeCloseTo(SPEAKER_H, 6);
      expect(SPEAKER_H).toBeLessThan(ICON_H);
    });

    it("scales picked item icons with the panel content", () => {
      expect(HAND_BOX.h).toBeCloseTo(13 * 0.8 * CONTENT_SCALE, 6);
    });
  });

  describe("inventory slot", () => {
    const handX = (svg: string): number | null => {
      const m = /<g transform="translate\(([\d.]+) [\d.]+\) scale\([\d.]+\) translate\([-\d.]+ [-\d.]+\)"><g fill=/.exec(svg);
      return m ? Number(m[1]) - HAND_BOX.w / 2 : null;
    };
    const imageX = (svg: string, file: string): number => Number(new RegExp(`<image href="${file}" x="([\\d.]+)"`).exec(svg)![1]);
    const bar = hudSvg(320, 200, base, icons);

    it("replaces the hand with the shown item and labels it with its name", () => {
      const svg = hudSvg(320, 200, { ...base, item: "craneKey" }, icons);
      expect(imageX(svg, "craneKey.png")).toBeGreaterThan(0);
      expect(handX(svg)).toBeNull();
      expect(svg).toContain(">crane key</text>");
      expect(svg).not.toContain(">nothing</text>");
    });

    it("centres the icon, one slot gap and the name together in the item panel", () => {
      const { inv, invW } = topBar(320, itemPlateW(icons));
      const svg = hudSvg(320, 200, { ...base, item: "craneKey" }, icons);
      const x = Number(/<text x="([\d.]+)"[^>]*>crane key<\/text>/.exec(svg)![1]);
      const [, iconX, iconW] = /<image href="craneKey.png" x="([\d.]+)" y="[\d.]+" width="([\d.]+)"/.exec(svg)!.map(Number);
      const half = ("crane key".length * READOUT_SIZE * MONO_ADVANCE) / 2;
      expect(x - half - (iconX! + iconW!)).toBeCloseTo(SLOT.gap, 6);
      expect(iconX! - inv).toBeCloseTo(inv + invW - (x + half), 6);
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

  it("centres one ENTER tab on the item panel", () => {
    const { inv, invW } = topBar(320, itemPlateW(icons));
    const svg = hudSvg(320, 200, { ...base, item: "craneKey" }, icons);
    const at = (label: string): number => Number([...svg.matchAll(new RegExp(`<text x="([\\d.]+)"[^>]*font-size="3\\.4"[^>]*>${label}</text>`, "g"))].at(-1)![1]);
    expect(at("ENTER")).toBeCloseTo(inv + invW / 2, 6);
  });

  it("glows red only the key of the selected weapon", () => {
    const glowing = (svg: string): string[] => [...svg.matchAll(/fill="#ff4a26"[^>]*>([^<]+)</g)].map((m) => m[1]!);
    const walking = { ...base, running: false, soundOn: false };
    expect(glowing(hudSvg(320, 200, walking, icons))).toEqual(["1"]);
    expect(glowing(hudSvg(320, 200, { ...walking, weapon: 1 }, icons))).toEqual(["2"]);
  });
});

describe("keyLabel", () => {
  it("turns key codes into short labels", () => {
    expect(keyLabel("Digit1")).toBe("1");
    expect(keyLabel("AltLeft")).toBe("ALT");
    expect(keyLabel("KeyI")).toBe("I");
    expect(keyLabel("Escape")).toBe("ESC");
  });
});

describe("applyLive", () => {
  const liveParts = (svg: string): Record<string, string> =>
    Object.fromEntries([...svg.matchAll(/<(text|rect|g)\b([^>]*)data-hud="(\w+)"[^>]*>([^<]*)/g)].map(([, tag, attrs, id, body]) => {
      const attr = (name: string): string => new RegExp(` ${name}="([^"]*)"`).exec(attrs!)?.[1] ?? "";
      return [id!, tag === "text" ? body! : tag === "rect" ? `${attr("y")}|${attr("height")}` : attr("transform")];
    }));

  const fakeRoot = (parts: Record<string, string>): ParentNode & { parts: Record<string, string> } => {
    const root = { parts: { ...parts } } as ParentNode & { parts: Record<string, string> };
    root.querySelector = ((selector: string) => {
      const id = /data-hud="(\w+)"/.exec(selector)![1]!;
      if (!(id in root.parts)) return null;
      const attrs: Record<string, string> = {};
      return {
        set textContent(v: string) {
          root.parts[id] = v;
        },
        setAttribute(name: string, v: string) {
          attrs[name] = v;
          root.parts[id] = name === "transform" ? v : `${attrs.y ?? root.parts[id]!.split("|")[0]}|${attrs.height ?? root.parts[id]!.split("|")[1]}`;
        },
      };
    }) as ParentNode["querySelector"];
    return root;
  };

  it("leaves the live parts as a full rebuild would draw them", () => {
    const armed = { ...base, bonus: true, bonusAmmo: 40 };
    const next = { ...armed, ammo: 7, bonusAmmo: 12, life: 23.5 };
    const root = fakeRoot(liveParts(hudSvg(320, 200, armed, icons)));
    applyLive(root, next);
    expect(Object.keys(root.parts).sort()).toEqual(["ammo", "bonusAmmo", "lifeArrow", "lifeFill"]);
    expect(root.parts).toEqual(liveParts(hudSvg(320, 200, next, icons)));
  });
});
