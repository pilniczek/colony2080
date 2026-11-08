# Film hands - audit and builder holds

Goal: films use the hand poses of the robot design sheet (`spikes/robot-design/index.html` Hands section), so each hand grips, pinches, cups, carries or punches what it touches. Phase 1 (this branch): audit every film, give every rig builder the holds the films need, spike and port alike. Phase 2: change the films.

Times are film seconds. Front and back `L` / `R` = screen side. "Now" without a note = no hold option, default open hand, item drawn into the hand hook.

## Builder holds after phase 1

| builder | option | arm | poses | view drawn |
|---|---|---|---|---|
| `buildSide` | `hold` | near | reach, grip, pinch (with `wrist` joint), carry (thumb view), fist, gunGrip (back view), cup (gun support) | |
| `buildSide` | `farHold` (new) | far | same as `hold`; reach, grip, pinch add `wristFar` | |
| `buildSide` | `fists`, `carry`, `armed` | both | fixed pairs | |
| `buildFront` | `holdL`, `holdR` (new) | one arm each | reach, grip, pinch, carry, fist, cup, gunGrip | hand pose thumb view, `wristL` / `wristR` joint |
| `buildFront` | `fists`, `armed` | both | guard + jab, gunGrip + support cup | |
| `buildBack` | `holdL`, `holdR` (new) | one arm each | same as front | little view mirrored (thumb behind), thumb view on `rightForeBehind` |
| `buildTop` | `forearms`, `spread` | both | open palms, `carry` hook | |
| `buildHand` | `view`, `pose`, `rest`, `forearm`, `lod` (new) | lone hand | all 8 poses, 5 views | |

Hand hooks of a front or back arm with a hold sit inside its wrist joint (not with `propBehindArm`), so a held item turns with the wrist. Sheet section "Arm holds" shows every hold in front, back and side.

## Films

### crowbarDoor (`cutscenes.js`)
| shot | view | hand | action | now | fits |
|---|---|---|---|---|---|
| B 0.4-1.1 | side | near | takes crowbar | `propBehindArm`, crowbar in `hand` hook | `hold: "grip"` |
| B 0.7-1.1 | side | far | joins the bar (`solve` handFar) | open | `farHold: "grip"` (new) |
| C 1.1-3.95 | back | L + R | two-hand pry | crowbar drawn between handL and handR | `holdL` / `holdR: "grip"` (new) |

### pickupFilm: pickController, pickCraneKey, pickCrowbar, pickShipPart (`pick-controller.js`)
Robot view, one mirrored `buildSide({ propBehindArm })` arm. Item follows the hand matrix after `gripAt` 0.6.
| shot | view | hand | action | now | fits |
|---|---|---|---|---|---|
| 0-0.6 | side | near | reaches to ground | open | `hold: "reach"` |
| 0.6-1.76 controller | side | near | picks, lifts | open | `hold: "grip"` or `"cup"` view |
| 0.6-1.76 craneKey | side | near | picks, lifts | open | `hold: "pinch"` (new on side) |
| 0.6-1.76 crowbar | side | near | picks, lifts | open | `hold: "grip"` |
| 0.6-1.76 shipPart | side | near | picks, lifts | open | `hold: "carry"` |

Reach to grip at 0.6 swaps two rigs mid shot; both share the arm joints, so a pose carries over.

### pickEBlaster
| 0-2.4 | first person | both palms | two-hand carry | `buildHand({ view: "palm", pose: "open", forearm: true })` twice | `pose: "carry"` palm view |
|---|---|---|---|---|---|

### hullCover
| shot | view | hand | action | now | fits |
|---|---|---|---|---|---|
| A 0-2.21 | back | - | walks | - | no contact |
| B 2.21-3.71 | side | near | fires gun | `GUN.hook` in `hand`, `holdPoses` CARRY | `armed` (gunGrip) |
| B | side | far | supports gun | open, CARRY_FAR | `armed` (support cup) |

### hullCoverPunch
| B 2.62-3.71 | side | near + far | jabs at 2.62, 2.92-3.16, 3.22 | `buildSide({ farLimbs })`, open | `fists` |
|---|---|---|---|---|---|

### missionStart
| shot | view | hand | action | now | fits |
|---|---|---|---|---|---|
| hold 25-27.2 | front, enemy guard | L (+ R) | carries gun | `buildFront({ enemy })`, `GUN.hook` on `handL` | `armed` |
| hand 31-37.5 | side close-up | near | hand on deck, finger twitch | open | open; twitch needs open-fist blend (none) |
| march, fall, monitor | - | - | - | - | no contact |

### rebelShot
| shot | view | hand | action | now | fits |
|---|---|---|---|---|---|
| B 0-1.8, D | front, enemy droid | L (+ R) | carries gun, falls | `GUN.hook` on `handL`, open | `armed` |
| D 3.56-5.78 | back, hero | R | aims, fires one-handed | `buildBack({ rightForeBehind })`, `GUN_HOOK` on `handR` | `holdR: "gunGrip"` (new) |

Rebel arm is hand-drawn, not xbot.

