# 기능 명세 (Feature Specs)

현재 구현(v0.1.0)을 기준으로 한 명세. **규칙·동작**은 아래 문서에, **수치**는 코드에서 자동 생성된 `generated/` 에 있다.

## 시스템 명세

| 문서 | 다루는 것 |
|---|---|
| [core-loop.md](core-loop.md) | 한 판의 흐름, 이동·카메라, 시간·스코어·골드, 레벨업·리롤·보물 상자, 경험치 보석 |
| [combat.md](combat.md) | 무기 7종 동작, 진화 규칙, 장신구, 피해 계산식, 패시브 |
| [enemies-spawning.md](enemies-spawning.md) | 적 13종, 스폰 곡선, 엘리트, 추적·가속, 접촉·원거리 피해, 컬링 |
| [meta-progression.md](meta-progression.md) | 골드, 뽑기, 캐릭터 레벨·각성·돌파, 특성, 업적·해금 |
| [ui-flow.md](ui-flow.md) | 화면 흐름, HUD, 레벨업 모달, 게임오버, 도감 |
| [save-settings-launcher.md](save-settings-launcher.md) | 세이브 스키마·마이그레이션, 그래픽 설정, 원클릭 실행기 |

## 자동 생성 수치표 — `npm run docs:spec`

| 문서 | 내용 |
|---|---|
| [generated/weapons.md](generated/weapons.md) | 무기별 Lv1–8 + 진화 수치, 진화 조건 |
| [generated/accessories.md](generated/accessories.md) | 장신구 Lv1–5 효과, 진화 짝 |
| [generated/enemies.md](generated/enemies.md) | 적 스탯·등장 시간·스폰 파라미터·엘리트 배율 |
| [generated/leveling.md](generated/leveling.md) | 경험치 곡선 Lv1–30, 플레이어 기본값, 스코어·골드 공식 |
| [generated/meta.md](generated/meta.md) | 캐릭터 배율·패시브, 특성 비용, 업적, 뽑기·강화·돌파 비용 |

## 기능 목록 (Feature List)

| ID | 기능 | 상태 | 명세 |
|---|---|---|---|
| F-01 | 8방향 이동, 무한 월드, 카메라 추적 | ✅ 구현 | core-loop |
| F-02 | 자동 공격 무기 7종 (Lv1–8) | ✅ | combat |
| F-03 | 무기 진화 (Lv8 + 짝 장신구, 최종형) | ✅ (v0.1.0 수치·설명 불일치 수정) | combat, [known-issues](../direction/known-issues.md) |
| F-04 | 장신구 9종 (Lv1–5) | ✅ | combat |
| F-05 | 레벨업 3지선다 + 리롤 | ✅ | core-loop |
| F-06 | 적 13종 시간차 등장 + 엘리트 | ✅ | enemies-spawning |
| F-07 | 경험치 보석 흡수·병합 | ✅ | core-loop |
| F-08 | 보물 상자 → 추가 레벨업 | ✅ | core-loop |
| F-09 | 골드·캐릭터 뽑기·강화·돌파 | ✅ | meta-progression |
| F-10 | 특성(영구 강화) | ✅ | meta-progression |
| F-11 | 업적·특수 캐릭터 해금 | ✅ | meta-progression |
| F-12 | 도감 | ✅ | ui-flow |
| F-13 | 효과음 (WebAudio 합성) | ✅ | — |
| F-14 | 그래픽 품질 자동/수동 | ✅ v0.1.0 | save-settings-launcher |
| F-15 | 세이브 스키마 마이그레이션 | ✅ v0.1.0 | save-settings-launcher |
| F-16 | 원클릭 exe + 디스크 세이브 미러 | ✅ v0.1.0 | save-settings-launcher |
| F-17 | 레벨업 큐 (한 번에 여러 레벨 → 선택지 여러 번) | ✅ v0.1.0 | core-loop |
| F-18 | 일시정지(ESC/P·포커스 상실)·설정(그래픽·효과음) | ✅ v0.1.0 | core-loop, ui-flow |
| F-21 | 아이콘 에셋 전 화면 적용 + 캔버스 표식 | ✅ v0.1.0 | ui-flow, [design](../design/README.md) |
| F-19 | 보스·스테이지 목표 시간(승리 조건) | ❌ 없음 | 로드맵 (게임 디자인 결정 필요) |
| F-20 | 게임패드·터치 입력 | ❌ 없음 | 로드맵 |
