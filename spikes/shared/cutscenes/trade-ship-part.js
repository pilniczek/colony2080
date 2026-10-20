(() => {
const { kit, tradeHoloPlan } = window.CUTSCENES;
const CFG = window.C28_CONFIG.cutscenes.tradeShipPart;

window.CUTSCENES.tradeShipPart = {
  name: CFG.title,
  camera: CFG.camera,
  duration: CFG.duration,
  palette: tradeHoloPlan.palette,
  render: (c, w, h, t) => tradeHoloPlan.doorShot(c, w, h, t, CFG.items),
  ref: kit.filmRef("tradeShipPart", CFG.duration)
};
})();
