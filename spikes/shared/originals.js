const film = (label, clips) => {
  const total = clips.reduce((n, [, frames]) => n + frames - 1, 0);
  return {
    label,
    frame: u => {
      let i = Math.min(total - 1, Math.floor(u * total));
      for (const [name, frames] of clips) {
        if (i < frames - 1) return `../../docs/research/gamedata/png/${name}/f${String(i + 1).padStart(3, "0")}.png`;
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
    missionStart: film("Original ODNAK.ANM, NAKLAD.ANM, RAKOD1.ANM, SESTREL.ANM, ROBBLIK.ANM, UPAD.ANM, RUCE.ANM, MONITOR.ANM, PRILET1.ANM, PRILET2.ANM", [["ODNAK", 102], ["NAKLAD", 152], ["RAKOD1", 240], ["SESTREL", 102], ["ROBBLIK", 50], ["UPAD", 53], ["RUCE", 151], ["MONITOR", 213], ["PRILET1", 132], ["PRILET2", 98]]),
    rebelShot: film("Original OTOC.ANM, POSTREL.ANM, POSTREL2.ANM, POSTREL3.ANM", [["OTOC", 32], ["POSTREL", 42], ["POSTREL2", 41], ["POSTREL3", 52]]),
    talkRebel: film("Original REBMRT.ANM", [["REBMRT", 181]]),
    pullWires: film("Original VYTDRAT.ANM", [["VYTDRAT", 61]]),
    wireSwitchboard: film("Original DRATVLOZ.ANM", [["DRATVLOZ", 37]]),
    takeTapHandle: film("Original OTOCKOH.ANM, SEBKOH.ANM", [["OTOCKOH", 52], ["SEBKOH", 46]]),
    searchCorpse: film("Original SEBPLAN.ANM", [["SEBPLAN", 62]]),
    tradeHoloPlan: film("Original OTEVRID.ANM, UKAZHOLO.ANM, DEJSOU1.ANM", [["OTEVRID", 43], ["UKAZHOLO", 142], ["DEJSOU1", 66]]),
    tradeShipPart: film("Original DEJSOU1.ANM", [["DEJSOU1", 66]]),
    unlockPlasma: film("Original DEKOD1.ANM", [["DEKOD1", 72]]),
    repairLift: film("Original VYTAHOP.ANM", [["VYTAHOP", 62]]),
    openDoor: film("Original OTDVER1.ANM", [["OTDVER1", 102]]),
    useAcidTank: film("Original KYSELINA.ANM", [["KYSELINA", 52]]),
    hullCover: film("Original SEBSOUC.ANM", [["SEBSOUC", 52]]),
    pickShipPart: film("Original SEBSOU.ANM", [["SEBSOU", 41]]),
    pickCraneKey: film("Original SEBKL1.ANM", [["SEBKL1", 41]]),
    pickCrowbar: film("Original SEBPACID.ANM", [["SEBPACID", 41]]),
    pickController: film("Original SEBOVL.ANM", [["SEBOVL", 41]]),
    pickEBlaster: film("Original EBLAST.ANM", [["EBLAST", 42]]),
    repairCrane: film("Original MESTOKO.ANM, SKALA3.ANM", [["MESTOKO", 202], ["SKALA3", 102]])
  }
};
