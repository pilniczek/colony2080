{
  const { locate, solve, FOOT_Y, SIDE_AX } = window.XBOT;
  const CROWBAR = window.ENV.ASSETS.find(a => a.id === "crowbar");
  const ROD_K = 16;
  const DUCK = { body: 16, hipNear: -86, kneeNear: 124, ankleNear: -44, hipFar: -68, kneeFar: 128, ankleFar: -76, arm: -52, fore: -92, armFar: 10, foreFar: -20 };
  const SIDE = { w: 640, h: 560, x0: 40, y0: FOOT_Y - 530 };
  const VIEW = { w: 640, h: 380, pivot: [88, 438] };
  const ITEM_X = 530;
  const MAX_LEAN = 60;
  const PALM_DOWN = -60;
  const LIFT_AT = [SIDE_AX + 130, FOOT_Y - 230];
  const TIMES = { start: 0.4, reach: 1.1, take: 1.5, hold: 1.7, lift: 2.5, loop: 3.3 };

  const rigs = { reach: buildSide({ farLimbs: true, hold: "reach" }), grip: buildSide({ farLimbs: true, hold: "grip" }) };
  const drop = FOOT_Y - Math.max(...["heelNear", "toeNear", "heelFar", "toeFar"].map(h => locate(rigs.grip, h, DUCK).f));
  const poseOf = ({ lean, arm, fore, wrist }) => ({ ...DUCK, body: DUCK.body + lean, hipNear: DUCK.hipNear - lean, hipFar: DUCK.hipFar - lean, arm, fore, wrist });

  const turnOf = m => Math.atan2(m.b, m.a) * 180 / Math.PI;
  const wrap = a => ((a + 540) % 360) - 180;
  const rest = turnOf(locate(rigs.grip, "rod", poseOf({ lean: 0, arm: 0, fore: 0, wrist: 0 })));

  function fit(rig, hook, [tx, ty], turn, maxLean = MAX_LEAN) {
    const target = { x: tx, y: ty - drop };
    let best = null;
    for (let lean = 0; lean <= maxLean; lean += 2) {
      let wrist = 0, arm = null, miss = Infinity;
      for (let i = 0; i < 6; i++) {
        arm = solve(rig, hook, poseOf({ lean, arm: 0, fore: 0, wrist }), ["arm", "fore"], [[-180, 60], [-170, 10]], target);
        const m = locate(rig, hook, poseOf({ lean, ...arm, wrist }));
        miss = Math.hypot(m.e - target.x, m.f - target.y);
        wrist += wrap(turn - turnOf(m));
      }
      best = { lean, ...arm, wrist };
      if (miss < 3) break;
    }
    return best;
  }

  const ROD_Y = FOOT_Y - 1.5 * ROD_K;
  const take = fit(rigs.grip, "rod", [ITEM_X, ROD_Y], rest + PALM_DOWN);
  const takeHand = locate(rigs.grip, "hand", poseOf(take));
  const reach = fit(rigs.reach, "hand", [takeHand.e - 16, takeHand.f + drop - 46], rest + PALM_DOWN);
  const lift = fit(rigs.grip, "rod", LIFT_AT, turnOf(locate(rigs.grip, "rod", poseOf(take))), 0);
  const start = { lean: 0, arm: -30, fore: -40, wrist: 0 };

  const ease = u => u * u * (3 - 2 * u);
  const mix = (a, b, u) => Object.fromEntries(Object.keys(a).map(k => [k, a[k] + (b[k] - a[k]) * ease(u)]));
  const span = (t, a, b) => Math.min(1, Math.max(0, (t - a) / (b - a)));

  const PHASES = { reach: TIMES.reach, take: TIMES.hold, lift: TIMES.lift };

  function armAt(t) {
    if (t < TIMES.reach) return { hold: "reach", arm: mix(start, reach, span(t, TIMES.start, TIMES.reach)) };
    if (t < TIMES.take) return { hold: "reach", arm: mix(reach, take, span(t, TIMES.reach, TIMES.take)) };
    return { hold: "grip", arm: mix(take, lift, span(t, TIMES.hold, TIMES.lift)) };
  }

  const groundSide = new DOMMatrix().translate(ITEM_X, FOOT_Y - drop).scale(ROD_K);
  const rodTake = locate(rigs.grip, "rod", poseOf(take));

  function crowbar(ctx, m, view, dpr) {
    ctx.save();
    ctx.transform(m.a, m.b, m.c, m.d, m.e, m.f);
    window.ENV.draw(ctx, CROWBAR, { view, lines: dpr });
    ctx.restore();
  }

  function drawSide(c, t) {
    const [ctx, dpr] = fitCanvas(c, SIDE.w, SIDE.h);
    ctx.translate(-SIDE.x0, -SIDE.y0);
    ctx.strokeStyle = "rgba(63,208,224,0.5)";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(SIDE.x0, FOOT_Y); ctx.lineTo(SIDE.x0 + SIDE.w, FOOT_Y); ctx.stroke();
    const { hold, arm } = armAt(t);
    const pose = poseOf(arm);
    const held = hold === "grip" ? locate(rigs.grip, "rod", pose).multiply(rodTake.inverse()) : new DOMMatrix();
    ctx.translate(0, drop);
    crowbar(ctx, held.multiply(groundSide), "front", dpr);
    render(ctx, rigs[hold], { pal, pose, lineW: 1.4 * dpr });
  }

  function viewLayout({ hands, place, at, h, hook, tf }) {
    const ground = place(at.take, "grip").multiply(locate(hands.grip, hook)).multiply(tf);
    const held = ctx => {
      ctx.transform(tf.a, tf.b, tf.c, tf.d, tf.e, tf.f);
      window.ENV.draw(ctx, CROWBAR, { view: "top", lines: devicePixelRatio || 1 });
    };
    return { hands, place, at, h, hook, ground, held };
  }

  const FINGERS_DOWN = new DOMMatrix().translate(88, 470).rotate(-90).translate(-88, -470);
  const across = viewLayout({
    hands: { reach: buildHand({ view: "back", pose: "reach", forearm: true }), grip: buildHand({ view: "back", pose: "grip", forearm: true }) },
    place: ([x, y, k], hold) => {
      const m = new DOMMatrix().translate(x, y).scale(k).rotate(180).translate(-VIEW.pivot[0], -VIEW.pivot[1]);
      return hold === "grip" ? m.multiply(FINGERS_DOWN) : m;
    },
    at: { start: [380, 470, 1.35], reach: [326, 196, 1.08], take: [320, 172, 1], lift: [334, 330, 1.4] },
    h: VIEW.h,
    hook: "item",
    tf: new DOMMatrix().translate(0, -1.5)
  });
  const THUMB_UP = new DOMMatrix().translate(88, 470).rotate(90).translate(-88, -470);
  const away = viewLayout({
    hands: { reach: buildHand({ view: "thumb", pose: "reach", forearm: true }), grip: buildHand({ view: "thumb", pose: "grip", forearm: true }) },
    place: ([x, y, k], hold) => {
      const m = new DOMMatrix().translate(x, y).scale(k).rotate(180).translate(-VIEW.pivot[0], -VIEW.pivot[1]);
      return hold === "grip" ? m.multiply(THUMB_UP) : m;
    },
    at: { start: [380, 660, 1.35], reach: [356, 300, 1.08], take: [330, 270, 1], lift: [344, 440, 1.35] },
    h: 560,
    hook: "underThumb",
    tf: new DOMMatrix().rotate(90).scale(ROD_K).translate(-13, 0)
  });
  const LAYOUTS = { view: across, viewAway: away };

  function viewAt(layout, t) {
    const lerp = (a, b, u) => a.map((v, i) => v + (b[i] - v) * ease(u));
    const { at } = layout;
    if (t < TIMES.reach) return { hold: "reach", at: lerp(at.start, at.reach, span(t, TIMES.start, TIMES.reach)) };
    if (t < TIMES.take) return { hold: "reach", at: lerp(at.reach, at.take, span(t, TIMES.reach, TIMES.take)) };
    return { hold: "grip", at: lerp(at.take, at.lift, span(t, TIMES.hold, TIMES.lift)) };
  }

  function drawView(c, t, layout) {
    const [ctx, dpr] = fitCanvas(c, VIEW.w, layout.h);
    const { hold, at } = viewAt(layout, t);
    const m = layout.place(at, hold);
    const base = ctx.getTransform();
    const onGround = g => {
      g.setTransform(base);
      crowbar(g, layout.ground, "top", dpr);
    };
    const hand = layout.hands[hold];
    if (hold === "reach" && !locate(hand, "item")) onGround(ctx);
    ctx.save();
    ctx.transform(m.a, m.b, m.c, m.d, m.e, m.f);
    render(ctx, hand, { pal, hooks: hold === "reach" ? { item: onGround } : { [layout.hook]: layout.held }, lineW: 1.4 * dpr });
    ctx.restore();
  }

  const canvases = [...document.querySelectorAll("canvas[data-pick]")];
  function frame(now) {
    const loop = (now / 1000) % TIMES.loop;
    for (const c of canvases) {
      const t = c.dataset.phase ? PHASES[c.dataset.phase] : loop;
      if (c.dataset.pick === "side") drawSide(c, t);
      else drawView(c, t, LAYOUTS[c.dataset.pick]);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
