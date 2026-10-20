import "@fontsource/orbitron/900.css";
import "@fontsource/share-tech-mono/400.css";
import { CHEATS } from "../game/cheats";

const cell = (child: Node): HTMLTableCellElement => {
  const td = document.createElement("td");
  td.append(child);
  return td;
};

document.getElementById("cheats")!.append(
  ...CHEATS.map(({ code, effect }) => {
    const tr = document.createElement("tr");
    const name = document.createElement("code");
    name.textContent = code;
    tr.append(cell(name), cell(document.createTextNode(effect)));
    return tr;
  }),
);
