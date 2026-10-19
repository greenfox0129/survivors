# Canvas 2D 성능 — 저사양 원칙

> 목표: 내장 그래픽 노트북(1366×768)에서 60fps. 렌더링은 "싸고 또렷하게".

## 근거 자료 요약

| 출처 | 요점 | 우리 적용 |
|---|---|---|
| [MDN — Optimizing canvas](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas) | 반복 그리기는 오프스크린 캔버스에 미리 그려 재사용, 호출은 묶어서(batch), `shadowBlur` 는 피하라, 투명이 필요 없으면 `alpha: false` | `render/sprites.ts`, `render/iconSprites.ts`, 트랩 가시 배칭, 브레스 shadowBlur 제거, `getContext("2d", {alpha:false})` |
| [web.dev — Canvas performance](https://web.dev/articles/canvas-performance) | 비슷한 것을 여러 프레임 그리면 미리 렌더(pre-render)로 큰 이득, 결과는 하드웨어 가속 여부에 좌우됨 → 직접 측정 | 그리드를 패턴 1장으로, 오오라·잔불 그라디언트 캐시 |
| [hyring — Canvas shadows](https://hyring.com/learn/canvas/shadows) | 큰 shadowBlur 는 매 프레임 블러를 다시 계산해 느리다, 그림자를 한 번 구워 이미지로 재사용 | 아이콘 외곽선은 8방향 1px 복사로 한 번만 굽는다 |

## 이 코드의 규칙

| ❌ 하지 말 것 | ✅ 대신 |
|---|---|
| 매 프레임 `ctx.shadowBlur`, `ctx.filter` | 반투명 굵은 선으로 halo / 필터는 오프스크린에 1회 적용 (발톱 이미지 반전) |
| 매 프레임 `createRadialGradient` 로 큰 원 채우기 | `getRadialSprite(radius, stops)` → `drawImage` |
| 같은 스타일 선 N개에 `stroke()` N번 | path 하나에 모아 `stroke()` 1번 |
| 루프 안 `Date.now()`·`performance.now()` 반복 | 함수 시작에서 1번 |
| 매 프레임 배열/객체 대량 생성 | in-place 컬링(`cull*`), 미리 정의된 상수 객체(보석 등급) |
| 정지 중 계속 렌더 | `frozenFrameDrawn` — 1장만 |
| 아이콘을 매 프레임 SVG로 그리기 | 색·크기별로 한 번 틴트한 캔버스 스프라이트 캐시 (`getIconSprite`) |
| 장식을 무조건 그리기 | `isLowQuality()` 일 때 생략 (잔불, 깜빡임, 광채, 처치 이펙트, 흡수 반경) |

## 품질 단계

`render/quality.ts` — 자동/높음/저사양. 자동은 평균 프레임 간격이 24ms(≈42fps)를 2초 넘게 초과하면
세션 동안 저사양. 100ms 넘는 간격(탭 숨김·스로틀링)은 측정에서 제외해 오판을 막는다.

## 측정 방법

1. 개발 서버 → Chrome/Edge DevTools → Performance → **CPU 4× slowdown** 으로 녹화
2. 2분 이상 플레이(적 100+ 상태)에서 프레임 시간 확인 — 16.7ms 이하가 목표
3. `edge://gpu` 에서 Canvas 하드웨어 가속 여부 확인 (꺼져 있으면 결과가 크게 다르다)
4. 그래픽 버튼을 "저사양"으로 바꿔 차이 확인

## 다음 단계 후보 (필요해지면)

| 기법 | 언제 | 메모 |
|---|---|---|
| 공간 분할(spatial hash) | 적 300+ 또는 투사체×적 충돌이 병목일 때 | Game Programming Patterns — Spatial Partition |
| 객체 풀(object pool) | GC 멈칫이 보일 때 | 투사체·보석 객체 재사용 (Game Programming Patterns — Object Pool) |
| 레이어 분리 캔버스 | 정적 배경이 커질 때 | 배경 캔버스 + 동적 캔버스 2장 |
| OffscreenCanvas + Worker | 메인 스레드가 UI로 바쁠 때 | Edge/Chrome 지원, 구조 변경 큼 |

## 커뮤니티 경험 (요약)

- 적을 무작정 늘리면 어느 순간 급락한다 — "수"보다 "강한 적"으로 난이도를 올리는 편이 성능에 유리. ([itch.io 토론](https://itch.io/post/12756916))
- 화면 밖 오래 있는 적은 정리한다 (VS 도 그렇게 한다는 커뮤니티 관찰). ([Construct 포럼](https://www.construct.net/en/forum/users/moebios-34541/posts/page-4))
- 자세한 목록: [community](../community/README.md)
