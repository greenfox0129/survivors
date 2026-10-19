# src/game/ — 순수 게임 로직

React·DOM 컴포넌트에 의존하지 않는다 (캔버스 2D 컨텍스트만 받음). UI와는 `GameEngine`의 공개 메서드와
`GameCallbacks`(통계·레벨업·게임오버)로만 연결된다.

| 폴더 | 내용 | 수정 빈도 |
|---|---|---|
| [`core/`](core/README.md) | `GameEngine`(루프·충돌·통합), 공용 타입, 세이브, 사운드 | 낮음 |
| [`data/`](data/README.md) | **밸런스·콘텐츠 데이터** (무기/적/장신구 수치, 진화, 캐릭터·특성·업적) | **높음** |
| [`entities/`](entities/README.md) | 플레이어, 적 스폰·이동·렌더, 경험치 보석 | 중간 |
| [`systems/`](systems/README.md) | 무기/장신구 관리, 레벨업 선택지, 메타 배율 계산 | 중간 |
| [`weapons/`](weapons/README.md) | 무기 7종 구현 + **등록표 `registry.ts`** | 무기 추가 시 |
| [`render/`](render/README.md) | 저사양 렌더링 도구 (품질 판단, 스프라이트·아이콘 캐시, 이펙트, 배경) | 낮음 |

## 한 프레임의 순서 (`GameEngine.loop`)

1. FPS 상한 확인(`CONFIG.render.fpsCap`) → dt 계산(최대 0.05s로 클램프)
2. 일시정지/사망이면 정지 화면 1장만 그리고 종료
3. `update(dt)`: 패시브 배율 갱신 → 플레이어 이동 → 적 스폰·이동 → 접촉 피해/반사 → 재생 →
   무기 update → 보상 드롭(+처치 이펙트) → 죽은/먼 적 정리 → 보석 흡수·병합 → 경험치 → 레벨업 큐 → 통계(0.15s마다)
4. `render()`: 배경(패턴) → 보석(보물 상자 아이콘) → 적 → 처치 이펙트 → 엘리트 왕관 → 무기(renderOrder 순) → 플레이어(엠블럼)

## 의존 방향

`data` ← `entities` ← `weapons` ← `systems` ← `core/GameEngine`
(`render/` 는 어디서나 쓰는 도구. `data/` 는 로직을 import 하지 않는다.)
