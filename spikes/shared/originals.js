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
