const film = (label, clips) => {
  const total = clips.reduce((n, [, frames]) => n + frames - 1, 0);
  const pick = (name, i) => `../../docs/research/gamedata/png/${name}/f${String(i + 1).padStart(3, "0")}.png`;
  return {
    label,
    frame: (t, duration) => {
      if (clips.every(c => c.length > 2)) {
        const at = clips.findLastIndex(([, , start]) => t >= start);
        const [name, frames, start] = clips[Math.max(0, at)];
        const end = clips[Math.max(0, at)][3] ?? clips[at + 1]?.[2] ?? duration;
        return pick(name, Math.min(frames - 2, Math.floor(Math.min(t - start, end - start) / (end - start) * (frames - 1))));
      }
      let i = Math.min(total - 1, Math.floor(t / duration * total));
      for (const [name, frames] of clips) {
        if (i < frames - 1) return pick(name, i);
        i -= frames - 1;
      }
    }
  };
};

window.ORIGINALS = {
  on: true,
  src: path => "../../docs/research/" + path,
  previewSheet: preview => `../../docs/research/gamedata/png/${preview.split("/").pop().replace(/\.GRA$/i, "")}_sheet.png`,
  weapons: {
    blaster: [
      ["Beam, 6 frames (game data)", "video/frames-best/GRA_LEV1_f008_eblaster_beam_6frames.png"],
      ["Beam hits a droid", "video/frames-best/L1_KkPeK_t1304_eblaster_beam_hits_droid.png"],
      ["HUD top bar, slot 3", "video/frames-best/GRA_DESKA3_hud_top_with_eblaster_slot3.png"]
    ],
    toaster: [
      ["Shot, 6 frames, fireball 1 tile per tick (game data, LEV2.GRA f8)", "video/frames-best/GRA_LEV2_f008_toaster_shot_6frames.png"],
      ["HUD slot 3, level 2 (DESKA4.GRA)", "video/frames-best/GRA_DESKA4_hud_slot3_toaster.png"]
    ]
  },
  enemies: {
    rocketRobot: [["Rocket robot (rows 1-2) and grey trooper (rows 3-4), LEV2.GRA f21-24", "gamedata/png/enemy-sprites/lev2_types_f21_f24.png"]],
    greyTrooper: [["Rocket robot (rows 1-2) and grey trooper (rows 3-4), LEV2.GRA f21-24", "gamedata/png/enemy-sprites/lev2_types_f21_f24.png"]],
    bridgeGuard: [["Bridge guard, LEV2.GRA f25 frames 1-8", "gamedata/png/enemy-sprites/lev2_guard_f25_frames.png"]],
    rocketDroid: [
      ["Walk, LEV3.GRA f21", "gamedata/png/enemy-sprites/lev3_f21.png"],
      ["Fire 1-9, burning scrap 10-24, LEV3.GRA f22", "gamedata/png/enemy-sprites/lev3_f22.png"]
    ],
    crawler: [
      ["Walk, LEV3.GRA f23", "gamedata/png/enemy-sprites/lev3_f23.png"],
      ["Burst 1-9, wreck 10-24, LEV3.GRA f24", "gamedata/png/enemy-sprites/lev3_f24.png"],
      ["Unused guard, LEV3.GRA f25", "gamedata/png/enemy-sprites/lev3_turret_f25_frames.png"]
    ],
    spiderWalker: [
      ["Spider walker walk, LEV4.GRA f21 frames 1, 7, 13, 19", "gamedata/png/enemy-sprites/lev4_spider_walk.png"],
      ["Spider walker firing, LEV4.GRA f22 frames 1, 2, 4, 7", "gamedata/png/enemy-sprites/lev4_spider_fire.png"],
      ["Spider walker, LEV4.GRA f21-f22 all frames", "gamedata/png/enemy-sprites/lev4_spider_f21_f22.png"]
    ],
    podWalker: [
      ["Pod walker walk, LEV4.GRA f23 frames 1, 5, 10, 16", "gamedata/png/enemy-sprites/lev4_pod_walk.png"],
      ["Pod walker fire and wreck, LEV4.GRA f24 frames 1, 2, 4, 12, 20", "gamedata/png/enemy-sprites/lev4_pod_fire_wreck.png"],
      ["Pod walker, LEV4.GRA f23-f24 all frames", "gamedata/png/enemy-sprites/lev4_pod_f23_f24.png"]
    ],
    caveTrooper: [
      ["Trooper walk, LEV4.GRA f27 frames 1, 6, 12, 18", "gamedata/png/enemy-sprites/lev4_trooper_walk.png"],
      ["Trooper aim, fire, knockback, front, LEV4.GRA f28", "gamedata/png/enemy-sprites/lev4_trooper_other.png"],
      ["Trooper, LEV4.GRA f27-f28 all frames", "gamedata/png/enemy-sprites/lev4_trooper_f27_f28.png"]
    ]
  },
  cutscenes: {
    crowbarDoor: {
      label: "Original METROPAC.ANM (time-normalised)",
      frames: 61,
      frame: i => `../../docs/research/gamedata/png/METROPAC/f${String(i).padStart(3, "0")}.png`
    },
    missionStart: film("Original ODNAK.ANM, NAKLAD.ANM, RAKOD1.ANM, SESTREL.ANM, ROBBLIK.ANM, UPAD.ANM, RUCE.ANM, MONITOR.ANM, PRILET1.ANM, PRILET2.ANM", [["ODNAK", 102, 0], ["NAKLAD", 152, 6.5], ["RAKOD1", 240, 12.5], ["SESTREL", 102, 20.5], ["ROBBLIK", 50, 25], ["UPAD", 53, 27.2], ["RUCE", 151, 31], ["MONITOR", 213, 37.5], ["PRILET1", 132, 47.5], ["PRILET2", 98, 54.5]]),
    rebelShot: film("Original POSTREL.ANM, POSTREL2.ANM, POSTREL3.ANM", [["POSTREL", 42, 0], ["POSTREL2", 41, 1.8], ["POSTREL3", 52, 3.56]]),
    talkRebel: film("Original REBMRT.ANM", [["REBMRT", 181]]),
    pullWires: film("Original VYTDRAT.ANM", [["VYTDRAT", 61]]),
    wireSwitchboard: film("Original DRATVLOZ.ANM", [["DRATVLOZ", 37]]),
    takeTapHandle: film("Original OTOCKOH.ANM, SEBKOH.ANM", [["OTOCKOH", 52, 0], ["SEBKOH", 46, 3.714]]),
    searchCorpse: film("Original SEBPLAN.ANM", [["SEBPLAN", 62]]),
    tradeHoloPlan: film("Original OTEVRID.ANM, UKAZHOLO.ANM, DEJSOU1.ANM", [["OTEVRID", 43, 0], ["UKAZHOLO", 142, 3.07], ["DEJSOU1", 66, 5.9]]),
    tradeShipPart: film("Original DEJSOU1.ANM", [["DEJSOU1", 66]]),
    unlockPlasma: film("Original DEKOD1.ANM", [["DEKOD1", 72]]),
    repairLift: film("Original VYTAHOP.ANM", [["VYTAHOP", 62]]),
    openDoor: film("Original OTDVER1.ANM", [["OTDVER1", 102]]),
    acidGuardComes: film("Original ZABIJ.ANM", [["ZABIJ", 61]]),
    useAcidTank: film("Original KYSELINA.ANM", [["KYSELINA", 52, 0, 2.23]]),
    hullCover: film("Original SEBSOUC.ANM", [["SEBSOUC", 52]]),
    pickShipPart: film("Original SEBSOU.ANM", [["SEBSOU", 41]]),
    pickCraneKey: film("Original SEBKL1.ANM", [["SEBKL1", 41]]),
    pickCrowbar: film("Original SEBPACID.ANM", [["SEBPACID", 41]]),
    pickController: film("Original SEBOVL.ANM", [["SEBOVL", 41]]),
    pickEBlaster: film("Original EBLAST.ANM", [["EBLAST", 42]]),
    repairCrane: film("Original MESTOKO.ANM, SKALA3.ANM", [["MESTOKO", 202, 0], ["SKALA3", 102, 8.66]])
  }
};
