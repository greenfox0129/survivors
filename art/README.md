# art/ — source pixel-art packs (not bundled as-is)

Full CC0 packs kept in the repo as a sprite library. The game only ships the files
listed in `scripts/sync-pixel-assets.mjs`, which copies them into `src/assets/pixel/`
(`npm run assets:pixel`). Nothing here is imported directly by code.

| Folder | Pack | Author | License | Fetched from |
|---|---|---|---|---|
| `ninja-adventure/` | Ninja Adventure Asset Pack (characters, monsters, bosses, tilesets, FX, items, UI). **Current game style.** | Pixel-boy & AAA — [itch.io page](https://pixel-boy.itch.io/ninja-adventure-asset-pack) | CC0 (`ninja-adventure/LICENSE.txt`) | GitHub mirror `Untersander/Gladiator` (`assets/Ninja Adventure - Asset Pack`) |
| `0x72-dungeon-ii/` | 16×16 DungeonTileset II v1.7 (one sheet: dungeon tiles, heroes, monsters, items; `tile_list_v1.7` = sprite rects) | 0x72 — [itch.io page](https://0x72.itch.io/dungeontileset-ii) | CC0 (stated on the itch.io page) | GitHub mirror `veroteknic/godot2d` (`map/`) |
| `kenney-tiny-dungeon/` | 16×16 dungeon tiles, monsters, items, characters (`Tiles/`, 132 sprites) | Kenney — [kenney.nl](https://kenney.nl/assets/tiny-dungeon) | CC0 (`License.txt`) | kenney.nl zip |
| `kenney-roguelike-characters/` | 16×16 roguelike character sheet (`Spritesheet/`, 1px margin) | Kenney — [kenney.nl](https://kenney.nl/assets/roguelike-characters) | CC0 (`License.txt`) | kenney.nl zip |
| `kenney-roguelike-rpg/` | 16×16 roguelike RPG sheet: floors, walls, monsters, items (`Spritesheet/`, 1px margin) | Kenney — [kenney.nl](https://kenney.nl/assets/roguelike-rpg-pack) | CC0 (`License.txt`) | kenney.nl zip |
| `kenney-tiny-town/` | 16×16 top-down town tiles and props (`Tiles/`, 132 sprites) | Kenney — [kenney.nl](https://kenney.nl/assets/tiny-town) | CC0 (`License.txt`) | kenney.nl zip |
| `kenney-pixel-shmup/` | 16×16 ships and projectile tiles (`Ships/`, `Tiles/`) | Kenney — [kenney.nl](https://kenney.nl/assets/pixel-shmup) | CC0 (`License.txt`) | kenney.nl zip |
| `kenney-particle-pack/` | Full particle set, black and transparent PNGs. The game ships only the few textures in `src/assets/fx/` | Kenney — [kenney.nl](https://kenney.nl/assets/particle-pack) | CC0 (`License.txt`) | kenney.nl zip |

## Where to look

Search this folder before downloading anything else.

| Need | Look here first |
|---|---|
| Character or enemy that matches the current pixel style | `ninja-adventure/Actor/Characters`, `Actor/Monsters`, `Actor/Boss` |
| Another 16×16 monster, item, or dungeon tile | `kenney-tiny-dungeon/Tiles`, `kenney-roguelike-rpg/Spritesheet`, `0x72-dungeon-ii/` |
| Another 16×16 character | `kenney-roguelike-characters/Spritesheet` |
| Town / outdoor prop | `kenney-tiny-town/Tiles` |
| Projectile or ship | `ninja-adventure/FX/Projectile`, then `kenney-pixel-shmup/` |
| Explosion, flame, spark, smoke | `kenney-particle-pack/PNG (Transparent)` |

Humanoid walk cycles that none of these packs have (a beastkin, a specific haircut) still come from the
[Universal LPC Spritesheet Character Generator](https://github.com/LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator)
(`spritesheets/`). Credits and the license of each layer are in that repo's `CREDITS.csv`.
Layers are mixed CC0, CC-BY, and CC-BY-SA, so credit every layer that ends up in the
image and name the resulting license (`art/linya/`, `art/euroan/`, `art/cheon/`, and `art/kali/` are the examples). Ship only the frames
the game uses. Do not copy the generator's scripts into this repo.

## Using a sprite

1. Find it here (Ninja Adventure layout: `Actor/<Characters|Monsters>/<Name>/` → 64×64 walk sheet,
   4 columns = down/up/left/right, 4 rows = frames; `Faceset.png` 38×38 portrait; FX/projectiles are
   horizontal frame strips).
2. Add a `[dest, src]` line to `scripts/sync-pixel-assets.mjs`, run `npm run assets:pixel`.
3. Strips: add the frame width to `STRIP_FRAME_W` in `src/assets/pixel/catalog.ts`.
4. Draw with `game/render/pixel.ts` (`drawUnit`, `drawStrip`) or `ui/components/PixelSprite.tsx`.
5. Credit line in `wiki/design/assets/CREDITS.md` if it comes from a new pack.

Only CC0 / CC-BY packs belong here, except `linya/`, `euroan/`, `cheon/`, and `kali/`. Those characters
are CC BY-SA 3.0 because the LPC layers are share-alike, and the packs here have
no cat-person, red-haired male, black-haired messy, or fox-person walk cycle. Credits are in each folder's README.
Images only — no scripts or executables from downloaded packs.
