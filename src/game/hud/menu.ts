import type { Rect } from "../geometry";
import { LANG_NAMES, LANGS, tr, type Lang } from "../i18n";
import { AUTO_SLOT, savedStamp, slotLabel, type Slots } from "../save/slots";
import { BOLD, box, image, INV, INVENTORY_BOXES, INVENTORY_DEFS, label, MONO, type InventoryArt } from "./inventory";
import { BAR_H, HUD_H, HUD_MIN_W, MONO_ADVANCE, VIEW_BOX, viewRect } from "./layout";
import { PAUSE_ROWS, SETTINGS_ROWS, type MenuState } from "./menuKeys";
import { hudTabs, sideMarks, TAB_BOTTOM, type HudIcon, type HudPart } from "./svg";

const MENU = { back: "#0a1f14", grid: "#5a1a14", over: "#ffffff", overEdge: "#2438d0" };
const AUTOSAVES = ["AUTOSAVE", "NO AUTOSAVE"];
const MENU_BOX: Rect = { x: 22, y: 8, w: 148, h: 68 };
const SLOT_BOX: Rect = { x: 10, y: 8, w: 210, h: 184 };
const CHOICE_BOX: Rect = { x: 106, y: 146, w: 108, h: 45 };
const OVER = { size: 9, stroke: 1.2, fallback: { y: 100 } };
const SLOT_ROW = 30;
const SLOT_ROOM = 26;
const LETTER = { size: 7.2, auto: 4.4 };
const MENU_ROW = 12;
const MENU_ROOM = 20;
const BUTTON_GAP = 6;
const ARROW = { w: 3, h: 4.4, inset: 2.4 };
const CHOICE_ROW = 13;
const PICTURE = { aspect: 5 / 3, pad: 6 };
const ROBOT_OPACITY = 0.3;
const DIM = 0.25;
const ASK = { title: "RESTART?", lines: ["UNSAVED PROGRESS IS LOST", "ENTER / ESC"], top: 17, pad: 6 };
const STEPS = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] } as const;
type Step = keyof typeof STEPS;
const MANUAL_KEYS: [string | Step[], string][] = [
  [["left", "right"], "MOVE"],
  [["up"], "JUMP, CLIMB UP"],
  [["down"], "DUCK, CLIMB DOWN"],
  ["C", "SHOOT / PUNCH"],
  ["ENTER", "USE ITEM FROM INVENTORY"],
  ["I", "INVENTORY"],
  ["X", "HIDING MIGHT BE MORE THAN SHOOTING"],
];
type TipArt = "liftDeck" | "liftPanel" | "wireBox" | "crashedShip" | "crowbar";
const TIPS: [TipArt, string][] = [
  ["liftDeck", "ENTER TO USE THE LIFT"],
  ["liftPanel", "ENTER CALLS A DISTANT LIFT"],
  ["crowbar", "ENTER PICKS UP AN ITEM"],
  ["wireBox", "ENTER TO USE THINGS"],
  ["crashedShip", "SOME THINGS NEED TO BE DAMAGED"],
];
const ARROW_KEY = { len: 5.4, head: 1.6, stroke: 0.7, spread: 4.5 };
const MANUAL = { gap: 8, text: 5.6, key: 14, keyGap: 10, top: 17, pitch: 10, pad: 6 };
const TIP_BOX = { gap: 6, w: 138, key: 22, pitch: 14 };
const CAPS_EM = 0.7;

export type MenuArt = Pick<InventoryArt, "robot" | TipArt>;

type Row = { entry: string; gap?: boolean } | { options: string[]; on: number };

const DEFS = `<defs><pattern id="menuGrid" width="16" height="16" patternUnits="userSpaceOnUse"><path d="M0 16V0H16" fill="none" stroke="${MENU.grid}" stroke-width=".6"/></pattern></defs>`;

const escaped = (value: string): string => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const text = (x: number, y: number, size: number, fill: string, value: string, attrs = ""): string =>
  `<text x="${x}" y="${y}" font-family="${MONO}" font-size="${size}" fill="${fill}" ${attrs}>${escaped(value)}</text>`;

const pick = (x: number, y: number, w: number, h: number): string => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${INV.pick}"/>`;

const hit = (row: number, x: number, y: number, w: number, h: number, body: string, live = true): string =>
  live ? `<g data-menu-row="${row}" style="cursor:pointer"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="transparent"/>${body}</g>` : body;

