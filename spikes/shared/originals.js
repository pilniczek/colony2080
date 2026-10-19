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
    }
  }
};
