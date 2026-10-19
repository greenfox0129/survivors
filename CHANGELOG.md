# Changelog

형식: [Keep a Changelog](https://keepachangelog.com/ko/1.1.0/) · 버전: [SemVer](https://semver.org/lang/ko/)
버전 올리는 법: [wiki/methodology/versioning-and-updates.md](wiki/methodology/versioning-and-updates.md)

## [Unreleased]

### Changed
- **그래픽 전면 개편 (높음/자동 품질)** — 16px 픽셀 아트(Ninja Adventure, CC0)로 교체. 저사양 품질은 이전 모습 그대로.
  - 월드: 포켓몬식 타일 필드(풀·흙 빈터·키 큰 풀·꽃·나무·그루터기·뼈), 청크 캐시로 프레임당 4–6 drawImage
  - 유닛: 캐릭터 7명·적 6종이 원+엠블럼 대신 4방향 걷기 스프라이트 + 그림자, 엘리트는 금빛 + 금 고리
  - 공격: 에너지 탄, 쿠나이·마법 수리검, 검, 대포알·운석 + 폭발 링·연기, 룬 서클·번개, 불꽃 고리, 발톱 슬래시, 불꽃 브레스
  - 보석은 크리스탈, 보물은 상자 스프라이트, 처치 시 연기
- UI: 캐릭터·적 초상(Faceset)과 걷기 애니메이션 — 로비(파티 줄), 캐릭터 관리, 뽑기, 도감

### Added
- `art/` 픽셀 팩 라이브러리(Ninja Adventure 전체, 0x72 DungeonTileset II), `npm run assets:pixel` (사용 에셋만 `src/assets/pixel` 로 복사)
- 시각 점검 장면 `?view=units`(적 전 종류+엘리트), `?view=world`(월드 4배 축소)

## [0.1.0] - 2026-10-19

Bolt.new 프로토타입을 저장소로 정리한 첫 버전. 게임 규칙·밸런스 수치는 그대로이며,
원작자 의도와 어긋나 있던 구현만 바로잡았다 ([의도 대조표](wiki/overview/original-intent-audit.md)).

### Added
- 원클릭 Windows 실행기 `SurvivorsProto.exe` (`npm run build:exe`) — 설치 없이 Edge 앱 창으로 실행,
  세이브를 `%LOCALAPPDATA%\SurvivorsProto\save.json` 에도 백업
- 아이콘 74종(game-icons.net, CC BY 3.0)을 전 화면에 적용 — HUD, 레벨업 카드, 로비, 캐릭터·뽑기·특성·도감·업적, 게임오버
- 캔버스 그래픽: 보물 상자·엘리트 왕관·플레이어 엠블럼, 적 도형 안 엠블럼, 칼날·비도·폭탄·운석·트랩·토템 스프라이트,
  Kenney 이펙트(처치 별·레벨업 빛·총구 화염·폭발 불꽃·잔불), 은은한 월드 장식 — 장식은 저사양에서 끔
- ESC/P 일시정지 메뉴 (그래픽 품질 · 효과음 볼륨/음소거), 로비 설정 버튼, 창 포커스를 잃으면 자동 일시정지
- 로비에 재화·선택 캐릭터·버전·아이콘 크레딧 표시, 레벨업 단축키(1/2/3, R)
- 그래픽 품질(자동/높음/저사양)
- 개발 위키 `wiki/`, `AGENTS.md`, 수치표 자동 생성 `npm run docs:spec`, 헤드리스 시뮬레이션 `npm run sim`

### Changed
- 소스 구조 재편: `src/game/{core,data,entities,systems,weapons,render}`, `src/ui/{screens,components,hooks}`, `src/assets`
- 무기 등록표(`weapons/registry.ts`), 레벨업 선택지 로직 분리(`systems/upgrades.ts`)
- 세이브 스키마 버전 관리 + 마이그레이션 (기존 세이브 호환 유지)
- 렌더링 경량화: 60fps 상한, 일시정지 중 재렌더 중단, shadowBlur 제거, 그라디언트·아이콘 캐시, 그리드 패턴화, 불투명 캔버스
- 게임 화면이 창 높이에 맞춰 축소 (1366×768 노트북 대응)
- 도감의 적 목록이 실제 게임 속 도형을 표시
- 로비 제목을 `src/gameInfo.ts` 로 분리 ("Survivors")

### Fixed
- **진화 무기 수치** — 진화 시 Lv1 수치로 계산되어 Lv8보다 약해지던 문제 (도감 표시와 일치하도록 최대 레벨 기준)
- **폭풍의 칼날**이 설명(칼날 8개·넉백)과 달리 칼날 5개·넉백 없음이던 문제, **심판의 화염** 넉백 강화 누락
- 한 프레임에 여러 레벨업(큰 병합 보석, 보물 상자 동시 획득)이 겹치면 선택지가 한 번만 뜨던 문제
- 선택할 강화가 하나도 없을 때 빈 레벨업 창으로 게임이 멈출 수 있던 문제
- 레벨업 창의 리롤 횟수가 늦게 갱신되던 문제, 실제 사망 시 게임오버 효과음 누락
- 창 전환 후 이동 키가 눌린 채로 남던 문제, 뽑기 연타 시 중복 실행 가능성
- HUD 에서 야생의 발톱·자연의 축복 색이 회색이던 문제, 시작 직후 HUD 가 항상 "라이플"을 표시하던 문제
- 깨진 주석 문자열(돌파), ESLint 오류 23건

### Removed
- 사용하지 않는 `@supabase/supabase-js` 의존성, 중복 `assets/` 폴더, Bolt 전용 `.bolt/`
