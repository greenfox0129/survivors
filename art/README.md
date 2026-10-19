# art/ — source pixel-art packs (not bundled as-is)

Full CC0 packs kept in the repo as a sprite library. The game only ships the files
listed in `scripts/sync-pixel-assets.mjs`, which copies them into `src/assets/pixel/`
(`npm run assets:pixel`). Nothing here is imported directly by code.

| Folder | Pack | Author | License | Fetched from |
|---|---|---|---|---|
| `ninja-adventure/` | Ninja Adventure Asset Pack (characters, monsters, bosses, tilesets, FX, items, UI) | Pixel-boy & AAA — [itch.io page](https://pixel-boy.itch.io/ninja-adventure-asset-pack) | CC0 (`ninja-adventure/LICENSE.txt`) | GitHub mirror `Untersander/Gladiator` (`assets/Ninja Adventure - Asset Pack`) |
| `0x72-dungeon-ii/` | 16×16 DungeonTileset II v1.7 (dungeon tiles, heroes, monsters, items; `tile_list_v1.7` = sprite rects) | 0x72 — [itch.io page](https://0x72.itch.io/dungeontileset-ii) | CC0 (stated on the itch.io page) | GitHub mirror `veroteknic/godot2d` (`map/`) |

## Using a sprite

1. Find it here (Ninja Adventure layout: `Actor/<Characters|Monsters>/<Name>/` → 64×64 walk sheet,
   4 columns = down/up/left/right, 4 rows = frames; `Faceset.png` 38×38 portrait; FX/projectiles are
   horizontal frame strips).
2. Add a `[dest, src]` line to `scripts/sync-pixel-assets.mjs`, run `npm run assets:pixel`.
3. Strips: add the frame width to `STRIP_FRAME_W` in `src/assets/pixel/catalog.ts`.
4. Draw with `game/render/pixel.ts` (`drawUnit`, `drawStrip`) or `ui/components/PixelSprite.tsx`.
5. Credit line in `wiki/design/assets/CREDITS.md` if it comes from a new pack.

Only CC0 / CC-BY packs belong here. Images only — no scripts or executables from downloaded packs.
