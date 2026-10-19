# src/assets/ — bundled art (imported by code, hashed by Vite, embedded in the exe)

| Folder | What | License |
|---|---|---|
| `icons/` | 62 single-color SVG icons (`fill="currentColor"`, no background, 512×512) | game-icons.net, CC BY 3.0 — authors per icon in `icons/credits.json` |
| `icons/index.ts` | `iconUrl(name)` — file name → bundled URL (via `import.meta.glob`) | — |
| `icons/map.ts` | Semantic mapping: `weaponIcon`, `accessoryIconName`, `enemyIcon`, `characterIcon`, `traitIcon`, `UI_ICONS` | — |
| `fx/star.png` | Kill-pop texture (white alpha, tinted at runtime) | Kenney Particle Pack, CC0 |

Usage
- UI: `<GameIcon name={weaponIcon("claw", true)} color="#84cc16" size={24} />`
- Canvas: `getIconSprite(name, color, size)` from `game/render/iconSprites.ts` (tinted + outlined once, cached)

Naming: `weapon-<type>[-evo]`, `acc-<type>`, `enemy-<id>`, `char-<id>`, `trait-<id>`, `menu-<screen>`, `stat-<name>`, `ui-<name>`.
Adding an icon: same SVG format, add the author to `credits.json` and `wiki/design/assets/CREDITS.md`
(and the lobby credit line if it's a new author). Static files referenced by absolute URL (`/assets/...`) live in `public/` instead.
