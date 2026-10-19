(() => {
const KEY = "spikePaused";
let paused = false;
let offset = 0;
let frozen = 0;

const now = () => (paused ? frozen : performance.now() - offset);

function setPaused(on) {
  if (on === paused) return;
  if (on) frozen = now();
  else offset = performance.now() - frozen;
  paused = on;
  try { localStorage.setItem(KEY, on ? "1" : ""); } catch {}
}

function mount() {
  const label = document.createElement("label");
  const input = document.createElement("input");
  input.type = "checkbox";
  label.append(input, " Pause animations");
  try { input.checked = localStorage.getItem(KEY) === "1"; } catch {}
  setPaused(input.checked);
  input.onchange = () => setPaused(input.checked);
  const header = document.querySelector("header");
  if (header) header.append(label);
  else {
    label.style.cssText = "position:fixed;top:8px;right:12px;z-index:20;background:#141c1e;color:#c9d1d0;padding:4px 8px;border-radius:4px;font:13px system-ui";
    document.body.append(label);
  }
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
else mount();

window.SPIKE_CLOCK = { now, seconds: () => now() / 1000, get paused() { return paused; } };
})();
