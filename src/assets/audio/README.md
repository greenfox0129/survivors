# src/assets/audio/

| File | What |
|---|---|
| `lobby-bgm.mp3` | Lobby music. Loops on every screen except the run itself. Supplied by the user. |
| `ingame-bgm.mp3` | Run music. Loops from the start of each run, and stops when the run is left. Supplied by the user. |

Imported from `src/ui/bgm.ts`. Vite bundles both files, and `build:exe` embeds them. Volume and mute follow the existing sound setting.
