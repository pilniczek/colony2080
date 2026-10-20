(() => {
function lookAt(id, t) {
  let look = "camera";
  for (const [from, view] of window.C28_CONFIG.cutscenes[id]?.views ?? []) if (t >= from) look = view;
  return look;
}

function overlay(ctx, w, h, t, scene) {
  const id = Object.keys(window.CUTSCENES).find(key => window.CUTSCENES[key] === scene);
  if (lookAt(id, t) === "robot" && window.ROBOT_VIEW) window.ROBOT_VIEW.draw(ctx, w, h, t);
  else window.CUTSCENES.securityCam(ctx, w, h, t, scene.camera);
}

window.FILM_LOOK = { lookAt, overlay };
})();
