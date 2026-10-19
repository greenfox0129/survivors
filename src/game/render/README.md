# src/game/render/ — 저사양 렌더링 도구

| 파일 | 역할 |
|---|---|
| `quality.ts` | 그래픽 품질 설정 `auto/high/low` (localStorage `survivors_proto_settings`). `auto` 는 평균 프레임 간격이 `CONFIG.render.autoLowFrameMs`(24ms) 를 `autoLowAfterSec`(2s) 넘게 초과하면 세션 동안 low. `isLowQuality()` 로 장식 생략 여부 판단 |
| `sprites.ts` | `getRadialSprite()` — 색·반지름별 원형 그라디언트를 오프스크린 캔버스에 한 번 그려 캐시(최대 64개). `drawCentered()` |
| `background.ts` | 월드 배경 + 40px 그리드를 패턴 1장으로 그림 (선 ~45회 stroke → fillRect 1회) |

원칙과 근거(MDN·web.dev): [wiki/methodology/canvas-performance.md](../../../wiki/methodology/canvas-performance.md)
