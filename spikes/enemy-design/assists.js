{
  const { ROCKET_ROBOT, GREY_TROOPER, HEALTH_BAR } = ENEMIES;
  const FLYER = ENV.ASSETS.find(a => a.id === "flyer");
  const BAR = ENV.ASSETS.find(a => a.id === "healthBar");
  const states = Array.from({ length: HEALTH_BAR.segments + 1 }, (_, i) => HEALTH_BAR.segments - i);

  const bars = (lod) => (ctx, lw, pal, w, h) => {
    const step = w / states.length;
    states.forEach((state, i) => enemy(ctx, BAR, { x: step * (i + 0.5), y: h / 2, state, pal, lineW: lw, lod }));
  };

  const HUMANOID_TOP = -ENV.TILE * 1.9;
  const overEnemy = (asset, state, left, top = asset.box[1]) => (ctx, lw, pal, w, h, t) => {
    backdrop(ctx, w, h);
    const floor = h - 50;
    const x = w / 2;
    enemy(ctx, asset, { x, y: floor, state, t, pal, lineW: lw, lod: true, facing: -1 });
    enemy(ctx, BAR, { x, y: floor + (top - HEALTH_BAR.lift) * K, state: left, pal, lineW: lw, lod: true });
  };

  ENEMY_KINDS.healthBar = {
    label: "Health bar", mission: "all missions, ENEMY HEALTH BARS assist",
    palette: () => ({ ...ENV.PALETTE, ...overrides.healthBar }),
    ownKeys: [],
    figures: [
      { id: "hbStates", caption: `Health bar, hits left ${HEALTH_BAR.segments} to 0 (green over half, yellow over a quarter, orange below), full size`, w: 3800, h: 300, draw: bars(false) },
      { id: "hbLod", caption: "Health bar, game LOD", w: 3800, h: 300, draw: bars(true) }
    ],
    game: [
      { id: "gHbFlyer", caption: "Over a hit flyer (mesto special)", w: 1300, h: 1100, draw: overEnemy(FLYER, 0, 5) },
      { id: "gHbRocket", caption: "Over a hit rocket robot (vesnice special)", w: 1300, h: 1100, draw: overEnemy(ROCKET_ROBOT, 0, 3, HUMANOID_TOP) },
      { id: "gHbTrooper", caption: "Over a hit grey trooper (vesnice base)", w: 1300, h: 1100, draw: overEnemy(GREY_TROOPER, 0, 1, HUMANOID_TOP) }
    ]
  };
}
