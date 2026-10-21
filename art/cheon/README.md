# art/cheon — Cheon, black-haired male

Walk sheet and portrait for 천. These two PNGs are the only files the game
ships (`scripts/sync-pixel-assets.mjs` copies them into `src/assets/pixel/`).

| File | Layout |
|---|---|
| `char-cheon-walk.png` | 128×128 = 4 columns × 4 rows of 32×32 frames. Columns: down, up, left, right. Rows: walk frames. |
| `char-cheon-face.png` | 38×38 portrait (same size as the other faces). |

Frames come from the official Universal LPC walk sheets (576×256, 9×4 of 64×64).
Walk frames 0, 2, 4, 6 of each direction were nearest-neighbour scaled to 32×32.
Row order on those sheets is up, left, down, right; the game sheet reorders them
to down, up, left, right. `drawUnit` uses the same 1.2 draw scale as Linya so the
padded LPC figure matches the 16px cast.

## What he is

A black-haired man in a black sleeveless shirt, dark pants, and dark boots.
The hair sheet is messy2, recolored from its orange ramp to black. Pants and
boots were recolored dark. Eyes are the gray adult set, darkened. No text was
added to the sprites.

## License — CC BY-SA 3.0

The body, head, hair, shirt, pants, and boots are CC BY-SA, so this combined
sprite is **CC BY-SA 3.0**. Same exception as `art/linya/` and `art/euroan/`:
the packs already in the repo have no black-haired male walk cycle.

Say you used Liberated Pixel Cup / Universal LPC art by the people below, and
link the license: https://creativecommons.org/licenses/by-sa/3.0/

| Layer | Author | Their license | Source |
|---|---|---|---|
| Male body (`body/bodies/male/walk.png`) | bluecarrot16, JaidynReiman, Benjamin K. Smith (BenCreating), Evert, Eliza Wyatt (ElizaWy), TheraHedwig, MuffinElZangano, Durrani, Johannes Sjölund (wulax), Stephen Challener (Redshrike) | OGA-BY 3.0, CC BY-SA 3.0, GPL 3.0 | https://opengameart.org/content/lpc-character-bases |
| Male head (`head/heads/human/male/walk.png`) | bluecarrot16, Benjamin K. Smith (BenCreating), Stephen Challener (Redshrike) | OGA-BY 3.0, CC BY-SA 3.0, GPL 3.0 | https://opengameart.org/content/lpc-character-bases |
| Eyes, gray, darkened (`eyes/human/adult/default/walk/gray.png`) | Stephen Challener (Redshrike), Matthew Krohn (makrohn), JaidynReiman | OGA-BY 3.0, CC BY-SA 3.0, GPL 3.0 | https://github.com/LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator |
| Messy hair, recolored black (`hair/messy2/adult/walk.png`) | JaidynReiman, Manuel Riecke (MrBeast) | CC BY-SA 3.0, GPL 3.0 | https://opengameart.org/content/lpc-expanded-hair |
| Sleeveless shirt, black (`torso/clothes/sleeveless/sleeveless/male/walk/black.png`) | bluecarrot16, Matthew Krohn (makrohn), JaidynReiman, Marcel van de Steeg (MadMarcel), Nila122, Johannes Sjölund (wulax), Stephen Challener (Redshrike) | OGA-BY 3.0, CC BY-SA 3.0, GPL 3.0 | https://opengameart.org/content/lpc-pirates |
| Pants, recolored dark (`legs/pants/male/walk.png`) | bluecarrot16, JaidynReiman, ElizaWy, Matthew Krohn (makrohn), Johannes Sjölund (wulax), Stephen Challener (Redshrike) | OGA-BY 3.0, CC BY-SA 3.0, GPL 3.0 | https://opengameart.org/content/lpc-expanded-pants |
| Basic boots, recolored dark (`feet/boots/basic/male/walk.png`) | JaidynReiman, bluecarrot16, Nila122 | OGA-BY 3.0, CC BY-SA 3.0, GPL 2.0, GPL 3.0 | https://opengameart.org/content/lpc-expanded-socks-shoes |

Layers were taken from [Universal LPC Spritesheet Character Generator](https://github.com/LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator) (`spritesheets/`). Credits match that repo's `CREDITS.csv` where the file is listed. The gray eyes use the same authors as the other default adult eyes in this repo; that color file is not a separate row in the CSV. Where a file is dual-licensed, this project uses CC BY-SA 3.0.
