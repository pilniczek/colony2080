import "@fontsource/orbitron/900.css";
import "@fontsource/share-tech-mono/400.css";
import { readSlots, savedStamp, SLOT_IDS, slotHref, type SlotEntry } from "../game/save/slots";

const storage = (): Storage | null => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const option = (href: string, title: string, detail = "", picture = ""): HTMLAnchorElement => {
  const a = document.createElement("a");
  a.href = href;
  a.className = "option";
  if (picture) {
    const img = document.createElement("img");
    img.src = picture;
    img.alt = "";
    a.append(img);
  }
  const b = document.createElement("b");
  b.textContent = title;
  const span = document.createElement("span");
  span.textContent = detail;
  a.append(b, span);
  return a;
};

function offerSaves(bar: HTMLAnchorElement, saves: { entry: SlotEntry; slot: number }[]): void {
  const page = bar.getAttribute("href")!;
  const menu = document.createElement("div");
  menu.className = "options";
  menu.id = `${bar.dataset.mission}-options`;
  menu.hidden = true;
  menu.append(option(page, "New game"), ...saves.map(({ entry, slot }) => option(slotHref(page, slot), entry.name, `${SLOT_IDS[slot]} · ${savedStamp(entry.savedAt)}`, entry.picture)));
  bar.after(menu);
  bar.setAttribute("aria-haspopup", "true");
  bar.setAttribute("aria-controls", menu.id);
  let open = false;
  const show = (value: boolean): void => {
    open = value;
    menu.hidden = !open;
    bar.setAttribute("aria-expanded", String(open));
  };
  show(false);
  bar.addEventListener("click", (e) => {
    e.preventDefault();
    show(!open);
  });
  document.addEventListener("click", (e) => {
    if (!bar.contains(e.target as Node) && !menu.contains(e.target as Node)) show(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || !open) return;
    show(false);
    bar.focus();
  });
}

const slots = readSlots(storage());
for (const bar of document.querySelectorAll<HTMLAnchorElement>("a.mission[data-mission]")) {
  const saves = slots
    .map((entry, slot) => ({ entry, slot }))
    .filter((s): s is { entry: SlotEntry; slot: number } => s.entry?.mission === bar.dataset.mission)
    .sort((a, b) => b.entry.savedAt - a.entry.savedAt);
  if (saves.length) offerSaves(bar, saves);
}
