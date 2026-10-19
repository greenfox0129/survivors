# src/

게임 소스 전체.

| 폴더/파일 | 역할 | React 사용 |
|---|---|---|
| [`game/`](game/README.md) | 게임 루프·엔티티·무기·데이터 — 순수 TypeScript | ✗ |
| [`ui/`](ui/README.md) | 로비·게임 화면·메타 성장 화면 | ✓ |
| [`assets/`](assets/README.md) | 번들되는 그림 (아이콘 SVG, 이펙트 텍스처) + 의미 매핑 | ✗ |
| `main.tsx` | 진입점. 원클릭 실행기 모드면 세이브 동기화 후 렌더 | ✓ |
| `App.tsx` | 화면 전환(`Screen` state)과 세이브 상태 보유 | ✓ |
| `gameInfo.ts` | 제목·부제·버전(`__APP_VERSION__`) — **한 곳에서만 수정** | ✗ |
| `launcherBridge.ts` | `?launcher=1` 로 열렸을 때 실행기와 ping/bye/세이브 미러 통신 | ✗ |
| `index.css` | Tailwind 진입 | — |
| `vite-env.d.ts` | Vite 타입 + `__APP_VERSION__` 선언 | — |

## 데이터 흐름

```
App (save state)
 ├─ Lobby / Gacha / Character / Traits / Codex / Achievements  ── saveSave() ──▶ localStorage (+ 실행기 디스크 미러)
 └─ GameCanvas ── new GameEngine(ctx, callbacks, save)
                     ├─ onStatsUpdate (≈6.7Hz) ─▶ HUD
                     ├─ onLevelUp(options)     ─▶ UpgradeModal ─▶ engine.applyUpgrade()  (대기 레벨업이 있으면 다음 선택지)
                     └─ onGameOver(stats)      ─▶ 골드·업적 정산 후 saveSave()
     ESC/P · 포커스 상실 ─▶ engine.setUserPaused(true) ─▶ 일시정지 메뉴 (SettingsPanel)
```

import 는 항상 `@/` 별칭 (`@/game/core/GameEngine`). 게임은 네트워크 요청을 하지 않는다.
