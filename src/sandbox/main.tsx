import { createRoot } from "react-dom/client";

const ui = document.getElementById("ui");
if (!ui) throw new Error("missing #ui");
createRoot(ui).render(null);