const fitIn = ({ x, y, w, h }: Rect): string => {
  const k = Math.min(w / HUD_MIN_W, h / HUD_H, (HUD_H - VIEW_BOX.top - VIEW_BOX.bottom) / HUD_H);
  return `translate(${x + (w - HUD_MIN_W * k) / 2} ${y + (h - HUD_H * k) / 2}) scale(${k})`;
};

const area = ({ x, y, w, h }: Rect, fill: string): string => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`;

function backdrop(view: Rect, robot: HudIcon): string {
  const r = INVENTORY_BOXES.robot;
  return `${area(view, MENU.back)}
  <g transform="${fitIn(view)}" style="opacity:${ROBOT_OPACITY}">${image(robot, r.x + (r.w - robot.w) / 2, r.y + r.h - robot.h)}</g>
  ${area(view, "url(#menuGrid)")}`;
}

const tspan = (fill: string, value: string, active = false, option?: number): string =>
  `<tspan fill="${fill}"${option === undefined ? "" : ` data-option="${option}"`}${active ? ' text-decoration="underline"' : ""}>${escaped(value)}</tspan>`;

function rowText(row: Row, x: number, y: number, on: boolean): string {
  const bright = on ? "#fff" : INV.name;
  if ("entry" in row) return text(x, y, 6.4, bright, row.entry);
  const parts = row.options.map((option, i) => tspan(i === row.on ? bright : INV.frame, option, i === row.on, i)).join(tspan(INV.frame, " / "));
  return `<text x="${x}" y="${y}" font-family="${MONO}" font-size="6.4" xml:space="preserve">${parts}</text>`;
}

function arrows(b: Rect, y: number, on: boolean): string {
  const fill = on ? "#fff" : INV.frame;
  const mid = y + (MENU_ROW - 1) / 2;
  const top = mid - ARROW.h / 2;
  const bottom = mid + ARROW.h / 2;
  const left = b.x + ARROW.inset;
  const right = b.x + b.w - ARROW.inset;
  return (
    `<polygon data-arrow="left" points="${left},${mid} ${left + ARROW.w},${top} ${left + ARROW.w},${bottom}" fill="${fill}"/>` +
    `<polygon data-arrow="right" points="${right},${mid} ${right - ARROW.w},${top} ${right - ARROW.w},${bottom}" fill="${fill}"/>`
  );
}

const rowsHeight = (rows: Row[]): number => MENU_ROOM + rows.length * MENU_ROW + rows.filter((row) => "entry" in row && row.gap).length * BUTTON_GAP;

function rowsBox(title: string, rows: Row[], cursor: number): string {
  const b = { ...MENU_BOX, h: rowsHeight(rows) };
  let y = b.y + 16;
  const drawn = rows.map((row, i) => {
    if ("entry" in row && row.gap) y += BUTTON_GAP;
    const on = i === cursor;
    const out = hit(i, b.x + 2, y, b.w - 4, MENU_ROW - 1, (on ? pick(b.x + 2, y, b.w - 4, MENU_ROW - 1) : "") + rowText(row, b.x + 10, y + MENU_ROW * 0.66, on) + ("options" in row ? arrows(b, y, on) : ""));
    y += MENU_ROW;
    return out;
  }).join("");
  return box(b) + label(b.x + b.w / 2, b.y + 10, 7.6, title) + drawn;
}

function arrowKey(cx: number, cy: number, step: Step): string {
  const [dx, dy] = STEPS[step];
  const { len, head } = ARROW_KEY;
  const tip = [cx + (dx * len) / 2, cy + (dy * len) / 2] as const;
  const back = [tip[0] - dx * head, tip[1] - dy * head] as const;
  const wing = (side: number): string => `${back[0] - dy * head * side},${back[1] + dx * head * side}`;
  return `<path d="M${cx - (dx * len) / 2},${cy - (dy * len) / 2}L${tip[0]},${tip[1]}M${wing(1)}L${tip[0]},${tip[1]}L${wing(-1)}" fill="none" stroke="${INV.name}" stroke-width="${ARROW_KEY.stroke}" stroke-linecap="round" stroke-linejoin="round"/>`;
}

const arrowKeys = (cx: number, cy: number, steps: Step[]): string =>
  steps.map((step, i) => arrowKey(cx + (i - (steps.length - 1) / 2) * 2 * ARROW_KEY.spread, cy, step)).join("");

type KeyColumn = { x: number; w: number; key: number; pitch: number };

const CAPS_MID = (MANUAL.text * CAPS_EM) / 2;

function keyBox<K>(top: number, title: string, column: KeyColumn, rows: [K, string][], keyOf: (key: K, keyMid: number, mid: number) => string): string {
  const x = column.x + 10;
  const keyMid = x + column.key / 2;
  const actionX = x + column.key + MANUAL.keyGap;
  const midOf = (i: number): number => top + MANUAL.top + i * column.pitch;
  const drawn = rows.map(([key, value], i) => keyOf(key, keyMid, midOf(i)) + text(actionX, midOf(i) + CAPS_MID, MANUAL.text, INV.label, value)).join("");
  const b = { x: column.x, y: top, w: column.w, h: midOf(rows.length - 1) + column.pitch / 2 - MANUAL.pitch / 2 + CAPS_MID + MANUAL.pad - top };
  return box(b) + label(b.x + b.w / 2, b.y + 10, 7.6, title) + drawn;
}

function manual(rows: Row[], art: MenuArt, lang: Lang): string {
  const top = MENU_BOX.y + rowsHeight(rows) + MANUAL.gap;
  const keys = MANUAL_KEYS.map(([key, value]): [string | Step[], string] => [key, tr(value, lang)]);
  const left = keyBox(top, tr("MANUAL", lang), { ...MENU_BOX, key: MANUAL.key, pitch: MANUAL.pitch }, keys, (key, keyMid, mid) =>
    typeof key === "string" ? text(keyMid, mid + CAPS_MID, MANUAL.text, INV.name, key, 'text-anchor="middle"') : arrowKeys(keyMid, mid, key),
  );
  const tips = TIPS.map(([id, value]): [TipArt, string] => [id, tr(value, lang)]);
  const right = keyBox(top, tr("TIPS", lang), tipColumn, tips, (id, keyMid, mid) => image(art[id], keyMid - art[id].w / 2, mid - art[id].h / 2));
  return left + right;
}

const tipColumn = { x: MENU_BOX.x + MENU_BOX.w + TIP_BOX.gap, w: TIP_BOX.w, key: TIP_BOX.key, pitch: TIP_BOX.pitch };

function askBox(lang: Lang): string {
  const b = { x: tipColumn.x, y: MENU_BOX.y, w: tipColumn.w, h: ASK.top + (ASK.lines.length - 1) * MANUAL.pitch + CAPS_MID + ASK.pad };
  const lines = ASK.lines.map((value, i) => text(b.x + b.w / 2, b.y + ASK.top + i * MANUAL.pitch + CAPS_MID, MANUAL.text, INV.stat, tr(value, lang), 'text-anchor="middle"')).join("");
  return box(b) + label(b.x + b.w / 2, b.y + 10, 7.6, tr(ASK.title, lang)) + lines;
}

const autosaveRow = (autosave: boolean, lang: Lang): Row => ({ options: AUTOSAVES.map((o) => tr(o, lang)), on: autosave ? 0 : 1 });

const langRow = (lang: Lang): Row => ({ options: LANGS.map((l) => LANG_NAMES[l]), on: LANGS.indexOf(lang) });

function settings(s: Extract<MenuState, { screen: "settings" }>, lang: Lang, art: MenuArt): string {
  const rows: Row[] = [];
  rows[SETTINGS_ROWS.autosave] = autosaveRow(s.autosave, lang);
  rows[SETTINGS_ROWS.lang] = langRow(lang);
  rows[SETTINGS_ROWS.help] = { entry: tr("HELP", lang) };
  rows[SETTINGS_ROWS.start] = { entry: tr("START", lang), gap: true };
  return rowsBox(tr("SETTINGS", lang), rows, s.cursor) + manual(rows, art, lang);
}

function pause(s: Extract<MenuState, { screen: "pause" }>, lang: Lang, autosave: boolean, art: MenuArt): string {
  const rows: Row[] = [];
  rows[PAUSE_ROWS.save] = { entry: tr("SAVE GAME", lang) };
  rows[PAUSE_ROWS.load] = { entry: tr("LOAD GAME", lang) };
  rows[PAUSE_ROWS.autosave] = autosaveRow(autosave, lang);
  rows[PAUSE_ROWS.lang] = langRow(lang);
  rows[PAUSE_ROWS.restart] = { entry: tr("RESTART MISSION", lang) };
  rows[PAUSE_ROWS.help] = { entry: tr("HELP", lang) };
  return rowsBox(tr("MENU", lang), rows, s.cursor) + (s.confirm ? askBox(lang) : "") + manual(rows, art, lang);
}

function footer(s: Extract<MenuState, { screen: "save" | "load" }>, lang: Lang): [string, string] {
  if (s.message) return [tr(s.message, lang).toUpperCase(), INV.stat];
  if (s.confirm) return [tr("OVERWRITE?  ENTER / ESC", lang), INV.stat];
  if (s.typing !== null) return [tr("TYPE A NAME  ENTER SAVES  ESC BACK", lang), INV.frame];
  return [tr("ENTER SELECTS  ESC BACK", lang), INV.frame];
}

function slotList(s: Extract<MenuState, { screen: "save" | "load" }>, slots: Slots, prefix: string, lang: Lang): string {
  const b = SLOT_BOX;
  const shown = s.screen === "save" ? slots.slice(0, AUTO_SLOT) : slots;
  const row = Math.min(SLOT_ROW, (b.h - SLOT_ROOM) / shown.length);
  const ph = row - PICTURE.pad;
  const pw = ph * PICTURE.aspect;
  const rows = shown.map((slot, i) => {
    const y = b.y + 16 + i * row;
    const on = i === s.cursor;
    const typing = on && s.typing !== null;
    const name = typing ? `${s.typing ? `${prefix} - ${s.typing}` : prefix}|` : slot ? slot.name : tr("EMPTY", lang);
    const picture = slot
      ? `<image href="${escaped(slot.picture)}" x="${b.x + b.w - pw - 6}" y="${y + 3}" width="${pw}" height="${ph}" preserveAspectRatio="xMidYMid slice"/><rect x="${b.x + b.w - pw - 6}" y="${y + 3}" width="${pw}" height="${ph}" fill="none" stroke="${INV.frame}" stroke-width=".5"/>`
      : "";
    return hit(
      i,
      b.x + 2,
      y,
      b.w - 4,
      row - 2,
      (on ? pick(b.x + 2, y, b.w - 4, row - 2) : "") +
      text(b.x + 6, y + 11, i === AUTO_SLOT ? LETTER.auto : LETTER.size, on ? "#fff" : INV.label, slotLabel(i)) +
      text(b.x + 18, y + 11, 6, on ? "#fff" : slot || typing ? INV.name : INV.frame, name.toUpperCase()) +
      (slot ? text(b.x + 18, y + 21, 5, on ? "#fff" : INV.frame, savedStamp(slot.savedAt)) : "") +
      picture,
    );
  }).join("");
  const [hint, colour] = footer(s, lang);
  return box(b) + label(b.x + b.w / 2, b.y + 10, 7.6, tr(s.screen === "save" ? "SAVE GAME" : "LOAD GAME", lang)) + rows + text(b.x + b.w / 2, b.y + b.h - 4, 5.2, colour, hint, 'text-anchor="middle"');
}

function gameOver(W: number, H: number, s: Extract<MenuState, { screen: "gameOver" }>, lang: Lang): string {
  const choices = ["LOAD LAST SAVE", "RESTART MISSION", "EXIT"].map((choice) => tr(choice, lang));
  const rows = choices.map((choice, i) => {
    const y = CHOICE_BOX.y + 4 + i * CHOICE_ROW;
    const on = i === s.cursor;
    const off = i === 0 && !s.canLoad;
    const body = (on ? pick(CHOICE_BOX.x + 4, y, CHOICE_BOX.w - 8, CHOICE_ROW - 1) : "") + text(CHOICE_BOX.x + CHOICE_BOX.w / 2, y + 8.4, 6.4, on ? "#fff" : off ? INV.frame : INV.name, choice, 'text-anchor="middle"');
    return hit(i, CHOICE_BOX.x + 4, y, CHOICE_BOX.w - 8, CHOICE_ROW - 1, body, !off);
  }).join("");
  const note = s.message ? text(160, CHOICE_BOX.y - 4, 5.2, INV.stat, tr(s.message, lang).toUpperCase(), 'text-anchor="middle"') : "";
  const ox = (W - HUD_MIN_W) / 2;
  const oy = (H - HUD_H) / 2;
  const at = { x: W / 2, y: s.at?.y ?? oy + OVER.fallback.y };
  const title = `<text x="${at.x}" y="${at.y}" text-anchor="middle" font-family="${BOLD}" font-weight="900" font-size="${OVER.size}" letter-spacing="1" fill="${MENU.over}" stroke="${MENU.overEdge}" stroke-width="${OVER.stroke}" stroke-linejoin="miter" paint-order="stroke">${escaped(tr("GAME OVER", lang))}</text>`;
  return `<rect width="${W}" height="${H}" fill="#000" opacity="${DIM}"/>
  ${title}
  <g transform="translate(${ox} ${oy})">${note}${box(CHOICE_BOX)}${rows}</g>`;
}

const HELP = { text: 5.2, row: 13, first: 16, leg: 6, gap: 2, tip: 1.2, head: 2.6, stroke: 0.6, line: 7, side: 8, clear: 0.3 };
const HELP_TEXTS: Record<HudPart, string> = {
  menu: "OPENS THE MENU",
  weapon1: "FISTS",
  weapon2: "GUN, NUMBER = AMMO LEFT",
  weapon3: "E-BLASTER",
  sound: "SOUND ON / OFF",
  run: "RUN OR WALK",
  hide: "HIDE",
  map: "MAP",
  item: "ITEM IN HAND: ENTER USES IT, I OPENS INVENTORY",
};
const LEFT_PARTS: ReadonlySet<HudPart> = new Set(["menu", "weapon1", "weapon2", "weapon3"]);
const ENERGY_LINES = ["ENERGY: HITS DRAIN IT, NO ENERGY = DEATH.", "E BLINKS RED WHEN LOW"];
const PRO_TIP_LINES = ["HOLD MORE KEYS AT ONCE, E.G. C AND X.", "WHILE HIDDEN, ARROWS TURN YOU AROUND."];
const PRO_TIP = { w: 150, pad: 8, title: 10, lines: 2 };
const BACK = { w: 50, h: 11, bottom: 10 };

export interface HelpLabel {
  x: number;
  y: number;
  end: boolean;
  text: string;
}

export interface HelpLayout {
  labels: HelpLabel[];
  arrows: { path: string; tip: [number, number]; dir: "up" | "left" | "right" }[];
  tip: Rect;
  back: Rect;
}

export const helpTextW = (value: string): number => value.length * HELP.text * MONO_ADVANCE;

type Box = { x0: number; x1: number; y0: number; y1: number };

const labelBox = (x: number, y: number, end: boolean, value: string): Box => {
  const w = helpTextW(value);
  return { x0: end ? x - w : x, x1: end ? x : x + w, y0: y - HELP.text * 0.8, y1: y + HELP.text * 0.25 };
};

const line = (xa: number, xb: number, ya: number, yb: number): Box => ({ x0: Math.min(xa, xb) - HELP.clear, x1: Math.max(xa, xb) + HELP.clear, y0: Math.min(ya, yb) - HELP.clear, y1: Math.max(ya, yb) + HELP.clear });

const overlaps = (a: Box, b: Box): boolean => Math.max(a.x0, b.x0) < Math.min(a.x1, b.x1) && Math.max(a.y0, b.y0) < Math.min(a.y1, b.y1);

export function helpLayout(W: number, H: number, blaster: boolean, lang: Lang): HelpLayout {
  const labels: HelpLabel[] = [];
  const arrows: HelpLayout["arrows"] = [];
  const tabs = hudTabs(W, blaster);
  const left = tabs.filter((t) => LEFT_PARTS.has(t.part)).reverse();
  const right = tabs.filter((t) => !LEFT_PARTS.has(t.part));
  const rowY = (i: number): number => BAR_H + HELP.first + i * HELP.row;
  const mid = (y: number): number => y - (HELP.text * CAPS_EM) / 2;
  const tipY = TAB_BOTTOM + HELP.tip;
  const taken: Box[] = [];
  let lastRow = 0;
  for (const [group, side] of [[left, 1], [right, -1]] as const) {
    let row = -1;
    for (const { part, cx } of group) {
      const words = tr(HELP_TEXTS[part], lang);
      const legEnd = cx + side * HELP.leg;
      const x = legEnd + side * HELP.gap;
      const fits = (y: number): boolean => {
        const own = [labelBox(x, y, side < 0, words), line(legEnd, cx, mid(y), mid(y)), line(cx, cx, tipY, mid(y))];
        return own.every((a) => taken.every((b) => !overlaps(a, b)));
      };
      do row++;
      while (!fits(rowY(row)));
      const y = rowY(row);
      taken.push(labelBox(x, y, side < 0, words), line(legEnd, cx, mid(y), mid(y)), line(cx, cx, tipY, mid(y)));
      arrows.push({ path: `M${legEnd} ${mid(y)}H${cx}V${tipY + HELP.head}`, tip: [cx, tipY], dir: "up" });
      labels.push({ x, y, end: side < 0, text: words });
      lastRow = Math.max(lastRow, row);
    }
  }
  const { energy, shields } = sideMarks(H);
  const inner = { left: VIEW_BOX.left + HELP.tip, right: W - VIEW_BOX.right - HELP.tip };
  arrows.push({ path: `M${inner.left + HELP.side} ${energy}H${inner.left + HELP.head}`, tip: [inner.left, energy], dir: "left" });
  ENERGY_LINES.forEach((line, i) => labels.push({ x: inner.left + HELP.side + HELP.gap, y: energy - mid(0) + i * HELP.line, end: false, text: tr(line, lang) }));
  arrows.push({ path: `M${inner.right - HELP.side} ${shields}H${inner.right - HELP.head}`, tip: [inner.right, shields], dir: "right" });
  labels.push({ x: inner.right - HELP.side - HELP.gap, y: shields - mid(0), end: true, text: tr("SHIELDS: SPARE LIVES", lang) });
  const tip = { x: (W - PRO_TIP.w) / 2, y: rowY(lastRow) + HELP.row, w: PRO_TIP.w, h: PRO_TIP.title + PRO_TIP.lines * HELP.line + PRO_TIP.pad };
  const back = { x: (W - BACK.w) / 2, y: H - VIEW_BOX.bottom - BACK.bottom - BACK.h, w: BACK.w, h: BACK.h };
  return { labels, arrows, tip, back };
}

function arrowHead([x, y]: [number, number], dir: "up" | "left" | "right"): string {
  const { head } = HELP;
  const wing = head / 2;
  const points = dir === "up" ? [[x, y], [x - wing, y + head], [x + wing, y + head]] : dir === "left" ? [[x, y], [x + head, y - wing], [x + head, y + wing]] : [[x, y], [x - head, y - wing], [x - head, y + wing]];
  return `<polygon points="${points.map((p) => p.join(",")).join(" ")}" fill="${INV.name}"/>`;
}

function help(W: number, H: number, blaster: boolean, lang: Lang): string {
  const { labels, arrows, tip, back } = helpLayout(W, H, blaster, lang);
  const lines = arrows.map(({ path, tip, dir }) => `<path d="${path}" fill="none" stroke="${INV.name}" stroke-width="${HELP.stroke}"/>${arrowHead(tip, dir)}`).join("");
  const words = labels.map(({ x, y, end, text: value }) => text(x, y, HELP.text, INV.label, value, end ? 'text-anchor="end"' : "")).join("");
  const tipLines = PRO_TIP_LINES.map((line, i) => text(W / 2, tip.y + PRO_TIP.title + PRO_TIP.pad + i * HELP.line, HELP.text, INV.name, tr(line, lang), 'text-anchor="middle"')).join("");
  const button = hit(0, back.x, back.y, back.w, back.h, pick(back.x, back.y, back.w, back.h) + text(W / 2, back.y + back.h * 0.7, 6.4, "#fff", tr("BACK", lang), 'text-anchor="middle"'));
  return lines + words + box(tip) + label(W / 2, tip.y + 8, 6.6, tr("PRO TIP", lang)) + tipLines + button;
}

export function menuSvg(W: number, H: number, state: MenuState, slots: Slots, art: MenuArt, prefix = "City", lang: Lang = "en", autosave = false, blaster = false): string {
  const open = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${INVENTORY_DEFS}${DEFS}`;
  if (state.screen === "gameOver") return `${open}${gameOver(W, H, state, lang)}</svg>`;
  if (state.screen === "help") {
    const view = viewRect({ W, H, unit: 1 });
    return `${open}${area(view, MENU.back)}${area(view, "url(#menuGrid)")}${help(W, H, blaster, lang)}</svg>`;
  }
  const body = state.screen === "settings" ? settings(state, lang, art) : state.screen === "pause" ? pause(state, lang, autosave, art) : slotList(state, slots, prefix, lang);
  const view = viewRect({ W, H, unit: 1 });
  return `${open}${backdrop(view, art.robot)}<g transform="${fitIn(view)}">${body}</g></svg>`;
}
