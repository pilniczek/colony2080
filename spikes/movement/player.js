(() => {
const dialog = document.getElementById("player");
const $ = sel => dialog.querySelector(sel);
const ui = {
  title: $("h2"), canvas: $("canvas"), ref: $("#ref"), refLabel: $("#refLabel"),
  play: $("#play"), restart: $("#restart"), scrub: $("#scrub"), time: $("#time"), speed: $("#speed"), loop: $("#loop"),
  refToggle: $("#refToggle"), palToggle: $("#palToggle"), copyPal: $("#copyPal"), palette: $("#palette"), close: $("#close")
};
const ctx = ui.canvas.getContext("2d");
let scene = null, t = 0, playing = true, last = 0, refSrc = "";

function setPlaying(v) {
  playing = v;
  ui.play.textContent = v ? "Pause" : "Play";
}

function frame(now) {
  if (!dialog.open) return;
  const dt = (now - last) / 1000;
  last = now;
  if (playing) {
    t += dt * parseFloat(ui.speed.value);
    if (t >= scene.duration) {
      if (ui.loop.checked) t = 0; else { t = scene.duration; setPlaying(false); }
    }
  }
  const dpr = devicePixelRatio || 1;
  const w = Math.round(ui.canvas.clientWidth * dpr), h = Math.round(ui.canvas.clientHeight * dpr);
  if (ui.canvas.width !== w || ui.canvas.height !== h) { ui.canvas.width = w; ui.canvas.height = h; }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  scene.render(ctx, w, h, t);
  if (ui.ref && scene.ref && dialog.classList.contains("with-ref")) {
    const src = scene.ref.frame(t);
    if (src !== refSrc) { refSrc = src; ui.ref.src = src; }
  }
  ui.scrub.value = Math.round(t / scene.duration * 1000);
  ui.time.textContent = `${t.toFixed(2)}s / ${scene.duration.toFixed(1)}s`;
  requestAnimationFrame(frame);
}

function buildPalette() {
  ui.palette.replaceChildren();
  for (const key of Object.keys(scene.palette)) {
    const label = document.createElement("label");
    const input = document.createElement("input");
    input.type = "color";
    input.value = scene.palette[key];
    input.oninput = () => { scene.palette[key] = input.value; };
    label.append(input, key);
    ui.palette.append(label);
  }
}

window.openCutscene = s => {
  scene = s;
  t = 0;
  refSrc = "";
  ui.title.textContent = s.name;
  if (ui.refLabel && s.ref) ui.refLabel.textContent = s.ref.label;
  buildPalette();
  setPlaying(true);
  dialog.showModal();
  last = performance.now();
  requestAnimationFrame(frame);
};

ui.play.onclick = () => { if (t >= scene.duration) t = 0; setPlaying(!playing); };
ui.restart.onclick = () => { t = 0; setPlaying(true); };
ui.scrub.oninput = () => { t = ui.scrub.value / 1000 * scene.duration; setPlaying(false); };
if (ui.refToggle) ui.refToggle.onclick = () => {
  const on = dialog.classList.toggle("with-ref");
  ui.refToggle.textContent = on ? "Hide original" : "Show original";
  refSrc = "";
};
ui.palToggle.onclick = () => dialog.classList.toggle("with-palette");
ui.copyPal.onclick = () => navigator.clipboard.writeText(JSON.stringify(scene.palette, null, 2)).then(() => {
  ui.copyPal.textContent = "Copied";
  setTimeout(() => ui.copyPal.textContent = "Copy palette JSON", 1200);
});
ui.close.onclick = () => dialog.close();
})();
