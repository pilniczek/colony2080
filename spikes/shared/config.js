window.C28_CONFIG = {
 "items": {
  "crowbar": {
   "name": "crowbar",
   "cs": "Páčidlo",
   "icon": {
    "asset": "crowbar",
    "tilt": 45,
    "scale": 1.25
   },
   "preview": "GRAFIKA/PRPAC.GRA"
  },
  "wires": {
   "name": "wires",
   "cs": "Dráty",
   "icon": {
    "asset": "wires",
    "tilt": 0,
    "scale": 1.25
   },
   "preview": "GRAFIKA/PRDRAT.GRA"
  },
  "tapHandle": {
   "name": "tap handle",
   "cs": "Kohout uzávěru",
   "icon": {
    "asset": "tapHandle",
    "tilt": 0,
    "scale": 1.25
   },
   "preview": "GRAFIKA/PRKOH.GRA"
  },
  "card": {
   "name": "card",
   "cs": "Karta",
   "icon": {
    "asset": "card",
    "tilt": 0,
    "scale": 1.25
   },
   "preview": "GRAFIKA/PRKART.GRA"
  },
  "holoPlan": {
   "name": "holo plan",
   "cs": "Holog. plán",
   "icon": {
    "asset": "holoPlan",
    "tilt": 0,
    "scale": 1.25
   },
   "preview": "GRAFIKA/PRHOLO.GRA"
  },
  "shipPlan": {
   "name": "ship plan",
   "cs": "Nákres",
   "icon": {
    "asset": "shipPlan",
    "tilt": 0,
    "scale": 1.25
   },
   "preview": "GRAFIKA/PRPLAN.GRA"
  },
  "shipPart": {
   "name": "ship part",
   "cs": "Součástka",
   "icon": {
    "asset": "shipPart",
    "state": 1,
    "tilt": 20,
    "scale": 1.25
   },
   "preview": "GRAFIKA/PRSOUC.GRA"
  },
  "decoder": {
   "name": "decoder",
   "cs": "Dekodér",
   "icon": {
    "asset": "decoder",
    "tilt": 0,
    "scale": 1.25
   },
   "preview": "GRAFIKA/PRDEKOD.GRA"
  },
  "controller": {
   "name": "controller",
   "cs": "Ovladač",
   "icon": {
    "asset": "controller",
    "tilt": 25,
    "scale": 1.25
   },
   "preview": "GRAFIKA/PROVL.GRA"
  },
  "craneKey": {
   "name": "crane key",
   "cs": "Klíč",
   "icon": {
    "asset": "craneKey",
    "tilt": 30,
    "scale": 1.25
   },
   "preview": "GRAFIKA/PRKLIC.GRA"
  }
 },
 "robots": {
  "xbot": {
   "status": "draft",
   "source": "docs/requirements.md",
   "note": "Tunable look and proportions of the hero robot. Part shapes (polygons) are drawn in spikes/shared/xbot.js; this file holds the agreed parameters.",
   "palette": {
    "a0": "#8c3c0c",
    "a1": "#e2701a",
    "a2": "#f5973a",
    "a3": "#ffd2a0",
    "aLine": "#3a1806",
    "m0": "#142427",
    "m1": "#25393d",
    "m2": "#3c5458",
    "m3": "#6f878b",
    "mLine": "#070d0e",
    "c0": "#5d686c",
    "c1": "#a3adb1",
    "c2": "#d4dbdd",
    "c3": "#ffffff",
    "badge": "#e8c21a",
    "trefoil": "#141414",
    "visor": "#e0281e",
    "screen": "#3fa34a",
    "hole": "#1a1210"
   },
   "frame": {
    "width": 640,
    "height": 780,
    "axis": 320,
    "sideAxis": 300,
    "footY": 744
   },
   "proportions": {
    "legShift": 26,
    "legCenterX": 211,
    "bodyScaleX": 0.8,
    "forearmShift": 10,
    "shoulderIn": 20,
    "forearmScaleX": 0.86,
    "badgeRadius": 26,
    "sideTorsoScaleX": 0.8,
    "sideShoulder": {
     "cx": 306,
     "cy": 96,
     "scaleX": 0.75,
     "scaleY": 0.92
    }
   },
   "gameLod": {
    "lineW": 0.6,
    "minThickness": 8,
    "minArea": 400,
    "minRadius": 8,
    "bulk": {
     "sideLegs": 1.45,
     "arms": 1.3
    }
   },
   "levels": {
    "head": 2,
    "shoulder": 104,
    "hip": 344,
    "knee": 522,
    "foot": 744
   },
   "joints": {
    "front": [
     "body",
     "armL",
     "foreL",
     "armR",
     "foreR"
    ],
    "back": [
     "body",
     "armL",
     "foreL",
     "armR",
     "foreR",
     "legL",
     "thighL",
     "shinL",
     "legR",
     "thighR",
     "shinR"
    ],
    "side": [
     "body",
     "chest",
     "head",
     "hipNear",
     "kneeNear",
     "ankleNear",
     "hipFar",
     "kneeFar",
     "ankleFar",
     "arm",
     "fore",
     "armFar",
     "foreFar"
    ]
   },
   "hooks": {
    "front": [
     "handL",
     "handR"
    ],
    "back": [
     "handL",
     "handR",
     "back",
     "footL",
     "footR"
    ],
    "side": [
     "hand",
     "handFar",
     "back",
     "heelNear",
     "toeNear",
     "heelFar",
     "toeFar"
    ]
   }
  }
 },
 "cutscenes": {
  "crowbarDoor": {
   "status": "draft",
   "source": "docs/requirements.md",
   "note": "Agreed crowbar item-use clip. Track keys are absolute seconds on the original METROPAC.ANM timeline (0..clip.end); the clip plays clip.start..clip.end. Keyframe: [time, value, easing?], easing in linear|in|out|inOut; string-valued tracks switch values. robot.x is stage units; crowbar sizes and farGripOffset are robot model units.",
   "stage": {
    "width": 1600,
    "height": 900,
    "floorY": 740,
    "doorSeamX": 900,
    "doorHalfWidth": 95
   },
   "clip": {
    "start": 1.85,
    "end": 5.8
   },
   "sounds": [
    [
     0.242,
     "step",
     13000
    ],
    [
     0.622,
     "servo",
     11000
    ],
    [
     1.953,
     "servo",
     11000
    ]
   ],
   "robot": {
    "scale": 0.46,
    "x": 705,
    "barTilt": -0.15,
    "farGripOffset": -367,
    "pullArmDeg": -34,
    "pullForeDeg": 48
   },
   "crowbar": {
    "reach": 500,
    "butt": 60,
    "width": 16
   },
   "palette": {
    "tunnel": "#0f1a1c",
    "wall": "#1d2a2c",
    "ceiling": "#0a1213",
    "lamp": "#e9d8a6",
    "lampCone": "#e9d8a6",
    "wagon": "#8c9396",
    "wagonShade": "#5f676a",
    "stripe": "#9c4a2a",
    "window": "#16211f",
    "windowGlint": "#3a4d50",
    "doorFrame": "#4a5255",
    "door": "#7b8285",
    "doorShade": "#596063",
    "interior": "#050808",
    "interiorLight": "#c9a85a",
    "platform": "#3a3430",
    "platformLine": "#2d2825",
    "safety": "#a8892f",
    "crowbar": "#dcd6c8",
    "crowbarShade": "#8f8a80",
    "shadow": "#000000"
   },
   "tracks": {
    "shot": [
     [
      1.85,
      "B"
     ],
     [
      2.95,
      "C"
     ]
    ],
    "camX": [
     [
      1.85,
      705
     ],
     [
      2.95,
      715
     ],
     [
      2.95,
      810
     ],
     [
      5.8,
      835,
      "out"
     ]
    ],
    "camY": [
     [
      1.85,
      540
     ],
     [
      2.95,
      525
     ],
     [
      2.95,
      520
     ],
     [
      5.8,
      505,
      "out"
     ]
    ],
    "camZ": [
     [
      1.85,
      1.7
     ],
     [
      2.95,
      1.78
     ],
     [
      2.95,
      2
     ],
     [
      5.8,
      2.25,
      "out"
     ]
    ],
    "armB": [
     [
      1.95,
      0
     ],
     [
      2.2,
      18,
      "inOut"
     ],
     [
      2.45,
      18
     ],
     [
      2.85,
      -57,
      "inOut"
     ],
     [
      5.8,
      -57
     ]
    ],
    "foreB": [
     [
      1.95,
      0
     ],
     [
      2.2,
      -38,
      "inOut"
     ],
     [
      2.45,
      -38
     ],
     [
      2.85,
      13,
      "inOut"
     ],
     [
      5.8,
      13
     ]
    ],
    "barTurnB": [
     [
      2.45,
      0
     ],
     [
      2.85,
      63,
      "inOut"
     ],
     [
      5.8,
      63
     ]
    ],
    "barShown": [
     [
      2.24,
      0
     ],
     [
      2.25,
      1
     ]
    ],
    "barLen": [
     [
      2.25,
      0.2
     ],
     [
      2.55,
      1,
      "out"
     ],
     [
      5.8,
      1
     ]
    ],
    "farGrip": [
     [
      2.55,
      0
     ],
     [
      2.85,
      1,
      "inOut"
     ],
     [
      5.8,
      1
     ]
    ],
    "pry": [
     [
      2.95,
      0
     ],
     [
      3.3,
      0.15,
      "inOut"
     ],
     [
      3.55,
      0.45,
      "in"
     ],
     [
      3.75,
      0.3,
      "out"
     ],
     [
      4,
      0.3
     ],
     [
      4.45,
      1,
      "in"
     ],
     [
      5.3,
      1
     ],
     [
      5.8,
      0.6,
      "out"
     ]
    ],
    "gap": [
     [
      3.55,
      0
     ],
     [
      3.65,
      10,
      "out"
     ],
     [
      4.45,
      12
     ],
     [
      4.6,
      40,
      "out"
     ],
     [
      5.3,
      190,
      "inOut"
     ],
     [
      5.8,
      190
     ]
    ],
    "glow": [
     [
      4.5,
      0
     ],
     [
      5.4,
      1,
      "inOut"
     ],
     [
      5.8,
      1
     ]
    ],
    "shake": [
     [
      3.55,
      0
     ],
     [
      3.6,
      6
     ],
     [
      3.75,
      0
     ],
     [
      4.45,
      0
     ],
     [
      4.5,
      10
     ],
     [
      4.8,
      0
     ]
    ]
   }
  },
  "hullCover": {
   "status": "draft",
   "source": "docs/research/gamedata/raw/CD/Colony28.iso GRAFIKA/SEBSOUC.ANM; trigger: hull cover shot off",
   "title": "Hull cover shot off",
   "camera": "CAM 12 HANGAR",
   "duration": 3.71,
   "sounds": [
    [
     1.018,
     "step",
     10000
    ],
    [
     1.746,
     "step",
     10000
    ],
    [
     2.837,
     "cannon",
     12000
    ],
    [
     2.983,
     "cannon",
     12000
    ],
    [
     3.128,
     "cannon",
     12000
    ],
    [
     3.274,
     "cannon",
     12000
    ],
    [
     3.419,
     "cannon",
     12000
    ],
    [
     3.565,
     "cannon",
     12000
    ]
   ],
   "stage": {
    "width": 1600,
    "height": 900,
    "seed": 52,
    "walk": {
     "horizon": 560,
     "stepSeconds": 0.62,
     "lift": 0.45,
     "swing": 9,
     "bob": 12,
     "shipX": 120,
     "shipY": 590,
     "shipScale": 6.4
    },
    "aim": {
     "horizon": 640,
     "floorY": 1120,
     "x": 300,
     "scale": 1.45,
     "shipX": 1120,
     "shipY": 680,
     "shipScale": 6.4
    },
    "flashSeconds": 0.107,
    "tracer": 260,
    "coverFly": [
     520,
     -420,
     1500
    ],
    "partDrop": 250,
    "partScale": 4,
    "shipShade": 0.5
   },
   "palette": {
    "dark": "#0d0a09",
    "rock0": "#2a140c",
    "rock1": "#4a2414",
    "rock2": "#6e3a1e",
    "rock3": "#93562c",
    "floor": "#26313a",
    "floorLine": "#3f525c",
    "floorFar": "#1a2229",
    "shadow": "#000000",
    "flash": "#fff2b0",
    "flashCore": "#ffffff",
    "flashEdge": "#ff9a2a",
    "spark": "#ffd060"
   },
   "tracks": {
    "shot": [
     [
      0,
      "A"
     ],
     [
      2.21,
      "B"
     ]
    ],
    "walkScale": [
     [
      0,
      3
     ],
     [
      2.21,
      1.05,
      "out"
     ]
    ],
    "walkY": [
     [
      0,
      990
     ],
     [
      2.21,
      860,
      "out"
     ]
    ],
    "walkX": [
     [
      0,
      830
     ],
     [
      2.21,
      770
     ]
    ],
    "camZ": [
     [
      2.21,
      1
     ],
     [
      3.71,
      1.14,
      "out"
     ]
    ],
    "camX": [
     [
      2.21,
      800
     ],
     [
      3.71,
      770,
      "out"
     ]
    ],
    "camY": [
     [
      2.21,
      450
     ],
     [
      3.71,
      440,
      "out"
     ]
    ],
    "raise": [
     [
      2.21,
      0
     ],
     [
      2.36,
      0
     ],
     [
      2.86,
      1,
      "inOut"
     ]
    ],
    "fire": [
     [
      2.93,
      0
     ],
     [
      2.94,
      1
     ],
     [
      3.71,
      1
     ]
    ],
    "hits": [
     [
      2.98,
      0
     ],
     [
      2.99,
      1
     ],
     [
      3.71,
      1
     ]
    ],
    "cover": [
     [
      3.3,
      0
     ],
     [
      3.31,
      1
     ]
    ],
    "coverFly": [
     [
      3.3,
      0
     ],
     [
      3.71,
      1
     ]
    ],
    "partDrop": [
     [
      3.4,
      0
     ],
     [
      3.71,
      1,
      "in"
     ]
    ]
   }
  },
  "missionStart": {
   "status": "draft",
   "source": "docs/research/gamedata/raw/CD/Colony28.iso GRAFIKA/ODNAK.ANM, NAKLAD.ANM, RAKOD1.ANM, SESTREL.ANM, ROBBLIK.ANM, UPAD.ANM, RUCE.ANM, MONITOR.ANM, PRILET1.ANM, PRILET2.ANM; trigger: new game start",
   "title": "Mission start",
   "camera": "CAM 01 TRANSPORT",
   "views": [
    [
     0,
     "camera"
    ],
    [
     31,
     "robot"
    ],
    [
     37.5,
     "camera"
    ]
   ],
   "duration": 61.5,
   "sounds": [
    [
     0.064,
     "step",
     13000
    ],
    [
     1.48,
     "step",
     13000
    ],
    [
     1.995,
     "step",
     13000
    ],
    [
     3.089,
     "step",
     13000
    ],
    [
     4.634,
     "step",
     13000
    ],
    [
     6.738,
     "hatch",
     6000
    ],
    [
     7.136,
     "hatch",
     6000
    ],
    [
     7.454,
     "ignition",
     14000
    ],
    [
     7.533,
     "hatch",
     6000
    ],
    [
     7.93,
     "hatch",
     6000
    ],
    [
     8.328,
     "hatch",
     6000
    ],
    [
     8.526,
     "slam",
     8000
    ],
    [
     10.275,
     "takeoff",
     13000
    ],
    [
     16.918,
     "flyby",
     7000
    ],
    [
     21.792,
     "laser",
     8000
    ],
    [
     23.262,
     "laser",
     8000
    ],
    [
     23.931,
     "laser",
     8000
    ],
    [
     24.02,
     "blast",
     8000
    ],
    [
     25.18,
     "crackle",
     18000
    ],
    [
     26.347,
     "crackle",
     12000
    ],
    [
     27.02,
     "crackle",
     17000
    ],
    [
     27.2,
     "explosion",
     9000
    ],
    [
     28.808,
     "crackle",
     17000
    ],
    [
     29.904,
     "crackle",
     17000
    ],
    [
     31.823,
     "spark",
     6000
    ],
    [
     31.867,
     "spark",
     6000
    ],
    [
     32.69,
     "spark",
     6000
    ],
    [
     33.123,
     "spark",
     6000
    ],
    [
     33.167,
     "spark",
     6000
    ],
    [
     33.21,
     "spark",
     6000
    ],
    [
     33.253,
     "spark",
     6000
    ],
    [
     33.297,
     "spark",
     6000
    ],
    [
     33.383,
     "spark",
     6000
    ],
    [
     33.47,
     "spark",
     6000
    ],
    [
     34.813,
     "spark",
     6000
    ],
    [
     34.857,
     "spark",
     6000
    ],
    [
     36.113,
     "spark",
     6000
    ],
    [
     36.157,
     "spark",
     6000
    ],
    [
     36.2,
     "spark",
     6000
    ],
    [
     41.745,
     "land",
     13000
    ],
    [
     43.821,
     "land",
     13000
    ],
    [
     44.292,
     "land",
     13000
    ],
    [
     45.519,
     "land",
     13000
    ],
    [
     45.991,
     "land",
     13000
    ],
    [
     46.604,
     "land",
     13000
    ],
    [
     47.17,
     "land",
     13000
    ],
    [
     48.515,
     "flyover",
     10000
    ]
   ],
   "note": "One shot per original clip, static lead-ins trimmed. Track keys are film seconds. Stage units: 1600 x 900. Robot k is the rig scale; march speeds are stage px per second.",
   "stage": {
    "width": 1600,
    "height": 900
   },
   "march": {
    "cadence": 1.1,
    "files": [
     {
      "n": 8,
      "x0": -1700,
      "gap": 380,
      "floorY": 610,
      "k": 0.32,
      "speed": 215,
      "dim": 0.45,
      "lod": true
     },
     {
      "n": 5,
      "x0": -1900,
      "gap": 620,
      "floorY": 860,
      "k": 0.66,
      "speed": 440,
      "dim": 0.7,
      "lod": false
     }
    ],
    "guards": [
     {
      "x": 1330,
      "floorY": 700,
      "k": 0.42,
      "dim": 0.55
     }
    ]
   },
   "hold": {
    "robots": [
     {
      "x": 330,
      "floorY": 900,
      "k": 0.8,
      "enemy": false
     },
     {
      "x": 650,
      "floorY": 870,
      "k": 0.74,
      "enemy": false
     },
     {
      "x": 960,
      "floorY": 845,
      "k": 0.69,
      "enemy": true
     }
    ]
   },
   "diagnostic": [
    "MEMORY BLOCKS DAMAGED",
    "MISSION PROGRAM LOST",
    "",
    "SYSTEM OUTPUT 89%"
   ],
   "palette": {
    "black": "#000000",
    "white": "#ffffff",
    "space": "#04050a",
    "star": "#d8dcf0",
    "hangarWall": "#2b2c1e",
    "hangarPillar": "#3c3d28",
    "hangarPillarLit": "#56563a",
    "hangarBeam": "#17180f",
    "hatch": "#d9c58a",
    "hatchGlow": "#f0e2b0",
    "plate": "#4a4c4a",
    "plateLine": "#383a38",
    "plateShine": "#5e605c",
    "bayWall": "#55585a",
    "bayPanel": "#45484a",
    "bayFloor": "#6a6c6a",
    "bayFloorFar": "#575958",
    "rail": "#8d9090",
    "railShade": "#5a5d5e",
    "planetLit": "#9aa0e0",
    "planet": "#4a52a0",
    "planetDark": "#121634",
    "thrust": "#ffffff",
    "thrustGlow": "#c8d8ff",
    "hull": "#867a62",
    "hullTop": "#bcb092",
    "hullDark": "#5a5040",
    "hullLine": "#100e0a",
    "wing": "#2e2820",
    "glassLit": "#c8d0c8",
    "station": "#57523e",
    "stationTop": "#7a745a",
    "stationDark": "#2e2b20",
    "stationLight": "#b8d4d0",
    "pod": "#9aa04a",
    "podDark": "#3c4018",
    "lens": "#c8ccd0",
    "skyHigh": "#56636e",
    "skyMid": "#7a7c80",
    "skyLow": "#c86a44",
    "skyGlow": "#e48a56",
    "cloud": "#94a0aa",
    "cloudDark": "#4a525a",
    "hills": "#2c4428",
    "grassFar": "#3c6232",
    "grassNear": "#5a8a42",
    "grassSpot": "#2e5228",
    "smoke": "#3c3a36",
    "fire": "#ffb040",
    "fireHot": "#fff2c0",
    "holdWall": "#16160f",
    "holdRib": "#25251b",
    "holdPipe": "#30302a",
    "crate": "#25352e",
    "crateLine": "#3e6a4a",
    "crateTop": "#33463c",
    "fallWall": "#4a3020",
    "fallLine": "#2a1a10",
    "spark": "#fff4c0",
    "sparkHot": "#ffffff",
    "deck": "#1a1c1c",
    "deckLine": "#2e3232",
    "deckBump": "#262a2a",
    "diag": "#c8d0c0",
    "wave": "#e8c21a",
    "staticBase": "#6e6252",
    "staticLight": "#d8ccb4",
    "staticDark": "#2a241c",
    "panel": "#6a6630",
    "panelDark": "#4a4620",
    "panelLine": "#3a3818",
    "lampOff": "#4a3a1c",
    "lampOn": "#f0a040",
    "keyOff": "#1e4a22",
    "keyOn": "#4ad25a",
    "bezel": "#2c2c22",
    "bezelLit": "#4a4a38",
    "crtLit": "#5e6666",
    "crtDark": "#22282a",
    "wire": "#b4ff96",
    "wireFill": "#3cb83c",
    "mapMark": "#e8e050",
    "duskHigh": "#2a1008",
    "duskLow": "#7a3a1a",
    "dustCloud": "#5a2a14",
    "desertFar": "#8a4420",
    "desertNear": "#b05c2a",
    "crack": "#4a2410",
    "mesa": "#3a1c0e",
    "scaffold": "#4a3a30",
    "scaffoldLit": "#7a6450",
    "shadow": "#000000",
    "ruinSkyHigh": "#3a1a10",
    "ruinSkyLow": "#b0602e",
    "ruinCloud": "#c47a48",
    "ruinCloudDark": "#5a2a18",
    "ruinFar": "#4a2414",
    "ruinMid": "#2e160c",
    "brick": "#6a3020",
    "brickDark": "#3a1a10",
    "rubble": "#24120a",
    "dust": "#c09070"
   },
   "tracks": {
    "shot": [
     [
      0,
      "march"
     ],
     [
      6.5,
      "hangar"
     ],
     [
      12.5,
      "orbit"
     ],
     [
      20.5,
      "shotDown"
     ],
     [
      25,
      "hold"
     ],
     [
      27.2,
      "fall"
     ],
     [
      31,
      "hand"
     ],
     [
      37.5,
      "monitor"
     ],
     [
      47.5,
      "crash"
     ],
     [
      54.5,
      "city"
     ]
    ],
    "marchCamX": [
     [
      0,
      640
     ],
     [
      6.5,
      900,
      "inOut"
     ]
    ],
    "marchZ": [
     [
      0,
      1
     ],
     [
      6.5,
      1.22,
      "inOut"
     ]
    ],
    "hangCamX": [
     [
      6.5,
      560
     ],
     [
      9.6,
      760,
      "inOut"
     ],
     [
      12.5,
      1500,
      "in"
     ]
    ],
    "hangZ": [
     [
      6.5,
      1.15
     ],
     [
      12.5,
      0.95,
      "inOut"
     ]
    ],
    "shipLift": [
     [
      6.5,
      0
     ],
     [
      7.8,
      0
     ],
     [
      9.4,
      130,
      "inOut"
     ]
    ],
    "shipGo": [
     [
      6.5,
      0
     ],
     [
      9.4,
      0
     ],
     [
      12.3,
      2600,
      "in"
     ]
    ],
    "thrust": [
     [
      6.5,
      0
     ],
     [
      7.6,
      0
     ],
     [
      8,
      0.6,
      "out"
     ],
     [
      9.4,
      0.6
     ],
     [
      10,
      1
     ]
    ],
    "hangFlash": [
     [
      10.6,
      0
     ],
     [
      10.9,
      0.85,
      "out"
     ],
     [
      11.9,
      0,
      "in"
     ]
    ],
    "stationX": [
     [
      12.5,
      180
     ],
     [
      16.2,
      -260,
      "inOut"
     ],
     [
      17.4,
      -2300,
      "in"
     ]
    ],
    "stationZ": [
     [
      12.5,
      1
     ],
     [
      16.2,
      1.12
     ]
    ],
    "orbitShip": [
     [
      16.6,
      1.5
     ],
     [
      20.5,
      0.04,
      "out"
     ]
    ],
    "orbitShipX": [
     [
      16.6,
      1120
     ],
     [
      20.5,
      760,
      "out"
     ]
    ],
    "orbitShipY": [
     [
      16.6,
      560
     ],
     [
      20.5,
      450,
      "out"
     ]
    ],
    "sdZ": [
     [
      20.5,
      0.05
     ],
     [
      23.1,
      0.16,
      "in"
     ],
     [
      25,
      1.7,
      "in"
     ]
    ],
    "sdX": [
     [
      20.5,
      760
     ],
     [
      23.1,
      800
     ],
     [
      25,
      1180,
      "in"
     ]
    ],
    "sdY": [
     [
      20.5,
      430
     ],
     [
      23.1,
      415
     ],
     [
      25,
      140,
      "in"
     ]
    ],
    "sdRoll": [
     [
      23.1,
      0
     ],
     [
      25,
      -16,
      "in"
     ]
    ],
    "sdFlash": [
     [
      23.05,
      0
     ],
     [
      23.12,
      1
     ],
     [
      23.9,
      0,
      "out"
     ]
    ],
    "sdHit": [
     [
      23.1,
      0
     ],
     [
      23.12,
      1
     ]
    ],
    "sdBoom": [
     [
      23.1,
      0
     ],
     [
      23.9,
      1,
      "out"
     ]
    ],
    "holdFlash": [
     [
      25,
      0.7
     ],
     [
      25.35,
      0,
      "out"
     ],
     [
      26.8,
      0
     ],
     [
      27.2,
      1,
      "in"
     ]
    ],
    "holdCamX": [
     [
      25,
      760
     ],
     [
      27.2,
      840
     ]
    ],
    "fallFlash": [
     [
      27.2,
      1
     ],
     [
      27.8,
      0,
      "out"
     ]
    ],
    "fallAngle": [
     [
      27.2,
      -40
     ],
     [
      28.7,
      -74,
      "in"
     ],
     [
      28.85,
      -70,
      "out"
     ],
     [
      29.1,
      -73
     ],
     [
      31,
      -73
     ]
    ],
    "fallDrop": [
     [
      27.2,
      -80
     ],
     [
      28.7,
      60,
      "in"
     ],
     [
      31,
      60
     ]
    ],
    "fallShake": [
     [
      28.7,
      0
     ],
     [
      28.72,
      14
     ],
     [
      29.3,
      0
     ]
    ],
    "fallHead": [
     [
      27.2,
      0
     ],
     [
      28.7,
      10
     ],
     [
      29,
      26,
      "out"
     ],
     [
      31,
      22
     ]
    ],
    "fallArm": [
     [
      27.2,
      -10
     ],
     [
      28.7,
      -40,
      "in"
     ],
     [
      29.1,
      -5,
      "out"
     ],
     [
      31,
      -12
     ]
    ],
    "sparks": [
     [
      27.2,
      0
     ],
     [
      27.85,
      0
     ],
     [
      27.9,
      1
     ],
     [
      28.3,
      1
     ],
     [
      28.35,
      0
     ],
     [
      28.7,
      0
     ],
     [
      28.75,
      1
     ],
     [
      29.6,
      1
     ],
     [
      29.65,
      0
     ],
     [
      30.2,
      0
     ],
     [
      30.25,
      1
     ],
     [
      30.6,
      1
     ],
     [
      30.65,
      0
     ]
    ],
    "handStatic": [
     [
      31,
      1
     ],
     [
      31.4,
      1
     ],
     [
      31.41,
      0
     ],
     [
      32.4,
      0
     ],
     [
      32.41,
      1
     ],
     [
      32.9,
      1
     ],
     [
      32.91,
      0
     ],
     [
      35.5,
      0
     ],
     [
      35.51,
      1
     ],
     [
      35.8,
      1
     ],
     [
      35.81,
      0
     ]
    ],
    "handText": [
     [
      31,
      0
     ],
     [
      33.2,
      0
     ],
     [
      35.4,
      58
     ],
     [
      37.5,
      58
     ]
    ],
    "handFore": [
     [
      31,
      0
     ],
     [
      34,
      0
     ],
     [
      34.3,
      -12,
      "inOut"
     ],
     [
      34.6,
      0,
      "inOut"
     ],
     [
      36.4,
      0
     ],
     [
      36.7,
      -8,
      "inOut"
     ],
     [
      37,
      0,
      "inOut"
     ]
    ],
    "handCamZ": [
     [
      31,
      1
     ],
     [
      37.5,
      1.12,
      "inOut"
     ]
    ],
    "monitorMode": [
     [
      37.5,
      "panel"
     ],
     [
      39.6,
      "robot"
     ],
     [
      43.8,
      "map"
     ]
    ],
    "monCamY": [
     [
      37.5,
      -330
     ],
     [
      38.6,
      -330
     ],
     [
      39.6,
      450,
      "inOut"
     ]
    ],
    "monZ": [
     [
      37.5,
      2.2
     ],
     [
      38.6,
      2.2
     ],
     [
      39.6,
      1,
      "inOut"
     ],
     [
      47.5,
      1.12
     ]
    ],
    "monTurn": [
     [
      39.6,
      0
     ],
     [
      43.8,
      300
     ]
    ],
    "mapTurn": [
     [
      43.8,
      -30
     ],
     [
      47.5,
      20
     ]
    ],
    "mapZoom": [
     [
      43.8,
      0.7
     ],
     [
      47.5,
      1,
      "out"
     ]
    ],
    "crashCamX": [
     [
      47.5,
      520
     ],
     [
      51.5,
      820,
      "inOut"
     ],
     [
      54.5,
      880
     ]
    ],
    "crashCamY": [
     [
      47.5,
      420
     ],
     [
      54.5,
      470
     ]
    ],
    "flyZ": [
     [
      51.4,
      0.3
     ],
     [
      54.5,
      2.6,
      "in"
     ]
    ],
    "flyX": [
     [
      51.4,
      860
     ],
     [
      54.5,
      820
     ]
    ],
    "flyY": [
     [
      51.4,
      -200
     ],
     [
      54.5,
      640,
      "in"
     ]
    ],
    "flyShadow": [
     [
      50.4,
      -600
     ],
     [
      52.6,
      1600
     ]
    ],
    "cityCamX": [
     [
      54.5,
      700
     ],
     [
      61.5,
      860,
      "inOut"
     ]
    ],
    "cityShipX": [
     [
      54.5,
      -260
     ],
     [
      58.5,
      640,
      "out"
     ],
     [
      61,
      1060,
      "inOut"
     ]
    ],
    "cityShipY": [
     [
      54.5,
      120
     ],
     [
      58.5,
      330,
      "inOut"
     ],
     [
      61,
      600,
      "inOut"
     ]
    ],
    "cityShipZ": [
     [
      54.5,
      2.6
     ],
     [
      61,
      1.7,
      "inOut"
     ]
    ],
    "cityShipRot": [
     [
      54.5,
      16
     ],
     [
      58.5,
      6
     ],
     [
      61,
      -2,
      "inOut"
     ],
     [
      61.5,
      0
     ]
    ],
    "cityDust": [
     [
      60.6,
      0
     ],
     [
      61.5,
      1
     ]
    ]
   }
  },
  "openDoor": {
   "status": "draft",
   "source": "docs/research/gamedata/raw/CD/Colony28.iso GRAFIKA/OTDVER1.ANM; trigger: openDoor task",
   "title": "Card door opens",
   "camera": "CAM 10 ROOF",
   "duration": 7.29,
   "sounds": [
    [
     0,
     "power",
     13000
    ]
   ],
   "stage": {
    "width": 1600,
    "height": 900,
    "horizon": 470,
    "sun": [
     640,
     470,
     700
    ]
   },
   "robot": {
    "scale": 1.6,
    "x": 820,
    "y": 58
   },
   "palette": {
    "sky0": "#2a1008",
    "sky1": "#5a2a14",
    "sky2": "#8a4a28",
    "sky3": "#b8744a",
    "glow": "#e8a040",
    "sun": "#fff1a8",
    "cloud": "#3a2418",
    "cloudLit": "#c87a40",
    "ground": "#6a4020",
    "groundFar": "#2a1408",
    "door": "#070808",
    "doorEdge": "#1c2628",
    "doorTube": "#3a8ea0"
   },
   "tracks": {
    "door": [
     [
      0,
      0
     ],
     [
      0.07,
      0
     ],
     [
      5.4,
      1480
     ],
     [
      5.79,
      1600,
      "out"
     ],
     [
      7.29,
      1600
     ]
    ],
    "camZ": [
     [
      0,
      1
     ],
     [
      7.29,
      1.03,
      "inOut"
     ]
    ],
    "breathe": [
     [
      0,
      0
     ],
     [
      1.8,
      4,
      "inOut"
     ],
     [
      3.6,
      0,
      "inOut"
     ],
     [
      5.4,
      4,
      "inOut"
     ],
     [
      7.29,
      0,
      "inOut"
     ]
    ],
    "head": [
     [
      0,
      0
     ],
     [
      5.8,
      0
     ],
     [
      6.4,
      -4,
      "inOut"
     ],
     [
      7.29,
      -4
     ]
    ],
    "armL": [
     [
      0,
      14
     ],
     [
      7.29,
      14
     ]
    ],
    "foreL": [
     [
      0,
      -10
     ],
     [
      1.8,
      -14,
      "inOut"
     ],
     [
      3.6,
      -10,
      "inOut"
     ],
     [
      5.4,
      -14,
      "inOut"
     ],
     [
      7.29,
      -10,
      "inOut"
     ]
    ],
    "armR": [
     [
      0,
      -14
     ],
     [
      7.29,
      -14
     ]
    ],
    "foreR": [
     [
      0,
      10
     ],
     [
      1.8,
      14,
      "inOut"
     ],
     [
      3.6,
      10,
      "inOut"
     ],
     [
      5.4,
      14,
      "inOut"
     ],
     [
      7.29,
      10,
      "inOut"
     ]
    ]
   }
  },
  "pickController": {
   "status": "draft",
   "source": "docs/research/gamedata/raw/CD/Colony28.iso GRAFIKA/SEBOVL.ANM; trigger: controller pickup",
   "title": "Lift controller picked up",
   "camera": "CAM 08 PLASMA",
   "views": [
    [
     0,
     "robot"
    ]
   ],
   "duration": 1.76,
   "sounds": [
    [
     0,
     "step",
     7000
    ]
   ],
   "stage": {
    "item": "controller",
    "itemState": 0,
    "itemFlip": false,
    "ground": "grass",
    "seed": 7,
    "blades": 2200,
    "yaw": 20,
    "horizon": -918,
    "height": 20,
    "inset": 0.1,
    "edge": 4,
    "grout": 8,
    "gripAt": 0.6,
    "itemOffset": [
     -220,
     25
    ],
    "itemTilt": -4,
    "itemScale": 20,
    "shadow": [
     0,
     40,
     230,
     36
    ],
    "gridBox": [
     33,
     22,
     1567,
     862
    ],
    "gridCell": 64,
    "panel": [
     56,
     43,
     400,
     228
    ],
    "panelScan": 1.3,
    "wave": [
     1189,
     33,
     361,
     108
    ],
    "waveRate": 14,
    "glyphRows": 10,
    "glyphBox": [
     40,
     330,
     9,
     50,
     40
    ],
    "focal": 2000
   },
   "palette": {
    "soil": "#3a1a0c",
    "grass0": "#5a2c14",
    "grass1": "#7c4020",
    "grass2": "#9a5a2c",
    "grout": "#24140c",
    "tile": "#6e4429",
    "tileLight": "#a8744c",
    "tileShade": "#3a2214",
    "haze": "rgba(0, 0, 0, 0.45)",
    "shadow": "#000000",
    "scan": "#e2401a",
    "flash": "#e5381a",
    "panel": "#bfeaea",
    "panelLine": "#4fa3a8",
    "panelItem": "#6cc4c6"
   },
   "tracks": {
    "grid": [
     [
      0.04,
      0
     ],
     [
      0.34,
      1
     ],
     [
      0.72,
      1
     ],
     [
      0.73,
      0
     ]
    ],
    "flash": [
     [
      0.72,
      0
     ],
     [
      0.73,
      1
     ],
     [
      0.81,
      1
     ],
     [
      0.82,
      0
     ]
    ],
    "glyphs": [
     [
      0,
      2
     ],
     [
      0.73,
      2
     ],
     [
      1,
      10
     ]
    ],
    "shadow": [
     [
      0.6,
      1
     ],
     [
      0.85,
      0
     ]
    ],
    "yaw": [
     [
      0,
      0
     ],
     [
      0.8,
      0
     ],
     [
      1.76,
      -6,
      "inOut"
     ]
    ],
    "pan": [
     [
      0,
      0
     ],
     [
      0.8,
      0
     ],
     [
      1.76,
      1,
      "inOut"
     ]
    ],
    "panelSpin": [
     [
      0,
      0
     ],
     [
      1.76,
      40
     ]
    ],
    "robotX": [
     [
      0,
      2200
     ],
     [
      0.6,
      1868,
      "out"
     ],
     [
      1.76,
      1830,
      "inOut"
     ]
    ],
    "robotY": [
     [
      0,
      1250
     ],
     [
      0.6,
      986,
      "out"
     ],
     [
      1.76,
      1010,
      "inOut"
     ]
    ],
    "robotK": [
     [
      0,
      3
     ],
     [
      0.6,
      3
     ],
     [
      1.76,
      3.4,
      "inOut"
     ]
    ],
    "arm": [
     [
      0,
      -104
     ],
     [
      0.6,
      -110,
      "out"
     ],
     [
      0.85,
      -110
     ],
     [
      1.76,
      -118,
      "inOut"
     ]
    ],
    "fore": [
     [
      0,
      4
     ],
     [
      0.6,
      10,
      "out"
     ],
     [
      0.85,
      10
     ],
     [
      1.76,
      24,
      "inOut"
     ]
    ]
   }
  },
  "pickCraneKey": {
   "status": "draft",
   "source": "docs/research/gamedata/raw/CD/Colony28.iso GRAFIKA/SEBKL1.ANM; trigger: craneKey pickup",
   "title": "Crane key picked up",
   "camera": "CAM 13 CRANE",
   "views": [
    [
     0,
     "robot"
    ]
   ],
   "duration": 1.76,
   "sounds": [
    [
     0,
     "step",
     7000
    ]
   ],
   "stage": {
    "item": "craneKey",
    "itemState": 0,
    "itemFlip": true,
    "ground": "grass",
    "seed": 7,
    "blades": 2200,
    "yaw": 20,
    "horizon": -918,
    "height": 20,
    "inset": 0.1,
    "edge": 4,
    "grout": 8,
    "gripAt": 0.6,
    "itemOffset": [
     -120,
     20
    ],
    "itemTilt": -6,
    "itemScale": 14,
    "shadow": [
     0,
     30,
     110,
     18
    ],
    "gridBox": [
     33,
     22,
     1567,
     862
    ],
    "gridCell": 64,
    "panel": [
     56,
     43,
     400,
     228
    ],
    "panelScan": 1.3,
    "wave": [
     1189,
     33,
     361,
     108
    ],
    "waveRate": 14,
    "glyphRows": 10,
    "glyphBox": [
     40,
     330,
     9,
     50,
     40
    ],
    "focal": 2000
   },
   "palette": {
    "soil": "#3a1a0c",
    "grass0": "#5a2c14",
    "grass1": "#7c4020",
    "grass2": "#9a5a2c",
    "grout": "#24140c",
    "tile": "#6e4429",
    "tileLight": "#a8744c",
    "tileShade": "#3a2214",
    "haze": "rgba(0, 0, 0, 0.45)",
    "shadow": "#000000",
    "scan": "#e2401a",
    "flash": "#e5381a",
    "panel": "#bfeaea",
    "panelLine": "#4fa3a8",
    "panelItem": "#6cc4c6"
   },
   "tracks": {
    "grid": [
     [
      0.04,
      0
     ],
     [
      0.34,
      1
     ],
     [
      0.72,
      1
     ],
     [
      0.73,
      0
     ]
    ],
    "flash": [
     [
      0.72,
      0
     ],
     [
      0.73,
      1
     ],
     [
      0.81,
      1
     ],
     [
      0.82,
      0
     ]
    ],
    "glyphs": [
     [
      0,
      2
     ],
     [
      0.73,
      2
     ],
     [
      1,
      10
     ]
    ],
    "shadow": [
     [
      0.6,
      1
     ],
     [
      0.85,
      0
     ]
    ],
    "yaw": [
     [
      0,
      0
     ],
     [
      0.8,
      0
     ],
     [
      1.76,
      -6,
      "inOut"
     ]
    ],
    "pan": [
     [
      0,
      0
     ],
     [
      0.8,
      0
     ],
     [
      1.76,
      1,
      "inOut"
     ]
    ],
    "panelSpin": [
     [
      0,
      0
     ],
     [
      1.76,
      40
     ]
    ],
    "robotX": [
     [
      0,
      2200
     ],
     [
      0.6,
      1868,
      "out"
     ],
     [
      1.76,
      1830,
      "inOut"
     ]
    ],
    "robotY": [
     [
      0,
      1250
     ],
     [
      0.6,
      986,
      "out"
     ],
     [
      1.76,
      1010,
      "inOut"
     ]
    ],
    "robotK": [
     [
      0,
      3
     ],
     [
      0.6,
      3
     ],
     [
      1.76,
      3.4,
      "inOut"
     ]
    ],
    "arm": [
     [
      0,
      -104
     ],
     [
      0.6,
      -110,
      "out"
     ],
     [
      0.85,
      -110
     ],
     [
      1.76,
      -118,
      "inOut"
     ]
    ],
    "fore": [
     [
      0,
      4
     ],
     [
      0.6,
      10,
      "out"
     ],
     [
      0.85,
      10
     ],
     [
      1.76,
      24,
      "inOut"
     ]
    ]
   }
  },
  "pickCrowbar": {
   "status": "draft",
   "source": "docs/research/gamedata/raw/CD/Colony28.iso GRAFIKA/SEBPACID.ANM; trigger: crowbar pickup",
   "title": "Crowbar picked up",
   "camera": "CAM 04 STREET",
   "views": [
    [
     0,
     "robot"
    ]
   ],
   "duration": 1.76,
   "sounds": [
    [
     0.044,
     "servo",
     16000
    ],
    [
     0.924,
     "servo",
     16000
    ]
   ],
   "stage": {
    "item": "crowbar",
    "itemState": 0,
    "itemFlip": true,
    "ground": "grass",
    "seed": 7,
    "blades": 2200,
    "yaw": 20,
    "horizon": -918,
    "height": 20,
    "inset": 0.1,
    "edge": 4,
    "grout": 8,
    "gripAt": 0.6,
    "itemOffset": [
     -290,
     20
    ],
    "itemTilt": -4,
    "itemScale": 20,
    "shadow": [
     0,
     40,
     280,
     26
    ],
    "gridBox": [
     33,
     22,
     1567,
     862
    ],
    "gridCell": 64,
    "panel": [
     56,
     43,
     400,
     228
    ],
    "panelScan": 1.3,
    "wave": [
     1189,
     33,
     361,
     108
    ],
    "waveRate": 14,
    "glyphRows": 10,
    "glyphBox": [
     40,
     330,
     9,
     50,
     40
    ],
    "focal": 2000
   },
   "palette": {
    "soil": "#3a1a0c",
    "grass0": "#5a2c14",
    "grass1": "#7c4020",
    "grass2": "#9a5a2c",
    "grout": "#24140c",
    "tile": "#6e4429",
    "tileLight": "#a8744c",
    "tileShade": "#3a2214",
    "haze": "rgba(0, 0, 0, 0.45)",
    "shadow": "#000000",
    "scan": "#e2401a",
    "flash": "#e5381a",
    "panel": "#bfeaea",
    "panelLine": "#4fa3a8",
    "panelItem": "#6cc4c6"
   },
   "tracks": {
    "grid": [
     [
      0.04,
      0
     ],
     [
      0.34,
      1
     ],
     [
      0.72,
      1
     ],
     [
      0.73,
      0
     ]
    ],
    "flash": [
     [
      0.72,
      0
     ],
     [
      0.73,
      1
     ],
     [
      0.81,
      1
     ],
     [
      0.82,
      0
     ]
    ],
    "glyphs": [
     [
      0,
      2
     ],
     [
      0.73,
      2
     ],
     [
      1,
      10
     ]
    ],
    "shadow": [
     [
      0.6,
      1
     ],
     [
      0.85,
      0
     ]
    ],
    "yaw": [
     [
      0,
      0
     ],
     [
      0.8,
      0
     ],
     [
      1.76,
      -6,
      "inOut"
     ]
    ],
    "pan": [
     [
      0,
      0
     ],
     [
      0.8,
      0
     ],
     [
      1.76,
      1,
      "inOut"
     ]
    ],
    "panelSpin": [
     [
      0,
      0
     ],
     [
      1.76,
      40
     ]
    ],
    "robotX": [
     [
      0,
      2200
     ],
     [
      0.6,
      1868,
      "out"
     ],
     [
      1.76,
      1830,
      "inOut"
     ]
    ],
    "robotY": [
     [
      0,
      1250
     ],
     [
      0.6,
      986,
      "out"
     ],
     [
      1.76,
      1010,
      "inOut"
     ]
    ],
    "robotK": [
     [
      0,
      3
     ],
     [
      0.6,
      3
     ],
     [
      1.76,
      3.4,
      "inOut"
     ]
    ],
    "arm": [
     [
      0,
      -104
     ],
     [
      0.6,
      -110,
      "out"
     ],
     [
      0.85,
      -110
     ],
     [
      1.76,
      -118,
      "inOut"
     ]
    ],
    "fore": [
     [
      0,
      4
     ],
     [
      0.6,
      10,
      "out"
     ],
     [
      0.85,
      10
     ],
     [
      1.76,
      24,
      "inOut"
     ]
    ]
   }
  },
  "pickEBlaster": {
   "status": "draft",
   "source": "docs/research/gamedata/raw/CD/Colony28.iso GRAFIKA/EBLAST.ANM; trigger: E-Blaster pickup",
   "title": "E-Blaster picked up",
   "camera": "CAM 03 METRO",
   "duration": 2.4,
   "sounds": [
    [
     0,
     "servo",
     11000
    ],
    [
     1.698,
     "servo",
     11000
    ]
   ],
   "stage": {
    "width": 1600,
    "height": 900,
    "floorY": 870,
    "robotX": 800,
    "robotScale": 1.02,
    "lightY": 200,
    "railY": [
     650,
     710
    ],
    "seed": 31,
    "blots": 70
   },
   "palette": {
    "wall": "#46423b",
    "wallDark": "#2a2723",
    "blot": "#524d45",
    "blotDark": "#3c3833",
    "light": "#f2f2ea",
    "rail": "#2f2820",
    "railLight": "#76664e",
    "floor": "#1a1815",
    "shadow": "#000000",
    "lightGlow": "#fffbe0"
   },
   "tracks": {
    "camX": [
     [
      0,
      800
     ],
     [
      0.46,
      812
     ],
     [
      1.14,
      860,
      "inOut"
     ],
     [
      2.4,
      895,
      "out"
     ]
    ],
    "camY": [
     [
      0,
      470
     ],
     [
      0.46,
      462
     ],
     [
      1.14,
      445,
      "inOut"
     ],
     [
      2.4,
      440,
      "out"
     ]
    ],
    "camZ": [
     [
      0,
      1.5
     ],
     [
      0.46,
      1.62
     ],
     [
      1.14,
      2,
      "inOut"
     ],
     [
      2.4,
      2.7,
      "out"
     ]
    ],
    "bob": [
     [
      0,
      0
     ],
     [
      0.2,
      -10,
      "out"
     ],
     [
      0.4,
      0,
      "in"
     ],
     [
      0.6,
      -10,
      "out"
     ],
     [
      0.8,
      0,
      "in"
     ],
     [
      2.4,
      0
     ]
    ],
    "armL": [
     [
      0,
      0
     ],
     [
      0.8,
      5,
      "inOut"
     ],
     [
      1.6,
      -2,
      "inOut"
     ],
     [
      2.4,
      0,
      "inOut"
     ]
    ],
    "armR": [
     [
      0,
      0
     ],
     [
      0.46,
      0
     ],
     [
      1.14,
      -30,
      "inOut"
     ],
     [
      2.4,
      -34,
      "out"
     ]
    ],
    "foreR": [
     [
      0,
      0
     ],
     [
      0.46,
      0
     ],
     [
      1.14,
      58,
      "inOut"
     ],
     [
      2.4,
      64,
      "out"
     ]
    ],
    "foreGrow": [
     [
      0,
      1
     ],
     [
      0.46,
      1
     ],
     [
      1.14,
      1.4,
      "inOut"
     ],
     [
      2.4,
      1.85,
      "out"
     ]
    ]
   }
  },
  "pickShipPart": {
   "status": "draft",
   "source": "docs/research/gamedata/raw/CD/Colony28.iso GRAFIKA/SEBSOU.ANM; trigger: shipPart pickup",
   "title": "Ship part picked up",
   "camera": "CAM 12 HANGAR",
   "views": [
    [
     0,
     "robot"
    ]
   ],
   "duration": 1.76,
   "sounds": [
    [
     0,
     "step",
     7000
    ]
   ],
   "stage": {
    "item": "shipPart",
    "itemState": 1,
    "itemFlip": false,
    "ground": "tiles",
    "seed": 7,
    "blades": 2200,
    "yaw": 20,
    "horizon": -918,
    "height": 20,
    "inset": 0.1,
    "edge": 4,
    "grout": 8,
    "gripAt": 0.6,
    "itemOffset": [
     -230,
     10
    ],
    "itemTilt": -8,
    "itemScale": 22,
    "shadow": [
     10,
     70,
     260,
     46
    ],
    "gridBox": [
     33,
     22,
     1567,
     862
    ],
    "gridCell": 64,
    "panel": [
     56,
     43,
     400,
     228
    ],
    "panelScan": 1.3,
    "wave": [
     1189,
     33,
     361,
     108
    ],
    "waveRate": 14,
    "glyphRows": 10,
    "glyphBox": [
     40,
     330,
     9,
     50,
     40
    ],
    "focal": 2000
   },
   "palette": {
    "soil": "#3a1a0c",
    "grass0": "#5a2c14",
    "grass1": "#7c4020",
    "grass2": "#9a5a2c",
    "grout": "#24140c",
    "tile": "#6e4429",
    "tileLight": "#a8744c",
    "tileShade": "#3a2214",
    "haze": "rgba(0, 0, 0, 0.45)",
    "shadow": "#000000",
    "scan": "#e2401a",
    "flash": "#e5381a",
    "panel": "#bfeaea",
    "panelLine": "#4fa3a8",
    "panelItem": "#6cc4c6"
   },
   "tracks": {
    "grid": [
     [
      0.04,
      0
     ],
     [
      0.34,
      1
     ],
     [
      0.72,
      1
     ],
     [
      0.73,
      0
     ]
    ],
    "flash": [
     [
      0.72,
      0
     ],
     [
      0.73,
      1
     ],
     [
      0.81,
      1
     ],
     [
      0.82,
      0
     ]
    ],
    "glyphs": [
     [
      0,
      2
     ],
     [
      0.73,
      2
     ],
     [
      1,
      10
     ]
    ],
    "shadow": [
     [
      0.6,
      1
     ],
     [
      0.85,
      0
     ]
    ],
    "yaw": [
     [
      0,
      0
     ],
     [
      0.8,
      0
     ],
     [
      1.76,
      -6,
      "inOut"
     ]
    ],
    "pan": [
     [
      0,
      0
     ],
     [
      0.8,
      0
     ],
     [
      1.76,
      1,
      "inOut"
     ]
    ],
    "panelSpin": [
     [
      0,
      0
     ],
     [
      1.76,
      40
     ]
    ],
    "robotX": [
     [
      0,
      2200
     ],
     [
      0.6,
      1868,
      "out"
     ],
     [
      1.76,
      1830,
      "inOut"
     ]
    ],
    "robotY": [
     [
      0,
      1250
     ],
     [
      0.6,
      986,
      "out"
     ],
     [
      1.76,
      1010,
      "inOut"
     ]
    ],
    "robotK": [
     [
      0,
      3
     ],
     [
      0.6,
      3
     ],
     [
      1.76,
      3.4,
      "inOut"
     ]
    ],
    "arm": [
     [
      0,
      -104
     ],
     [
      0.6,
      -110,
      "out"
     ],
     [
      0.85,
      -110
     ],
     [
      1.76,
      -118,
      "inOut"
     ]
    ],
    "fore": [
     [
      0,
      4
     ],
     [
      0.6,
      10,
      "out"
     ],
     [
      0.85,
      10
     ],
     [
      1.76,
      24,
      "inOut"
     ]
    ]
   }
  },
  "pullWires": {
   "status": "draft",
   "source": "docs/research/gamedata/raw/CD/Colony28.iso GRAFIKA/VYTDRAT.ANM; trigger: pullWires task",
   "title": "Wires torn out",
   "camera": "CAM 04 STREET",
   "duration": 2.61,
   "sounds": [
    [
     0,
     "servo",
     16000
    ],
    [
     0.566,
     "servo",
     16000
    ],
    [
     1.175,
     "gunShot",
     30000
    ],
    [
     1.697,
     "spark",
     30000
    ],
    [
     1.74,
     "spark",
     30000
    ],
    [
     1.783,
     "spark",
     30000
    ]
   ],
   "stage": {
    "width": 1600,
    "height": 900,
    "floorY": 1330,
    "pipeX": 150,
    "brick": {
     "w": 96,
     "h": 34
    }
   },
   "robot": {
    "scale": 1.45,
    "x": 1000
   },
   "box": {
    "x": 280,
    "y": 250,
    "scale": 18,
    "envScale": 16
   },
   "palette": {
    "wall": "#5a3020",
    "brickLine": "#2e170e",
    "brickLight": "#734030",
    "shadow": "#000000",
    "pipe": "#6d6656",
    "pipeLight": "#a59c84",
    "pipeDark": "#2e2a22",
    "doorBack": "#14200f",
    "spark": "#ffffff",
    "sparkGlow": "#fff2a8",
    "arc": "#cfe8ff"
   },
   "tracks": {
    "camX": [
     [
      0,
      800
     ],
     [
      2.2,
      790
     ],
     [
      2.61,
      900,
      "inOut"
     ]
    ],
    "camY": [
     [
      0,
      450
     ],
     [
      2.2,
      450
     ],
     [
      2.61,
      470,
      "inOut"
     ]
    ],
    "camZ": [
     [
      0,
      1
     ],
     [
      2.2,
      1.04
     ],
     [
      2.61,
      1.16,
      "inOut"
     ]
    ],
    "door": [
     [
      0,
      0
     ],
     [
      0.12,
      6,
      "in"
     ],
     [
      0.62,
      118,
      "out"
     ],
     [
      0.75,
      112,
      "inOut"
     ],
     [
      2.61,
      112
     ]
    ],
    "arm": [
     [
      0,
      -86
     ],
     [
      0.12,
      -84
     ],
     [
      0.45,
      -62,
      "inOut"
     ],
     [
      0.68,
      -60
     ],
     [
      1,
      -94,
      "inOut"
     ],
     [
      1.2,
      -97,
      "inOut"
     ],
     [
      1.4,
      -93,
      "inOut"
     ],
     [
      1.6,
      -97,
      "inOut"
     ],
     [
      1.85,
      -96
     ],
     [
      2.2,
      -52,
      "out"
     ],
     [
      2.61,
      -48
     ]
    ],
    "fore": [
     [
      0,
      -8
     ],
     [
      0.12,
      -10
     ],
     [
      0.45,
      -50,
      "inOut"
     ],
     [
      0.68,
      -52
     ],
     [
      1,
      2,
      "inOut"
     ],
     [
      1.2,
      6,
      "inOut"
     ],
     [
      1.4,
      0,
      "inOut"
     ],
     [
      1.6,
      6,
      "inOut"
     ],
     [
      1.85,
      4
     ],
     [
      2.2,
      -78,
      "out"
     ],
     [
      2.61,
      -82
     ]
    ],
    "lean": [
     [
      0,
      1
     ],
     [
      0.68,
      -2
     ],
     [
      1,
      6,
      "inOut"
     ],
     [
      1.85,
      7
     ],
     [
      2.2,
      1,
      "out"
     ],
     [
      2.61,
      2
     ]
    ],
    "head": [
     [
      0,
      6
     ],
     [
      1,
      10,
      "inOut"
     ],
     [
      1.85,
      10
     ],
     [
      2.2,
      4,
      "out"
     ],
     [
      2.61,
      6
     ]
    ],
    "wire": [
     [
      0,
      0
     ],
     [
      1.86,
      0
     ],
     [
      1.86,
      1
     ]
    ],
    "torn": [
     [
      0,
      0
     ],
     [
      1.7,
      0
     ],
     [
      1.7,
      1
     ]
    ],
    "flash": [
     [
      0,
      0
     ],
     [
      1.6,
      0
     ],
     [
      1.66,
      1,
      "out"
     ],
     [
      1.8,
      0.7
     ],
     [
      1.95,
      0,
      "in"
     ]
    ],
    "arcs": [
     [
      0,
      0
     ],
     [
      1.6,
      0
     ],
     [
      1.62,
      1
     ],
     [
      2.3,
      1
     ],
     [
      2.45,
      0
     ]
    ],
    "shake": [
     [
      0,
      0
     ],
     [
      1.62,
      0
     ],
     [
      1.66,
      8
     ],
     [
      1.9,
      0
     ]
    ]
   }
  },
  "rebelShot": {
   "status": "draft",
   "source": "docs/research/gamedata/raw/CD/Colony28.iso GRAFIKA/OTOC.ANM, POSTREL.ANM, POSTREL2.ANM, POSTREL3.ANM; trigger: hero reaches the rebel",
   "title": "Rebel shot down",
   "camera": "CAM 02 STREET",
   "duration": 8.07,
   "sounds": [
    [
     0,
     "servo",
     11000
    ],
    [
     2.29,
     "servo",
     8000
    ],
    [
     2.685,
     "punch",
     13000
    ],
    [
     3.563,
     "punch",
     13000
    ],
    [
     4.09,
     "punch",
     13000
    ],
    [
     4.618,
     "laser",
     8000
    ],
    [
     5.85,
     "servo",
     11000
    ],
    [
     6.764,
     "laser",
     8000
    ],
    [
     7.243,
     "laser",
     8000
    ],
    [
     7.417,
     "gunShot",
     13000
    ],
    [
     7.504,
     "gunShot",
     13000
    ],
    [
     7.591,
     "gunShot",
     13000
    ],
    [
     7.678,
     "gunShot",
     13000
    ],
    [
     7.765,
     "gunShot",
     13000
    ]
   ],
   "stage": {
    "width": 1600,
    "height": 900
   },
   "light": {
    "dusk": 0.72
   },
   "palette": {
    "skyTop": "#120e0c",
    "skyMid": "#3a2a22",
    "skyLow": "#8a6a52",
    "cloudDark": "#0c0a08",
    "cloudLight": "#d0b89a",
    "dirtFar": "#4a3a2c",
    "dirtNear": "#1e1610",
    "dirtDark": "#100c08",
    "dirtLight": "#6a5a48",
    "rustFar": "#6a3a24",
    "rustNear": "#3a1a10",
    "rustLight": "#a8683e",
    "girder": "#3e6a5e",
    "rust": "#7c4a2a",
    "rustDark": "#4e2a16",
    "rod": "#2a2a2c",
    "wreck": "#4a5a6a",
    "wreckLight": "#7a8a9a",
    "ruinSky": "#3a2a30",
    "glass": "#1c2a40",
    "glassLit": "#7a5060",
    "beam": "#8a8a8a",
    "brick": "#8a3e26",
    "brickDark": "#4a1e10",
    "block": "#a8a088",
    "blockDark": "#6a6454",
    "sandFar": "#8a5a30",
    "sandNear": "#5a3418",
    "sandDark": "#3a2210",
    "sandLight": "#b07a48",
    "flash": "#ffb040",
    "flashCore": "#fff4c0"
   },
   "tracks": {
    "shot": [
     [
      0,
      "A"
     ],
     [
      2.29,
      "B"
     ],
     [
      4.09,
      "C"
     ],
     [
      5.85,
      "D"
     ]
    ],
    "camX": [
     [
      0,
      800
     ],
     [
      1,
      790,
      "inOut"
     ],
     [
      2.29,
      780,
      "in"
     ],
     [
      2.29,
      900
     ],
     [
      3.55,
      760
     ],
     [
      4.09,
      700,
      "out"
     ],
     [
      4.09,
      900
     ],
     [
      5.85,
      640,
      "inOut"
     ],
     [
      5.85,
      800
     ],
     [
      6.6,
      800,
      "inOut"
     ],
     [
      8.07,
      900,
      "inOut"
     ]
    ],
    "camY": [
     [
      0,
      450
     ],
     [
      1,
      440,
      "inOut"
     ],
     [
      2.29,
      350,
      "in"
     ],
     [
      2.29,
      450
     ],
     [
      3.55,
      450
     ],
     [
      4.09,
      450
     ],
     [
      4.09,
      450
     ],
     [
      5.85,
      450
     ],
     [
      5.85,
      450
     ],
     [
      6.6,
      440,
      "inOut"
     ],
     [
      8.07,
      430,
      "inOut"
     ]
    ],
    "camZ": [
     [
      0,
      1
     ],
     [
      1,
      1.15,
      "inOut"
     ],
     [
      2.29,
      3,
      "in"
     ],
     [
      2.29,
      1
     ],
     [
      3.55,
      1.12
     ],
     [
      4.09,
      1.35,
      "out"
     ],
     [
      4.09,
      1
     ],
     [
      5.85,
      1.05
     ],
     [
      5.85,
      1
     ],
     [
      6.6,
      1.3,
      "inOut"
     ],
     [
      8.07,
      1.45,
      "out"
     ]
    ],
    "turn": [
     [
      0,
      0
     ],
     [
      0.35,
      0
     ],
     [
      1.15,
      180,
      "inOut"
     ]
    ],
    "botX": [
     [
      0,
      720
     ]
    ],
    "botY": [
     [
      0,
      2380
     ]
    ],
    "botK": [
     [
      0,
      3
     ]
    ],
    "runX": [
     [
      2.29,
      700
     ],
     [
      2.8,
      540
     ],
     [
      3.2,
      420
     ],
     [
      3.55,
      250
     ]
    ],
    "runY": [
     [
      2.29,
      480
     ],
     [
      2.8,
      500
     ],
     [
      3.2,
      540
     ],
     [
      3.55,
      600
     ]
    ],
    "runK": [
     [
      2.29,
      2
     ],
     [
      2.8,
      3.2
     ],
     [
      3.2,
      4.4
     ],
     [
      3.55,
      5.6
     ]
    ],
    "phase": [
     [
      2.29,
      0
     ],
     [
      3.55,
      2.9
     ]
    ],
    "bust": [
     [
      2.29,
      "run"
     ],
     [
      3.55,
      "face"
     ]
    ],
    "faceX": [
     [
      3.55,
      600
     ],
     [
      4.09,
      620
     ]
    ],
    "faceY": [
     [
      3.55,
      440
     ],
     [
      4.09,
      500
     ]
    ],
    "faceK": [
     [
      3.55,
      2.2
     ],
     [
      4.09,
      3.4,
      "out"
     ]
    ],
    "faceTurn": [
     [
      3.55,
      0.9
     ],
     [
      3.8,
      0.4,
      "inOut"
     ],
     [
      4.09,
      0.3
     ]
    ],
    "hitX": [
     [
      4.09,
      1500
     ],
     [
      4.5,
      1250,
      "out"
     ],
     [
      4.65,
      1180
     ],
     [
      5,
      1060,
      "out"
     ],
     [
      5.4,
      820
     ],
     [
      5.85,
      600,
      "in"
     ]
    ],
    "hitY": [
     [
      4.09,
      750
     ],
     [
      4.65,
      740
     ],
     [
      5,
      740
     ],
     [
      5.3,
      900,
      "in"
     ],
     [
      5.85,
      1300,
      "in"
     ]
    ],
    "lean": [
     [
      4.09,
      16
     ],
     [
      4.5,
      16
     ],
     [
      4.65,
      -22,
      "out"
     ],
     [
      4.95,
      -30
     ],
     [
      5.2,
      10,
      "inOut"
     ],
     [
      5.85,
      40
     ]
    ],
    "headTilt": [
     [
      4.09,
      6
     ],
     [
      4.5,
      6
     ],
     [
      4.65,
      -30,
      "out"
     ],
     [
      5,
      -34
     ],
     [
      5.3,
      20,
      "inOut"
     ],
     [
      5.85,
      30
     ]
    ],
    "fall": [
     [
      4.09,
      0
     ],
     [
      4.95,
      0
     ],
     [
      5.85,
      70,
      "in"
     ]
    ],
    "legNear": [
     [
      4.09,
      30
     ],
     [
      4.3,
      -20
     ],
     [
      4.5,
      30
     ],
     [
      4.65,
      10
     ],
     [
      5,
      20
     ],
     [
      5.3,
      -10
     ],
     [
      5.85,
      10
     ]
    ],
    "kneeNear": [
     [
      4.09,
      -30
     ],
     [
      4.3,
      -70
     ],
     [
      4.5,
      -30
     ],
     [
      4.65,
      -10
     ],
     [
      5,
      -50
     ],
     [
      5.3,
      -90
     ],
     [
      5.85,
      -60
     ]
    ],
    "legFar": [
     [
      4.09,
      -20
     ],
     [
      4.3,
      30
     ],
     [
      4.5,
      -20
     ],
     [
      4.65,
      -10
     ],
     [
      5,
      30
     ],
     [
      5.3,
      40
     ],
     [
      5.85,
      20
     ]
    ],
    "kneeFar": [
     [
      4.09,
      -70
     ],
     [
      4.3,
      -30
     ],
     [
      4.5,
      -70
     ],
     [
      4.65,
      -20
     ],
     [
      5,
      -40
     ],
     [
      5.3,
      -80
     ],
     [
      5.85,
      -40
     ]
    ],
    "armNear": [
     [
      4.09,
      60
     ],
     [
      4.5,
      40
     ],
     [
      4.65,
      -70,
      "out"
     ],
     [
      5,
      -110
     ],
     [
      5.4,
      60,
      "inOut"
     ],
     [
      5.85,
      120
     ]
    ],
    "elbowNear": [
     [
      4.09,
      50
     ],
     [
      4.5,
      60
     ],
     [
      4.65,
      10
     ],
     [
      5,
      20
     ],
     [
      5.85,
      30
     ]
    ],
    "armFar": [
     [
      4.09,
      -30
     ],
     [
      4.5,
      -20
     ],
     [
      4.65,
      -100,
      "out"
     ],
     [
      5,
      -130
     ],
     [
      5.4,
      40,
      "inOut"
     ],
     [
      5.85,
      100
     ]
    ],
    "elbowFar": [
     [
      4.09,
      70
     ],
     [
      4.5,
      70
     ],
     [
      4.65,
      20
     ],
     [
      5.85,
      40
     ]
    ],
    "spray": [
     [
      4.09,
      0
     ],
     [
      4.55,
      0
     ],
     [
      4.6,
      1
     ],
     [
      4.95,
      0,
      "out"
     ]
    ],
    "aim": [
     [
      5.85,
      0
     ],
     [
      6.3,
      0
     ],
     [
      7.2,
      1,
      "inOut"
     ]
    ],
    "fire": [
     [
      5.85,
      0
     ],
     [
      7.3,
      0
     ],
     [
      7.31,
      1
     ],
     [
      7.75,
      1
     ],
     [
      7.76,
      0
     ]
    ],
    "recoil": [
     [
      5.85,
      0
     ],
     [
      7.3,
      0
     ],
     [
      7.31,
      1
     ],
     [
      7.75,
      1
     ],
     [
      7.76,
      0
     ]
    ],
    "droidHit": [
     [
      5.85,
      0
     ],
     [
      7.45,
      0
     ],
     [
      7.5,
      1
     ],
     [
      7.8,
      0,
      "out"
     ]
    ],
    "droidFall": [
     [
      5.85,
      0
     ],
     [
      7.5,
      0
     ],
     [
      8.07,
      1,
      "in"
     ]
    ]
   }
  },
  "repairCrane": {
   "status": "draft",
   "source": "docs/research/gamedata/raw/CD/Colony28.iso GRAFIKA/MESTOKO.ANM, SKALA3.ANM; trigger: repairCrane task, level end",
   "title": "Crane ride out of the city",
   "camera": "CAM 13 CRANE",
   "duration": 13.03,
   "sounds": [
    [
     0.302,
     "servo",
     11000
    ],
    [
     1.379,
     "servo",
     11000
    ],
    [
     2.714,
     "step",
     13000
    ],
    [
     3.576,
     "step",
     13000
    ],
    [
     4.438,
     "step",
     13000
    ],
    [
     5.299,
     "step",
     13000
    ],
    [
     6.161,
     "step",
     13000
    ],
    [
     7.023,
     "step",
     13000
    ],
    [
     7.884,
     "step",
     13000
    ],
    [
     12.165,
     "servo",
     11000
    ]
   ],
   "stage": {
    "width": 1600,
    "height": 900,
    "deckTop": 560,
    "deckFront": 760,
    "deckRight": 1420,
    "horizon": 560,
    "sun": [
     1150,
     560,
     760
    ],
    "cityX": 700,
    "cityY": 640,
    "cityScale": 5.6
   },
   "robot": {
    "x": 720,
    "y": 640,
    "keyScale": 14,
    "aboardX": 92
   },
   "crane": {
    "hang": 120,
    "panelX": 590,
    "panelScale": 4
   },
   "walk": {
    "rate": 0.9,
    "cut": 420,
    "legs": [
     [
      140,
      180
     ],
     [
      320,
      180
     ]
    ]
   },
   "palette": {
    "sky0": "#2a1008",
    "sky1": "#5a2a14",
    "sky2": "#8a4a28",
    "sky3": "#b8744a",
    "glow": "#e8a040",
    "sun": "#fff1a8",
    "cloud": "#3a2418",
    "cloudLit": "#c87a40",
    "void": "#140c08",
    "deck": "#6a3416",
    "deckLit": "#8a4a22",
    "deckStreak": "#4e260f",
    "deckFront": "#2a1810",
    "deckSide": "#1c100a",
    "wood": "#3a2a1a",
    "woodLit": "#5a4228",
    "woodDark": "#1e150c",
    "brick": "#3a2a22",
    "brickLit": "#4a382c",
    "mortar": "#241a14",
    "ridge": "#3a2028",
    "rock": "#5a3a2a",
    "rockLit": "#9a6a4a",
    "rockDark": "#2a1810",
    "leaf": "#2a3a18",
    "leafLit": "#5a6a2a"
   },
   "tracks": {
    "shot": [
     [
      0,
      "roof"
     ],
     [
      8.66,
      "hill"
     ]
    ],
    "pose": [
     [
      0,
      "side"
     ],
     [
      1.3,
      "front"
     ],
     [
      5.8,
      "back"
     ]
    ],
    "camX": [
     [
      0,
      760
     ],
     [
      2.6,
      760
     ],
     [
      4.4,
      900,
      "inOut"
     ],
     [
      6.2,
      900
     ],
     [
      8.66,
      1450,
      "inOut"
     ]
    ],
    "camY": [
     [
      0,
      470
     ],
     [
      8.66,
      470
     ]
    ],
    "camZ": [
     [
      0,
      1
     ],
     [
      6.2,
      1
     ],
     [
      8.66,
      1.08,
      "inOut"
     ]
    ],
    "craneX": [
     [
      0,
      -1300
     ],
     [
      1,
      -1300
     ],
     [
      2.6,
      400,
      "out"
     ],
     [
      6.2,
      400
     ],
     [
      8.66,
      1350,
      "inOut"
     ]
    ],
    "craneY": [
     [
      0,
      -140
     ],
     [
      6.2,
      -140
     ],
     [
      8.66,
      -330,
      "inOut"
     ]
    ],
    "craneSwing": [
     [
      0,
      0
     ],
     [
      1,
      0
     ],
     [
      1.6,
      16,
      "out"
     ],
     [
      2.6,
      10
     ],
     [
      3.1,
      -7,
      "inOut"
     ],
     [
      3.7,
      4,
      "inOut"
     ],
     [
      4.3,
      -1.5,
      "inOut"
     ],
     [
      4.9,
      0,
      "inOut"
     ],
     [
      6.2,
      0
     ],
     [
      6.8,
      7,
      "inOut"
     ],
     [
      8,
      5
     ],
     [
      8.66,
      -2,
      "inOut"
     ]
    ],
    "craneK": [
     [
      0,
      4
     ],
     [
      6.2,
      4
     ],
     [
      8.66,
      4.6,
      "inOut"
     ]
    ],
    "armB": [
     [
      0,
      -55
     ],
     [
      0.4,
      -72,
      "inOut"
     ],
     [
      0.8,
      -62,
      "inOut"
     ],
     [
      1.3,
      -62
     ]
    ],
    "foreB": [
     [
      0,
      -30
     ],
     [
      1.3,
      -30
     ]
    ],
    "keyTurn": [
     [
      0,
      0
     ],
     [
      0.4,
      0
     ],
     [
      0.8,
      70,
      "inOut"
     ],
     [
      1.3,
      70
     ]
    ],
    "armL": [
     [
      0,
      10
     ],
     [
      1.3,
      10
     ],
     [
      1.7,
      150,
      "inOut"
     ],
     [
      2,
      130,
      "inOut"
     ],
     [
      2.3,
      150,
      "inOut"
     ],
     [
      2.6,
      140,
      "inOut"
     ],
     [
      3.2,
      12,
      "inOut"
     ],
     [
      13.03,
      12
     ]
    ],
    "foreL": [
     [
      0,
      -8
     ],
     [
      1.3,
      -8
     ],
     [
      1.7,
      -20,
      "inOut"
     ],
     [
      3.2,
      -8,
      "inOut"
     ],
     [
      13.03,
      -8
     ]
    ],
    "armR": [
     [
      0,
      -10
     ],
     [
      1.3,
      -10
     ],
     [
      1.7,
      -150,
      "inOut"
     ],
     [
      2,
      -130,
      "inOut"
     ],
     [
      2.3,
      -150,
      "inOut"
     ],
     [
      2.6,
      -140,
      "inOut"
     ],
     [
      3.2,
      -12,
      "inOut"
     ],
     [
      13.03,
      -12
     ]
    ],
    "foreR": [
     [
      0,
      8
     ],
     [
      1.3,
      8
     ],
     [
      1.7,
      20,
      "inOut"
     ],
     [
      3.2,
      8,
      "inOut"
     ],
     [
      13.03,
      8
     ]
    ],
    "walk": [
     [
      0,
      0
     ],
     [
      4,
      0
     ],
     [
      5.8,
      1
     ],
     [
      8.66,
      1
     ]
    ],
    "stride": [
     [
      0,
      0
     ],
     [
      4,
      0
     ],
     [
      4.2,
      26
     ],
     [
      5.6,
      26
     ],
     [
      5.8,
      0
     ],
     [
      8.66,
      0
     ],
     [
      8.66,
      30
     ],
     [
      13.03,
      30
     ]
    ],
    "heroK": [
     [
      0,
      0.3
     ],
     [
      4,
      0.3
     ],
     [
      5.8,
      0.34
     ],
     [
      13.03,
      0.34
     ]
    ],
    "walkerX": [
     [
      8.66,
      800
     ],
     [
      13.03,
      800
     ]
    ],
    "walkerK": [
     [
      8.66,
      0.32
     ],
     [
      10.5,
      0.7,
      "in"
     ],
     [
      12.2,
      1.8,
      "in"
     ],
     [
      13.03,
      2.9,
      "in"
     ]
    ],
    "walkerY": [
     [
      8.66,
      600
     ],
     [
      10.5,
      700,
      "in"
     ],
     [
      12.2,
      960,
      "in"
     ],
     [
      13.03,
      1100,
      "in"
     ]
    ],
    "plantShift": [
     [
      8.66,
      0
     ],
     [
      11,
      0
     ],
     [
      12.4,
      -700,
      "in"
     ],
     [
      13.03,
      -700
     ]
    ]
   }
  },
  "repairLift": {
   "status": "draft",
   "source": "docs/research/gamedata/raw/CD/Colony28.iso GRAFIKA/VYTAHOP.ANM; trigger: repairLift task",
   "title": "Lift repaired",
   "camera": "CAM 09 ROOF",
   "duration": 4.43,
   "sounds": [],
   "stage": {
    "width": 1600,
    "height": 900,
    "sun": [
     1380,
     840,
     520
    ]
   },
   "robot": {
    "scale": 1.35,
    "x": 860,
    "y": 190,
    "controllerScale": 11
   },
   "palette": {
    "sky0": "#2a1008",
    "sky1": "#5a2a14",
    "sky2": "#8a4a28",
    "sky3": "#b8744a",
    "glow": "#e8a040",
    "sun": "#fff1a8",
    "cloud": "#3a2418",
    "cloudLit": "#c87a40",
    "box": "#0b0705",
    "boxSide": "#140b07",
    "boxRim": "#8a4520",
    "boxGlow": "#f0b050",
    "lampOff": "#ff3020",
    "lampOn": "#8cf060"
   },
   "tracks": {
    "camX": [
     [
      0,
      790
     ],
     [
      4.43,
      818,
      "inOut"
     ]
    ],
    "camY": [
     [
      0,
      450
     ],
     [
      4.43,
      438,
      "inOut"
     ]
    ],
    "camZ": [
     [
      0,
      1
     ],
     [
      4.43,
      1.04,
      "inOut"
     ]
    ],
    "crouch": [
     [
      0,
      0
     ],
     [
      0.55,
      0
     ],
     [
      1.1,
      85,
      "inOut"
     ],
     [
      2.85,
      85
     ],
     [
      3.55,
      0,
      "inOut"
     ],
     [
      4.43,
      0
     ]
    ],
    "head": [
     [
      0,
      0
     ],
     [
      0.6,
      0
     ],
     [
      1.1,
      9,
      "inOut"
     ],
     [
      2.9,
      9
     ],
     [
      3.5,
      -3,
      "inOut"
     ],
     [
      4.43,
      -3
     ]
    ],
    "armR": [
     [
      0,
      -56
     ],
     [
      0.6,
      -60,
      "inOut"
     ],
     [
      1.1,
      -68,
      "inOut"
     ],
     [
      2.9,
      -68
     ],
     [
      3.5,
      -58,
      "inOut"
     ],
     [
      4.43,
      -58
     ]
    ],
    "foreR": [
     [
      0,
      50
     ],
     [
      0.6,
      60,
      "inOut"
     ],
     [
      1.3,
      78,
      "inOut"
     ],
     [
      1.6,
      66,
      "inOut"
     ],
     [
      1.9,
      80,
      "inOut"
     ],
     [
      2.2,
      68,
      "inOut"
     ],
     [
      2.5,
      78,
      "inOut"
     ],
     [
      2.9,
      70,
      "inOut"
     ],
     [
      3.5,
      48,
      "inOut"
     ],
     [
      4.43,
      50
     ]
    ],
    "wrist": [
     [
      0,
      -8
     ],
     [
      1.3,
      8,
      "inOut"
     ],
     [
      1.6,
      -6,
      "inOut"
     ],
     [
      1.9,
      10,
      "inOut"
     ],
     [
      2.2,
      -4,
      "inOut"
     ],
     [
      2.5,
      8,
      "inOut"
     ],
     [
      3.5,
      -8,
      "inOut"
     ],
     [
      4.43,
      -8
     ]
    ],
    "armL": [
     [
      0,
      32
     ],
     [
      4.43,
      30
     ]
    ],
    "foreL": [
     [
      0,
      -40
     ],
     [
      4.43,
      -42
     ]
    ],
    "lit": [
     [
      0,
      0
     ],
     [
      2.2,
      0
     ],
     [
      2.3,
      1
     ],
     [
      4.43,
      1
     ]
    ]
   }
  },
  "searchCorpse": {
   "status": "draft",
   "source": "docs/research/gamedata/raw/CD/Colony28.iso GRAFIKA/SEBPLAN.ANM; trigger: searchCorpse task",
   "title": "Corpse searched",
   "camera": "CAM 06 RUBBLE",
   "duration": 4.43,
   "sounds": [
    [
     0,
     "step",
     7000
    ]
   ],
   "stage": {
    "width": 1600,
    "height": 900,
    "wallBase": 560,
    "floorY": 780,
    "robotX": 720,
    "robotScale": 1.8,
    "corpseX": 1380,
    "corpseY": 890,
    "corpseScale": 29,
    "itemScale": 10,
    "squash": 0.1,
    "crouchX": -60,
    "crouchY": 620,
    "handFront": [
     880,
     590,
     320,
     200
    ]
   },
   "palette": {
    "wall": "#3e2a1a",
    "wallLit": "#5a3e26",
    "wallDark": "#24170e",
    "block": "#4a3220",
    "pipe": "#8a8272",
    "pipeLit": "#c4bba4",
    "pipeDark": "#4a4438",
    "panel": "#6a6052",
    "panelDark": "#3a342a",
    "rivet": "#a49a84",
    "skirt": "#2a2018",
    "floor": "#2e2418",
    "floorLit": "#4a3a26",
    "grate": "#18120c",
    "shadow": "#000000"
   },
   "tracks": {
    "camX": [
     [
      0,
      800
     ],
     [
      4.43,
      790
     ]
    ],
    "camY": [
     [
      0,
      450
     ],
     [
      4.43,
      455
     ]
    ],
    "camZ": [
     [
      0,
      1
     ],
     [
      4.43,
      1.04,
      "inOut"
     ]
    ],
    "crouch": [
     [
      0.45,
      0
     ],
     [
      1.3,
      1,
      "inOut"
     ],
     [
      4.43,
      1
     ]
    ],
    "lean": [
     [
      0.45,
      0
     ],
     [
      1.3,
      -16,
      "inOut"
     ],
     [
      2.3,
      -20,
      "inOut"
     ],
     [
      3,
      -20
     ],
     [
      3.6,
      -12,
      "inOut"
     ],
     [
      4.43,
      -11
     ]
    ],
    "taken": [
     [
      2.99,
      0
     ],
     [
      3,
      1
     ]
    ],
    "head": [
     [
      0,
      0
     ],
     [
      1.3,
      0
     ],
     [
      2,
      12,
      "inOut"
     ],
     [
      3.3,
      12
     ],
     [
      3.8,
      4,
      "inOut"
     ],
     [
      4.43,
      4
     ]
    ],
    "armL": [
     [
      0,
      8
     ],
     [
      0.6,
      8
     ],
     [
      1.3,
      20,
      "inOut"
     ],
     [
      4.43,
      20
     ]
    ],
    "foreL": [
     [
      0,
      0
     ],
     [
      0.6,
      0
     ],
     [
      1.3,
      -10,
      "inOut"
     ],
     [
      4.43,
      -10
     ]
    ],
    "armR": [
     [
      0,
      -8
     ],
     [
      0.6,
      -8
     ],
     [
      1.3,
      -28,
      "inOut"
     ],
     [
      1.8,
      -28
     ],
     [
      2.3,
      6,
      "inOut"
     ],
     [
      2.5,
      3,
      "inOut"
     ],
     [
      2.7,
      8,
      "inOut"
     ],
     [
      2.9,
      4,
      "inOut"
     ],
     [
      3,
      6
     ],
     [
      3.6,
      -14.5,
      "inOut"
     ],
     [
      4.43,
      -15
     ]
    ],
    "foreR": [
     [
      0,
      0
     ],
     [
      0.6,
      0
     ],
     [
      1.3,
      100,
      "inOut"
     ],
     [
      1.8,
      100
     ],
     [
      2.3,
      0.5,
      "inOut"
     ],
     [
      2.5,
      10,
      "inOut"
     ],
     [
      2.7,
      -4,
      "inOut"
     ],
     [
      2.9,
      6,
      "inOut"
     ],
     [
      3,
      0
     ],
     [
      3.6,
      159,
      "inOut"
     ],
     [
      4.43,
      158
     ]
    ],
    "handFront": [
     [
      2,
      0
     ],
     [
      2.01,
      1
     ],
     [
      3.15,
      1
     ],
     [
      3.16,
      0
     ]
    ]
   }
  },
  "takeTapHandle": {
   "status": "draft",
   "source": "docs/research/gamedata/raw/CD/Colony28.iso GRAFIKA/OTOCKOH.ANM, SEBKOH.ANM; trigger: takeTapHandle task",
   "title": "Water off, tap handle taken",
   "camera": "CAM 05 PUMP ROOM",
   "views": [
    [
     0,
     "camera"
    ],
    [
     3.714,
     "robot"
    ]
   ],
   "duration": 5.686,
   "sounds": [
    [
     0,
     "step",
     10000
    ],
    [
     3.714,
     "step",
     10000
    ]
   ],
   "stage": {
    "width": 1600,
    "height": 900,
    "floorY": 820,
    "robot": {
     "scale": 0.92,
     "x": 905
    },
    "pipe": {
     "x": 560,
     "w": 150,
     "sleeveTop": 280,
     "bottom": 580,
     "floor": 715
    },
    "wheel": {
     "x": 732,
     "y": 380,
     "r": 66,
     "depth": 0.5
    },
    "close": {
     "x": 800,
     "y": 470,
     "rx": 360,
     "tilt": 0.38,
     "arm": 3.2
    }
   },
   "palette": {
    "back": "#040606",
    "floor": "#2a2016",
    "floorLit": "#7a5a34",
    "gravel": "#140e08",
    "gravelLit": "#a88050",
    "wall": "#1a2a22",
    "wallLit": "#2c4232",
    "seam": "#0a120e",
    "stain": "#4e3218",
    "water": "#86a8a0",
    "waterDark": "#3e5a58",
    "flash": "#e03a10",
    "grid": "#e04018"
   },
   "tracks": {
    "shot": [
     [
      0,
      "A"
     ],
     [
      3.714,
      "B"
     ]
    ],
    "camZ": [
     [
      0,
      1
     ],
     [
      3.714,
      1.05,
      "inOut"
     ]
    ],
    "reach": [
     [
      0,
      0
     ],
     [
      0.45,
      1,
      "inOut"
     ]
    ],
    "grip": [
     [
      0,
      -40
     ],
     [
      0.45,
      -40
     ],
     [
      1.15,
      50,
      "inOut"
     ],
     [
      1.45,
      -40,
      "inOut"
     ],
     [
      2.15,
      50,
      "inOut"
     ],
     [
      2.45,
      -40,
      "inOut"
     ],
     [
      3.15,
      50,
      "inOut"
     ]
    ],
    "wheel": [
     [
      0,
      0
     ],
     [
      0.45,
      0
     ],
     [
      1.15,
      90,
      "inOut"
     ],
     [
      1.45,
      90
     ],
     [
      2.15,
      180,
      "inOut"
     ],
     [
      2.45,
      180
     ],
     [
      3.15,
      270,
      "inOut"
     ]
    ],
    "lean": [
     [
      0,
      0
     ],
     [
      0.45,
      2,
      "inOut"
     ],
     [
      1.15,
      -2,
      "inOut"
     ],
     [
      1.45,
      2,
      "inOut"
     ],
     [
      2.15,
      -2,
      "inOut"
     ],
     [
      2.45,
      2,
      "inOut"
     ],
     [
      3.15,
      -2,
      "inOut"
     ],
     [
      3.714,
      0,
      "inOut"
     ]
    ],
    "flow": [
     [
      0,
      1
     ],
     [
      1.2,
      1
     ],
     [
      2.9,
      0.15,
      "inOut"
     ],
     [
      3.2,
      0,
      "in"
     ]
    ],
    "grid": [
     [
      3.714,
      0
     ],
     [
      3.95,
      1,
      "out"
     ],
     [
      4.44,
      1
     ],
     [
      4.53,
      0
     ]
    ],
    "flash": [
     [
      4.44,
      0
     ],
     [
      4.445,
      1
     ],
     [
      4.525,
      1
     ],
     [
      4.53,
      0
     ]
    ],
    "spin": [
     [
      3.714,
      270
     ],
     [
      4.44,
      285,
      "out"
     ],
     [
      4.6,
      285
     ],
     [
      5,
      330,
      "inOut"
     ],
     [
      5.686,
      345,
      "out"
     ]
    ],
    "hands": [
     [
      4.53,
      0
     ],
     [
      4.85,
      1,
      "out"
     ]
    ],
    "lift": [
     [
      4.95,
      0
     ],
     [
      5.686,
      1,
      "inOut"
     ]
    ]
   }
  },
  "talkRebel": {
   "status": "draft",
   "source": "docs/research/gamedata/raw/CD/Colony28.iso GRAFIKA/REBMRT.ANM; trigger: talkRebel task",
   "title": "Dying rebel speaks",
   "camera": "CAM 02 STREET",
   "views": [
    [
     0,
     "robot"
    ]
   ],
   "duration": 12.93,
   "sounds": [],
   "stage": {
    "width": 1600,
    "height": 900
   },
   "palette": {
    "grass": "#5a5a22",
    "grassDark": "#34361a",
    "grassLight": "#7a7a34",
    "straw": "#6a4a22",
    "blood": "#5a0a08",
    "bloodWet": "#8a1a10"
   },
   "tracks": {
    "camX": [
     [
      0,
      800
     ],
     [
      9.5,
      780,
      "inOut"
     ],
     [
      12.93,
      760,
      "in"
     ]
    ],
    "camY": [
     [
      0,
      450
     ],
     [
      9.5,
      470,
      "inOut"
     ],
     [
      12.93,
      540,
      "in"
     ]
    ],
    "camZ": [
     [
      0,
      1
     ],
     [
      9.5,
      1.12,
      "inOut"
     ],
     [
      12.93,
      1.7,
      "in"
     ]
    ],
    "tilt": [
     [
      0,
      28
     ],
     [
      11.4,
      28
     ],
     [
      12.6,
      34,
      "inOut"
     ]
    ],
    "talk": [
     [
      0,
      0
     ],
     [
      0.6,
      0
     ],
     [
      0.8,
      1
     ],
     [
      3,
      1
     ],
     [
      3.2,
      0
     ],
     [
      4.2,
      0
     ],
     [
      4.4,
      1
     ],
     [
      6.8,
      1
     ],
     [
      7,
      0
     ],
     [
      8.4,
      0
     ],
     [
      8.6,
      1
     ],
     [
      10.6,
      1
     ],
     [
      10.9,
      0
     ]
    ],
    "cough": [
     [
      0,
      0
     ],
     [
      7.3,
      0
     ],
     [
      7.4,
      1,
      "out"
     ],
     [
      7.6,
      0.3
     ],
     [
      7.7,
      0.9,
      "out"
     ],
     [
      8,
      0,
      "inOut"
     ]
    ],
    "lids": [
     [
      0,
      0.45
     ],
     [
      9,
      0.5
     ],
     [
      11,
      0.6
     ],
     [
      12.4,
      1,
      "inOut"
     ]
    ],
    "look": [
     [
      0,
      0.4
     ],
     [
      5,
      0.6,
      "inOut"
     ],
     [
      9,
      0.3,
      "inOut"
     ]
    ],
    "spread": [
     [
      0,
      0.92
     ],
     [
      12.93,
      1.05
     ]
    ]
   }
  },
  "tradeHoloPlan": {
   "status": "draft",
   "source": "docs/research/gamedata/raw/CD/Colony28.iso GRAFIKA/OTEVRID.ANM, UKAZHOLO.ANM, DEJSOU1.ANM; trigger: tradeHoloPlan task",
   "title": "Holo plan shown at the bar",
   "camera": "CAM 07 BAR",
   "duration": 11.99,
   "sounds": [
    [
     3.07,
     "servo",
     11000
    ],
    [
     4.366,
     "servo",
     11000
    ],
    [
     9.204,
     "heavyDoor",
     9000
    ],
    [
     10.51,
     "servo",
     11000
    ],
    [
     11.076,
     "step",
     13000
    ],
    [
     11.729,
     "servo",
     11000
    ]
   ],
   "items": {
    "robotBefore": null,
    "robotAfter": "shipPlan",
    "manBefore": "shipPlan",
    "manAfter": null
   },
   "stage": {
    "width": 1600,
    "height": 900,
    "holoStart": 3.07,
    "doorStart": 9.16,
    "hatch": [
     170,
     90,
     1190,
     600
    ],
    "robotScale": 1,
    "itemScale": 14
   },
   "palette": {
    "wall": "#5a5040",
    "wallLit": "#867a62",
    "wallDark": "#2e2820",
    "grit": "#100e0a",
    "hole": "#0c0806",
    "holeLight": "#3a2a18",
    "panel": "#3c5458",
    "panelLit": "#6f878b",
    "panelDark": "#25393d",
    "rivet": "#142427",
    "skin": "#c98a5a",
    "skinLit": "#e8b88a",
    "skinDark": "#9a5a32",
    "skinDeep": "#5a2e16",
    "hair": "#c0ab6d",
    "hairDark": "#7b6834",
    "glassRim": "#a3adb1",
    "glass": "#ffffff",
    "lip": "#7a3e22",
    "collar": "#414b3c",
    "collarDark": "#232a22",
    "sky": "#5a2a14",
    "skyLit": "#8a4a28",
    "skyDark": "#2a1008",
    "cloud": "#b8744a",
    "cloudDark": "#3e1a0c",
    "holo": "#7ae0ff",
    "holoCore": "#ffffff",
    "lamp": "#ffd2a0",
    "plaster": "#867a62",
    "plasterLit": "#a89c80",
    "plasterDark": "#5a5040",
    "door": "#4e3218",
    "doorLit": "#7c5228",
    "doorDark": "#24160c",
    "doorEdge": "#3c5458",
    "sleeve": "#414b3c",
    "sleeveDark": "#232a22",
    "shadow": "#000000"
   },
   "tracks": {
    "slide": [
     [
      0.15,
      0
     ],
     [
      0.75,
      1,
      "inOut"
     ]
    ],
    "manX": [
     [
      0.45,
      1700
     ],
     [
      0.95,
      1020,
      "out"
     ],
     [
      1.6,
      1060,
      "inOut"
     ],
     [
      2.1,
      820,
      "inOut"
     ],
     [
      3.07,
      800
     ]
    ],
    "manY": [
     [
      0.45,
      470
     ],
     [
      2.1,
      470
     ],
     [
      3.07,
      500,
      "inOut"
     ]
    ],
    "manScale": [
     [
      0.45,
      1
     ],
     [
      2.3,
      1
     ],
     [
      3.07,
      1.18,
      "inOut"
     ]
    ],
    "manTurn": [
     [
      0.45,
      -0.5
     ],
     [
      1,
      -0.35,
      "inOut"
     ],
     [
      1.5,
      0.25,
      "inOut"
     ],
     [
      2.1,
      0,
      "inOut"
     ],
     [
      3.07,
      0
     ]
    ],
    "glare": [
     [
      0.9,
      1
     ],
     [
      1.5,
      1
     ],
     [
      1.9,
      0.25,
      "inOut"
     ],
     [
      3.07,
      0.2
     ]
    ],
    "camY": [
     [
      3.07,
      1010
     ],
     [
      5.3,
      990
     ],
     [
      7.6,
      830,
      "inOut"
     ],
     [
      9.16,
      815
     ]
    ],
    "camZ": [
     [
      3.07,
      3
     ],
     [
      9.16,
      2.8,
      "inOut"
     ]
    ],
    "armL": [
     [
      3.07,
      8.75
     ],
     [
      5.1,
      8.75
     ],
     [
      5.9,
      0,
      "inOut"
     ],
     [
      9.16,
      0
     ]
    ],
    "foreL": [
     [
      3.07,
      -91.75
     ],
     [
      5.1,
      -91.75
     ],
     [
      5.9,
      0,
      "inOut"
     ],
     [
      9.16,
      0
     ]
    ],
    "holo": [
     [
      3.2,
      0
     ],
     [
      3.6,
      1,
      "out"
     ],
     [
      5,
      1
     ],
     [
      5.4,
      0,
      "in"
     ]
    ],
    "lamp": [
     [
      3.07,
      0.6
     ],
     [
      3.5,
      1,
      "inOut"
     ],
     [
      6.5,
      1
     ],
     [
      7.2,
      0.5,
      "inOut"
     ],
     [
      9.16,
      0.4
     ]
    ]
   },
   "door": {
    "duration": 2.83,
    "robotX": 1250,
    "robotY": 1020,
    "robotScale": 1.4,
    "hinge": 520,
    "leafWidth": 600,
    "top": 200,
    "itemScale": 11,
    "manReach": 230,
    "itemStates": {
     "shipPart": 1
    },
    "tracks": {
     "camX": [
      [
       0,
       820
      ],
      [
       1.4,
       820
      ],
      [
       2.83,
       760,
       "inOut"
      ]
     ],
     "swing": [
      [
       0.7,
       0
      ],
      [
       1.5,
       1,
       "inOut"
      ]
     ],
     "reach": [
      [
       1.05,
       0
      ],
      [
       1.5,
       1,
       "out"
      ],
      [
       1.95,
       1
      ],
      [
       2.35,
       0,
       "inOut"
      ]
     ],
     "armL": [
      [
       0,
       5.5
      ],
      [
       1.3,
       5.5
      ],
      [
       1.7,
       29,
       "inOut"
      ],
      [
       1.95,
       29
      ],
      [
       2.4,
       5.5,
       "inOut"
      ],
      [
       2.83,
       6
      ]
     ],
     "foreL": [
      [
       0,
       -75.5
      ],
      [
       1.3,
       -75.5
      ],
      [
       1.7,
       -36,
       "inOut"
      ],
      [
       1.95,
       -36
      ],
      [
       2.4,
       -75.5,
       "inOut"
      ],
      [
       2.83,
       -78
      ]
     ],
     "robotShift": [
      [
       0,
       0
      ],
      [
       1.3,
       0
      ],
      [
       1.7,
       -30,
       "inOut"
      ],
      [
       2.3,
       40,
       "inOut"
      ],
      [
       2.83,
       50
      ]
     ],
     "swap": [
      [
       1.84,
       0
      ],
      [
       1.85,
       1
      ]
     ]
    }
   }
  },
  "tradeShipPart": {
   "status": "draft",
   "source": "docs/research/gamedata/raw/CD/Colony28.iso GRAFIKA/DEJSOU1.ANM; trigger: tradeShipPart task",
   "title": "Ship part handed in",
   "camera": "CAM 07 BAR",
   "duration": 2.83,
   "sounds": [],
   "note": "Same bar door shot as trade-holo-plan (its door block holds stage and tracks); only the handed items differ.",
   "items": {
    "robotBefore": "shipPart",
    "robotAfter": "decoder",
    "manBefore": null,
    "manAfter": "shipPart"
   },
   "palette": {},
   "tracks": {}
  },
  "unlockPlasma": {
   "status": "draft",
   "source": "docs/research/gamedata/raw/CD/Colony28.iso GRAFIKA/DEKOD1.ANM; trigger: unlockPlasma task",
   "title": "Code lock decoded",
   "camera": "CAM 08 PLASMA",
   "views": [
    [
     0,
     "robot"
    ]
   ],
   "duration": 5.14,
   "sounds": [
    [
     0.434,
     "servo",
     11000
    ],
    [
     1.303,
     "servo",
     11000
    ],
    [
     1.955,
     "punch",
     13000
    ],
    [
     2.244,
     "servo",
     11000
    ]
   ],
   "stage": {
    "width": 1600,
    "height": 900,
    "grid": 72,
    "speckles": 520
   },
   "lock": {
    "x": 700,
    "y": 450,
    "scale": 22,
    "decoderAt": [
     4,
     -27
    ]
   },
   "hand": {
    "scale": 5.4,
    "grip": [
     170,
     90
    ]
   },
   "palette": {
    "wall": "#8c857a",
    "speckDark": "#6e675c",
    "speckLight": "#aaa397",
    "shadow": "#0f1c14",
    "grid": "#e2481c",
    "readout": "#d83a1e",
    "monitor": "#c9d6d2",
    "monitorEdge": "#55635f",
    "monitorInk": "#2a3634",
    "monitorGlow": "#5fd8d0"
   },
   "tracks": {
    "camX": [
     [
      0,
      800
     ],
     [
      5.14,
      790,
      "inOut"
     ]
    ],
    "camY": [
     [
      0,
      450
     ],
     [
      5.14,
      460,
      "inOut"
     ]
    ],
    "camZ": [
     [
      0,
      1
     ],
     [
      5.14,
      1.04,
      "inOut"
     ]
    ],
    "grid": [
     [
      0,
      1
     ],
     [
      0.7,
      1
     ],
     [
      1.15,
      0,
      "in"
     ]
    ],
    "carryX": [
     [
      0,
      520
     ],
     [
      1,
      520
     ],
     [
      2,
      160,
      "out"
     ],
     [
      2.7,
      40,
      "inOut"
     ],
     [
      3.3,
      0,
      "inOut"
     ]
    ],
    "carryY": [
     [
      0,
      640
     ],
     [
      1,
      640
     ],
     [
      2,
      120,
      "out"
     ],
     [
      2.7,
      -30,
      "inOut"
     ],
     [
      3.3,
      0,
      "inOut"
     ]
    ],
    "rot": [
     [
      0,
      155
     ],
     [
      1,
      155
     ],
     [
      2,
      146,
      "out"
     ],
     [
      2.7,
      136,
      "inOut"
     ],
     [
      3.3,
      140,
      "inOut"
     ],
     [
      4.4,
      158,
      "inOut"
     ]
    ],
    "handX": [
     [
      0,
      0
     ],
     [
      3.45,
      0
     ],
     [
      4.4,
      520,
      "inOut"
     ]
    ],
    "handY": [
     [
      0,
      0
     ],
     [
      3.45,
      0
     ],
     [
      3.6,
      30,
      "out"
     ],
     [
      4.4,
      560,
      "in"
     ]
    ],
    "placed": [
     [
      0,
      0
     ],
     [
      3.3,
      0
     ],
     [
      3.3,
      1
     ]
    ],
    "led": [
     [
      0,
      0
     ],
     [
      3.4,
      0
     ],
     [
      3.5,
      1,
      "out"
     ],
     [
      4.6,
      1
     ],
     [
      4.75,
      0,
      "in"
     ],
     [
      4.85,
      1,
      "out"
     ]
    ],
    "open": [
     [
      0,
      0
     ],
     [
      4.75,
      0
     ],
     [
      4.75,
      1
     ]
    ]
   }
  },
  "useAcidTank": {
   "status": "draft",
   "source": "docs/research/gamedata/raw/CD/Colony28.iso GRAFIKA/KYSELINA.ANM; trigger: useAcidTank task",
   "title": "Acid poured on the guard",
   "camera": "CAM 11 TANK",
   "views": [
    [
     0,
     "robot"
    ],
    [
     2.23,
     "camera"
    ]
   ],
   "duration": 4.73,
   "sounds": [
    [
     0,
     "servo",
     11000
    ],
    [
     0.481,
     "servo",
     11000
    ],
    [
     0.962,
     "heavyDoor",
     18000
    ],
    [
     1.006,
     "servo",
     11000
    ]
   ],
   "stage": {
    "width": 1600,
    "height": 900,
    "close": {
     "x": 800,
     "y": 430,
     "rx": 380,
     "tilt": 0.34,
     "arm": 3.2
    },
    "melt": {
     "x": 800,
     "guardX": 975,
     "floorY": 800,
     "guardScale": 7.4,
     "pipeX": 772,
     "pipeW": 70,
     "outlet": 330
    }
   },
   "palette": {
    "back": "#050606",
    "under": "#0c0f0c",
    "wall": "#141c18",
    "seam": "#070a08",
    "floor": "#262a24",
    "floorEdge": "#3a4036",
    "flash": "#e03a10",
    "grid": "#e04018",
    "rot": "#22301a",
    "lift": "#a0b0a4",
    "rim": "#d8ff90",
    "acidBright": "#a6ff3c"
   },
   "tracks": {
    "shot": [
     [
      0,
      "A"
     ],
     [
      2.23,
      "B"
     ]
    ],
    "bring": [
     [
      0,
      1
     ],
     [
      0.6,
      0,
      "out"
     ]
    ],
    "grid": [
     [
      0,
      0
     ],
     [
      0.35,
      1,
      "out"
     ],
     [
      0.68,
      1
     ],
     [
      0.69,
      0
     ]
    ],
    "flash": [
     [
      0.68,
      0
     ],
     [
      0.685,
      1
     ],
     [
      0.765,
      1
     ],
     [
      0.77,
      0
     ]
    ],
    "spin": [
     [
      0,
      -20
     ],
     [
      0.6,
      0,
      "out"
     ],
     [
      0.85,
      0
     ],
     [
      1.9,
      75,
      "inOut"
     ],
     [
      2.23,
      80,
      "out"
     ]
    ],
    "pour": [
     [
      0,
      0
     ],
     [
      1.75,
      0
     ],
     [
      2.1,
      1,
      "out"
     ],
     [
      2.23,
      1
     ],
     [
      3.95,
      1
     ],
     [
      4.4,
      0,
      "in"
     ]
    ],
    "camX": [
     [
      2.23,
      790
     ],
     [
      4.73,
      800,
      "inOut"
     ]
    ],
    "camY": [
     [
      2.23,
      600
     ],
     [
      2.95,
      605
     ],
     [
      4.73,
      660,
      "inOut"
     ]
    ],
    "camZ": [
     [
      2.23,
      1.42
     ],
     [
      2.95,
      1.46
     ],
     [
      4.73,
      1.7,
      "inOut"
     ]
    ],
    "sizzle": [
     [
      2.23,
      0
     ],
     [
      2.35,
      0
     ],
     [
      3.4,
      1,
      "inOut"
     ]
    ],
    "sag": [
     [
      2.23,
      0
     ],
     [
      2.95,
      0
     ],
     [
      3.85,
      1,
      "in"
     ]
    ],
    "wreck": [
     [
      3.75,
      0
     ],
     [
      4,
      1,
      "inOut"
     ]
    ],
    "puddle": [
     [
      2.23,
      0
     ],
     [
      2.4,
      0
     ],
     [
      4.5,
      1,
      "out"
     ]
    ]
   }
  },
  "wireSwitchboard": {
   "status": "draft",
   "source": "docs/research/gamedata/raw/CD/Colony28.iso GRAFIKA/DRATVLOZ.ANM; trigger: wireSwitchboard task",
   "title": "Switchboard wired",
   "camera": "CAM 03 METRO",
   "duration": 2.64,
   "sounds": [
    [
     0,
     "servo",
     11000
    ],
    [
     1.54,
     "servo",
     11000
    ]
   ],
   "stage": {
    "width": 1600,
    "height": 900,
    "floorY": 790,
    "platformY": 700,
    "pillarX": 700
   },
   "robot": {
    "scale": 0.74,
    "envScale": 13.2,
    "lungeDrop": 27
   },
   "lunge": {
    "hipNear": -32,
    "kneeNear": 34,
    "ankleNear": -2,
    "hipFar": 22,
    "kneeFar": 6,
    "ankleFar": -28
   },
   "palette": {
    "pillarTop": "#3a342a"
   },
   "tracks": {
    "camX": [
     [
      0,
      760
     ],
     [
      2.64,
      830,
      "inOut"
     ]
    ],
    "camY": [
     [
      0,
      450
     ],
     [
      2.64,
      440,
      "inOut"
     ]
    ],
    "camZ": [
     [
      0,
      1
     ],
     [
      2.64,
      1.06,
      "inOut"
     ]
    ],
    "x": [
     [
      0,
      1150
     ],
     [
      0.5,
      1105,
      "out"
     ],
     [
      1.9,
      1100
     ],
     [
      2.64,
      1135,
      "inOut"
     ]
    ],
    "lunge": [
     [
      0,
      0.6
     ],
     [
      0.5,
      1,
      "out"
     ],
     [
      1.9,
      1
     ],
     [
      2.64,
      0.45,
      "inOut"
     ]
    ],
    "lean": [
     [
      0,
      2
     ],
     [
      0.5,
      6,
      "out"
     ],
     [
      1.9,
      6
     ],
     [
      2.64,
      1,
      "inOut"
     ]
    ],
    "arm": [
     [
      0,
      -55
     ],
     [
      0.5,
      -84,
      "inOut"
     ],
     [
      0.8,
      -88,
      "inOut"
     ],
     [
      1.1,
      -82,
      "inOut"
     ],
     [
      1.4,
      -88,
      "inOut"
     ],
     [
      1.7,
      -84,
      "inOut"
     ],
     [
      1.95,
      -84
     ],
     [
      2.4,
      -25,
      "inOut"
     ],
     [
      2.64,
      -18
     ]
    ],
    "fore": [
     [
      0,
      -50
     ],
     [
      0.5,
      -16,
      "inOut"
     ],
     [
      0.8,
      -8,
      "inOut"
     ],
     [
      1.1,
      -20,
      "inOut"
     ],
     [
      1.4,
      -10,
      "inOut"
     ],
     [
      1.7,
      -16,
      "inOut"
     ],
     [
      1.95,
      -16
     ],
     [
      2.4,
      -40,
      "inOut"
     ],
     [
      2.64,
      -34
     ]
    ],
    "armFar": [
     [
      0,
      -45
     ],
     [
      0.5,
      -76,
      "inOut"
     ],
     [
      1.95,
      -76
     ],
     [
      2.4,
      -18,
      "inOut"
     ],
     [
      2.64,
      -12
     ]
    ],
    "foreFar": [
     [
      0,
      -40
     ],
     [
      0.5,
      -20,
      "inOut"
     ],
     [
      1.95,
      -20
     ],
     [
      2.4,
      -30,
      "inOut"
     ],
     [
      2.64,
      -24
     ]
    ],
    "head": [
     [
      0,
      4
     ],
     [
      0.5,
      8,
      "out"
     ],
     [
      1.9,
      8
     ],
     [
      2.4,
      -2,
      "inOut"
     ],
     [
      2.64,
      0
     ]
    ],
    "wire": [
     [
      0,
      1
     ],
     [
      1.05,
      1
     ],
     [
      1.05,
      0
     ]
    ],
    "lit": [
     [
      0,
      0
     ],
     [
      1.9,
      0
     ],
     [
      1.9,
      1
     ]
    ]
   }
  }
 },
 "levels": {
  "jeskyne": {
   "order": 4,
   "name": "Caves",
   "objects": {
    "status": "draft",
    "source": "docs/research/reports/16-level4-layout.md",
    "units": "original pixels, 1 tile = 24",
    "objects": [
     {
      "id": "leverBank",
      "name": "Lever bank (four levers)",
      "csName": "páky",
      "interactive": true,
      "marker": 1,
      "task": "pullLevers",
      "sheet": "machines",
      "description": "Four wall levers on floor 20 at columns 28, 30, 38 and 40, drawn as sprites (not map tiles). Each pull toggles one lever. The combination left down, three right up opens the lever door at column 26 (object record 1, target [0,1,1,1], 7:0x3609-0x3B73). Wrong combination closes it again.",
      "states": [
       "lever down",
       "lever up",
       "moving"
      ],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M41.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         576,
         336,
         456,
         192
        ],
        "caption": "map M41: floor 20, lever columns 28-40 (levers are sprites, not in the map)"
       }
      ]
     },
     {
      "id": "leverDoor",
      "name": "Lever-operated cave door",
      "csName": "dveře",
      "interactive": true,
      "marker": 1,
      "task": "pullLevers",
      "sheet": "machines",
      "description": "Sliding door, 5 rows tall, opened by a lever combination (object table records 1, 3 and 4, 12-frame animation). Record 1 at column 26 on floor 20 (start area); records 3 and 4 at columns 130 and 125 on floor 21, each with one lever (columns 132 and 123). Closed doors push the hero back (3:0x5F25). Drawn as sprites.",
      "states": [
       "closed",
       "opening",
       "open",
       "closing"
      ],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M41.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         480,
         336,
         264,
         192
        ],
        "caption": "map M41: door spot at column 26, floor 20"
       },
       {
        "path": "docs/research/gamedata/png/maps/map_M41.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         2880,
         336,
         360,
         192
        ],
        "caption": "map M41: lever doors at columns 125 and 130, floor 21"
       }
      ]
     },
     {
      "id": "rod",
      "name": "Rod pickup",
      "csName": "Tyč",
      "interactive": true,
      "marker": 2,
      "task": "pickRod",
      "sheet": "props",
      "description": "Item record 1 (TYC) at engine (21, 22), cell column 27 on floor 28. Used at the lift lock it is consumed.",
      "states": [
       "on ground",
       "in inventory",
       "used"
      ],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M41.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         552,
         576,
         216,
         120
        ],
        "caption": "map M41: floor 28, rod at column 27 (item drawn as sprite)"
       }
      ]
     },
     {
      "id": "liftLock",
      "name": "Lift mechanism safety lock",
      "csName": "pojistka výtahu",
      "interactive": true,
      "marker": 3,
      "task": "releaseLiftLock",
      "sheet": "machines",
      "description": "Mechanical safety lock of lift 1 at columns 34-36 on floor 55 (hero engine x 28-30, y 49). Using the rod plays XTYC.anm (TYCI JSI PREPNUL MECHANICKOU POJISTKU) and rewrites lift 1 from one stop (55) to three stops (29, 44, 55) (5:0xECB7).",
      "states": [
       "locked",
       "released"
      ],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M41.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         720,
         1176,
         600,
         192
        ],
        "caption": "map M41: floor 55, lock spot columns 34-36 and lift 1 at columns 49-51"
       }
      ]
     },
     {
      "id": "lift",
      "name": "Lift platform and shaft",
      "csName": "výtah",
      "interactive": true,
      "marker": null,
      "task": null,
      "sheet": "machines",
      "description": "Six rope lifts: a thin chain or rope column at the lift centre (tile (10,36) on each stop's stand row) and a deck drawn by tiles (7,61) (7,62) (7,63) where the lift stops in a gap of an upper floor. Same slot code as level 1 (ds:0x4C90). Lift 1 is locked until the rod is used; lift 4 snaps to its top stop while the hero is on the cart stretch (7:0x87A5).",
      "states": [
       "idle at floor",
       "moving up",
       "moving down",
       "locked (lift 1)"
      ],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M41.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         1032,
         312,
         144,
         792
        ],
        "caption": "map M41: lift 2 shaft, columns 44-46, floors 20 to 44"
       },
       {
        "path": "docs/research/gamedata/png/maps/map_M41.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         1920,
         456,
         168,
         288
        ],
        "caption": "map M41: lift 4 shaft, three stops 21, 23, 29"
       }
      ]
     },
     {
      "id": "stalactite",
      "name": "Stalactite",
      "csName": "krápník",
      "interactive": true,
      "marker": 4,
      "task": "shootStalactite",
      "sheet": "structures",
      "description": "Rock stalactite hanging at columns 62-63, rows 16-18, over the chasm east of floor 20. Shot with the gun from floor 20 (hero engine x 50-55, y 14): krapnik1.anm, SESTRELIL JSI KRAPNIK, map switches to M42 (5:0x7294). In M42 the tiles are gone.",
      "states": [
       "hanging",
       "falling",
       "gone"
      ],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M41.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         1392,
         336,
         264,
         168
        ],
        "caption": "map M41: stalactite hanging"
       },
       {
        "path": "docs/research/gamedata/png/maps/map_M42.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         1392,
         336,
         264,
         168
        ],
        "caption": "map M42: stalactite gone"
       }
      ]
     },
     {
      "id": "crystal",
      "name": "Crystal block",
      "csName": "krystal",
      "interactive": false,
      "marker": 4,
      "task": "shootStalactite",
      "sheet": "structures",
      "description": "Crystal on floor 29 at columns 62-64, rows 27-28. A code wall (east wall table entry engine (56, 23)) blocks floor 29 there until the stalactite falls on it; then the entry moves to (200, 200) and M42 shows the crystal smashed.",
      "states": [
       "intact (blocks)",
       "smashed"
      ],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M41.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         1392,
         576,
         264,
         144
        ],
        "caption": "map M41: crystal intact"
       },
       {
        "path": "docs/research/gamedata/png/maps/map_M42.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         1392,
         576,
         264,
         144
        ],
        "caption": "map M42: crystal smashed"
       }
      ]
     },
     {
      "id": "keySlots",
      "name": "Three key slots",
      "csName": null,
      "interactive": true,
      "marker": 5,
      "task": "insertKeys",
      "sheet": "machines",
      "description": "Slot panel on floor 37 at columns 57-59 (hero engine x 51-53, y 31). Using the yellow, orange or blue key consumes it (vkart1-3.anm, POUZIL JSI ... KLIC). With all three inserted the key doors (object record 2) open (3:0xEB14).",
      "states": [
       "empty",
       "one or two keys",
       "all keys (doors open)"
      ],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M41.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         1248,
         744,
         360,
         192
        ],
        "caption": "map M41: floor 37, slot spot columns 57-59"
       }
      ]
     },
     {
      "id": "stoneBlocks",
      "name": "Stone blocks",
      "csName": "kameny kvádry",
      "interactive": true,
      "marker": 6,
      "task": "smashBlocks",
      "sheet": "structures",
      "description": "Two stacked stone blocks at column 81, rows 23-24 (stone block table, 7:0x3236). Destroyed only by fists: 5 punches each, then the frame runs to 12 and the block stops blocking. Drawn as sprites.",
      "states": [
       "intact",
       "cracking",
       "broken"
      ],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M41.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         1776,
         408,
         360,
         216
        ],
        "caption": "map M41: block spot at column 81, floor 23"
       }
      ]
     },
     {
      "id": "orangeKey",
      "name": "Orange key-card pickup",
      "csName": "Oranžový klíč",
      "interactive": true,
      "marker": 7,
      "task": "pickOrangeKey",
      "sheet": "props",
      "description": "Item record 3 (ORANZOVY KLIC) at engine (66, 17), column 72 on floor 23, west of the stone blocks.",
      "states": [
       "on ground",
       "in inventory",
       "inserted"
      ],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M41.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         1632,
         456,
         264,
         120
        ],
        "caption": "map M41: floor 23, key at column 72"
       }
      ]
     },
     {
      "id": "chasm",
      "name": "Chasm with middle platform",
      "csName": "propast",
      "interactive": false,
      "marker": 8,
      "task": null,
      "sheet": "structures",
      "description": "Gap in floor 21 between columns 94 and 101 with a one-cell middle platform at column 99; the hero jumps to it. Falling in is game over (zone engine x 85-98, y 16). The drop east of floor 20 under the stalactite (columns 60-67, rows 21-23) is a second deadly chasm: propast.anm, then game over (3:0xEA79).",
      "states": [],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M41.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         2112,
         360,
         384,
         384
        ],
        "caption": "map M41: chasm 8 and middle platform at column 99"
       },
       {
        "path": "docs/research/gamedata/png/maps/map_M41.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         1344,
         336,
         360,
         408
        ],
        "caption": "map M41: deadly drop east of floor 20"
       }
      ]
     },
     {
      "id": "barrel",
      "name": "Explosive tank",
      "csName": "nádrž s výbušninou",
      "interactive": true,
      "marker": 8,
      "task": "shootTank",
      "sheet": "props",
      "description": "Explosive barrel at columns 103-104, rows 19-20 on floor 21. It exists only in map M42; its tiles (7,64) (7,65) (7,77) (7,78) are wall tiles. Shot with the gun from the middle platform (hero engine x 92-93, y 15) it explodes (barelbum.anm, ZNICIL JSI BAREL S VYBUSNINOU) and M43 loads. Shooting from x 94-98 kills the hero (5:0x63ED-0x69B7).",
      "states": [
       "intact",
       "exploding",
       "destroyed"
      ],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M42.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         2304,
         336,
         360,
         216
        ],
        "caption": "map M42: tank on floor 21"
       },
       {
        "path": "docs/research/gamedata/png/maps/map_M43.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         2304,
         336,
         360,
         216
        ],
        "caption": "map M43: tank gone"
       }
      ]
     },
     {
      "id": "blueKey",
      "name": "Blue key pickup",
      "csName": "Modrý klíč",
      "interactive": true,
      "marker": 9,
      "task": "pickBlueKey",
      "sheet": "props",
      "description": "Item record 4 (MODRY KLIC) at engine (111, 15), column 117 on floor 21.",
      "states": [
       "on ground",
       "in inventory",
       "inserted"
      ],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M41.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         2688,
         384,
         264,
         144
        ],
        "caption": "map M41: floor 21, key at column 117"
       }
      ]
     },
     {
      "id": "mineCarts",
      "name": "Moving mine carts",
      "csName": "jezdící těžební vozík",
      "interactive": false,
      "marker": 10,
      "task": null,
      "sheet": "machines",
      "description": "Row of yellow-green carts on rows 38-39, columns 97-130 (sheet 2 tiles). Standing on tiles (2,2) (2,4) (2,6) carries the hero east about 5.5 px per tick (7:0x8875). Ledges above let him jump off toward the yellow key. Reaching columns 123-125 (engine x 117-119, y 31-35) plays zabvozik.anm and ends the game: the hero must jump off before.",
      "states": [
       "moving"
      ],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M41.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         2256,
         816,
         936,
         192
        ],
        "caption": "map M41: cart strip, rows 38-39"
       }
      ]
     },
     {
      "id": "yellowKey",
      "name": "Yellow key pickup",
      "csName": "Žlutý klíč",
      "interactive": true,
      "marker": 11,
      "task": "pickYellowKey",
      "sheet": "props",
      "description": "Item record 2 (ZLUTY KLIC) at engine (129, 25), column 135 on floor 31, reached by jumping up the ledges above the carts.",
      "states": [
       "on ground",
       "in inventory",
       "inserted"
      ],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M41.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         3072,
         624,
         312,
         168
        ],
        "caption": "map M41: floor 31, key at column 135"
       }
      ]
     },
     {
      "id": "keyDoors",
      "name": "Key doors",
      "csName": "dveře",
      "interactive": false,
      "marker": 12,
      "task": "insertKeys",
      "sheet": "machines",
      "description": "Door at column 55 on floor 44 (object record 2, engine (49, 38)), 5 rows tall. Opens when all three keys sit in the slots. Drawn as a sprite.",
      "states": [
       "closed",
       "opening",
       "open"
      ],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M41.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         1152,
         912,
         360,
         192
        ],
        "caption": "map M41: floor 44, door spot at column 55"
       }
      ]
     },
     {
      "id": "lavaPit",
      "name": "Lava pits",
      "csName": null,
      "interactive": false,
      "marker": 13,
      "task": null,
      "sheet": "structures",
      "description": "Everything below the bottom corridor (engine y above 68, floor row 75 and lower) is lava: lava.anm, then game over. Pits are the gaps in the corridor floor (columns 44, 46-49, 52, 55, 62, 64-65, 67-68, 75, 92 on row 74) and the left shaft (columns 12-15) whose ledge at row 75 is already in the lava band. Marker 13: from the west end of floor 63 the hero must reach the ledge at row 72 (columns 16-20, energy bonus) instead of falling down the shaft.",
      "states": [],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M41.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         240,
         1416,
         504,
         480
        ],
        "caption": "map M41: left shaft, ledge at row 75 and gap at columns 16-19"
       },
       {
        "path": "docs/research/gamedata/png/maps/map_M41.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         960,
         1680,
         792,
         216
        ],
        "caption": "map M41: bottom corridor pits"
       }
      ]
     },
     {
      "id": "entryCard",
      "name": "Entry card pickup",
      "csName": "Vstupní karta",
      "interactive": true,
      "marker": 14,
      "task": "pickCard",
      "sheet": "props",
      "description": "Item record 5 (VSTUPNI KARTA) at engine (93, 46), column 99 on floor 52, at the top of a ledge stair. Pickup plays sebk44.anm (NALEZL JSI VSTUPNI KARTU).",
      "states": [
       "on ground",
       "in inventory",
       "used"
      ],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M41.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         2112,
         1128,
         456,
         312
        ],
        "caption": "map M41: card ledge, column 99 floor 52"
       }
      ]
     },
     {
      "id": "cardDoor",
      "name": "Card door",
      "csName": "dveře",
      "interactive": true,
      "marker": 15,
      "task": "openCardDoor",
      "sheet": "machines",
      "description": "Door at column 104 on floor 74 (object record 5, engine (98, 68)). Using the entry card at hero x 93-97 opens it (OTEVREL JSI DVERE); without it NEMAS U SEBE NIC CIM BY JSI OTEVREL DVERE. Drawn as a sprite.",
      "states": [
       "locked",
       "opening",
       "open"
      ],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M41.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         2352,
         1608,
         312,
         216
        ],
        "caption": "map M41: floor 74, door spot at column 104"
       }
      ]
     },
     {
      "id": "airlock",
      "name": "Exit airlock",
      "csName": null,
      "interactive": false,
      "marker": 15,
      "task": null,
      "sheet": "machines",
      "description": "Two doors on floor 48 at columns 133 and 141 (object records 6 and 7), open at start. Walking into columns 136-139 closes both; when the east door has closed level 5 starts (3:0xEB43-0xEBCF).",
      "states": [
       "open",
       "closing",
       "closed (level end)"
      ],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M41.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         3072,
         984,
         456,
         216
        ],
        "caption": "map M41: floor 48, airlock columns 133-141"
       }
      ]
     },
     {
      "id": "rockLedge",
      "name": "Stepping ledges",
      "csName": null,
      "interactive": false,
      "marker": null,
      "task": null,
      "sheet": "structures",
      "description": "Small rock ledges with a green top, one row apart and offset 1-3 columns, forming zigzag stairs (for example columns 126-136 rows 16-31, 116-121 rows 31-38). The hero climbs them by jumping one row at a time; they replace the ladders of other levels.",
      "states": [],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M41.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         2760,
         336,
         576,
         648
        ],
        "caption": "map M41: ledge stairs above the carts"
       }
      ]
     },
     {
      "id": "ropeColumn",
      "name": "Chain or root column",
      "csName": null,
      "interactive": false,
      "marker": null,
      "task": null,
      "sheet": "structures",
      "description": "Thin vertical chain or root strands hanging between floors, with dark caps (tiles (10,36) and neighbours). Scenery next to lifts and in shafts.",
      "states": [],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M41.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         3024,
         720,
         168,
         456
        ],
        "caption": "map M41: vertical strands"
       }
      ]
     },
     {
      "id": "caveRock",
      "name": "Cave rock walls",
      "csName": null,
      "interactive": false,
      "marker": null,
      "task": null,
      "sheet": "structures",
      "description": "Orange and brown curved rock masses and dark fill between floors (sheets 7 and 9). Rock fill tiles (9,61)-(9,64) and (9,66)-(9,69) are the level wall tiles.",
      "states": [],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M41.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         1344,
         744,
         600,
         192
        ],
        "caption": "map M41: rock masses on floor 37"
       }
      ]
     },
     {
      "id": "caveFloor",
      "name": "Rock floor plank",
      "csName": null,
      "interactive": false,
      "marker": null,
      "task": null,
      "sheet": "structures",
      "description": "Thin pebbled rock floor strip, tiles (7,1)-(7,4) with end caps (7,22) (7,23) (7,103) (7,104). Every walkable plank is one of the floor-list tiles.",
      "states": [],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M41.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         432,
         432,
         600,
         96
        ],
        "caption": "map M41: floor 20"
       }
      ]
     },
     {
      "id": "metalPillars",
      "name": "Metal machinery pillars",
      "csName": null,
      "interactive": false,
      "marker": null,
      "task": null,
      "sheet": "structures",
      "description": "Grey-green riveted metal columns and pipes set in the rock (for example floor 63 columns 17-23, floor 44 columns 57-61).",
      "states": [],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M41.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         384,
         1392,
         216,
         168
        ],
        "caption": "map M41: machinery at the west end of floor 63"
       },
       {
        "path": "docs/research/gamedata/png/maps/map_M41.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         1344,
         936,
         168,
         168
        ],
        "caption": "map M41: pillars on floor 44"
       }
      ]
     },
     {
      "id": "lavaFall",
      "name": "Glowing lava curtain and strip",
      "csName": null,
      "interactive": false,
      "marker": null,
      "task": null,
      "sheet": "structures",
      "description": "Orange striped glowing block at columns 37-42, rows 68-73 (sheet 1 tile 3) and orange strips in the bottom corridor floor (sheet 1 tiles 4-7). Effect on the hero not traced.",
      "states": [],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M41.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         816,
         1584,
         408,
         264
        ],
        "caption": "map M41: lava curtain over the bottom corridor"
       }
      ]
     },
     {
      "id": "caveBackdrop",
      "name": "Parallax cave backdrop",
      "csName": null,
      "interactive": false,
      "marker": null,
      "task": null,
      "sheet": "buildings",
      "description": "Full-screen backdrop: mossy rock ceiling, a dark band, stalagmites on a pale ground and a glowing lava strip at the bottom (LEV4.GRA frame 0).",
      "states": [],
      "refs": [
       {
        "path": "docs/research/gamedata/png/lev4/f000.png",
        "imgSize": [
         320,
         200
        ],
        "crop": [
         0,
         0,
         320,
         190
        ],
        "caption": "background frame 0"
       }
      ]
     }
    ]
   }
  },
  "jungle": {
   "order": 3,
   "name": "Jungle",
   "objects": {
    "status": "draft",
    "source": "docs/research/reports/15-level3-layout.md",
    "units": "original pixels, 1 tile = 24",
    "objects": [
     {
      "id": "distributionCabinet",
      "name": "Distribution cabinet",
      "csName": "rozvodná skříň",
      "interactive": true,
      "marker": 1,
      "task": "shootCabinet",
      "sheet": "machines",
      "description": "Small electrical box low in the cave pit (cells 97-98, row 46). Shooting it with the gun from the cave floor (engine y 42, x >= 87) plays delo.anm, puts 2 blasts on it and switches the cannon off ([0x5481]=1, map M32). No hit points: one shot does it (5:0x704B). Its tiles change from (8,32/33) to (8,53/54) in M32/M33.",
      "states": [
       "intact (cannon live)",
       "shot (cannon off)"
      ],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M31.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         2280,
         1056,
         96,
         72
        ],
        "caption": "map M31: cabinet cells 97-98 row 46"
       },
       {
        "path": "docs/research/gamedata/png/maps/map_M33.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         2280,
         1056,
         96,
         72
        ],
        "caption": "map M33: broken cabinet"
       },
       {
        "path": "docs/research/video/sheets/98GhruztJP0_03.png",
        "imgSize": [
         1280,
         712
        ],
        "crop": [
         960,
         178,
         320,
         178
        ],
        "caption": "demo: round vent with a yellow E sign, cabinet candidate"
       }
      ]
     },
     {
      "id": "cannonTurret",
      "name": "Cannon turret",
      "csName": "dělo",
      "interactive": false,
      "marker": 2,
      "task": "shootCabinet",
      "sheet": "enemies",
      "description": "Dome gun turret on a short pedestal at the east end of plank row 32 (cell 90,31), map tiles. While the cabinet is intact, a hero at cells 90-98 on that floor gets strilna.anm, 3 blasts, (6 - shields)/6 x 30 energy and a push one cell right and one row down (3:0xE42D). Cannot be destroyed; the cabinet shot switches it off. LEV3.GRA f25 holds a dome turret sprite (8 frames, firing right) that level 3 does not use as a guard.",
      "states": [
       "live (fires at the floor)",
       "off (base tile replaced)"
      ],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M31.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         2112,
         696,
         120,
         96
        ],
        "caption": "map M31: turret"
       },
       {
        "path": "docs/research/gamedata/png/maps/map_M33.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         2112,
         696,
         120,
         96
        ],
        "caption": "map M33: turret off"
       },
       {
        "path": "docs/research/video/frames-best/DEMO_jungle_rock_ledges_turret.png",
        "imgSize": [
         2562,
         1422
        ],
        "crop": [
         832,
         915,
         358,
         270
        ],
        "caption": "demo: turret on rock ledge"
       },
       {
        "path": "docs/research/video/sheets/98GhruztJP0_02.png",
        "imgSize": [
         1280,
         712
        ],
        "crop": [
         320,
         0,
         320,
         178
        ],
        "caption": "demo: turret on a ledge"
       }
      ]
     },
     {
      "id": "smallKey",
      "name": "Small key",
      "csName": "malý klíč",
      "interactive": true,
      "marker": 3,
      "task": "takeKey",
      "sheet": "props",
      "description": "Item record 5 (KLIC) lying in the grass at cell 54 on plank row 32, in front of a small building. Pickup plays klic.anm: V TRAVE JSI NASEL MALY KLIC. Opens the flamethrower door (9).",
      "states": [
       "on ground",
       "taken",
       "used on door"
      ],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M31.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         1248,
         696,
         120,
         96
        ],
        "caption": "map: key spot"
       },
       {
        "path": "docs/research/video/sheets/98GhruztJP0_02.png",
        "imgSize": [
         1280,
         712
        ],
        "crop": [
         640,
         534,
         320,
         178
        ],
        "caption": "demo: key found message"
       }
      ]
     },
     {
      "id": "tripwire",
      "name": "Tripwire trap",
      "csName": "napnutý drát / past",
      "interactive": true,
      "marker": 4,
      "task": "cutTrap",
      "sheet": "props",
      "description": "Tensioned wire between two posts (cells 52-53, rows 35-36) on plank row 37, item records 3 and 4 (NAPNUTY DRAT) at cells 54-55 that cannot be picked up. Walking into cell 55 while it is armed sets off 45 blast rounds and ends the game (3:0xE742). Using the cutters there removes it and gives the grenade (sebgra.anm, granat.anm).",
      "states": [
       "armed (deadly)",
       "cut"
      ],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M31.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         1224,
         816,
         144,
         96
        ],
        "caption": "map: trap posts"
       },
       {
        "path": "docs/research/video/sheets/98GhruztJP0_03.png",
        "imgSize": [
         1280,
         712
        ],
        "crop": [
         640,
         534,
         320,
         178
        ],
        "caption": "demo: trap removed, grenade found"
       }
      ]
     },
     {
      "id": "boulder",
      "name": "Bulky boulder",
      "csName": "mohutný kámen",
      "interactive": true,
      "marker": 5,
      "task": "blowRock",
      "sheet": "structures",
      "description": "Large rock over the spike strip of plank row 20, used from cells 46-54. Wrong item: MOHUTNY KAMEN. The grenade (hodgra.anm, skala1.anm, skala2.anm) collapses it onto the spikes (map M33): PO EXPLOZI SE ZAVALILA CAST PREKAZKY. Not drawn in M31 tiles (probably a sprite) [inferred].",
      "states": [
       "standing",
       "blown (rubble on spikes)"
      ],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M31.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         1176,
         384,
         312,
         144
        ],
        "caption": "map M31: rock area and spikes"
       },
       {
        "path": "docs/research/video/sheets/98GhruztJP0_04.png",
        "imgSize": [
         1280,
         712
        ],
        "crop": [
         960,
         0,
         320,
         178
        ],
        "caption": "demo: boulder above spikes"
       }
      ]
     },
     {
      "id": "spikes",
      "name": "Spike pit",
      "csName": "bodáky",
      "interactive": false,
      "marker": 5,
      "task": "blowRock",
      "sheet": "structures",
      "description": "Strip of spikes on plank row 20, cells 53-60, with no floor tiles: a hero who walks or falls in drops to engine y 15 and dies (OSTNY.anm, 3:0xE9F7). After the grenade, rubble gives floor cells 57-58, so a running jump gets over.",
      "states": [
       "open",
       "rubble on spikes (M33)"
      ],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M31.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         1248,
         432,
         240,
         96
        ],
        "caption": "map M31: spikes"
       },
       {
        "path": "docs/research/gamedata/png/maps/map_M33.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         1248,
         432,
         240,
         96
        ],
        "caption": "map M33: debris on spikes"
       },
       {
        "path": "docs/research/video/sheets/98GhruztJP0_04.png",
        "imgSize": [
         1280,
         712
        ],
        "crop": [
         320,
         178,
         320,
         178
        ],
        "caption": "demo: spikes after the explosion"
       }
      ]
     },
     {
      "id": "stonePuzzle",
      "name": "Stone puzzle",
      "csName": "hlavolam",
      "interactive": true,
      "marker": 6,
      "task": "stonePuzzle",
      "sheet": "machines",
      "description": "Four-stone panel used from cells 104-105 on the ledge at plank row 17. Opens a close-up screen (6:0xB514): move over raised stones, Enter presses one; each press also toggles or releases others by a 4-step counter. All four pressed: Z VODOPADU NAD TEBOU SE VYSUNULY DVA KAMENNE BLOKY and map M34. Otherwise NIC SE NESTALO.",
      "states": [
       "unsolved",
       "solved"
      ],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M31.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         2448,
         312,
         144,
         168
        ],
        "caption": "map: puzzle ledge cells 101-105"
       },
       {
        "path": "docs/research/video/sheets/98GhruztJP0_04.png",
        "imgSize": [
         1280,
         712
        ],
        "crop": [
         0,
         534,
         320,
         178
        ],
        "caption": "demo: puzzle stones close-up"
       },
       {
        "path": "docs/research/video/sheets/98GhruztJP0_04.png",
        "imgSize": [
         1280,
         712
        ],
        "crop": [
         960,
         356,
         320,
         178
        ],
        "caption": "demo: NIC SE NESTALO"
       }
      ]
     },
     {
      "id": "waterfall",
      "name": "Waterfall",
      "csName": "vodopád",
      "interactive": false,
      "marker": 6,
      "task": "stonePuzzle",
      "sheet": "structures",
      "description": "Tall grey waterfall column at cells 94-99, rows 3-20, between plank rows 20 and 11. Solving the puzzle slides out two stone blocks (cells 96,12 and 98,13) that act as steps up to floor 11 (M34). Ambient sound while the hero is nearby (3:0xBF20) [inferred].",
      "states": [
       "plain",
       "with stone steps (M34)"
      ],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M31.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         2256,
         72,
         144,
         432
        ],
        "caption": "map M31: waterfall"
       },
       {
        "path": "docs/research/gamedata/png/maps/map_M34.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         2280,
         264,
         120,
         96
        ],
        "caption": "map M34: stone steps"
       },
       {
        "path": "docs/research/video/sheets/98GhruztJP0_04.png",
        "imgSize": [
         1280,
         712
        ],
        "crop": [
         960,
         534,
         320,
         178
        ],
        "caption": "demo: two blocks in the waterfall"
       }
      ]
     },
     {
      "id": "flamethrowerDoor",
      "name": "Door to the flamethrower",
      "csName": "dveře",
      "interactive": true,
      "marker": 9,
      "task": "openDoor",
      "sheet": "buildings",
      "description": "Door in a small building with a red lamp on plank row 41 (use from cells 119-123). Locked without the key: DVERE JSOU ZAMCENE. With the key: dvere.anm, ZA DVERMI JSI OBJEVIL PLAMENOMET, weapon slot 3 becomes the flamethrower with 500 ammo (3:0x95EC).",
      "states": [
       "locked",
       "opened"
      ],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M31.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         2808,
         864,
         192,
         120
        ],
        "caption": "map: door building"
       },
       {
        "path": "docs/research/video/sheets/98GhruztJP0_03.png",
        "imgSize": [
         1280,
         712
        ],
        "crop": [
         0,
         0,
         320,
         178
        ],
        "caption": "demo: building door"
       },
       {
        "path": "docs/research/video/sheets/98GhruztJP0_03.png",
        "imgSize": [
         1280,
         712
        ],
        "crop": [
         320,
         0,
         320,
         178
        ],
        "caption": "demo: flamethrower found"
       }
      ]
     },
     {
      "id": "flamethrower",
      "name": "Flamethrower",
      "csName": "plamenomet",
      "interactive": true,
      "marker": 9,
      "task": "openDoor",
      "sheet": "props",
      "description": "Bonus weapon 3 of levels 3 and 4: a particle stream (40 particles, table ds:0x499E), 0.03 hp per particle tick on enemies within 1 cell. Starts with 500 ammo and carries into level 4.",
      "states": [
       "behind door",
       "held"
      ],
      "refs": [
       {
        "path": "docs/research/video/sheets/98GhruztJP0_03.png",
        "imgSize": [
         1280,
         712
        ],
        "crop": [
         320,
         534,
         320,
         178
        ],
        "caption": "demo: flamethrower firing"
       }
      ]
     },
     {
      "id": "crate",
      "name": "Crate with cutters",
      "csName": "bedna",
      "interactive": true,
      "marker": 10,
      "task": "openCrate",
      "sheet": "props",
      "description": "Wooden crate under the helicopter wreck at cell 83 on plank row 32, item record 2 (BEDNA). Pickup plays bedna.anm, renames it to STIPACKY: UVNITR BEDNY JSI NASEL STIPACKY. Same thing as the mesto crate, here holding a quest item.",
      "states": [
       "closed",
       "opened (cutters taken)"
      ],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M31.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         1944,
         672,
         96,
         96
        ],
        "caption": "map: crate spot"
       },
       {
        "path": "docs/research/video/sheets/98GhruztJP0_02.png",
        "imgSize": [
         1280,
         712
        ],
        "crop": [
         320,
         178,
         320,
         178
        ],
        "caption": "demo: crate cutscene"
       },
       {
        "path": "docs/research/video/sheets/98GhruztJP0_02.png",
        "imgSize": [
         1280,
         712
        ],
        "crop": [
         640,
         178,
         320,
         178
        ],
        "caption": "demo: cutters found"
       }
      ]
     },
     {
      "id": "cutters",
      "name": "Wire cutters",
      "csName": "štípačky",
      "interactive": true,
      "marker": 10,
      "task": "cutTrap",
      "sheet": "props",
      "description": "Item given by the crate (record 2 renamed). Used on the tripwire, then gone.",
      "states": [
       "held",
       "used"
      ],
      "refs": [
       {
        "path": "docs/research/video/sheets/98GhruztJP0_02.png",
        "imgSize": [
         1280,
         712
        ],
        "crop": [
         640,
         178,
         320,
         178
        ],
        "caption": "demo: cutters message"
       }
      ]
     },
     {
      "id": "grenade",
      "name": "Grenade",
      "csName": "granát",
      "interactive": true,
      "marker": 4,
      "task": "blowRock",
      "sheet": "props",
      "description": "Item given by cutting the tripwire (record 3 renamed GRANAT). Thrown at the boulder, then gone.",
      "states": [
       "held",
       "thrown"
      ],
      "refs": [
       {
        "path": "docs/research/video/sheets/98GhruztJP0_03.png",
        "imgSize": [
         1280,
         712
        ],
        "crop": [
         640,
         534,
         320,
         178
        ],
        "caption": "demo: grenade found"
       }
      ]
     },
     {
      "id": "canister",
      "name": "Fuel canister",
      "csName": "kanystr",
      "interactive": true,
      "marker": 8,
      "task": "takeCanister",
      "sheet": "props",
      "description": "Item record 1 (KANYSTR) at cell 100 on the small ledge at plank row 40, beside the orange car wreck. Pickup plays kanistr.anm: NALEZL JSI KANYSTR S PALIVEM. Poured into the jeep.",
      "states": [
       "on ground",
       "taken",
       "used"
      ],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M31.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         2352,
         888,
         144,
         96
        ],
        "caption": "map: canister spot"
       },
       {
        "path": "docs/research/video/sheets/98GhruztJP0_01.png",
        "imgSize": [
         1280,
         712
        ],
        "crop": [
         960,
         356,
         320,
         178
        ],
        "caption": "demo: canister found message"
       }
      ]
     },
     {
      "id": "jeep",
      "name": "Jeep with winch",
      "csName": "jeep / naviják",
      "interactive": true,
      "marker": 8,
      "task": "fuelJeep",
      "sheet": "machines",
      "description": "Jeep on plank row 11 at cells 80-83, rows 9-10, east of the fallen tree. Canister used at cells 78-84: napln.anm, DO NADRZE AUTOMOBILU JSI NALIL PALIVO. Then any use at cells 76-80 runs the winch (navijak.anm, sutr.anm), pulls the tree away and ends the level (3:0x97CC).",
      "states": [
       "empty tank",
       "fueled",
       "winching (level end)"
      ],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M31.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         1944,
         192,
         96,
         96
        ],
        "caption": "map: jeep"
       },
       {
        "path": "docs/research/video/sheets/98GhruztJP0_05.png",
        "imgSize": [
         1280,
         712
        ],
        "crop": [
         320,
         0,
         320,
         178
        ],
        "caption": "demo: jeep and droid"
       },
       {
        "path": "docs/research/video/sheets/98GhruztJP0_05.png",
        "imgSize": [
         1280,
         712
        ],
        "crop": [
         0,
         178,
         320,
         178
        ],
        "caption": "demo: fuel message"
       },
       {
        "path": "docs/research/video/sheets/98GhruztJP0_05.png",
        "imgSize": [
         1280,
         712
        ],
        "crop": [
         320,
         178,
         320,
         178
        ],
        "caption": "demo: winch cutscene"
       }
      ]
     },
     {
      "id": "fallenTree",
      "name": "Fallen tree",
      "csName": "padlý strom",
      "interactive": false,
      "marker": 8,
      "task": "winchTree",
      "sheet": "structures",
      "description": "Tree trunk lying across plank row 11 at cells 70-81, rows 7-10; west wall of floor 11 (wall table x 71). Pulled away by the jeep winch at the level end.",
      "states": [
       "blocking"
      ],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M31.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         1680,
         144,
         288,
         144
        ],
        "caption": "map: fallen tree"
       },
       {
        "path": "docs/research/video/sheets/98GhruztJP0_05.png",
        "imgSize": [
         1280,
         712
        ],
        "crop": [
         640,
         0,
         320,
         178
        ],
        "caption": "demo: fallen tree and jeep"
       }
      ]
     },
     {
      "id": "towerLift",
      "name": "Rusty tower lift",
      "csName": "výtah",
      "interactive": true,
      "marker": null,
      "task": null,
      "sheet": "machines",
      "description": "Scripted lift between two lattice towers: up at cells 140-143 on plank row 41 plays vytnah.anm and puts the hero at cell 118 on the spawn ledge (row 25); down at cells 116-119 plays vytdol.anm back to cell 141 (7:0x815E). No lift slot and no visible deck: the ride is a cutscene. Same role as the mesto lift, different mechanics.",
      "states": [
       "at bottom",
       "at top"
      ],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M31.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         3288,
         696,
         120,
         288
        ],
        "caption": "map: lower tower"
       },
       {
        "path": "docs/research/gamedata/png/maps/map_M31.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         3384,
         624,
         72,
         384
        ],
        "caption": "map: blue pole at the bottom stop"
       },
       {
        "path": "docs/research/gamedata/png/maps/map_M31.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         2712,
         312,
         144,
         312
        ],
        "caption": "map: upper tower near the top stop"
       }
      ]
     },
     {
      "id": "latticePylon",
      "name": "Lattice pylon",
      "csName": null,
      "interactive": false,
      "marker": null,
      "task": null,
      "sheet": "structures",
      "description": "Steel truss towers, also used by the scripted lift; same as mesto.",
      "states": [],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M31.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         3288,
         312,
         120,
         312
        ],
        "caption": "map: lattice tower"
       }
      ]
     },
     {
      "id": "mine",
      "name": "Land mine",
      "csName": "nášlapná mina",
      "interactive": false,
      "marker": null,
      "task": null,
      "sheet": "props",
      "description": "One-shot mines at cells 126,25 (spawn ledge), 108,41 and 97,35 (rock slope). Stepping on one takes (6 - shields)/6 x 15 energy with 3 blasts (7:0x9EAE). Drawn from far pointer ds:0xDF00; picture [open].",
      "states": [
       "armed",
       "exploded"
      ],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M31.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         2952,
         504,
         144,
         120
        ],
        "caption": "map: spawn ledge mine cell 126,25"
       }
      ]
     },
     {
      "id": "bonusPickup",
      "name": "Bonus pickups",
      "csName": null,
      "interactive": true,
      "marker": null,
      "task": null,
      "sheet": "props",
      "description": "Hidden floor bonuses, one shot each: energy +90 at cell 25,31, second ammo type +350 at cell 65,37, shield +1 at cell 29,25 (seg 5).",
      "states": [
       "on ground",
       "taken"
      ],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M31.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         552,
         480,
         600,
         432
        ],
        "caption": "map: west rock ledges with the energy and shield bonus cells"
       }
      ]
     },
     {
      "id": "caveChasm",
      "name": "Cave pit and chasm",
      "csName": "propast",
      "interactive": false,
      "marker": null,
      "task": null,
      "sheet": "structures",
      "description": "Pit at cells 83-100, rows 42-50, below the stepped rock. A hero falling below its floor (engine y > 42, x > 77) dies: propast.anm, game over (3:0xE6CD).",
      "states": [
       "deadly"
      ],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M31.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         1992,
         960,
         432,
         264
        ],
        "caption": "map: cave pit"
       },
       {
        "path": "docs/research/video/sheets/98GhruztJP0_01.png",
        "imgSize": [
         1280,
         712
        ],
        "crop": [
         320,
         534,
         320,
         178
        ],
        "caption": "demo: cave with capsule"
       }
      ]
     },
     {
      "id": "caveCapsule",
      "name": "Cave capsule",
      "csName": null,
      "interactive": false,
      "marker": null,
      "task": null,
      "sheet": "machines",
      "description": "Rounded metal capsule in the cave pit at cells 86-87, rows 46-47. Decor; no code found.",
      "states": [],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M31.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         2040,
         1080,
         72,
         72
        ],
        "caption": "map: capsule"
       }
      ]
     },
     {
      "id": "rockLedges",
      "name": "Rock ledges",
      "csName": null,
      "interactive": false,
      "marker": null,
      "task": null,
      "sheet": "structures",
      "description": "Stacked rock ledges at cells 22-47, rows 20-37, one row apart: the hero climbs them with the jump (32 px rise) and drops between them (gravity).",
      "states": [],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M31.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         552,
         480,
         600,
         432
        ],
        "caption": "map: west rock ledges"
       },
       {
        "path": "docs/research/video/frames-best/DEMO_jungle_rock_ledges_turret.png",
        "imgSize": [
         2562,
         1422
        ],
        "crop": [
         128,
         180,
         2300,
         1180
        ],
        "caption": "demo: rock ledges"
       }
      ]
     },
     {
      "id": "rockSlope",
      "name": "Rock slope",
      "csName": null,
      "interactive": false,
      "marker": null,
      "task": null,
      "sheet": "structures",
      "description": "Stepped rock joining plank row 32 to row 41 at cells 92-100, rows 33-40.",
      "states": [],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M31.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         2208,
         768,
         216,
         240
        ],
        "caption": "map: rock slope"
       }
      ]
     },
     {
      "id": "girderColumn",
      "name": "Girder column",
      "csName": null,
      "interactive": false,
      "marker": null,
      "task": null,
      "sheet": "structures",
      "description": "Vertical girder at the west map edge (cell 22, rows 15-37); the west wall table entries (x 17) stop the hero here.",
      "states": [],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M31.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         528,
         360,
         24,
         552
        ],
        "caption": "map: girder column"
       }
      ]
     },
     {
      "id": "helicopterWreck",
      "name": "Helicopter wreck",
      "csName": "vrak vrtulníku",
      "interactive": false,
      "marker": null,
      "task": null,
      "sheet": "machines",
      "description": "Crashed bronze helicopter at cells 79-84, rows 27-31 on plank row 32; the crate sits under it.",
      "states": [],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M31.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         1872,
         624,
         192,
         168
        ],
        "caption": "map: helicopter wreck"
       },
       {
        "path": "docs/research/video/sheets/98GhruztJP0_02.png",
        "imgSize": [
         1280,
         712
        ],
        "crop": [
         640,
         0,
         320,
         178
        ],
        "caption": "demo: helicopter wreck"
       }
      ]
     },
     {
      "id": "carWreck",
      "name": "Car wreck",
      "csName": null,
      "interactive": false,
      "marker": null,
      "task": null,
      "sheet": "machines",
      "description": "Orange wrecked car at cells 103-109, rows 38-40, by the canister.",
      "states": [],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M31.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         2472,
         912,
         192,
         96
        ],
        "caption": "map: car wreck"
       },
       {
        "path": "docs/research/video/sheets/98GhruztJP0_01.png",
        "imgSize": [
         1280,
         712
        ],
        "crop": [
         0,
         356,
         320,
         178
        ],
        "caption": "demo: droids by the car wreck"
       }
      ]
     },
     {
      "id": "excavator",
      "name": "Red excavator",
      "csName": null,
      "interactive": false,
      "marker": null,
      "task": null,
      "sheet": "machines",
      "description": "Abandoned mining excavator over the spawn at cells 131-137, rows 22-24.",
      "states": [],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M31.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         3120,
         504,
         216,
         120
        ],
        "caption": "map: excavator"
       }
      ]
     },
     {
      "id": "fuelTank",
      "name": "Fuel tank",
      "csName": null,
      "interactive": false,
      "marker": null,
      "task": null,
      "sheet": "structures",
      "description": "Cylindrical tanks on plank row 37 (cells 57-66); same kind as mesto.",
      "states": [],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M31.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         1368,
         648,
         240,
         144
        ],
        "caption": "map: tanks"
       },
       {
        "path": "docs/research/video/sheets/98GhruztJP0_04.png",
        "imgSize": [
         1280,
         712
        ],
        "crop": [
         0,
         356,
         320,
         178
        ],
        "caption": "demo: tank by the waterfall"
       }
      ]
     },
     {
      "id": "jungleBuilding",
      "name": "Overgrown building",
      "csName": null,
      "interactive": false,
      "marker": null,
      "task": null,
      "sheet": "buildings",
      "description": "Small concrete buildings with windows on plank rows 25 and 32 (cells 37-44 and 50-57).",
      "states": [],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M31.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         1176,
         648,
         216,
         144
        ],
        "caption": "map: building on row 32"
       },
       {
        "path": "docs/research/gamedata/png/maps/map_M31.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         888,
         360,
         192,
         144
        ],
        "caption": "map: building on row 25"
       }
      ]
     },
     {
      "id": "chainFence",
      "name": "Fence",
      "csName": null,
      "interactive": false,
      "marker": null,
      "task": null,
      "sheet": "structures",
      "description": "Fence beside the door building on plank row 41; same as mesto.",
      "states": [],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M31.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         2592,
         912,
         240,
         96
        ],
        "caption": "map: fence"
       }
      ]
     },
     {
      "id": "skyBackground",
      "name": "Parallax sky",
      "csName": null,
      "interactive": false,
      "marker": null,
      "task": null,
      "sheet": "buildings",
      "description": "Jungle backdrop from LEV3.GRA frame 0, scrolls slower than the playfield.",
      "states": [],
      "refs": [
       {
        "path": "docs/research/gamedata/png/LEV3_f0.png",
        "imgSize": [
         320,
         200
        ],
        "crop": [
         0,
         0,
         320,
         170
        ],
        "caption": "LEV3.GRA frame 0"
       }
      ]
     }
    ]
   }
  },
  "mesto": {
   "order": 1,
   "name": "City",
   "objects": {
    "status": "draft",
    "source": "docs/research/reports/08-video-level1.md",
    "units": "original pixels, 1 tile = 24",
    "objects": [
     {
      "id": "dyingRebel",
      "name": "Dying rebel",
      "csName": "umírající rebel",
      "interactive": true,
      "marker": 1,
      "task": "talkRebel",
      "sheet": "props",
      "description": "Human in blue trousers lying on the street walkway (about 1.5 x 0.7 tiles), drawn as a sprite (not in the map tiles). Talk with ENTER plays a cutscene; afterwards he stays lying there as a corpse.",
      "states": [
       "dying (talk available)",
       "dead after talk"
      ],
      "refs": [
       {
        "path": "docs/research/video/f5r7/0121.png",
        "imgSize": [
         320,
         200
        ],
        "crop": [
         195,
         132,
         109,
         40
        ],
        "caption": "rebel lying on street, right of rubble"
       },
       {
        "path": "docs/research/video/f5r7/0086.png",
        "imgSize": [
         320,
         200
        ],
        "crop": [
         230,
         130,
         74,
         40
        ],
        "caption": "same body seen from the lift area"
       }
      ]
     },
     {
      "id": "crowbar",
      "name": "Crowbar pickup",
      "csName": "Páčidlo",
      "interactive": true,
      "marker": 2,
      "task": "takeCrowbar",
      "sheet": "props",
      "description": "Item spot in front of the chain-link fence on the floor-38 ledge (map cell 25,43). No ground sprite is visible in footage before pickup; the pickup plays a short clip and prints NAŠEL JSI PÁČIDLO.",
      "states": [
       "on ground",
       "taken"
      ],
      "refs": [
       {
        "path": "docs/research/video/frames-best/L1_t0330_found_crowbar_message.png",
        "imgSize": [
         960,
         600
        ],
        "crop": [
         420,
         340,
         500,
         170
        ],
        "caption": "fence at crowbar spot, message after pickup"
       },
       {
        "path": "docs/research/gamedata/png/maps/map_M11.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         528,
         984,
         216,
         96
        ],
        "caption": "map: fence ledge around cell 25,43"
       }
      ]
     },
     {
      "id": "wireBox",
      "name": "Electrical distribution box (wire source)",
      "csName": "elektrický rozvod / rozvaděč",
      "interactive": true,
      "marker": 3,
      "task": "pullWires",
      "sheet": "machines",
      "description": "Small square dark-green wall panel with a light frame (about 1 x 1 tile) on the concrete wall under the colonnade building marked 05. After the wire is ripped out the panel shows a lightning icon. The same green lightning panel tile reappears beside card door 17.",
      "states": [
       "intact (wires inside)",
       "wires ripped out (lightning icon)"
      ],
      "refs": [
       {
        "path": "docs/research/video/frames-best/L1_t0405_green_wall_panel_wire_cutscene_trigger.png",
        "imgSize": [
         960,
         600
        ],
        "crop": [
         330,
         320,
         150,
         150
        ],
        "caption": "green panel before cutscene"
       },
       {
        "path": "docs/research/video/f5r7/0134.png",
        "imgSize": [
         320,
         200
        ],
        "crop": [
         105,
         105,
         55,
         45
        ],
        "caption": "panel intact"
       },
       {
        "path": "docs/research/video/f5r7/0136.png",
        "imgSize": [
         320,
         200
        ],
        "crop": [
         35,
         105,
         55,
         45
        ],
        "caption": "panel after wire taken, lightning icon"
       }
      ]
     },
     {
      "id": "switchboard",
      "name": "Second switchboard (metro)",
      "csName": "druhý rozvaděč",
      "interactive": true,
      "marker": 4,
      "task": "wireSwitchboard",
      "sheet": "machines",
      "description": "Dark-green wall panel (about 1 x 1 tile, same style as the wire box) on the dark pillar between two metro carriages; the player stands in front of it, so it is partly hidden in every frame. Wiring it powers the metro (tunnel lights) and unlocks the train door.",
      "states": [
       "dead (no wire)",
       "repaired (wired, metro lit)"
      ],
      "refs": [
       {
        "path": "docs/research/video/frames-best/L1_t0436_subway_train_carriage_player_opens_door.png",
        "imgSize": [
         960,
         600
        ],
        "crop": [
         420,
         280,
         160,
         230
        ],
        "caption": "green panel on pillar behind player"
       },
       {
        "path": "docs/research/video/f5r7/0142.png",
        "imgSize": [
         320,
         200
        ],
        "crop": [
         120,
         95,
         90,
         75
        ],
        "caption": "pillar between carriages"
       }
      ]
     },
     {
      "id": "trainDoor",
      "name": "Metro train door",
      "csName": "dveře od soupravy",
      "interactive": true,
      "marker": 5,
      "task": "openTrainDoor",
      "sheet": "machines",
      "description": "Door at the left end of the bloodied subway carriage (map cells 60-61, rows 67-69, about 2 x 3 tiles). Locked until the switchboard is wired; the crowbar pries it open (METROPAC clip), leaving a dark doorway into the train.",
      "states": [
       "closed",
       "prying (crowbar clip)",
       "open"
      ],
      "refs": [
       {
        "path": "docs/research/video/f5r7/0145.png",
        "imgSize": [
         320,
         200
        ],
        "crop": [
         120,
         95,
         150,
         75
        ],
        "caption": "carriage door closed"
       },
       {
        "path": "docs/research/video/f5r7/0148.png",
        "imgSize": [
         320,
         200
        ],
        "crop": [
         120,
         95,
         150,
         75
        ],
        "caption": "door open, dark doorway"
       },
       {
        "path": "docs/research/gamedata/png/METROPAC/f061.png",
        "imgSize": [
         320,
         200
        ],
        "crop": [
         15,
         15,
         290,
         180
        ],
        "caption": "cutscene: door edge pried open"
       }
      ]
     },
     {
      "id": "tapValveWheel",
      "name": "Pipe valve wheel (tap handle source)",
      "csName": "kohout uzávěru",
      "interactive": true,
      "marker": 6,
      "task": "takeTapHandle",
      "sheet": "machines",
      "description": "Small round handwheel with a cross (about 0.5 tile) on the vertical leg of a large L-shaped grey tunnel pipe near the E-blaster spot (map col ~43, row 73). Messages KOHOUTEK JSI URVAL / ODŠROUBOVAL JSI KOHOUT suggest the wheel is unscrewed and carried; which pipe is marker 6 is unclear (see waterPipe).",
      "states": [
       "handle on pipe",
       "handle removed"
      ],
      "refs": [
       {
        "path": "docs/research/video/f5r7/0157.png",
        "imgSize": [
         320,
         200
        ],
        "crop": [
         190,
         60,
         114,
         115
        ],
        "caption": "L pipe with handwheel"
       },
       {
        "path": "docs/research/video/f5r7/0158.png",
        "imgSize": [
         320,
         200
        ],
        "crop": [
         190,
         60,
         114,
         115
        ],
        "caption": "same, closer to player"
       }
      ]
     },
     {
      "id": "waterPipe",
      "name": "Leaking water pipe / shut-off",
      "csName": "uzávěr vody",
      "interactive": true,
      "marker": 6,
      "task": "takeTapHandle",
      "sheet": "machines",
      "description": "Rusty vertical pipe coming out of the tunnel ceiling at map cell 20, rows 72-74, pouring a pale yellow-green stream to the floor; a broken ceiling pipe with a rust hole sits beside it. Closing the valve (KOHOUTEM JSI UZAVŘEL PROUDÍCÍ VODU) swaps the stream tiles for a plain pipe in map M13.",
      "states": [
       "water flowing",
       "water shut off"
      ],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M11.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         408,
         1680,
         168,
         144
        ],
        "caption": "map M11: stream flowing"
       },
       {
        "path": "docs/research/gamedata/png/maps/map_M13.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         408,
         1680,
         168,
         144
        ],
        "caption": "map M13: water off"
       },
       {
        "path": "docs/research/video/f5r7/0160.png",
        "imgSize": [
         320,
         200
        ],
        "crop": [
         15,
         40,
         289,
         140
        ],
        "caption": "tunnel pipe end, closed-water message"
       }
      ]
     },
     {
      "id": "corpse",
      "name": "Corpse with card and holo-plan",
      "csName": "mrtvola / mrtvé tělo",
      "interactive": true,
      "marker": 7,
      "task": "searchCorpse",
      "sheet": "props",
      "description": "Dead human in blue lying beside a boulder rubble pile in the tunnel side room (map cell 16,69), about 2 x 0.5 tiles. Player kneels to search (prompt MRTVÉ TĚLO, kneel clip); body stays after looting.",
      "states": [
       "unsearched",
       "searched"
      ],
      "refs": [
       {
        "path": "docs/research/video/frames-best/L1_t0500_crouch_search_dead_body_card_holoplan.png",
        "imgSize": [
         960,
         600
        ],
        "crop": [
         360,
         330,
         520,
         180
        ],
        "caption": "player kneeling at body by rubble"
       },
       {
        "path": "docs/research/video/f5r7/0168.png",
        "imgSize": [
         320,
         200
        ],
        "crop": [
         190,
         115,
         114,
         55
        ],
        "caption": "body by rubble"
       }
      ]
     },
     {
      "id": "eBlaster",
      "name": "E-Blaster pickup",
      "csName": "E-BLASTER",
      "interactive": true,
      "marker": 8,
      "task": "takeEBlaster",
      "sheet": "props",
      "description": "Weapon spot on the metro tunnel floor (map cell 40,74). No ground sprite seen; when near, a yellow 'E-BLASTER' label with an icon appears top right of the playfield, then NAŠEL JSI E-BLASTER.",
      "states": [
       "on ground (label shown when near)",
       "taken"
      ],
      "refs": [
       {
        "path": "docs/research/video/f5r7/0157.png",
        "imgSize": [
         320,
         200
        ],
        "crop": [
         15,
         24,
         289,
         150
        ],
        "caption": "tunnel with E-BLASTER hint label"
       }
      ]
     },
     {
      "id": "barDoor",
      "name": "Bar building and NPC door",
      "csName": "bar",
      "interactive": true,
      "marker": 9,
      "task": "tradeHoloPlan",
      "sheet": "buildings",
      "description": "Ruined grey concrete building with a jagged broken roof line, two fluted pillars and a recessed blue-grey door with a small red-white sign above it (door about 1 x 3 tiles, building about 6 x 4). Using it opens the NPC face dialogue; used twice (tradeHoloPlan, tradeShipPart).",
      "states": [
       "closed",
       "talking (NPC face cutscene)"
      ],
      "refs": [
       {
        "path": "docs/research/video/f5r7/0198.png",
        "imgSize": [
         320,
         200
        ],
        "crop": [
         150,
         55,
         154,
         115
        ],
        "caption": "bar facade and door"
       },
       {
        "path": "docs/research/video/f5r7/0195.png",
        "imgSize": [
         320,
         200
        ],
        "crop": [
         160,
         60,
         144,
         110
        ],
        "caption": "door between pillars"
       },
       {
        "path": "docs/research/video/sheets/KkPeKkoohvk_11.png",
        "imgSize": [
         1280,
         720
        ],
        "crop": [
         980,
         25,
         280,
         150
        ],
        "caption": "video B: bar building"
       }
      ]
     },
     {
      "id": "crashedShip",
      "name": "Crashed ship with hull cover",
      "csName": "loď / kryt na plášti",
      "interactive": true,
      "marker": 10,
      "task": "getShipPart",
      "sheet": "buildings",
      "description": "Grey-olive wedge-shaped landing craft with a dark cockpit and landing struts, sitting on a hazard-striped landing pad (map cells 11-19, rows 38-41, about 8 x 3 tiles). Shooting the cover by the nozzles drops the ship part (SOUČÁSTKA) to the ground.",
      "states": [
       "cover closed",
       "cover shot open",
       "part taken"
      ],
      "refs": [
       {
        "path": "docs/research/video/sheets/KkPeKkoohvk_10.png",
        "imgSize": [
         1280,
         720
        ],
        "crop": [
         665,
         60,
         275,
         115
        ],
        "caption": "video B: ship on pad, player in front"
       },
       {
        "path": "docs/research/video/f5r7/0097.png",
        "imgSize": [
         320,
         200
        ],
        "crop": [
         150,
         95,
         154,
         75
        ],
        "caption": "after shooting cover (message)"
       },
       {
        "path": "docs/research/gamedata/png/maps/map_M11.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         216,
         864,
         288,
         168
        ],
        "caption": "map: ship and pad"
       }
      ]
     },
     {
      "id": "shipPart",
      "name": "Ship part pickup",
      "csName": "Součástka",
      "interactive": true,
      "marker": 10,
      "task": "getShipPart",
      "sheet": "props",
      "description": "Part that falls out of the ship hull; picked from the ground (ZE ZEMĚ JSI SEBRAL SOUČÁSTKU Z RAKETY). No ground sprite identified. Look follows the inventory preview `GRAFIKA/PRSOUC.GRA`: ribbed drum between two end plates on a base plate, orange wires arcing from the drum to one end plate.",
      "states": [
       "inside hull",
       "on ground",
       "taken"
      ],
      "refs": [
       {
        "path": "docs/research/video/frames-best/L1_t0296_lift_scaffold_crate_item_message.png",
        "imgSize": [
         960,
         600
        ],
        "crop": [
         45,
         75,
         560,
         40
        ],
        "caption": "pickup message"
       }
      ]
     },
     {
      "id": "plasmaBarrier",
      "name": "Plasma fire barrier",
      "csName": "plazma / plazmový oheň",
      "interactive": true,
      "marker": 11,
      "task": "unlockPlasma",
      "sheet": "machines",
      "description": "Column of tall orange-yellow flame tongues, 1 tile wide and 2 tiles tall, standing on the walkway at map cell 103, rows 42-43, between a ruined wall and a grey factory block with ribbed cylinders. Blocks the way to the controller; removed in map M15. Likely animated (flicker) in game, not confirmed.",
      "states": [
       "burning (flicker)",
       "off"
      ],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M11.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         2376,
         912,
         264,
         144
        ],
        "caption": "map M11: flames"
       },
       {
        "path": "docs/research/gamedata/png/maps/map_M15.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         2376,
         912,
         264,
         144
        ],
        "caption": "map M15: flames gone"
       }
      ]
     },
     {
      "id": "codeLock",
      "name": "Code lock",
      "csName": "kódový zámek",
      "interactive": true,
      "marker": 11,
      "task": "unlockPlasma",
      "sheet": "machines",
      "description": "Keypad lock right next to the plasma; decoder removes the password. Not identified in map or footage - candidates are the reddish-brown wall box left of the flames (cells 99-100, row 41) or the small panel on the factory block (cell 115, row 42). The X*.GRA keypad close-ups may be its UI.",
      "states": [
       "locked",
       "decoded"
      ],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M11.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         2376,
         912,
         432,
         192
        ],
        "caption": "map: plasma surroundings"
       }
      ]
     },
     {
      "id": "controller",
      "name": "Lift controller pickup",
      "csName": "Ovladač",
      "interactive": true,
      "marker": 12,
      "task": "takeController",
      "sheet": "props",
      "description": "Item spot at map cell 112,50 on floor 45, by a small green machine and fence, left of a heap of fallen girders. No item sprite in the map; never reached in footage. Look follows the inventory preview `GRAFIKA/PROVL.GRA`: grey slab with a red block and a row of white keys.",
      "states": [
       "on ground",
       "taken"
      ],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M11.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         2592,
         1104,
         288,
         144
        ],
        "caption": "map: controller area and wreckage"
       }
      ]
     },
     {
      "id": "damagedLift",
      "name": "Damaged lift",
      "csName": "poškozený výtah",
      "interactive": true,
      "marker": 13,
      "task": "repairLift",
      "sheet": "machines",
      "description": "Standard lift shaft by a lattice pylon (map col 56, floors 31-38) whose control panel is broken: OVLÁDACÍ PANEL VÝTAHU JE POŠKOZEN; walkthrough calls it a snowy/grainy screen. Using the controller on it opens floors 24, 17 and 10.",
      "note": "The level draws the liftPanel asset for this object (state 1 damaged, 0 repaired), since the map lift draws the lift itself.",
      "states": [
       "broken (grainy screen)",
       "repaired",
       "moving"
      ],
      "refs": [
       {
        "path": "docs/research/video/sheets/KkPeKkoohvk_10.png",
        "imgSize": [
         1280,
         720
        ],
        "crop": [
         975,
         560,
         290,
         155
        ],
        "caption": "video B: damaged-panel message at lift"
       },
       {
        "path": "docs/research/gamedata/png/maps/map_M11.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         1296,
         696,
         120,
         216
        ],
        "caption": "map: lift column 56"
       }
      ]
     },
     {
      "id": "acidTank",
      "name": "Acid tank",
      "csName": "cisterna s kyselinou",
      "interactive": true,
      "marker": 14,
      "task": "acidGuard",
      "sheet": "machines",
      "description": "Tall corrugated cylindrical silo with a conical grey roof, stencilled ACID, on stubby stone legs (map cells 113-117, rows 18-23, about 4 x 5 tiles) with an outlet pipe toward the floor below. The tap handle fitted to the pipe pours acid on the acid-only guard one floor down; in M16 a handwheel shows on the pipe and the guard tiles are wreckage.",
      "states": [
       "idle (no tap)",
       "tap fitted",
       "spilling acid",
       "guard destroyed (wreck below)"
      ],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M11.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         2640,
         384,
         264,
         360
        ],
        "caption": "map M11: tank and guard floor"
       },
       {
        "path": "docs/research/gamedata/png/maps/map_M16.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         2640,
         384,
         264,
         360
        ],
        "caption": "map M16: tap fitted, guard wreck"
       }
      ]
     },
     {
      "id": "acidGuard",
      "name": "Acid guard",
      "csName": "strážce",
      "interactive": false,
      "marker": 14,
      "task": "useAcidTank",
      "sheet": "enemies",
      "description": "Guard robot that normal weapons cannot kill, standing on floor 30 at map cells 109-111, rows 27-29 (drawn as map tiles, not a sprite). It blocks the way to the lift up to the crane level. Acid from the tank one floor up destroys it; map variant M16 swaps it for wreckage. Our look is a compact walker built on the flyer hull with the original stepped red visor (spikes/enemy-design).",
      "states": [
       "alive (blocks)",
       "wreck"
      ],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M11.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         2592,
         600,
         144,
         144
        ],
        "caption": "map M11: guard tiles"
       },
       {
        "path": "docs/research/gamedata/png/maps/map_M16.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         2664,
         600,
         144,
         144
        ],
        "caption": "map M16: guard wreck"
       }
      ]
     },
     {
      "id": "craneKey",
      "name": "Crane key pickup",
      "csName": "klíček / Klíč",
      "interactive": true,
      "marker": 15,
      "task": "shootGuard",
      "sheet": "props",
      "description": "Small key lying behind the shoot-only guard on the top floor (engine item 15,10, map ~cell 21, row 15). Not seen in footage or map tiles. Look follows the inventory preview `GRAFIKA/PRKLIC.GRA`: silver key with a round bow.",
      "states": [
       "guarded",
       "on ground",
       "taken"
      ],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M11.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         408,
         264,
         264,
         144
        ],
        "caption": "map: top floor around guard and key"
       }
      ]
     },
     {
      "id": "wires",
      "name": "Wires",
      "csName": "Dráty",
      "interactive": true,
      "marker": 3,
      "task": "pullWires",
      "sheet": "props",
      "description": "One orange insulated wire with bare silver ends, ripped out of the electrical distribution box (marker 3); carried to the metro switchboard. Inventory item only, no level sprite; drawn after the inventory preview `GRAFIKA/PRDRAT.GRA`.",
      "states": [
       "on ground",
       "taken"
      ],
      "refs": []
     },
     {
      "id": "tapHandle",
      "name": "Tap handle",
      "csName": "Kohout uzávěru",
      "interactive": true,
      "marker": 6,
      "task": "takeTapHandle",
      "sheet": "props",
      "description": "Chrome handwheel with four spokes and a hub, unscrewed from the tunnel pipe (marker 6); used against the acid guard. Inventory item only, no level sprite; drawn after the inventory preview `GRAFIKA/PRKOH.GRA`.",
      "states": [
       "on ground",
       "taken"
      ],
      "refs": []
     },
     {
      "id": "card",
      "name": "Card",
      "csName": "Karta",
      "interactive": true,
      "marker": 7,
      "task": "searchCorpse",
      "sheet": "props",
      "description": "Grey access card with an orange L band, gold contact pads and a barcode, found on the corpse in the train (marker 7); opens card door 17. Inventory item only, no level sprite; drawn after the inventory preview `GRAFIKA/PRKART.GRA`.",
      "states": [
       "on ground",
       "taken"
      ],
      "refs": []
     },
     {
      "id": "holoPlan",
      "name": "Holo plan",
      "csName": "Holog. plán",
      "interactive": true,
      "marker": 7,
      "task": "searchCorpse",
      "sheet": "props",
      "description": "Brown box projector with a white top panel, blue rim and slotted front, found on the corpse in the train (marker 7); traded at marker 9. Inventory item only, no level sprite; drawn after the inventory preview `GRAFIKA/PRHOLO.GRA`.",
      "states": [
       "on ground",
       "taken"
      ],
      "refs": []
     },
     {
      "id": "shipPlan",
      "name": "Ship plan",
      "csName": "Nákres",
      "interactive": true,
      "marker": 9,
      "task": "tradeHoloPlan",
      "sheet": "props",
      "description": "White sheet with technical drawings of the ship, traded for the holo plan (marker 9). Inventory item only, no level sprite; drawn after the inventory preview `GRAFIKA/PRPLAN.GRA`.",
      "states": [
       "on ground",
       "taken"
      ],
      "refs": []
     },
     {
      "id": "decoder",
      "name": "Decoder",
      "csName": "Dekodér",
      "interactive": true,
      "marker": 9,
      "task": "tradeShipPart",
      "sheet": "props",
      "description": "Grey handheld device with a red display, ridged keys and green and orange lights, traded for the ship part (marker 9); unlocks the plasma barrier. Inventory item only, no level sprite; drawn after the inventory preview `GRAFIKA/PRDEKOD.GRA`.",
      "states": [
       "on ground",
       "taken"
      ],
      "refs": []
     },
     {
      "id": "crane",
      "name": "Crane beam",
      "csName": "jeřáb",
      "interactive": true,
      "marker": 16,
      "task": "repairCrane",
      "sheet": "machines",
      "description": "Long green riveted I-beam with orange clamp bands (about 7 x 1 tiles, map cells 23-31, row 13) hung from a single chain by a triangular bridle; a winch block and a small control box sit nearby. Repairing it with the key lets the player cross = level end.",
      "states": [
       "broken / idle",
       "repaired",
       "moving (crossing)"
      ],
      "refs": [
       {
        "path": "docs/research/images/steam-screens/s0.jpg",
        "imgSize": [
         1920,
         1080
        ],
        "crop": [
         95,
         140,
         1060,
         470
        ],
        "caption": "Steam shot: hanging beam on chain"
       },
       {
        "path": "docs/research/gamedata/png/maps/map_M11.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         456,
         0,
         312,
         408
        ],
        "caption": "map: chain, beam and stairs"
       }
      ]
     },
     {
      "id": "cardDoor",
      "name": "Card door 17",
      "csName": "dveře (karta)",
      "interactive": true,
      "marker": 17,
      "task": "openDoor",
      "sheet": "machines",
      "description": "Narrow grey metal door section with cyan pipes, 1 tile wide and 3 tall, at map cell 49, rows 20-22, between green lightning-icon card panels (same tile as the wire box). Map M14 replaces these cells (door opened). Never seen in footage.",
      "states": [
       "locked",
       "open"
      ],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M11.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         1104,
         432,
         192,
         144
        ],
        "caption": "map M11: door closed"
       },
       {
        "path": "docs/research/gamedata/png/maps/map_M14.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         1104,
         432,
         192,
         144
        ],
        "caption": "map M14: door open"
       }
      ]
     },
     {
      "id": "lift",
      "name": "Lift platform and shaft",
      "csName": "výtah",
      "interactive": true,
      "marker": null,
      "task": null,
      "sheet": "machines",
      "description": "Narrow vertical shaft with a toothed rack rail between two guide rails; the car is a small railed platform with a hazard-striped base (about 2 x 1 tiles plus railing). In the map the shaft shows as a dotted rung column. Player cannot hide while riding.",
      "states": [
       "idle at floor",
       "moving up",
       "moving down"
      ],
      "refs": [
       {
        "path": "docs/research/video/frames-best/L1_t0296_lift_scaffold_crate_item_message.png",
        "imgSize": [
         960,
         600
        ],
        "crop": [
         320,
         80,
         260,
         500
        ],
        "caption": "riding lift in brick shaft"
       },
       {
        "path": "docs/research/video/frames-best/L1_t0261_hide_pose_enemy_adjacent_wall_hole_scene.png",
        "imgSize": [
         960,
         600
        ],
        "crop": [
         570,
         75,
         250,
         450
        ],
        "caption": "street lift with railing"
       },
       {
        "path": "docs/research/video/f5r7/0154.png",
        "imgSize": [
         320,
         200
        ],
        "crop": [
         110,
         24,
         100,
         168
        ],
        "caption": "tunnel lift between stacked corridors"
       }
      ]
     },
     {
      "id": "liftPanel",
      "name": "Lift call / control box",
      "csName": "ovládací panel výtahu",
      "interactive": true,
      "marker": null,
      "task": null,
      "sheet": "machines",
      "description": "Small dark box with a yellow-orange triangle or arrow sign (about 1 x 0.5 tiles) on a post or wall beside lifts; a taller post version stands at street lifts. Function inferred (the damaged lift message names a lift control panel).",
      "states": [
       "normal",
       "damaged (lift 13 only)"
      ],
      "refs": [
       {
        "path": "docs/research/video/f5r7/0183.png",
        "imgSize": [
         320,
         200
        ],
        "crop": [
         180,
         110,
         124,
         60
        ],
        "caption": "low box and tall post at street lift"
       },
       {
        "path": "docs/research/video/frames-best/L1_t0500_crouch_search_dead_body_card_holoplan.png",
        "imgSize": [
         960,
         600
        ],
        "crop": [
         200,
         410,
         120,
         80
        ],
        "caption": "orange panel by tunnel lift"
       }
      ]
     },
     {
      "id": "barrel",
      "name": "Steel barrel",
      "csName": "barel",
      "interactive": true,
      "marker": null,
      "task": null,
      "sheet": "props",
      "description": "Ribbed grey steel drum, about 1 x 1.2 tiles, at the street start. Seen as hide cover; engine has an explosive-barrel message (ZNIČIL JSI BAREL S VÝBUŠNINOU) but no barrel was shot in level 1 footage. Whether hiding needs a prop is unknown.",
      "states": [
       "normal",
       "player hiding beside",
       "destroyed (unconfirmed for level 1)"
      ],
      "refs": [
       {
        "path": "docs/research/video/frames-best/L1_t0226_street_start_barrel_hud.png",
        "imgSize": [
         960,
         600
        ],
        "crop": [
         410,
         390,
         110,
         120
        ],
        "caption": "barrel at start"
       },
       {
        "path": "docs/research/video/frames-best/L1_t0231_hide_dark_sprite_behind_barrel_chrome_enemy_near.png",
        "imgSize": [
         960,
         600
        ],
        "crop": [
         410,
         350,
         270,
         160
        ],
        "caption": "player hiding at barrel"
       }
      ]
     },
     {
      "id": "crate",
      "name": "Slatted crate / small machine box",
      "csName": "bedna",
      "interactive": true,
      "marker": null,
      "task": null,
      "sheet": "props",
      "description": "Low brown box with vertical slats or a window grille (about 1-1.5 x 1 tiles) on streets and lift platforms; sizes vary (merged). Seen as hide cover. Looks like the small mid-ground huts at reduced size, so it may be a background tile rather than a solid prop - unsure.",
      "states": [
       "normal",
       "player hiding beside"
      ],
      "refs": [
       {
        "path": "docs/research/video/f5r7/0183.png",
        "imgSize": [
         320,
         200
        ],
        "crop": [
         115,
         130,
         60,
         40
        ],
        "caption": "slatted crate on street"
       },
       {
        "path": "docs/research/video/f5r7/0132.png",
        "imgSize": [
         320,
         200
        ],
        "crop": [
         165,
         130,
         50,
         40
        ],
        "caption": "crate by colonnade"
       }
      ]
     },
     {
      "id": "skyBackground",
      "name": "Parallax sky and skyline",
      "csName": null,
      "interactive": false,
      "marker": null,
      "task": null,
      "sheet": "buildings",
      "description": "Full-screen backdrop: rust-red and brown dithered clouds over black ruined-city silhouettes (antenna towers, block houses with lit windows). Scrolls much slower than the playfield. Frame 1 adds white lightning bolts and brighter clouds. The orange glowing strip below row 170 is probably outside the 169 px playfield.",
      "states": [
       "normal",
       "lightning flash"
      ],
      "refs": [
       {
        "path": "docs/research/gamedata/png/lev1/f000.png",
        "imgSize": [
         320,
         200
        ],
        "crop": [
         0,
         0,
         320,
         170
        ],
        "caption": "background frame 0"
       },
       {
        "path": "docs/research/gamedata/png/lev1/f001.png",
        "imgSize": [
         320,
         200
        ],
        "crop": [
         0,
         0,
         320,
         170
        ],
        "caption": "lightning variant"
       }
      ]
     },
     {
      "id": "midgroundRuins",
      "name": "Mid-ground ruined huts",
      "csName": null,
      "interactive": false,
      "marker": null,
      "task": null,
      "sheet": "buildings",
      "description": "Small dark brown block houses with window grids and broken posts standing just behind the walkway (1-3 tiles), drawn as map tiles in front of the sky.",
      "states": [],
      "refs": [
       {
        "path": "docs/research/video/frames-best/L1_t0226_street_start_barrel_hud.png",
        "imgSize": [
         960,
         600
        ],
        "crop": [
         540,
         400,
         375,
         100
        ],
        "caption": "huts right of the start"
       }
      ]
     },
     {
      "id": "streetWalkway",
      "name": "Street walkway floor",
      "csName": null,
      "interactive": false,
      "marker": null,
      "task": null,
      "sheet": "structures",
      "description": "Riveted rust-brown and olive metal walkway, 1 tile thick, with a row of rounded plates and small hanging hooks; every floor of the level is this plank, 7 tiles apart.",
      "states": [],
      "refs": [
       {
        "path": "docs/research/video/frames-best/L1_t0226_street_start_barrel_hud.png",
        "imgSize": [
         960,
         600
        ],
        "crop": [
         45,
         495,
         870,
         85
        ],
        "caption": "walkway"
       }
      ]
     },
     {
      "id": "hazardPlate",
      "name": "Hazard-striped plate with beacon lamps",
      "csName": null,
      "interactive": false,
      "marker": null,
      "task": null,
      "sheet": "structures",
      "description": "Raised floor plate with yellow-black stripes about 8 tiles wide, flanked by small yellow dome lamps on coil-spring posts. Under the start and as the ship landing pad; purpose unclear (landing pad or hatch).",
      "states": [],
      "refs": [
       {
        "path": "docs/research/video/f5r7/0176.png",
        "imgSize": [
         320,
         200
        ],
        "crop": [
         60,
         145,
         235,
         47
        ],
        "caption": "plate with lamps at both ends"
       },
       {
        "path": "docs/research/video/frames-best/L1_t0226_street_start_barrel_hud.png",
        "imgSize": [
         960,
         600
        ],
        "crop": [
         720,
         460,
         195,
         115
        ],
        "caption": "plate and lamp at start"
       }
      ]
     },
     {
      "id": "chainFence",
      "name": "Chain-link fence",
      "csName": null,
      "interactive": false,
      "marker": null,
      "task": null,
      "sheet": "structures",
      "description": "Silver diagonal-mesh fence panels about 2 tiles tall between thin steel posts, often with a small grey sign plate; some panels torn. A variant carries a TOXIC!! sign (map cells 101-103, row 49).",
      "states": [],
      "refs": [
       {
        "path": "docs/research/video/frames-best/L1_t0342_drone_fire_hit_swirl_on_player.png",
        "imgSize": [
         960,
         600
        ],
        "crop": [
         260,
         350,
         520,
         155
        ],
        "caption": "fence panels with sign plate"
       },
       {
        "path": "docs/research/video/frames-best/L1_t0226_street_start_barrel_hud.png",
        "imgSize": [
         960,
         600
        ],
        "crop": [
         45,
         350,
         385,
         155
        ],
        "caption": "torn fence at start"
       },
       {
        "path": "docs/research/gamedata/png/maps/map_M11.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         2400,
         1160,
         180,
         70
        ],
        "caption": "TOXIC sign fence"
       }
      ]
     },
     {
      "id": "latticePylon",
      "name": "Lattice pylon",
      "csName": null,
      "interactive": false,
      "marker": null,
      "task": null,
      "sheet": "structures",
      "description": "Vertical steel truss column with zigzag bracing and riveted flanges, 1 tile wide, floor to ceiling; some stand on a stepped concrete plinth.",
      "states": [],
      "refs": [
       {
        "path": "docs/research/video/frames-best/L1_t0372_fuel_tank_radiation_sign.png",
        "imgSize": [
         960,
         600
        ],
        "crop": [
         100,
         75,
         95,
         430
        ],
        "caption": "pylon"
       },
       {
        "path": "docs/research/video/f5r7/0183.png",
        "imgSize": [
         320,
         200
        ],
        "crop": [
         70,
         24,
         60,
         148
        ],
        "caption": "pylon on concrete plinth"
       }
      ]
     },
     {
      "id": "girderBridge",
      "name": "Girder bridge",
      "csName": null,
      "interactive": false,
      "marker": null,
      "task": null,
      "sheet": "structures",
      "description": "Horizontal riveted truss beam with X bracing and square gusset plates, 1 tile tall, spanning overhead between pylons and pipe columns.",
      "states": [],
      "refs": [
       {
        "path": "docs/research/video/frames-best/L1_t0342_drone_fire_hit_swirl_on_player.png",
        "imgSize": [
         960,
         600
        ],
        "crop": [
         45,
         200,
         810,
         95
        ],
        "caption": "girder bridge"
       },
       {
        "path": "docs/research/video/frames-best/L1_t0608_gantry_building_drone_missile_hit.png",
        "imgSize": [
         960,
         600
        ],
        "crop": [
         45,
         130,
         620,
         90
        ],
        "caption": "girder above gantry building"
       }
      ]
     },
     {
      "id": "pipeColumn",
      "name": "Vertical pipe column",
      "csName": null,
      "interactive": false,
      "marker": null,
      "task": null,
      "sheet": "structures",
      "description": "Thick grey-bronze vertical pipe with ring joints, 1 tile wide and several tiles tall; on the top floor the same pipes form tall smokestacks.",
      "states": [],
      "refs": [
       {
        "path": "docs/research/video/frames-best/L1_t0342_drone_fire_hit_swirl_on_player.png",
        "imgSize": [
         960,
         600
        ],
        "crop": [
         545,
         75,
         95,
         430
        ],
        "caption": "pipe column"
       },
       {
        "path": "docs/research/gamedata/png/maps/map_M11.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         2040,
         0,
         1008,
         432
        ],
        "caption": "map: top-floor smokestacks, tanks, trusses"
       }
      ]
     },
     {
      "id": "pipeBend",
      "name": "Large L-shaped pipe",
      "csName": null,
      "interactive": false,
      "marker": null,
      "task": null,
      "sheet": "structures",
      "description": "Big grey pipe running horizontally then bending down to the floor (about 5 x 5 tiles), on the street east of the fuel tank; similar L pipes run along the metro tunnel.",
      "states": [],
      "refs": [
       {
        "path": "docs/research/video/f5r7/0129.png",
        "imgSize": [
         320,
         200
        ],
        "crop": [
         160,
         40,
         144,
         132
        ],
        "caption": "street pipe bend and sign post"
       }
      ]
     },
     {
      "id": "fuelTank",
      "name": "Fuel tank",
      "csName": null,
      "interactive": false,
      "marker": null,
      "task": null,
      "sheet": "structures",
      "description": "Horizontal grey cylindrical tank with domed ends and a yellow radiation trefoil on the end, about 4 x 2 tiles, raised on the street. Longer twin tanks sit on the top floor.",
      "states": [],
      "refs": [
       {
        "path": "docs/research/video/f5r7/0126.png",
        "imgSize": [
         320,
         200
        ],
        "crop": [
         200,
         85,
         104,
         75
        ],
        "caption": "tank from the left"
       },
       {
        "path": "docs/research/video/f5r7/0129.png",
        "imgSize": [
         320,
         200
        ],
        "crop": [
         15,
         85,
         120,
         60
        ],
        "caption": "tank end with trefoil"
       }
      ]
     },
     {
      "id": "windowBuilding",
      "name": "Concrete building with barred windows",
      "csName": null,
      "interactive": false,
      "marker": null,
      "task": null,
      "sheet": "buildings",
      "description": "Flat-roofed grey stucco block (about 7 x 4 tiles) with three large barred windows, the middle one shot through; low concrete wall beside it.",
      "states": [],
      "refs": [
       {
        "path": "docs/research/video/frames-best/L1_t0372_fuel_tank_radiation_sign.png",
        "imgSize": [
         960,
         600
        ],
        "crop": [
         180,
         205,
         580,
         295
        ],
        "caption": "window building"
       },
       {
        "path": "docs/research/images/steam-screens/s5.jpg",
        "imgSize": [
         1920,
         1080
        ],
        "crop": [
         360,
         380,
         1160,
         520
        ],
        "caption": "Steam shot, same building"
       }
      ]
     },
     {
      "id": "ruinedBuilding",
      "name": "Ruined concrete building",
      "csName": null,
      "interactive": false,
      "marker": null,
      "task": null,
      "sheet": "buildings",
      "description": "Grey concrete facades with stepped roofs, balconies and ragged blast holes in the walls (several variants, 4-8 tiles wide); the dark holes show sky through. Also the tall plain facade with a breach next to the street lift.",
      "states": [],
      "refs": [
       {
        "path": "docs/research/video/f5r7/0082.png",
        "imgSize": [
         320,
         200
        ],
        "crop": [
         125,
         25,
         179,
         147
        ],
        "caption": "stepped-roof building with holes"
       },
       {
        "path": "docs/research/video/frames-best/L1_t0261_hide_pose_enemy_adjacent_wall_hole_scene.png",
        "imgSize": [
         960,
         600
        ],
        "crop": [
         45,
         75,
         460,
         425
        ],
        "caption": "breached facade"
       }
      ]
     },
     {
      "id": "colonnadeBuilding",
      "name": "Colonnade building (block 05)",
      "csName": null,
      "interactive": false,
      "marker": null,
      "task": null,
      "sheet": "buildings",
      "description": "Overhanging grey upper storey on a row of pale square pillars, painted block number 05, open dark bays below; the wire box hangs on its wall.",
      "states": [],
      "refs": [
       {
        "path": "docs/research/video/f5r7/0132.png",
        "imgSize": [
         320,
         200
        ],
        "crop": [
         15,
         25,
         289,
         147
        ],
        "caption": "colonnade"
       },
       {
        "path": "docs/research/video/frames-best/L1_t0405_green_wall_panel_wire_cutscene_trigger.png",
        "imgSize": [
         960,
         600
        ],
        "crop": [
         45,
         75,
         870,
         425
        ],
        "caption": "colonnade with 05 and pipe"
       }
      ]
     },
     {
      "id": "brickWall",
      "name": "Brick wall and shaft",
      "csName": null,
      "interactive": false,
      "marker": null,
      "task": null,
      "sheet": "buildings",
      "description": "Dark brown brick walls, full floor height, framing lift shafts and buildings, usually with a vertical pipe at the edge.",
      "states": [],
      "refs": [
       {
        "path": "docs/research/video/frames-best/L1_t0296_lift_scaffold_crate_item_message.png",
        "imgSize": [
         960,
         600
        ],
        "crop": [
         45,
         110,
         320,
         470
        ],
        "caption": "brick wall by lift"
       }
      ]
     },
     {
      "id": "facadeTower",
      "name": "Tall facade towers",
      "csName": null,
      "interactive": false,
      "marker": null,
      "task": null,
      "sheet": "buildings",
      "description": "Multi-storey building facades with vertical pilasters, brick strips and triangular braces, used as level walls (left edge) and as tall towers at the east end (about 9 x 27 tiles).",
      "states": [],
      "refs": [
       {
        "path": "docs/research/video/frames-best/L1_t0296_lift_scaffold_crate_item_message.png",
        "imgSize": [
         960,
         600
        ],
        "crop": [
         550,
         75,
         365,
         505
        ],
        "caption": "facade with braces right of lift"
       },
       {
        "path": "docs/research/gamedata/png/maps/map_M11.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         3024,
         48,
         264,
         720
        ],
        "caption": "map: east tower"
       }
      ]
     },
     {
      "id": "graffitiWall",
      "name": "Graffiti wall",
      "csName": null,
      "interactive": false,
      "marker": null,
      "task": null,
      "sheet": "buildings",
      "description": "Freestanding broken concrete wall (about 7 x 3 tiles) with red, orange and white spray graffiti; a second graffiti wall stands at the east end (cells 135-141, rows 40-44).",
      "states": [],
      "refs": [
       {
        "path": "docs/research/video/f5r7/0105.png",
        "imgSize": [
         320,
         200
        ],
        "crop": [
         60,
         85,
         180,
         87
        ],
        "caption": "graffiti wall"
       },
       {
        "path": "docs/research/video/sheets/KkPeKkoohvk_10.png",
        "imgSize": [
         1280,
         720
        ],
        "crop": [
         985,
         200,
         270,
         150
        ],
        "caption": "video B: graffiti wall"
       }
      ]
     },
     {
      "id": "gantryBuilding",
      "name": "Gantry building with blue lights",
      "csName": null,
      "interactive": false,
      "marker": null,
      "task": null,
      "sheet": "buildings",
      "description": "Industrial hall front: brown panelled lower storey with dark bays and ceiling lamps, a strip of blue lights above, girder on top and a fenced upper deck.",
      "states": [],
      "refs": [
       {
        "path": "docs/research/video/frames-best/L1_t0608_gantry_building_drone_missile_hit.png",
        "imgSize": [
         960,
         600
        ],
        "crop": [
         45,
         130,
         880,
         375
        ],
        "caption": "gantry building"
       }
      ]
     },
     {
      "id": "barSign",
      "name": "BAR neon sign",
      "csName": null,
      "interactive": false,
      "marker": 9,
      "task": null,
      "sheet": "buildings",
      "description": "Big red neon letters B A R on a rusty frame atop a splayed lattice stand (about 4 x 3 tiles) in front of the bar. In footage B and A glow red and R is dark grey-blue; in the map the R cells hold yellow lamp tiles, so R is probably animated (flicker).",
      "states": [
       "neon on",
       "R flicker / off"
      ],
      "refs": [
       {
        "path": "docs/research/video/f5r7/0187.png",
        "imgSize": [
         320,
         200
        ],
        "crop": [
         130,
         50,
         120,
         120
        ],
        "caption": "BAR sign"
       },
       {
        "path": "docs/research/gamedata/png/maps/map_M11.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         1008,
         768,
         216,
         144
        ],
        "caption": "map: B A plus lamp tiles"
       }
      ]
     },
     {
      "id": "metroTrain",
      "name": "Subway train carriage",
      "csName": "souprava metra",
      "interactive": false,
      "marker": 5,
      "task": null,
      "sheet": "buildings",
      "description": "Long white-grey carriages with dark windows, red and grey side stripes and blood splatter, standing on the platform track (about 5 x 3 tiles per car) with dark pillars between cars.",
      "states": [],
      "refs": [
       {
        "path": "docs/research/video/frames-best/L1_t0436_subway_train_carriage_player_opens_door.png",
        "imgSize": [
         960,
         600
        ],
        "crop": [
         45,
         300,
         870,
         210
        ],
        "caption": "bloodied carriages"
       },
       {
        "path": "docs/research/gamedata/png/METROPAC/f010.png",
        "imgSize": [
         320,
         200
        ],
        "crop": [
         15,
         15,
         290,
         180
        ],
        "caption": "cutscene close-up of carriage"
       }
      ]
     },
     {
      "id": "metroPlatformWall",
      "name": "Metro platform walls",
      "csName": null,
      "interactive": false,
      "marker": null,
      "task": null,
      "sheet": "structures",
      "description": "Station walls of blue-grey grid tiles under a band of brick and a gravel-textured ceiling; a large round wall fan unit (about 2 x 2 tiles) sits by the lift.",
      "states": [
       "fan spinning (assumed)"
      ],
      "refs": [
       {
        "path": "docs/research/video/f5r7/0139.png",
        "imgSize": [
         320,
         200
        ],
        "crop": [
         15,
         24,
         289,
         150
        ],
        "caption": "tiled wall, lift and fan"
       },
       {
        "path": "docs/research/video/f5r7/0174.png",
        "imgSize": [
         320,
         200
        ],
        "crop": [
         215,
         85,
         89,
         75
        ],
        "caption": "wall fan"
       }
      ]
     },
     {
      "id": "tunnelGate",
      "name": "Dark metro tunnel mouth",
      "csName": null,
      "interactive": false,
      "marker": null,
      "task": "wireSwitchboard",
      "sheet": "structures",
      "description": "Steel-framed tunnel mouth, 1 tile wide and 6 tall, that blocks the metro tunnel at map col 56 until the switchboard powers the metro: dark and closed, then lit and open.",
      "note": "Not an original object: the original blocks the dark tunnel with an invisible task wall (metroTunnel); this asset gives that gate a look.",
      "states": [
       "dark (closed)",
       "lit (open)"
      ],
      "refs": []
     },
     {
      "id": "tunnelWall",
      "name": "Metro tunnel walls",
      "csName": null,
      "interactive": false,
      "marker": null,
      "task": null,
      "sheet": "structures",
      "description": "Rough grey concrete wall panels split by riveted steel pillars, dark ceiling with a long horizontal pipe; two corridors stack per screen.",
      "states": [],
      "refs": [
       {
        "path": "docs/research/video/frames-best/L1_t0456_subway_tunnel_pipes.png",
        "imgSize": [
         960,
         600
        ],
        "crop": [
         45,
         75,
         870,
         500
        ],
        "caption": "tunnel corridor"
       },
       {
        "path": "docs/research/video/frames-best/L1_t0468_pickup_E-BLASTER_label_top_right.png",
        "imgSize": [
         960,
         600
        ],
        "crop": [
         45,
         75,
         870,
         500
        ],
        "caption": "stacked corridors with pipe"
       }
      ]
     },
     {
      "id": "stripLight",
      "name": "Tunnel strip light",
      "csName": null,
      "interactive": false,
      "marker": null,
      "task": null,
      "sheet": "structures",
      "description": "White fluorescent bar about 1.5 tiles wide under the tunnel ceiling, casting a pale cone on the wall.",
      "states": [
       "lit (metro powered)",
       "dark before switchboard (inferred from NENÍ TAM SVĚTLO)"
      ],
      "refs": [
       {
        "path": "docs/research/video/frames-best/L1_t0456_subway_tunnel_pipes.png",
        "imgSize": [
         960,
         600
        ],
        "crop": [
         440,
         270,
         200,
         200
        ],
        "caption": "strip light and light cone"
       }
      ]
     },
     {
      "id": "tunnelFloor",
      "name": "Tunnel floor rail",
      "csName": null,
      "interactive": false,
      "marker": null,
      "task": null,
      "sheet": "structures",
      "description": "Thin metal walkway with a yellow-black hazard stripe and short posts every few tiles; used on metro platform and tunnel floors.",
      "states": [],
      "refs": [
       {
        "path": "docs/research/video/frames-best/L1_t0468_pickup_E-BLASTER_label_top_right.png",
        "imgSize": [
         960,
         600
        ],
        "crop": [
         45,
         490,
         870,
         80
        ],
        "caption": "floor rail"
       }
      ]
     },
     {
      "id": "rubblePile",
      "name": "Boulder rubble pile",
      "csName": null,
      "interactive": false,
      "marker": null,
      "task": null,
      "sheet": "props",
      "description": "Heap of large grey angular boulders blocking part of a tunnel (about 4 x 4 tiles); smaller scrap and broken posts lie on streets.",
      "states": [],
      "refs": [
       {
        "path": "docs/research/video/frames-best/L1_t0500_crouch_search_dead_body_card_holoplan.png",
        "imgSize": [
         960,
         600
        ],
        "crop": [
         480,
         210,
         400,
         300
        ],
        "caption": "boulder pile"
       },
       {
        "path": "docs/research/video/f5r7/0121.png",
        "imgSize": [
         320,
         200
        ],
        "crop": [
         150,
         140,
         154,
         30
        ],
        "caption": "street scrap"
       }
      ]
     },
     {
      "id": "fallenGirders",
      "name": "Collapsed girder wreckage",
      "csName": null,
      "interactive": false,
      "marker": null,
      "task": null,
      "sheet": "props",
      "description": "Tangle of fallen diagonal beams and debris (about 5 x 4 tiles) east of the controller spot.",
      "states": [],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M11.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         2736,
         1104,
         168,
         120
        ],
        "caption": "map: wreckage"
       }
      ]
     },
     {
      "id": "staircase",
      "name": "Diagonal staircase with railings",
      "csName": null,
      "interactive": false,
      "marker": null,
      "task": null,
      "sheet": "structures",
      "description": "Steep diagonal stair stringers with orange handrails (about 5 x 4 tiles) beside the crane on the top floor; not used in footage, maybe decor.",
      "states": [],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M11.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         432,
         264,
         240,
         168
        ],
        "caption": "map: stairs next to crane"
       }
      ]
     },
     {
      "id": "floorVent",
      "name": "Wall-base vent grille",
      "csName": null,
      "interactive": false,
      "marker": null,
      "task": null,
      "sheet": "props",
      "description": "Small grey slotted grilles (about 1 x 0.3 tiles) at the foot of concrete walls.",
      "states": [],
      "refs": [
       {
        "path": "docs/research/video/frames-best/L1_t0261_hide_pose_enemy_adjacent_wall_hole_scene.png",
        "imgSize": [
         960,
         600
        ],
        "crop": [
         140,
         470,
         290,
         40
        ],
        "caption": "vents at wall base"
       }
      ]
     },
     {
      "id": "signPost",
      "name": "Street sign post",
      "csName": null,
      "interactive": false,
      "marker": null,
      "task": null,
      "sheet": "props",
      "description": "Thin grey pole with a small box or plate on top, about 2 tiles tall, standing on the street.",
      "states": [],
      "refs": [
       {
        "path": "docs/research/video/f5r7/0129.png",
        "imgSize": [
         320,
         200
        ],
        "crop": [
         255,
         95,
         35,
         75
        ],
        "caption": "sign post"
       }
      ]
     },
     {
      "id": "ladder",
      "name": "Ladder",
      "csName": null,
      "interactive": false,
      "marker": null,
      "task": null,
      "sheet": "structures",
      "description": "Steel ladder with two rails and chrome rungs, climbed by the hero; height follows the ladder cells, rung spacing matches the game climb steps.",
      "states": [],
      "refs": []
     }
    ]
   }
  },
  "vesnice": {
   "order": 2,
   "name": "Suburb",
   "objects": {
    "status": "draft",
    "source": "docs/research/reports/14-level2-layout.md",
    "units": "original pixels, 1 tile = 24",
    "objects": [
     {
      "id": "smoulderingRemains",
      "name": "Smouldering remains with small key",
      "csName": "tlející zbytky",
      "interactive": true,
      "marker": 1,
      "task": "takeSmallKey",
      "sheet": "props",
      "description": "Charred robot remains lying on floor 32 (map cell 110-111, row 31, about 2 x 1 tiles). Pickup of item record 1 (TORZO) at engine (105, 26) renames it MALÝ KLÍČ: \"U tlejících zbytků jsi našel malý klíč\".",
      "states": [
       "remains with key",
       "searched"
      ],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M21.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         2544,
         672,
         240,
         120
        ],
        "caption": "map M21: remains on floor 32"
       }
      ]
     },
     {
      "id": "smallKey",
      "name": "Small key",
      "csName": "malý klíč",
      "interactive": true,
      "marker": 1,
      "task": "takeSmallKey",
      "sheet": "props",
      "description": "Inventory item (record 1, shown as TORZO until picked). Opens the electric cabinet (marker 9) and is consumed there. Inventory art: open.",
      "states": [
       "on ground",
       "taken"
      ],
      "refs": []
     },
     {
      "id": "fuseBox",
      "name": "Electric distribution box (fuses)",
      "csName": "rozvod",
      "interactive": true,
      "marker": 2,
      "task": "breakFuses",
      "sheet": "machines",
      "description": "Wall box with a green panel on floor 32 (use window map cells 146-150, art about cells 148-149, rows 29-31). First use (map M21) smashes the fuses: power off, map M22 (energy barrier and bridge vanish). Using the fuse there in M22 restarts the power plant: map M23.",
      "states": [
       "working (M21)",
       "fuses smashed (M22)",
       "fuse fitted (M23)"
      ],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M21.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         3408,
         624,
         288,
         168
        ],
        "caption": "map M21: fuse box, floor 32"
       }
      ]
     },
     {
      "id": "sourceTeleport",
      "name": "Teleport",
      "csName": "teleport",
      "interactive": true,
      "marker": 3,
      "task": "useTeleport",
      "sheet": "machines",
      "description": "Small teleport pod with a dish top on floor 23 (use window map cells 127-130, art cells 128-129, rows 20-22). Sends the hero to the target teleport (cell 65, floor 32) once the navigation circuit and the fuse are fitted; else says the target teleport is damaged (or the power plant is off in M22). Two-way.",
      "states": [
       "target broken",
       "power off",
       "working"
      ],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M21.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         2976,
         432,
         216,
         144
        ],
        "caption": "map M21: teleport pod, floor 23"
       }
      ]
     },
     {
      "id": "toaster",
      "name": "TOASTER weapon pickup",
      "csName": "toaster",
      "interactive": true,
      "marker": 4,
      "task": "takeToaster",
      "sheet": "props",
      "description": "Bonus weapon (slot 3) lying at the east end of the bridge, engine (55, 35) = map cell 61, floor 41. Gives 250 shots; the only weapon that hurts the bridge guard. Not drawn in the map tiles (sprite or invisible, open).",
      "states": [
       "on ground",
       "taken"
      ],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M21.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         1344,
         864,
         240,
         144
        ],
        "caption": "map M21: pickup spot, floor 41 (item not in tiles)"
       }
      ]
     },
     {
      "id": "bridgeGuardPost",
      "name": "Guard post across the bridge",
      "csName": "hlídka",
      "interactive": true,
      "marker": 4,
      "task": "callGuardsAway",
      "sheet": "structures",
      "description": "No art of its own: a code wall (engine 48, floor 41, solid near cell 52) at the east end of the bridge with the message \"Nemůžeš jít dál, na druhé straně mostu je hlídka\". Using the walkie-talkie at cells 52-57 calls the guards away and removes it.",
      "states": [
       "guarded",
       "guards called away"
      ],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M21.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         1056,
         840,
         432,
         168
        ],
        "caption": "map M21: bridge east end"
       }
      ]
     },
     {
      "id": "bridgeGuard",
      "name": "Bridge guard",
      "csName": "stráž",
      "interactive": false,
      "marker": 5,
      "task": "shootGuard",
      "sheet": "enemies",
      "description": "Bulky olive armoured soldier with a rifle, facing right (LEV2.GRA frame 25, 8 frames of 3x3 tiles). Stands on floor 23 at map cell 62; 70 hit points, only the toaster hurts him (6 per hit). Blocks the hero and fires bursts. The walkie-talkie lies behind him at cell 60.",
      "states": [
       "idle",
       "firing",
       "dead"
      ],
      "refs": [
       {
        "path": "docs/research/gamedata/png/enemy-sprites/lev2_guard_f25_frames.png",
        "imgSize": [
         936,
         576
        ],
        "crop": [
         0,
         0,
         936,
         432
        ],
        "caption": "LEV2.GRA f25 frames 1-8"
       },
       {
        "path": "docs/research/gamedata/png/maps/map_M21.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         1344,
         408,
         288,
         168
        ],
        "caption": "map M21: guard spot, floor 23 (sprite not in tiles)"
       }
      ]
     },
     {
      "id": "walkieTalkie",
      "name": "Walkie-talkie",
      "csName": "vysílačka",
      "interactive": true,
      "marker": 5,
      "task": "callGuardsAway",
      "sheet": "props",
      "description": "Item record 2 on floor 23 behind the bridge guard, engine (54, 17) = map cell 60. Used at the bridge east end it calls the guard post away; it stays in the inventory.",
      "states": [
       "on ground",
       "taken"
      ],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M21.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         1344,
         408,
         240,
         168
        ],
        "caption": "map M21: pickup spot (item not in tiles)"
       }
      ]
     },
     {
      "id": "targetTeleport",
      "name": "Target teleport (damaged)",
      "csName": "cílový teleport",
      "interactive": true,
      "marker": 6,
      "task": "repairTeleport",
      "sheet": "machines",
      "description": "Same teleport pod as marker 3 on floor 32 (use window map cells 63-67, art cells 65-66, rows 29-31). The navigation circuit repairs it (\"Opravil jsi rozbitý teleport\"); then it links to the marker 3 pod both ways while the fuse is fitted. The walkthrough map swaps markers 5 and 6 in height; code puts the guard on floor 23 and this pod on floor 32.",
      "states": [
       "damaged",
       "repaired"
      ],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M21.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         1440,
         624,
         240,
         168
        ],
        "caption": "map M21: target teleport, floor 32"
       }
      ]
     },
     {
      "id": "detonator",
      "name": "Detonator",
      "csName": "rozbuška",
      "interactive": true,
      "marker": 7,
      "task": "blowWall",
      "sheet": "props",
      "description": "Item record 4 on floor 50, engine (73, 44) = map cell 79. Used at the dynamite wall after the dynamite is placed: level end.",
      "states": [
       "on ground",
       "taken"
      ],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M21.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         1776,
         1080,
         240,
         144
        ],
        "caption": "map M21: pickup spot (item not in tiles)"
       }
      ]
     },
     {
      "id": "projectileCrate",
      "name": "Crate with cannon projectile",
      "csName": "bedna",
      "interactive": true,
      "marker": 8,
      "task": "takeProjectile",
      "sheet": "props",
      "description": "Item record 3 (BEDNA) on floor 50, engine (109, 44) = map cell 115. Picking it renames it PROJEKTIL: \"Uvnitř bedny jsi našel projektil do děla\".",
      "states": [
       "on ground",
       "taken"
      ],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M21.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         2640,
         1080,
         240,
         144
        ],
        "caption": "map M21: pickup spot (item not in tiles)"
       }
      ]
     },
     {
      "id": "projectile",
      "name": "Cannon projectile",
      "csName": "projektil",
      "interactive": true,
      "marker": 8,
      "task": "fireCannon",
      "sheet": "props",
      "description": "Inventory item from the crate; loaded into the cannon (marker 12) and consumed.",
      "states": [
       "carried",
       "used"
      ],
      "refs": []
     },
     {
      "id": "electricCabinet",
      "name": "Locked electric cabinet",
      "csName": "elektrická skříň",
      "interactive": true,
      "marker": 9,
      "task": "takeFuse",
      "sheet": "machines",
      "description": "Concrete cabinet block with a grey door on floor 59 (use window map cells 122-126, art about cells 122-128, rows 55-58). Locked (\"Elektrická skříň je zamčena\") until the small key is used; then gives the fuse.",
      "states": [
       "locked",
       "opened, fuse taken"
      ],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M21.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         2832,
         1272,
         312,
         168
        ],
        "caption": "map M21: cabinet, floor 59"
       }
      ]
     },
     {
      "id": "fuse",
      "name": "Fuse",
      "csName": "pojistka",
      "interactive": true,
      "marker": 9,
      "task": "restorePower",
      "sheet": "props",
      "description": "Inventory item (record 7) from the cabinet; fitted into the fuse box while the power is off (map M22).",
      "states": [
       "carried",
       "fitted"
      ],
      "refs": []
     },
     {
      "id": "dynamite",
      "name": "Dynamite",
      "csName": "dynamit",
      "interactive": true,
      "marker": 10,
      "task": "placeDynamite",
      "sheet": "props",
      "description": "Item record 5 on floor 68 by the ruined house, engine (93, 62) = map cell 99 (\"U domu jsi našel dynamit\"). Placed at the wall (marker 14) it moves to engine (25, 26) and can no longer be picked up.",
      "states": [
       "on ground",
       "taken",
       "placed at wall"
      ],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M21.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         2208,
         1512,
         288,
         144
        ],
        "caption": "map M21: pickup spot by the house (item not in tiles)"
       }
      ]
     },
     {
      "id": "brokenTeleport",
      "name": "Broken teleport",
      "csName": "rozbitý teleport",
      "interactive": true,
      "marker": 11,
      "task": "takeNavCircuit",
      "sheet": "machines",
      "description": "Wrecked teleport pod on floor 59 (use window map cells 93-98, art about cells 94-96, rows 57-58). Gives the undamaged navigation circuit once.",
      "states": [
       "wreck with circuit",
       "circuit taken"
      ],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M21.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         2160,
         1296,
         264,
         144
        ],
        "caption": "map M21: broken teleport, floor 59"
       }
      ]
     },
     {
      "id": "navCircuit",
      "name": "Navigation circuit",
      "csName": "navigační obvod",
      "interactive": true,
      "marker": 11,
      "task": "repairTeleport",
      "sheet": "props",
      "description": "Inventory item (record 6, NAV. OBVOD); fitted into the target teleport and consumed.",
      "states": [
       "carried",
       "fitted"
      ],
      "refs": []
     },
     {
      "id": "cannon",
      "name": "Border cannon",
      "csName": "dělo",
      "interactive": true,
      "marker": 12,
      "task": "fireCannon",
      "sheet": "machines",
      "description": "Grey artillery gun on floor 41 pointing west, with a wooden watchtower behind it (art about map cells 33-43, rows 35-40; use window cells 31-38). \"Útočný kanón na hlídání hranice města\". With the projectile it blasts the barricade: map M24.",
      "states": [
       "idle",
       "firing"
      ],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M21.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         720,
         792,
         384,
         216
        ],
        "caption": "map M21: cannon and tower, floor 41"
       }
      ]
     },
     {
      "id": "fireBarricade",
      "name": "Burning barricade",
      "csName": "překážka",
      "interactive": false,
      "marker": 12,
      "task": "fireCannon",
      "sheet": "structures",
      "description": "Grey concrete post (map cell 22, rows 37-40) followed by a row of sandbagged fire boxes with red flames (cells 23-29). The post tiles (8,50) (8,63) (8,76) are a stand-row wall; M24 removes them.",
      "states": [
       "standing",
       "blasted (M24)"
      ],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M21.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         480,
         864,
         264,
         144
        ],
        "caption": "map M21: barricade"
       },
       {
        "path": "docs/research/gamedata/png/maps/map_M24.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         480,
         864,
         264,
         144
        ],
        "caption": "map M24: post blasted"
       }
      ]
     },
     {
      "id": "teleportPad",
      "name": "Teleport pair",
      "csName": "teleport",
      "interactive": true,
      "marker": 13,
      "task": "useTeleport13",
      "sheet": "machines",
      "description": "Unconditional two-way teleport: use at map cells 50-54 on floor 50 goes to cell 42 on floor 32, use at cells 40-44 on floor 32 goes back to cell 52. Art not identified in the map tiles (open).",
      "states": [
       "idle"
      ],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M21.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         1104,
         1032,
         288,
         192
        ],
        "caption": "map M21: floor 50 end"
       },
       {
        "path": "docs/research/gamedata/png/maps/map_M21.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         888,
         624,
         240,
         168
        ],
        "caption": "map M21: floor 32 end"
       }
      ]
     },
     {
      "id": "dynamiteWall",
      "name": "Wall to blow up",
      "csName": "zeď",
      "interactive": true,
      "marker": 14,
      "task": "blowWall",
      "sheet": "structures",
      "description": "Grey concrete post (map cell 29, rows 29-31, stand-row wall) with a row of fire boxes behind it on floor 32. Dynamite then detonator here ends the level.",
      "states": [
       "intact",
       "dynamite placed"
      ],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M21.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         624,
         648,
         336,
         144
        ],
        "caption": "map M21: wall, floor 32"
       }
      ]
     },
     {
      "id": "energyBarrier",
      "name": "Electric barrier",
      "csName": "elektrická bariéra",
      "interactive": false,
      "marker": 2,
      "task": "breakFuses",
      "sheet": "machines",
      "description": "White crackling electric arc one tile wide, rows 37-40 at map cell 99 on floor 41, tiles (1,1)-(1,4), a stand-row wall. Gone in M22 (power off), back in M23 and M24.",
      "states": [
       "on",
       "off (M22)"
      ],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M21.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         2304,
         840,
         168,
         168
        ],
        "caption": "map M21: barrier on"
       },
       {
        "path": "docs/research/gamedata/png/maps/map_M22.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         2304,
         840,
         168,
         168
        ],
        "caption": "map M22: barrier off"
       }
      ]
     },
     {
      "id": "powerBridge",
      "name": "Bridge over the chasm",
      "csName": "most",
      "interactive": false,
      "marker": 4,
      "task": "breakFuses",
      "sheet": "structures",
      "description": "Thin light rail bridge, one plank row (tiles (2,1)-(2,3)), map cells 45-56 on floor 41 between the barricade side and the toaster spot. M22 removes the planks: a hero who steps on the gap falls (engine y 36 plays padves.anm).",
      "states": [
       "standing",
       "gone (M22)"
      ],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M21.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         1008,
         888,
         432,
         144
        ],
        "caption": "map M21: bridge"
       },
       {
        "path": "docs/research/gamedata/png/maps/map_M22.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         1008,
         888,
         432,
         144
        ],
        "caption": "map M22: bridge gone"
       }
      ]
     },
     {
      "id": "holoPlan",
      "name": "Holo plan",
      "csName": "holografický plán",
      "interactive": true,
      "marker": null,
      "task": null,
      "sheet": "props",
      "description": "Owned from the level start (record 8 owned flag set by the init), so the map screen works. Inventory item only.",
      "states": [
       "carried"
      ],
      "refs": []
     },
     {
      "id": "energyPickup",
      "name": "Energy pickup",
      "csName": null,
      "interactive": true,
      "marker": null,
      "task": null,
      "sheet": "props",
      "description": "Bonus at engine (77, 17) = map cell 83, floor 23: energy + 90, once. Not in the map tiles (sprite or invisible, open).",
      "states": [
       "on ground",
       "taken"
      ],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M21.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         1896,
         456,
         216,
         120
        ],
        "caption": "map M21: spot (not in tiles)"
       }
      ]
     },
     {
      "id": "ammoPickup",
      "name": "Ammo pickup",
      "csName": null,
      "interactive": true,
      "marker": null,
      "task": null,
      "sheet": "props",
      "description": "Bonus at engine (123, 35) = map cell 129, floor 41: machine-gun ammo + 350 (cap 999), once. Not in the map tiles.",
      "states": [
       "on ground",
       "taken"
      ],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M21.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         3000,
         888,
         216,
         120
        ],
        "caption": "map M21: spot (not in tiles)"
       }
      ]
     },
     {
      "id": "shieldPickup",
      "name": "Shield pickup",
      "csName": null,
      "interactive": true,
      "marker": null,
      "task": null,
      "sheet": "props",
      "description": "Bonus at engine (35, 35) = map cell 41, floor 41 (west of the bridge): shields + 1 (cap 5), once. Not in the map tiles.",
      "states": [
       "on ground",
       "taken"
      ],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M21.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         888,
         888,
         216,
         120
        ],
        "caption": "map M21: spot (not in tiles)"
       }
      ]
     },
     {
      "id": "lift",
      "name": "Lift platform and shaft",
      "csName": "výtah",
      "interactive": true,
      "marker": null,
      "task": null,
      "sheet": "machines",
      "description": "Same lift as mesto: 9 lifts, deck tiles (10,1)-(10,3) at every stop, a rung rail column in the shaft. Two stops each, 9 rows apart.",
      "states": [
       "idle at floor",
       "moving up",
       "moving down"
      ],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M21.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         2712,
         720,
         168,
         312
        ],
        "caption": "map M21: lift 1 shaft and decks"
       }
      ]
     },
     {
      "id": "villageBackdrop",
      "name": "Jungle and ruins backdrop",
      "csName": null,
      "interactive": false,
      "marker": null,
      "task": null,
      "sheet": "buildings",
      "description": "Parallax backdrop (LEV2.GRA frame 0, frame 1 near identical): palm trees and dark jungle over pale ruined concrete walls and ferns, a green strip and an orange band at the bottom. Same role as mesto skyBackground, different art.",
      "states": [
       "normal"
      ],
      "refs": [
       {
        "path": "docs/research/gamedata/png/lev2/f000.png",
        "imgSize": [
         320,
         200
        ],
        "crop": [
         0,
         0,
         320,
         170
        ],
        "caption": "background frame 0"
       }
      ]
     },
     {
      "id": "rockCliff",
      "name": "Rock cliff over steel block wall",
      "csName": null,
      "interactive": false,
      "marker": null,
      "task": null,
      "sheet": "structures",
      "description": "Floor-high walls of riveted grey steel blocks with yellow seams, fronted by big rounded boulders spilling down in a slope; close every floor end and frame the chasm.",
      "states": [],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M21.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         96,
         768,
         240,
         456
        ],
        "caption": "map M21: west cliffs"
       },
       {
        "path": "docs/research/gamedata/png/maps/map_M21.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         3552,
         576,
         288,
         432
        ],
        "caption": "map M21: east cliff by the spawn"
       }
      ]
     },
     {
      "id": "grassyWalkway",
      "name": "Grassy girder walkway",
      "csName": null,
      "interactive": false,
      "marker": null,
      "task": null,
      "sheet": "structures",
      "description": "Floor plank: dry grass and dirt over a riveted steel girder with X bracing, 1 tile thick; every floor of the level, 9 rows apart.",
      "states": [],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M21.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         1440,
         744,
         288,
         48
        ],
        "caption": "map M21: floor 32 plank"
       }
      ]
     },
     {
      "id": "chainFence",
      "name": "Chain-link fence",
      "csName": null,
      "interactive": false,
      "marker": null,
      "task": null,
      "sheet": "structures",
      "description": "Same mesh fence panels between steel posts as mesto, with small grey sign plates; on most floors.",
      "states": [],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M21.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         1416,
         456,
         264,
         96
        ],
        "caption": "map M21: fence on floor 23"
       }
      ]
     },
     {
      "id": "overheadPipeline",
      "name": "Overhead pipeline",
      "csName": null,
      "interactive": false,
      "marker": null,
      "task": null,
      "sheet": "structures",
      "description": "Thin double pipe with orange-striped clamps running along row 25-26 above floor 32 (cells 106-160), hung from short concrete blocks.",
      "states": [],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M21.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         2496,
         576,
         864,
         96
        ],
        "caption": "map M21: pipeline"
       }
      ]
     },
     {
      "id": "storageTank",
      "name": "Riveted storage tank",
      "csName": null,
      "interactive": false,
      "marker": null,
      "task": null,
      "sheet": "structures",
      "description": "Squat brown riveted cylinder tanks with a top hatch (about 2 x 3 tiles) on floor 32 (cells 124-130); a pipe stack with lamps between them.",
      "states": [],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M21.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         2880,
         648,
         288,
         120
        ],
        "caption": "map M21: tanks"
       }
      ]
     },
     {
      "id": "fuelTank",
      "name": "Horizontal tank",
      "csName": null,
      "interactive": false,
      "marker": null,
      "task": null,
      "sheet": "structures",
      "description": "Horizontal bronze tank with curled end pipes on short legs (about 4 x 2 tiles) on floors 32 and 41; mesto fuelTank role, without the trefoil.",
      "states": [],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M21.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         3048,
         888,
         192,
         96
        ],
        "caption": "map M21: tank, floor 41"
       }
      ]
     },
     {
      "id": "transformer",
      "name": "Power plant transformer",
      "csName": null,
      "interactive": false,
      "marker": null,
      "task": null,
      "sheet": "machines",
      "description": "Large green-grey machine block with stacked coils, valves and cables on floor 41 (cells 121-127, rows 34-40); likely the power plant the fuse box feeds (inferred).",
      "states": [],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M21.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         2856,
         792,
         240,
         192
        ],
        "caption": "map M21: transformer"
       }
      ]
     },
     {
      "id": "watchtower",
      "name": "Wooden watchtower",
      "csName": null,
      "interactive": false,
      "marker": null,
      "task": null,
      "sheet": "structures",
      "description": "Small wooden hut on a tall lattice frame behind the cannon on floor 41 (cells 37-40, rows 34-40).",
      "states": [],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M21.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         840,
         792,
         168,
         192
        ],
        "caption": "map M21: watchtower"
       }
      ]
     },
     {
      "id": "villageHouse",
      "name": "Concrete village house",
      "csName": null,
      "interactive": false,
      "marker": null,
      "task": null,
      "sheet": "buildings",
      "description": "Pale concrete houses with flat roofs, window grids and pillars (5-10 tiles wide) on floors 41, 50 and 68; some ruined with broken roofs.",
      "states": [],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M21.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         2208,
         1512,
         336,
         144
        ],
        "caption": "map M21: ruined house, floor 68"
       },
       {
        "path": "docs/research/gamedata/png/maps/map_M21.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         2280,
         1056,
         432,
         144
        ],
        "caption": "map M21: house block, floor 50"
       }
      ]
     },
     {
      "id": "stiltBuilding",
      "name": "Building on stilts",
      "csName": null,
      "interactive": false,
      "marker": null,
      "task": null,
      "sheet": "buildings",
      "description": "Brown wooden building with window rows raised on posts, spanning a floor (cells 89-98, rows 51-58), and a smaller stilt hut with spiked roof on floor 50 (cells 74-86).",
      "states": [],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M21.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         2112,
         1200,
         264,
         216
        ],
        "caption": "map M21: stilt building"
       },
       {
        "path": "docs/research/gamedata/png/maps/map_M21.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         1752,
         1008,
         360,
         192
        ],
        "caption": "map M21: stilt hut"
       }
      ]
     },
     {
      "id": "pipeColumn",
      "name": "Vertical pipe column",
      "csName": null,
      "interactive": false,
      "marker": null,
      "task": null,
      "sheet": "structures",
      "description": "Thick bronze vertical pipe with ring joints (for example cell 60, rows 33-41 and cell 120, rows 33-40).",
      "states": [],
      "refs": [
       {
        "path": "docs/research/gamedata/png/maps/map_M21.png",
        "imgSize": [
         3840,
         1920
        ],
        "crop": [
         1392,
         768,
         120,
         240
        ],
        "caption": "map M21: pipe column"
       }
      ]
     }
    ]
   }
  }
 }
};
