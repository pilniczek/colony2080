{
  const { ROCKET_DROID, CRAWLER, ROCKET_PALETTE, CRAWLER_PALETTE } = ENEMIES;
  const ground = (ctx, w, h) => { floorLine(ctx, w, h - 50); return h - 50; };
  const solo = (asset, state, x, extra = {}) => (ctx, lw, pal, w, h, t) => {
    const floor = ground(ctx, w, h);
    enemy(ctx, asset, { x: x ?? w / 2, y: floor, state, t: t + (extra.dt ?? 0), pal, lineW: lw, facing: extra.facing ?? 1 });
  };
  const crawlerAt = (x0, w, t, facing = 1) => acrossX(x0 + facing * t * ENEMIES.CRAWLER_SPEED * K, w);
  const droidWalk = (ctx, { w, floor, t, pal, lineW, lod = false }) => {
    const { drop, x } = GAIT.walkAt(t);
    ctx.save();
    ctx.translate(acrossX(x, w) - XBOT.SIDE_AX, floor - XBOT.FOOT_Y + drop);
    ENEMIES.drawRocketDroidRig(ctx, { t, pal, lineW, lod });
    ctx.restore();
  };
  const scale = asset => (ctx, lw, pal, w, h, t) => {
    const floor = ground(ctx, w, h);
    hero(ctx, { x: 360, floor, lineW: lw * 1.4 });
    enemy(ctx, asset, { x: w - 420, y: floor, state: 0, t, pal, lineW: lw, facing: -1 });
  };
  const faceOff = (asset, state, gap, extra = []) => (ctx, lw, pal, w, h, t) => {
    backdrop(ctx, w, h);
    const floor = h - 50;
    floorLine(ctx, w, floor);
    if (opts.hero) hero(ctx, { x: 360, floor, lineW: lw * XBOT.GAME_LINE, simple: true });
    enemy(ctx, asset, { x: w - gap, y: floor, state, t, pal, lineW: lw, lod: true, facing: -1 });
    for (const [x, s, dt, walks] of extra) enemy(ctx, asset, { x: walks ? crawlerAt(x, w, t, -1) : x, y: floor, state: s, t: t + dt, pal, lineW: lw, lod: true, facing: -1 });
  };
  const duel = (gap, droidX, lod) => (ctx, lw, pal, w, h, t) => {
    if (lod) backdrop(ctx, w, h);
    const floor = ground(ctx, w, h);
    const cell = ENV.TILE * K;
    const heroX = droidX - gap * cell;
    if (opts.hero) hero(ctx, lod ? { x: heroX, floor, lineW: lw * XBOT.GAME_LINE, simple: true } : { x: heroX, floor, lineW: lw * 1.4 });
    enemy(ctx, ROCKET_DROID, { x: droidX, y: floor, state: 2, t, pal, lineW: lw, lod, facing: -1 });
    ENEMIES.drawDroidVolley(ctx, { x: droidX, floor, facing: -1, heroX, cell, t });
  };
  const gameSolo = (asset, state) => (ctx, lw, pal, w, h, t) => {
    backdrop(ctx, w, h);
    floorLine(ctx, w, h - 50);
    enemy(ctx, asset, { x: w / 2, y: h - 50, state, t, pal, lineW: lw, lod: true });
  };

  ENEMY_KINDS.rocketDroid = {
    label: "Rocket droid", mission: "jungle",
    palette: () => ({ ...ENV.PALETTE, ...ROCKET_PALETTE, ...overrides.rocketDroid }),
    ownKeys: Object.keys(ROCKET_PALETTE),
    figures: [
      { id: "rdIdle", caption: "Rocket droid, idle", w: 1000, h: 1000, draw: solo(ROCKET_DROID, 0, 420) },
      { id: "rdWalk", caption: "Rocket droid, walk", w: 1600, h: 1000, draw: (ctx, lw, pal, w, h, t) => droidWalk(ctx, { w, floor: ground(ctx, w, h), t, pal, lineW: lw }) },
      { id: "rdFire", caption: "Close face-off, 1.5 cells: brace, mortar salvos, get-up", w: 2000, h: 1500, draw: duel(1.5, 1350, false) },
      { id: "rdBlast", caption: "Rocket droid, explosion", w: 1000, h: 1000, draw: solo(ROCKET_DROID, 3, 480) },
      { id: "rdWreck", caption: "Rocket droid, burning wreck", w: 1000, h: 1000, draw: solo(ROCKET_DROID, 4, 480) },
      { id: "rdScale", caption: "Scale, hero and droid", w: 1800, h: 1000, hero: true, draw: scale(ROCKET_DROID) }
    ],
    game: [
      { id: "gRdDuel", caption: "Face-off, 8 cells: brace, missile salvos, get-up", w: 3800, h: 1800, draw: duel(8, 3500, true) },
      { id: "gRdWalk", caption: "Walk and wreck", w: 1600, h: 1000, draw: (ctx, lw, pal, w, h, t) => {
        backdrop(ctx, w, h);
        floorLine(ctx, w, h - 50);
        droidWalk(ctx, { w, floor: h - 50, t, pal, lineW: lw, lod: true });
        enemy(ctx, ROCKET_DROID, { x: 1080, y: h - 50, state: 4, t, pal, lineW: lw, lod: true, facing: -1 });
      } }
    ]
  };

  ENEMY_KINDS.crawler = {
    label: "Crawler", mission: "jungle",
    palette: () => ({ ...ENV.PALETTE, ...CRAWLER_PALETTE, ...overrides.crawler }),
    ownKeys: Object.keys(CRAWLER_PALETTE),
    figures: [
      { id: "crIdle", caption: "Crawler, idle", w: 1100, h: 800, draw: solo(CRAWLER, 0, 500) },
      { id: "crWalk", caption: "Crawler, walk", w: 1600, h: 800, draw: (ctx, lw, pal, w, h, t) => {
        const floor = ground(ctx, w, h);
        enemy(ctx, CRAWLER, { x: crawlerAt(0, w, t), y: floor, state: 1, t, pal, lineW: lw });
      } },
      { id: "crFire", caption: "Crawler, burst", w: 1100, h: 800, draw: solo(CRAWLER, 2, 440) },
      { id: "crBlast", caption: "Crawler, explosion", w: 1100, h: 800, draw: solo(CRAWLER, 3, 520) },
      { id: "crWreck", caption: "Crawler, wreck", w: 1100, h: 800, draw: solo(CRAWLER, 4, 520) },
      { id: "crScale", caption: "Scale, hero and crawler", w: 1600, h: 1000, hero: true, draw: scale(CRAWLER) }
    ],
    game: [
      { id: "gCrawler", caption: "Face-off, burst and walk", w: 2400, h: 1000, draw: faceOff(CRAWLER, 2, 400, [[1700, 1, 0, true]]) },
      { id: "gCrawlerWreck", caption: "Wreck", w: 1100, h: 800, draw: gameSolo(CRAWLER, 4) }
    ]
  };
}
