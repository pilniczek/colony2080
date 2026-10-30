import type { MenuPoint, MenuPress } from "./menuKeys";

const SIDES: Record<string, MenuPress> = { left: "moveLeft", right: "moveRight", 0: "moveLeft", 1: "moveRight" };

export const attrOf = (target: EventTarget | null, name: string): string | null => {
  const el = target as Element | null;
  return typeof el?.closest === "function" ? (el.closest(`[${name}]`)?.getAttribute(name) ?? null) : null;
};

export function menuPointOf(target: EventTarget | null, click: boolean): MenuPoint | null {
  const row = attrOf(target, "data-menu-row");
  if (row === null) return null;
  const side = attrOf(target, "data-arrow") ?? attrOf(target, "data-option");
  return { row: Number(row), press: !click ? "hover" : side === null ? "useItem" : (SIDES[side] ?? "useItem") };
}
