import { ITEMS, type ItemId } from "./items";

export type Lang = "en" | "cs";

export const LANGS: Lang[] = ["en", "cs"];

export const LANG_KEY = "c2080.lang";

export const LANG_NAMES: Record<Lang, string> = { en: "ENGLISH", cs: "ČESKY" };

const PICKED = /^Picked up (.+)$/;

const CS: Record<string, string> = {
  "Find the bar man. He knows the way out.": "Najdi barmana. Ví, kudy ven.",
  "Wires torn out.": "Dráty vytrženy.",
  "The metro lights come on.": "Světla v metru se rozsvítí.",
  "The switchboard is dead. Its wires are gone. Torn wires hang from a box somewhere.": "Rozvaděč je mrtvý. Chybí mu dráty. Vytržené dráty visí někde z krabice.",
  "The train door gives way.": "Dveře vlaku povolí.",
  "The train door is jammed shut. It needs power to the metro and something to pry it open.": "Dveře vlaku jsou zaseklé. Chce to proud do metra a něco, čím je vypáčit.",
  "Water off. The tap handle comes loose.": "Voda zastavena. Kohout uzávěru jde sundat.",
  "A card and a holo plan.": "Karta a hologramový plán.",
  "The bar man draws you a ship plan and wants the part.": "Barman ti nakreslí plán lodi a chce za něj součástku.",
  "The bar man will not open for nothing. Bring him a plan of the way out. The dead may carry one.": "Barman zadarmo neotevře. Přines mu plán cesty ven. Možná ho má u sebe mrtvý.",
  "A decoder for the part.": "Dekodér za součástku.",
  "The bar man wants the ship part from his plan first. Look for it at the crashed ship.": "Barman chce nejdřív součástku lodi ze svého plánu. Hledej ji u havarované lodi.",
  "Code accepted. The plasma dies down.": "Kód přijat. Plazma uhasíná.",
  "A coded lock. Guessing will not do. It needs a decoder.": "Kódový zámek. Hádáním to nepůjde. Chce to dekodér.",
  "The lift screen clears. It runs again.": "Obrazovka výtahu se rozjasní. Výtah zase jede.",
  "The lift screen is dead. It needs a new controller.": "Obrazovka výtahu je mrtvá. Chce to nový ovladač.",
  "Card accepted. The door opens.": "Karta přijata. Dveře se otevírají.",
  "The door has a card reader. It needs an access card.": "Dveře mají čtečku karet. Chce to přístupovou kartu.",
  "Acid pours out of the tank. The guard below melts down.": "Z cisterny teče kyselina. Strážce pod ní se rozpouští.",
  "The tank tap has no handle. Find one that fits.": "Kohout cisterny nemá rukojeť. Najdi takovou, která pasuje.",
  "Level complete": "Mise splněna",
  "The crane cab is locked. It needs its key.": "Kabina jeřábu je zamčená. Chce to její klíč.",
  "The hull cover falls off.": "Kryt trupu odpadne.",
  "The guard blows apart. The crane key lies behind it.": "Strážce se rozletí na kusy. Za ním leží klíč od jeřábu.",
  "The lift is broken.": "Výtah je rozbitý.",
  "Something is missing here.": "Tady něco chybí.",
  "Nothing more to do here.": "Tady už není co dělat.",
  "You have no map.": "Nemáš mapu.",
  "Saved.": "Uloženo.",
  "Save failed.": "Uložení selhalo.",
  "Game saved.": "Hra uložena.",
  "Autosave failed.": "Automatické uložení selhalo.",
  "This save does not fit this version of the mission.": "Tato pozice neodpovídá této verzi mise.",
  "This save is damaged and cannot be loaded.": "Tato pozice je poškozená a nelze ji nahrát.",
  "Back to mission select": "Zpět na výběr mise",
  nothing: "nic",
  MENU: "MENU",
  SETTINGS: "NASTAVENÍ",
  START: "SPUSTIT",
  AUTOSAVE: "AUTOUKLÁDÁNÍ",
  "NO AUTOSAVE": "RUČNĚ",
  "SAVE GAME": "ULOŽIT HRU",
  "LOAD GAME": "NAHRÁT HRU",
  "RESTART MISSION": "RESTARTOVAT MISI",
  "MISSION SELECT": "VÝBĚR MISE",
  "RESTART? UNSAVED PROGRESS IS LOST  ENTER / ESC": "RESTART? NEULOŽENÝ POSTUP SE ZTRATÍ  ENTER / ESC",
  "LEAVE? UNSAVED PROGRESS IS LOST  ENTER / ESC": "ODEJÍT? NEULOŽENÝ POSTUP SE ZTRATÍ  ENTER / ESC",
  "OVERWRITE?  ENTER / ESC": "PŘEPSAT?  ENTER / ESC",
  "TYPE A NAME  ENTER SAVES  ESC BACK": "NAPIŠ JMÉNO  ENTER ULOŽÍ  ESC ZPĚT",
  "ENTER SELECTS  ESC BACK": "ENTER VYBERE  ESC ZPĚT",
  EMPTY: "PRÁZDNÉ",
  "LOAD LAST SAVE": "NAHRÁT POSLEDNÍ POZICI",
  EXIT: "KONEC",
  "GAME OVER": "KONEC HRY",
  INVENTORY: "INVENTÁŘ",
  ENERGY: "ENERGIE",
  "SHIELDS:": "ŠTÍTY:",
  STATISTICS: "STATISTIKA",
};

export const itemName = (id: ItemId, lang: Lang): string => {
  const item = ITEMS[id];
  if (!item) return id;
  return lang === "cs" && item.cs ? item.cs : item.name;
};

const pickedName = (name: string): string => {
  const id = Object.keys(ITEMS).find((key) => ITEMS[key]!.name === name);
  return id === undefined ? name : itemName(id, "cs");
};

export function tr(text: string, lang: Lang): string {
  if (lang === "en") return text;
  const known = CS[text];
  if (known !== undefined) return known;
  const picked = PICKED.exec(text);
  return picked ? `Sebráno: ${pickedName(picked[1]!)}` : text;
}

export const knowsCs = (text: string): boolean => text in CS;

export function loadLang(storage: Pick<Storage, "getItem"> | null): Lang {
  try {
    return storage?.getItem(LANG_KEY) === "cs" ? "cs" : "en";
  } catch {
    return "en";
  }
}

export function saveLang(lang: Lang, storage: Pick<Storage, "setItem"> | null): void {
  try {
    storage?.setItem(LANG_KEY, lang);
  } catch {
    return;
  }
}

export function storedLang(): Lang {
  try {
    return loadLang(localStorage);
  } catch {
    return "en";
  }
}
