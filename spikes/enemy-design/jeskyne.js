(() => {
  const { SPIDER_WALKER, POD_WALKER, CAVE_TROOPER, SPIDER_PALETTE, POD_PALETTE, CAVE_TROOPER_PALETTE } = window.ENEMIES;
  const ROCK = { sky: ["#0d0b0a", "#1d1915"], far: "#2a241e", near: "#3a3129", floor: ["#3e352c", "#221d18"], lip: "#5a4c3e" };
  const own = pal => Object.keys(pal).filter(k => !/^j/.test(k));

  function cave(ctx, w, h, floor) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, ROCK.sky[0]);
    g.addColorStop(1, ROCK.sky[1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    const r = ENV.P.rng(41);
    for (const [fill, y0, amp] of [[ROCK.far, floor - 420, 160], [ROCK.near, floor - 180, 90]]) {
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.moveTo(0, floor);
      for (let x = 0; x <= w; x += 110) ctx.lineTo(x, y0 - r() * amp);
      ctx.lineTo(w, floor);
      ctx.fill();
    }
    ctx.fillStyle = ROCK.far;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    for (let x = 0; x <= w; x += 90) ctx.lineTo(x, 60 + r() * 140);
    ctx.lineTo(w, 0);
    ctx.fill();
    const f = ctx.createLinearGradient(0, floor, 0, h);
    f.addColorStop(0, ROCK.floor[0]);
    f.addColorStop(1, ROCK.floor[1]);
    ctx.fillStyle = f;
    ctx.fillRect(0, floor, w, h - floor);
    ctx.fillStyle = ROCK.lip;
    ctx.fillRect(0, floor, w, 8);
  }

  const at = (asset, state, { x, floor = 50, facing = 1, lod = false, dt = 0 } = {}) => (ctx, lw, pal, w, h, t) =>
    enemy(ctx, asset, { x, y: h - floor, state, t: t + dt, pal, lineW: lw, lod, facing });

  function trooperWalking({ scenery = false, lod = false } = {}) {
    return (ctx, lw, pal, w, h, t) => {
      const floor = scenery ? h - 60 : XBOT.FOOT_Y;
      if (scenery) cave(ctx, w, h, floor);
      const { pose, drop, x } = ENEMIES.caveTrooperWalk(t);
      ctx.translate(acrossX(x, w) - XBOT.SIDE_AX, drop + floor - XBOT.FOOT_Y);
      ENEMIES.caveTrooperRig(ctx, pose, { palette: pal, lines: lw, lod });
    };
  }

  function walking(asset, { floor = 50, lod = false, scenery = false, margin = 500 } = {}) {
    return (ctx, lw, pal, w, h, t) => {
      const y = h - (scenery ? 60 : floor);
      if (scenery) cave(ctx, w, h, y);
      else floorLine(ctx, w, y);
      const x = acrossX(asset.walkX(t) * K, w, margin);
      enemy(ctx, asset, { x, y, state: 1, t, pal, lineW: lw, lod });
    };
  }

  function scale(asset, state, x, heroX = 360) {
    return (ctx, lw, pal, w, h, t) => {
      const floor = h - 50;
      floorLine(ctx, w, floor);
      hero(ctx, { x: heroX, floor, lineW: lw * 1.4 });
      enemy(ctx, asset, { x, y: floor, state, t, pal, lineW: lw, facing: -1 });
    };
  }

  function faceOff(asset, state, x) {
    return (ctx, lw, pal, w, h, t) => {
      const floor = h - 60;
      cave(ctx, w, h, floor);
      hero(ctx, { x: 360, floor, lineW: lw * XBOT.GAME_LINE, simple: true });
      enemy(ctx, asset, { x, y: floor, state, t, pal, lineW: lw, lod: true, facing: -1 });
    };
  }

  function inCave(asset, state, x, dt = 0) {
    return (ctx, lw, pal, w, h, t) => {
      const floor = h - 60;
      cave(ctx, w, h, floor);
      enemy(ctx, asset, { x, y: floor, state, t: t + dt, pal, lineW: lw, lod: true });
    };
  }

  ENEMY_KINDS.spiderWalker = {
    label: "Spider walker", mission: "jeskyne",
    palette: () => ({ ...ENV.PALETTE, ...SPIDER_PALETTE, ...overrides.spiderWalker }),
    ownKeys: own(SPIDER_PALETTE),
    figures: [
      { id: "swIdle", caption: "Spider walker, idle", w: 1100, h: 700, draw: at(SPIDER_WALKER, 0, { x: 520 }) },
      { id: "swWalk", caption: "Spider walker, walk", w: 1100, h: 700, draw: walking(SPIDER_WALKER) },
      { id: "swFire", caption: "Spider walker, firing", w: 1100, h: 700, draw: at(SPIDER_WALKER, 2, { x: 520 }) },
      { id: "swBlast", caption: "Spider walker, explosion", w: 1100, h: 700, draw: at(SPIDER_WALKER, 3, { x: 520 }) },
      { id: "swWreck", caption: "Spider walker, wreck", w: 1100, h: 700, draw: at(SPIDER_WALKER, 4, { x: 520 }) },
      { id: "swScale", caption: "Scale, hero and spider walker", w: 1700, h: 900, draw: scale(SPIDER_WALKER, 2, 1250) }
    ],
    game: [
      { id: "gSwDuel", caption: "Face-off, cave", w: 2000, h: 1000, draw: faceOff(SPIDER_WALKER, 2, 1500) },
      { id: "gSwWalk", caption: "Walk", w: 1100, h: 1000, draw: walking(SPIDER_WALKER, { lod: true, scenery: true }) },
      { id: "gSwWreck", caption: "Wreck", w: 1100, h: 1000, draw: inCave(SPIDER_WALKER, 4, 520) }
    ]
  };

  ENEMY_KINDS.podWalker = {
    label: "Pod walker", mission: "jeskyne",
    palette: () => ({ ...ENV.PALETTE, ...POD_PALETTE, ...overrides.podWalker }),
    ownKeys: own(POD_PALETTE),
    figures: [
      { id: "pwIdle", caption: "Pod walker, idle", w: 1000, h: 800, draw: at(POD_WALKER, 0, { x: 480 }) },
      { id: "pwWalk", caption: "Pod walker, walk", w: 1000, h: 800, draw: walking(POD_WALKER) },
      { id: "pwFire", caption: "Pod walker, firing", w: 1000, h: 800, draw: at(POD_WALKER, 2, { x: 480 }) },
      { id: "pwBlast", caption: "Pod walker, explosion", w: 1000, h: 800, draw: at(POD_WALKER, 3, { x: 480 }) },
      { id: "pwWreck", caption: "Pod walker, wreck", w: 1000, h: 800, draw: at(POD_WALKER, 4, { x: 480 }) },
      { id: "pwScale", caption: "Scale, hero and pod walker", w: 1700, h: 900, draw: scale(POD_WALKER, 2, 1250) }
    ],
    game: [
      { id: "gPwDuel", caption: "Face-off, cave", w: 2000, h: 1000, draw: faceOff(POD_WALKER, 2, 1450) },
      { id: "gPwWalk", caption: "Walk", w: 1000, h: 1000, draw: walking(POD_WALKER, { lod: true, scenery: true }) },
      { id: "gPwWreck", caption: "Wreck", w: 1000, h: 1000, draw: inCave(POD_WALKER, 4, 480) }
    ]
  };

  ENEMY_KINDS.caveTrooper = {
    label: "Cave trooper", mission: "jeskyne",
    palette: () => ({ ...ENV.PALETTE, ...CAVE_TROOPER_PALETTE, ...overrides.caveTrooper }),
    ownKeys: own(CAVE_TROOPER_PALETTE),
    figures: [
      { id: "ctIdle", caption: "Cave trooper, idle", w: 1400, h: 1100, draw: at(CAVE_TROOPER, 0, { x: 480 }) },
      { id: "ctWalk", caption: "Cave trooper, walk", w: 1600, h: 780, draw: trooperWalking() },
      { id: "ctFire", caption: "Cave trooper, firing", w: 1400, h: 1100, draw: at(CAVE_TROOPER, 2, { x: 440 }) },
      { id: "ctHit", caption: "Cave trooper, death fling (thrown back and up as it explodes)", w: 1400, h: 1100, draw: at(CAVE_TROOPER, 3, { x: 600 }) },
      { id: "ctBlast", caption: "Cave trooper, explosion", w: 1400, h: 1100, draw: at(CAVE_TROOPER, 4, { x: 640 }) },
      { id: "ctWreck", caption: "Cave trooper, wreck", w: 1400, h: 1100, draw: at(CAVE_TROOPER, 5, { x: 640 }) },
      { id: "ctScale", caption: "Scale, hero and cave trooper", w: 2000, h: 1100, draw: scale(CAVE_TROOPER, 0, 1500) }
    ],
    game: [
      { id: "gCtDuel", caption: "Face-off, cave", w: 2200, h: 1200, draw: faceOff(CAVE_TROOPER, 2, 1650) },
      { id: "gCtWalk", caption: "Walk", w: 1300, h: 1200, draw: trooperWalking({ lod: true, scenery: true }) },
      { id: "gCtHit", caption: "Death fling", w: 1300, h: 1200, draw: inCave(CAVE_TROOPER, 3, 600) },
      { id: "gCtWreck", caption: "Wreck", w: 1300, h: 1200, draw: inCave(CAVE_TROOPER, 5, 640) }
    ]
  };
})();
