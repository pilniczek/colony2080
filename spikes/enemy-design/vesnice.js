{
  const { ROCKET_ROBOT, GREY_TROOPER, ROCKET_PALETTE, GREY_PALETTE } = ENEMIES;
  const RADIO_GUARD = ENV.ASSETS.find(a => a.id === "radioGuard");
  const ownKeys = palette => Object.keys(palette).filter(k => !k.startsWith("vFire"));

  const single = (asset, state, x = 500) => (ctx, lw, pal, w, h, t) => {
    floorLine(ctx, w, h - 50);
    enemy(ctx, asset, { x, y: h - 50, state, t, pal, lineW: lw });
  };
  const lodFull = (asset, state, x = 500) => (ctx, lw, pal, w, h, t) => {
    floorLine(ctx, w, h - 50);
    enemy(ctx, asset, { x, y: h - 50, state, t, pal, lineW: lw, lod: true });
  };
  const walking = (asset, lod = false) => (ctx, lw, pal, w, h, t) => {
    if (lod) backdrop(ctx, w, h);
    const x = acrossX(GAIT.walkAt(t).x, w);
    enemy(ctx, asset, { x: lod ? w - x : x, y: XBOT.FOOT_Y, state: 1, t, pal, lineW: lw, lod, facing: lod ? -1 : 1 });
  };
  const scale = (asset, state, x) => (ctx, lw, pal, w, h, t) => {
    const floor = h - 50;
    floorLine(ctx, w, floor);
    hero(ctx, { x: 360, floor, lineW: lw * 1.4 });
    enemy(ctx, asset, { x, y: floor, state, t, pal, lineW: lw, facing: -1 });
  };
  const faceOff = (asset, state, x) => (ctx, lw, pal, w, h, t) => {
    backdrop(ctx, w, h);
    const floor = h - 50;
    if (opts.hero) hero(ctx, { x: 360, floor, lineW: lw * XBOT.GAME_LINE, simple: true });
    enemy(ctx, asset, { x, y: floor, state, t, pal, lineW: lw, lod: true, facing: -1 });
  };
  const aimed = (asset, x, heroX = 360) => ({ ...asset, draw: (c, state, t) => asset.draw(c, state, t, { target: (x - heroX) / K }) });
  const inGame = (asset, state, x = 500) => (ctx, lw, pal, w, h, t) => {
    backdrop(ctx, w, h);
    enemy(ctx, asset, { x, y: h - 50, state, t, pal, lineW: lw, lod: true, facing: -1 });
  };

  ENEMY_KINDS.rocketRobot = {
    label: "Rocket robot", mission: "vesnice",
    palette: () => ({ ...ENV.PALETTE, ...ROCKET_PALETTE, ...overrides.rocketRobot }),
    ownKeys: ownKeys(ROCKET_PALETTE),
    figures: [
      { id: "rrIdle", caption: "Rocket robot, idle", w: 1300, h: 1100, draw: single(ROCKET_ROBOT, 0) },
      { id: "rrWalk", caption: "Rocket robot, walk", w: 1600, h: 780, draw: walking(ROCKET_ROBOT) },
      { id: "rrFire", caption: "Rocket robot attack: kneels in 0.12 s, first rocket at 0.15 s, then one every 0.9 s while it sees the hero; the warhead is back 0.45 s after each shot; hero lost at 2.4 s, gets up in 0.12 s", w: 2000, h: 1100, draw: single(ROCKET_ROBOT, 2, 650) },
      { id: "rrBlast", caption: "Rocket robot, explosion", w: 1300, h: 1100, draw: single(ROCKET_ROBOT, 3) },
      { id: "rrWreck", caption: "Rocket robot, burning wreck", w: 1300, h: 1100, draw: single(ROCKET_ROBOT, 4) },
      { id: "rrLod", caption: "Rocket robot, game LOD, full size", w: 2000, h: 1100, draw: lodFull(ROCKET_ROBOT, 2, 650) },
      { id: "rrScale", caption: "Scale, hero and rocket robot", w: 2300, h: 1100, hero: true, draw: scale(ROCKET_ROBOT, 0, 1800) }
    ],
    game: [
      { id: "gRocketRobot", caption: "Face-off: kneel, a rocket every 0.9 s at 22 cells/s, hit on the hero; hero lost at 2.4 s, gets up", w: 3600, h: 1100, draw: faceOff(aimed(ROCKET_ROBOT, 3000), 2, 3000) },
      { id: "gRocketWalk", caption: "Walk", w: 1600, h: 780, draw: walking(ROCKET_ROBOT, true) },
      { id: "gRocketWreck", caption: "Burning wreck", w: 1300, h: 1100, draw: inGame(ROCKET_ROBOT, 4, 700) }
    ]
  };

  ENEMY_KINDS.greyTrooper = {
    label: "Grey trooper", mission: "vesnice",
    palette: () => ({ ...ENV.PALETTE, ...GREY_PALETTE, ...overrides.greyTrooper }),
    ownKeys: ownKeys(GREY_PALETTE),
    figures: [
      { id: "gtIdle", caption: "Grey trooper, idle", w: 1500, h: 1100, draw: single(GREY_TROOPER, 0) },
      { id: "gtWalk", caption: "Grey trooper, walk", w: 1600, h: 780, draw: walking(GREY_TROOPER) },
      { id: "gtFire", caption: "Grey trooper, burst: 9 shots in 0.28 s, 0.4 s pause", w: 1500, h: 1100, draw: single(GREY_TROOPER, 2) },
      { id: "gtBlast", caption: "Grey trooper, explosion", w: 1500, h: 1100, draw: single(GREY_TROOPER, 3, 650) },
      { id: "gtWreck", caption: "Grey trooper, scrap pile", w: 1500, h: 1100, draw: single(GREY_TROOPER, 4, 650) },
      { id: "gtLod", caption: "Grey trooper, game LOD, full size", w: 1500, h: 1100, draw: lodFull(GREY_TROOPER, 2) },
      { id: "gtScale", caption: "Scale, hero and grey trooper", w: 2300, h: 1100, hero: true, draw: scale(GREY_TROOPER, 0, 1650) }
    ],
    game: [
      { id: "gGreyTrooper", caption: "Face-off, burst", w: 2600, h: 1100, draw: faceOff(GREY_TROOPER, 2, 1900) },
      { id: "gGreyWalk", caption: "Walk", w: 1600, h: 780, draw: walking(GREY_TROOPER, true) },
      { id: "gGreyWreck", caption: "Scrap pile", w: 1300, h: 1100, draw: inGame(GREY_TROOPER, 4, 650) }
    ]
  };

  ENEMY_KINDS.radioGuard = {
    label: "Walkie-talkie guard", mission: "vesnice",
    palette: () => ({ ...ENV.PALETTE, ...overrides.radioGuard }),
    ownKeys: [],
    figures: [
      { id: "bgIdle", caption: "Walkie-talkie guard, idle", w: 1300, h: 1300, draw: single(RADIO_GUARD, 0) },
      { id: "bgFire", caption: "Walkie-talkie guard, firing", w: 1300, h: 1300, draw: single(RADIO_GUARD, 1) },
      { id: "bgDead", caption: "Walkie-talkie guard, dead", w: 1300, h: 1300, draw: single(RADIO_GUARD, 2, 650) },
      { id: "bgScale", caption: "Scale, hero and walkie-talkie guard", w: 2300, h: 1300, hero: true, draw: scale(RADIO_GUARD, 0, 1650) }
    ],
    game: [
      { id: "gBridgeGuard", caption: "Face-off", w: 2600, h: 1300, draw: faceOff(RADIO_GUARD, 1, 1900) },
      { id: "gBridgeDead", caption: "Dead", w: 1300, h: 1300, draw: inGame(RADIO_GUARD, 2, 650) }
    ]
  };
}
