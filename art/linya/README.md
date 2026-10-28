# art/linya — Linya

The game ships two pictures from this folder (`scripts/sync-pixel-assets.mjs`
copies them into `src/assets/pixel/`).

| File | Layout |
|---|---|
| `char-linya-run.png` | 384×48 = 8 frames of 48×48, all facing right. Played while she moves. Looking left flips the frame. |
| `char-linya-idle.png` | 32×32, facing right. Shown while she stands, and used as her portrait. Looking left flips the in-game frame. |

The run and the idle are the same pixel size: the body is about 30px tall and the
feet sit about 14px below the frame center, so one scale lines them up.
`char-linya-walk.png` is the old four-direction LPC sheet, and `char-linya-face.png` is the old LPC portrait. Neither is copied into the game anymore.

## Run and idle

These two pictures were supplied for this project. They are not Universal LPC art
and they are not covered by the license below.

## Old portrait — CC BY-SA 3.0

`char-linya-face.png` stays in this folder and is not shipped. It is the cat beastkin composited from Universal LPC layers. The body and the eyes are CC BY-SA, so that file is **CC BY-SA 3.0**.

Say you used Liberated Pixel Cup / Universal LPC art by the people below, and
link the license: https://creativecommons.org/licenses/by-sa/3.0/

| Layer | Author | Their license | Source |
|---|---|---|---|
| Female body (`light`) | Benjamin K. Smith (BenCreating), bluecarrot16, TheraHedwig, Evert, MuffinElZangano, Durrani, Pierre Vigier (pvigier), ElizaWy, Matthew Krohn (makrohn), Johannes Sjölund (wulax), Stephen Challener (Redshrike) | CC BY-SA 3.0, GPL 3.0, OGA-BY 3.0 | https://opengameart.org/content/lpc-character-bases |
| Small female head (`light`) | ElizaWy, Stephen Challener (Redshrike) | OGA-BY 3.0, CC BY | https://opengameart.org/content/lpc-character-bases |
| Eyes (`green`) | Stephen Challener (Redshrike), Matthew Krohn (makrohn), JaidynReiman | CC BY-SA 3.0, GPL 3.0, OGA-BY 3.0 | https://opengameart.org/content/liberated-pixel-cup-lpc-base-assets-sprites-map-tiles |
| Bob hair (`black`) | bluecarrot16, ElizaWy | CC0 | https://opengameart.org/content/lpc-hair |
| Cat ears, cat tail (`black`) | JaidynReiman | CC BY 3.0, OGA-BY 3.0, GPL 3.0 | https://opengameart.org/content/lpc-furry-ears-tails-for-rpg-sprites |
| Kimono (`pink`) | JaidynReiman | CC BY 3.0, OGA-BY 3.0, GPL 3.0 | Universal LPC spritesheet generator |
| Fold boots (`black`) | JaidynReiman | CC BY 3.0, OGA-BY 3.0, GPL 3.0 | Universal LPC spritesheet generator |

Layers were taken from [Universal LPC Spritesheet Character Generator](https://github.com/sanderfrenken/Universal-LPC-Spritesheet-Character-Generator) (`spritesheets/`). Where a file is dual-licensed, the license named above is the one this project uses.
