# 게임 루프와 시간 (Game Loop & Timestep)

## 현재 구현 (`src/game/core/GameEngine.ts`)

```
requestAnimationFrame(loop)
  ├─ FPS 상한 (CONFIG.render.fpsCap = 60, 2ms 여유)  → 고주사율 모니터에서 프레임 건너뜀
  ├─ dt = min(경과시간, 0.05s)                       → 가변 타임스텝 + 클램프
  ├─ 일시정지/레벨업/사망이면: 정지 화면 1장만 그리고 끝
  └─ update(dt) → render()
```

| 결정 | 이유 | 대가 |
|---|---|---|
| 가변 dt | 구현 단순, 원본 구조 유지 | 프레임에 따라 결과가 미세하게 달라짐 (재현 불가) |
| dt 0.05 클램프 | 탭 복귀·멈춤 후 한 번에 큰 이동(터널링) 방지 | 20fps 미만이면 게임이 느려짐 ([KI-07](../direction/known-issues.md#ki-07)) |
| FPS 상한 60 | 144Hz 모니터에서 2.4배 렌더 방지 → 저사양·노트북 배터리 | 고주사율 부드러움 포기 |
| 정지 시 재렌더 안 함 | 모달 뒤 캔버스를 계속 그리면 GPU가 놀지 않음 | 정지 중 애니메이션 없음 (의도) |
| 통계 콜백 0.15초 간격 | React 재렌더 비용 절감 | HUD 숫자가 약간 늦게 갱신 |

## 고정 타임스텝으로 바꿔야 할 때

Glenn Fiedler 의 방식: 실제 경과 시간을 누산기에 쌓고, 고정 dt(예: 1/60)로 여러 번 update 한 뒤
남은 비율로 렌더를 보간한다. 프레임 시간이 너무 길면 상한을 둬서 "죽음의 나선"을 막는다.
([Fix Your Timestep!](https://gafferongames.com/post/fix_your_timestep/))

전환 신호:
- 리플레이·고스트·동기화(멀티) 같은 **결정론**이 필요할 때
- 저프레임에서 게임이 느려지는 게 문제가 될 때(KI-07)

전환 시 주의: 모든 무기·적 업데이트가 이미 `dt` 를 인자로 받으므로 엔진 루프만 바꾸면 된다.
`Math.random()` 은 시드 가능한 RNG로 교체해야 결정론이 생긴다.

## 일시정지 종류

| 종류 | 플래그 | 해제 |
|---|---|---|
| 레벨업 | `paused` | 선택 시(`applyUpgrade`) — 대기 중 레벨업이 있으면 다음 선택지 |
| 플레이어 | `userPaused` | ESC/P, 계속하기. 창 포커스를 잃으면 자동으로 걸림 |
| 사망 | `player.alive=false` | 다시 시작(`reset`) |

## 헤드리스 시뮬레이션

`update()` 는 캔버스를 쓰지 않으므로 Node 에서 돌릴 수 있다 → `npm run sim` (Vite SSR 로 실제 모듈 로드).
렌더 코드는 DOM에 의존하지만 모두 **지연 로딩**(첫 render 때 이미지 생성)이라 import 만으로는 실패하지 않는다.
이 성질을 깨지 않도록 모듈 최상단에서 `new Image()`/`document` 를 쓰지 말 것.
