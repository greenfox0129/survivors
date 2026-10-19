# src/

게임 소스 전체. 두 층으로 나뉜다.

| 폴더/파일 | 역할 | React 사용 |
|---|---|---|
| [`game/`](game/README.md) | 게임 루프·엔티티·무기·데이터 — 순수 TypeScript | ✗ |
| [`ui/`](ui/README.md) | 로비·게임 화면·메타 성장 화면 | ✓ |
| `main.tsx` | 진입점. 원클릭 실행기 모드면 세이브 동기화 후 렌더 | ✓ |
| `App.tsx` | 화면 전환(`Screen` state)과 세이브 상태 보유 | ✓ |
| `gameInfo.ts` | 제목·부제·버전(`__APP_VERSION__`)·저장소 주소 — **한 곳에서만 수정** | ✗ |
| `launcherBridge.ts` | `?launcher=1` 로 열렸을 때 실행기와 ping/bye/세이브 미러 통신 | ✗ |
| `index.css` | Tailwind 진입 | — |
| `vite-env.d.ts` | Vite 타입 + `__APP_VERSION__` 선언 | — |

## 데이터 흐름

```
App (save state)
 ├─ Lobby / Gacha / Character / Traits / Codex / Achievements  ── saveSave() ──▶ localStorage (+ 실행기 디스크 미러)
 └─ GameCanvas ── new GameEngine(ctx, callbacks, save)
                     ├─ onStatsUpdate (≈6.7Hz) ─▶ HUD
                     ├─ onLevelUp(options)     ─▶ UpgradeModal ─▶ engine.applyUpgrade()
                     └─ onGameOver(stats)      ─▶ 골드·업적 정산 후 saveSave()
```

import 는 항상 `@/` 별칭을 쓴다 (`@/game/core/GameEngine`).
