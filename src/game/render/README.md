# src/game/render/ — 저사양 렌더링 도구

| 파일 | 역할 |
|---|---|
| `quality.ts` | 그래픽 품질 판단. 값은 `core/settings.ts`. `auto` 는 평균 프레임 간격이 `CONFIG.render.autoLowFrameMs`(24ms) 를 `autoLowAfterSec`(2s) 넘게 초과하면 세션 동안 low (100ms 넘는 간격·숨김 탭은 측정 제외). `isLowQuality()` 로 장식 생략 |
| `sprites.ts` | `getRadialSprite()` — 원형 그라디언트를 오프스크린에 한 번 그려 캐시(64개). `drawCentered()` |
| `iconSprites.ts` | `getIconSprite(name, color, size)` — SVG 아이콘을 틴트 + 1px 외곽선으로 한 번 굽고 캐시(128개). `getStarFxSprite()`, `preloadGameSprites()` |
| `effects.ts` | 처치 이펙트(Kenney 별, 0.18초, 최대 32개, 저사양 생략). `spawnKillPop/updateEffects/renderEffects/resetEffects` |
| `background.ts` | 월드 배경 + 40px 그리드를 패턴 1장으로 |

Nothing here touches the DOM at import time (images/canvases are created on first use) — keeps game modules importable in Node.
원칙과 근거: [wiki/methodology/canvas-performance.md](../../../wiki/methodology/canvas-performance.md)
