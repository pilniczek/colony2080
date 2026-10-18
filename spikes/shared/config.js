window.C28_CONFIG = {
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
    "minThickness": 8,
    "minArea": 400,
    "minRadius": 8
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
   "note": "Agreed crowbar item-use clip. Track keys are absolute seconds; the clip plays clip.start..clip.end (the walk before clip.start is not shown). Keyframe: [time, value, easing?], easing in linear|in|out|inOut; string-valued tracks switch values.",
   "stage": {
    "width": 1600,
    "height": 900,
    "floorY": 740,
    "doorSeamX": 900
   },
   "clip": {
    "start": 1.85,
    "end": 5.8
   },
   "robot": {
    "model": "config/robots/xbot.json",
    "scale": 0.46,
    "backShotX": 705,
    "barReach": 60,
    "barTilt": -0.15,
    "farGripOffset": 78,
    "pullArmDeg": -24,
    "pullForeDeg": 32
   },
   "palette": {
    "tunnel": "#0f1a1c",
    "wall": "#1d2a2c",
    "ceiling": "#0a1213",
    "lamp": "#e9d8a6",
    "lampCone": "#e9d8a6",
    "wagon": "#8c9396",
    "wagonShade": "#5f676a",
    "wagonDark": "#3d4447",
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
    "pillar": "#080d0e",
    "crowbar": "#dcd6c8",
    "crowbarShade": "#8f8a80",
    "shadow": "#000000"
   },
   "tracks": {
    "shot": [
     [
      0,
      "A"
     ],
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
      0,
      520
     ],
     [
      1.85,
      860,
      "inOut"
     ],
     [
      1.85,
      790
     ],
     [
      2.95,
      800
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
      0,
      520
     ],
     [
      1.85,
      520
     ],
     [
      1.85,
      560
     ],
     [
      2.95,
      545
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
      0,
      1
     ],
     [
      1.85,
      1.05
     ],
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
    "walkX": [
     [
      0,
      120
     ],
     [
      1.6,
      790,
      "out"
     ],
     [
      5.8,
      790
     ]
    ],
    "armB": [
     [
      0,
      0
     ],
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
      -95,
      "inOut"
     ],
     [
      5.8,
      -95
     ]
    ],
    "foreB": [
     [
      0,
      0
     ],
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
      -25,
      "inOut"
     ],
     [
      5.8,
      -25
     ]
    ],
    "barShown": [
     [
      0,
      0
     ],
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
      0,
      0.2
     ],
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
      0,
      0
     ],
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
      0,
      0
     ],
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
      5,
      0.6,
      "out"
     ],
     [
      5.8,
      0.6
     ]
    ],
    "gap": [
     [
      0,
      0
     ],
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
      0,
      0
     ],
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
      0,
      0
     ],
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
  }
 }
};
