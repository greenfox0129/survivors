# art/kali — Kali, the small fox beastkin

Walk sheet and portrait for 칼리. These two PNGs are the only files the game
ships (`scripts/sync-pixel-assets.mjs` copies them into `src/assets/pixel/`).

| File | Layout |
|---|---|
| `char-kali-walk.png` | 128×128 = 4 columns × 4 rows of 32×32 frames. Columns: down, up, left, right. Rows: walk frames. |
| `char-kali-face.png` | 38×38 portrait (same size as the other faces). |

Frames come from the official Universal LPC walk sheets (576×256, 9×4 of 64×64).
Walk frames 0, 2, 4, 6 of each direction were nearest-neighbour scaled to 32×32.
Row order on those sheets is up, left, down, right; the game sheet reorders them
to down, up, left, right. `drawUnit` uses the same 1.2 draw scale as Linya so the
padded LPC figure matches the 16px cast.

## What she is

A small fox woman: small female head, tall upright beige fox ears, a beige fox tail, and
long beige hair. Brown tunic, brown pants, and brown boots. The hair sheet was
repainted a brighter beige. The wolf ears were replaced with taller pointed
fox ears in the same beige, gathered toward the center of the head.
On the walk sheet the ears sit on the skull. The side view is one near ear
plus a shorter far ear touching it from behind. The portrait is unchanged.
Pants and boots were repainted brown. No text was added to the sprites.

## License — CC BY-SA 3.0

The body, hair, tunic, and pants are CC BY-SA, so this combined sprite is
**CC BY-SA 3.0**. Same exception as `art/linya/`, `art/euroan/`, and `art/cheon/`:
the packs already in the repo have no fox-person walk cycle.

Say you used Liberated Pixel Cup / Universal LPC art by the people below, and
link the license: https://creativecommons.org/licenses/by-sa/3.0/

| Layer | Author | Their license | Source |
|---|---|---|---|
| Female body (`body/bodies/female/walk.png`) | Benjamin K. Smith (BenCreating), bluecarrot16, TheraHedwig, Evert, MuffinElZangano, Durrani, Pierre Vigier (pvigier), ElizaWy, Matthew Krohn (makrohn), Johannes Sjölund (wulax), Stephen Challener (Redshrike) | OGA-BY 3.0, CC BY-SA 3.0, GPL 3.0 | https://opengameart.org/content/lpc-character-bases |
| Small female head (`head/heads/human/female_small/walk.png`) | ElizaWy, Stephen Challener (Redshrike) | OGA-BY 3.0, CC BY | https://opengameart.org/content/lpc-character-bases |
| Eyes, brown (`eyes/human/adult/default/walk/brown.png`) | Stephen Challener (Redshrike), Matthew Krohn (makrohn), JaidynReiman | OGA-BY 3.0, CC BY-SA 3.0, GPL 3.0 | https://github.com/LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator |
| Fox ears, tall and upright, gathered toward the crown | this project, on the beige ramp from the wolf ears | same sheet as the rest of Kali | — |
| Wolf tail, tan (`body/tail/wolf/adult/fg/walk/fur_tan.png`, `bg/walk/fur_tan.png`) | JaidynReiman | OGA-BY 3.0, CC BY 3.0, GPL 3.0 | https://opengameart.org/content/lpc-furry-ears-tails-for-rpg-sprites |
| Extra-long hair, repainted beige (`hair/xlong/female/walk.png`) | JaidynReiman, Nila122 | OGA-BY 3.0, CC BY-SA 3.0, GPL 2.0, GPL 3.0 | https://opengameart.org/content/lpc-expanded-xlong-hair |
| Tunic, brown (`torso/clothes/tunic/female/walk/brown.png`) | bluecarrot16, JaidynReiman, Matthew Krohn (makrohn), Marcel van de Steeg (MadMarcel), Stephen Challener (Redshrike), Johannes Sjölund (wulax) | OGA-BY 3.0, CC BY-SA 3.0, GPL 3.0 | https://opengameart.org/content/lpc-clothing-updates |
| Thin pants, repainted brown (`legs/pants/thin/walk.png`) | bluecarrot16, JaidynReiman, ElizaWy, Joe White, Matthew Krohn (makrohn), Johannes Sjölund (wulax), Stephen Challener (Redshrike) | OGA-BY 3.0, CC BY-SA 3.0, GPL 3.0 | https://opengameart.org/content/lpc-expanded-pants |
| Fold boots, repainted brown (`feet/boots/fold/thin/walk.png`) | JaidynReiman | OGA-BY 3.0, CC BY 3.0, GPL 3.0 | https://opengameart.org/content/lpc-expanded-socks-shoes |

Layers were taken from [Universal LPC Spritesheet Character Generator](https://github.com/LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator) (`spritesheets/`). Credits match that repo's `CREDITS.csv` where the file is listed. The brown eyes use the same authors as the other default adult eyes in this repo; that color file is not a separate row in the CSV. The female extra-long hair sheet is not a separate row either; it uses the adult xlong credit. Where a file is dual-licensed, this project uses CC BY-SA 3.0.