### repairCrane (also vesniceStart front walker: no contact)
| shot | view | hand | action | now | fits |
|---|---|---|---|---|---|
| side 0-1.3 | side mirrored | near | key in keyhole, turns it 0.4-0.8 | craneKey rotated inside `hand` hook | `hold: "pinch"` (new on side), turn on `wrist` |
| front 1.3-3.2 | front | L + R | cheers, arms up 1.7-2.6 | open | open or `holdL` / `holdR: "fist"` |
| front 3.2-5.8, back 5.8-8.66 | - | - | walks, rides | - | no contact |

### repairLift
| 0-4.43, fitting 1.1-2.9 | front | R | fits controller, wiggles wrist | controller in `handR` hook, wrist turn inside hook | `holdR: "cup"` or `"pinch"`, turn on `wristR` (new) |
|---|---|---|---|---|---|

### searchCorpse
| shot | view | hand | action | now | fits |
|---|---|---|---|---|---|
| 1.8-3.0 | front | R | rummages | `buildFront({ rightArmFirst })`, open | `holdR: "reach"` (new) |
| 3.0-4.43 | front | R | lifts card + holo plan | items in `handR` hook | `holdR: "pinch"` (new) |

### takeTapHandle
| shot | view | hand | action | now | fits |
|---|---|---|---|---|---|
| A 0-3.714 | side mirrored | near | turns valve wheel rim | `kit.reach` on rim, open | `hold: "grip"` |
| A | side | far | turns rim, other side | open | `farHold: "grip"` (new) |
| B 4.246-5 | robot view, 2 arm rigs | near x2 | grabs tap, lifts | open | `hold: "grip"` |

### tradeHoloPlan
| shot | view | hand | action | now | fits |
|---|---|---|---|---|---|
| holo 3.07-5.9 | front | L | holds holo plan up | item in `handL` hook | `holdL: "pinch"` (new) |
| door 5.9-8.73 | back | L | reaches 7.2-8.3, gets ship plan 7.74 | empty, then item in `handL` hook | open, then `holdL: "pinch"` (new) |

Man's arm is hand-drawn.

### tradeShipPart (reuses door shot)
| shot | view | hand | action | now | fits |
|---|---|---|---|---|---|
| 0-1.84 | back | L | hands over ship part | item in `handL` hook | `holdL: "carry"` (new) |
| 1.85-2.83 | back | L | gets decoder | item in `handL` hook | `holdL: "pinch"` or `"cup"` (new) |

### unlockPlasma
| 0-4.26 | robot view, lone forearm | near | carries decoder, presses it on lock | `fore` group of `buildSide()`, open | `buildSide({ hold: "cup" })` gives the gun support wrist, so use `buildHand({ pose: "cup", forearm: true })` or `hold: "pinch"` |
|---|---|---|---|---|---|

### useAcidTank
| shot | view | hand | action | now | fits |
|---|---|---|---|---|---|
| A 0-2.23 | robot view, 2 arm rigs | near x2 | grips tap rim, turns it | open | `hold: "grip"` |
| B 2.23-4.73 | camera | - | acid melts guard | - | no robot |

### wireSwitchboard
| shot | view | hand | action | now | fits |
|---|---|---|---|---|---|
| 0-1.05 | side mirrored | near | pushes wires in | wires in `hand` hook | `hold: "grip"` |
| 0.5-1.95 | side | far | braces on board | open | `farHold: "reach"` (new) |

### pullWires
| shot | view | hand | action | now | fits |
|---|---|---|---|---|---|
| 0.12-0.62 | side mirrored | near | yanks box door | open | `hold: "grip"` |
| 1.0-2.61 | side | near | grabs, holds torn wires | wires in `hand` hook from 1.86 | `hold: "grip"` |
| all | side | far | hangs | open | open |

### No hand contact
talkRebel, acidGuardComes, openDoor, vesniceStart.

## Gaps found and closed

| gap | shots | option added |
|---|---|---|
| front one-arm pinch, reach, cup + wrist | searchCorpse x2, tradeHoloPlan holo, repairLift | `buildFront` `holdL` / `holdR`, `wristL` / `wristR` |
| back one-arm pinch, carry, grip, gunGrip | tradeHoloPlan door, tradeShipPart x2, crowbarDoor C, rebelShot D | `buildBack` `holdL` / `holdR` |
| side far grip, reach | crowbarDoor B, takeTapHandle A, wireSwitchboard | `buildSide` `farHold`, `wristFar` |
| side near pinch | repairCrane, pickCraneKey | `hold: "pinch"` (little view, `wrist` joint) |

Still open for phase 2: open-to-fist blend for the missionStart finger twitch; side near `hold: "cup"` means gun support, a cupped item on the side arm needs a new name if a film wants it.

## Phase 2 order

1. Side near holds already offered: crowbarDoor B, pickup films, takeTapHandle, useAcidTank, wireSwitchboard, pullWires, hullCover (`armed`), hullCoverPunch (`fists`), repairCrane side (`pinch`).
2. Far holds: crowbarDoor B, takeTapHandle A, wireSwitchboard.
3. Front and back holds: searchCorpse, repairLift, tradeHoloPlan, tradeShipPart, crowbarDoor C, rebelShot D, missionStart and rebelShot enemies (`armed`).
4. pickEBlaster palm carry, unlockPlasma cup.

Each film change: spike first, then port, `npm run test:visual` cutscene cases stay ok.
