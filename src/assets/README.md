# src/assets/ — bundled art (imported by code, hashed by Vite, embedded in the exe)

| Folder | What | License |
|---|---|---|
| `icons/` | 74 single-color SVG icons (`fill="currentColor"`, no background, 512×512) | game-icons.net, CC BY 3.0 — authors per icon in `icons/credits.json` |
| `icons/index.ts` | `iconUrl(name)` — file name → bundled URL (via `import.meta.glob`) | — |
| `icons/map.ts` | Semantic mapping: `weaponIcon`, `accessoryIconName`, `enemyIcon`, `characterIcon`, `traitIcon`, `UI_ICONS` | — |
| `pixel/` | Pixel-art sprites used on **high** quality: `units/` (4×4 walk sheets: characters + enemies), `faces/` (38×38 portraits for the UI), `tiles/` (ground/nature tilesets for the world), `proj/` `fx/` `items/` (horizontal frame strips). `index.ts` = name → URL, `catalog.ts` = slicing + id → sheet mapping. **Generated** by `npm run assets:pixel` from `art/` — edit the list in `scripts/sync-pixel-assets.mjs`, not the files | Ninja Adventure (Pixel-boy & AAA), CC0 |
| `fx/*.png` | FX textures (white alpha, tinted at runtime): star (kill), light_02 (level-up), muzzle_02 (rifle), fire_01 (explosion), flame_01 (burn field), scorch_02/spark_04 (spare) | Kenney Particle Pack, CC0 |
| `audio/` | `lobby-bgm.mp3` loops outside a run. `ingame-bgm.mp3` loops during a run | user supplied |

Usage
- UI: `<GameIcon name={weaponIcon("claw", true)} color="#84cc16" size={24} />`, portraits `<PixelFace kind="char" id="mage" size={48} />`
- Canvas pixel art: `drawUnit` / `drawStrip` from `game/render/pixel.ts` (high quality only; low quality keeps the SVG/shape look)
- Canvas: `getIconSprite(name, color, size)` from `game/render/iconSprites.ts` (tinted + outlined once, cached)

Naming: `weapon-<type>[-evo]`, `acc-<type>`, `enemy-<id>`, `char-<id>`, `trait-<id>`, `menu-<screen>`, `stat-<name>`, `ui-<name>`.
Adding an icon: same SVG format, add the author to `credits.json` and `wiki/design/assets/CREDITS.md`
(and the lobby credit line if it's a new author). Static files referenced by absolute URL (`/assets/...`) live in `public/` instead.
