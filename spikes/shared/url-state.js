(() => {
  const controls = [...document.querySelectorAll("body > header input[id], body > header select[id], [data-url]")];
  const weapons = [...document.querySelectorAll("body > header [data-weapon]")];

  const initial = el =>
    el.type === "checkbox" ? (el.defaultChecked ? "1" : "0")
    : el.tagName === "SELECT" ? [...el.options].filter(o => o.defaultSelected).map(o => o.value).join(",") || (el.multiple ? "" : el.options[0]?.value ?? "")
    : el.defaultValue;

  const read = el =>
    el.type === "checkbox" ? (el.checked ? "1" : "0")
    : el.multiple ? [...el.selectedOptions].map(o => o.value).join(",")
    : el.value;

  function write(el, value) {
    if (el.type === "checkbox") el.checked = value === "1";
    else if (el.multiple) { const on = new Set(value.split(",")); for (const o of el.options) o.selected = on.has(o.value); }
    else el.value = value;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  const params = new URLSearchParams(location.search);
  const defaults = new Map(controls.map(el => [el, initial(el)]));
  for (const el of controls) if (params.has(el.id) && params.get(el.id) !== read(el)) write(el, params.get(el.id));
  const weapon = weapons.find(b => b.dataset.weapon === params.get("weapon"));
  if (weapon) weapon.click();

  function save() {
    const query = new URLSearchParams(location.search);
    for (const el of controls) {
      if (read(el) === defaults.get(el)) query.delete(el.id);
      else query.set(el.id, read(el));
    }
    const pressed = weapons.find(b => b.getAttribute("aria-pressed") === "true");
    if (pressed) query.set("weapon", pressed.dataset.weapon);
    const search = query.toString();
    history.replaceState(null, "", location.pathname + (search ? "?" + search : "") + location.hash);
  }

  for (const el of controls) { el.addEventListener("change", save); el.addEventListener("input", save); }
  for (const b of weapons) b.addEventListener("click", save);
})();
