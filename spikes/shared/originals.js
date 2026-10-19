window.ORIGINALS = {
  on: true,
  src: path => "../../docs/research/" + path,
  previewSheet: preview => `../../docs/research/gamedata/png/${preview.split("/").pop().replace(/\.GRA$/i, "")}_sheet.png`,
  cutscenes: {
    crowbarDoor: {
      label: "Original METROPAC.ANM (time-normalised)",
      frames: 61,
      frame: i => `../../docs/research/gamedata/png/METROPAC/f${String(i).padStart(3, "0")}.png`
    }
  }
};
