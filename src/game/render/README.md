# src/game/render/ — 저사양 렌더링 도구

| 파일 | 역할 |
|---|---|
| `quality.ts` | 그래픽 품질 판단. 값은 `core/settings.ts`. `auto` 는 평균 프레임 간격이 `CONFIG.render.autoLowFrameMs`(24ms) 를 `autoLowAfterSec`(2s) 넘게 초과하면 세션 동안 low (100ms 넘는 간격·숨김 탭은 측정 제외). `isLowQuality()` 로 장식 생략 |
| `sprites.ts` | `getRadialSprite()` — 원형 그라디언트를 오프스크린에 한 번 그려 캐시(64개). `drawCentered()` |
| `iconSprites.ts` | `getIconSprite(name, color, size)` — SVG 아이콘을 틴트 + 1px 외곽선으로 한 번 굽고 캐시(128개). `getStarFxSprite()`, `preloadGameSprites()` |
| `effects.ts` | 처치 이펙트(Kenney 별, 0.18초, 최대 32개, 저사양 생략). `spawnKillPop/updateEffects/renderEffects/resetEffects` |
| `background.ts` | 월드 배경 + 40px 그리드를 패턴 1장으로 (**저사양**·로딩 중 배경) |
| `decor.ts` | 저사양이 아닐 때 타일 월드가 아직 없으면 쓰는 실루엣 장식 (원래 구현) |
| `pixel.ts` | 픽셀 아트 헬퍼 (**높음 품질 전용**): `getPixelImage`(지연 로딩), `drawUnit`(4×4 걷기 시트 한 프레임 + 그림자, 틴트는 1회 캐시), `drawStrip`(가로 프레임 스트립, 회전), `facingFromVector`, `drawShadow`. 스무딩 끄고 그린 뒤 복구. 이미지 로딩 전엔 false → 호출 측이 원래 도형으로 그림 |
| `tileWorld.ts` | 포켓몬식 타일 월드: 16×16 타일 청크를 좌표 해시로 생성(풀·흙빈터·키 큰 풀·꽃·돌·그루터기·나무) → 256px 오프스크린에 **한 번** 그려 LRU 24개 캐시 → 프레임당 청크 4–6개 drawImage. 충돌 없음(바닥 장식) |

품질별 그림: **높음** = 타일 월드 + 유닛/무기/보석 픽셀 스프라이트 (`src/assets/pixel`), **저사양** = 원래 벡터 룩
(그리드 배경·도형 적·원 플레이어·아이콘 무기)을 그대로 유지. 각 render 함수는 `!isLowQuality()` 일 때
픽셀 경로를 먼저 시도하고, 실패(로딩 중)하면 원래 코드로 떨어진다.

Nothing here touches the DOM at import time (images/canvases are created on first use) — keeps game modules importable in Node.
원칙과 근거: [wiki/methodology/canvas-performance.md](../../../wiki/methodology/canvas-performance.md)
