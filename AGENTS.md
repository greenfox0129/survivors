# AGENTS.md — AI 에이전트 작업 지침

> 이 저장소에서 작업하는 모든 AI 코딩 에이전트(Claude Code, Codex, Cursor, Copilot, Gemini CLI 등)와
> 사람이 **가장 먼저 읽는 문서**. 사람용 소개는 [README.md](README.md), 깊은 지식은 [wiki/](wiki/README.md).
> 사용자가 채팅으로 직접 준 지시가 이 문서보다 우선한다.

## 1. 프로젝트 한 줄 요약

Bolt.new로 만든 **뱀서라이크 브라우저 로그라이트 프로토타입**(React + TypeScript + Canvas 2D)을
유지보수·확장 가능한 형태로 정리한 저장소. Windows 원클릭 실행 exe(`launcher/`)도 함께 빌드한다.

## 2. 최우선 원칙 (반드시 지킬 것)

### 2-1. 게임의 성격을 바꾸지 않는다 — 기술적 개입이 기본값

- 장르·조작·핵심 루프·콘텐츠 구성·**밸런스 수치**·아트 방향은 **사용자가 요청할 때만** 바꾼다.
- 기본 작업 범위는 *구현의 기술적 부분*: 구조, 성능, 버그(설명과 구현이 어긋난 것 포함), 빌드·배포, 문서.
- 버그 수정이 밸런스를 바꾸게 되면(예: 진화 무기가 Lv8보다 약한 문제) **고치지 말고**
  [wiki/direction/known-issues.md](wiki/direction/known-issues.md)에 기록하고 사용자에게 결정을 요청한다.
- UI 문구는 한국어. 기존 톤(짧고 게임스러운 문장)을 따른다.

### 2-2. 업데이트가 편해야 한다 (Update-friendly by default)

모든 변경은 "다음 사람이 콘텐츠·밸런스·버전을 **한 곳만 고쳐서** 갱신할 수 있는가?"를 기준으로 한다.

1. **데이터는 한 곳에** — 수치는 `src/game/data/config.ts`, 진화는 `data/evolutions.ts`,
   메타 성장(캐릭터·특성·업적·비용)은 `data/progression.ts`. 코드에 매직 넘버를 흩뿌리지 않는다.
2. **등록표(registry)로 확장** — 무기는 `src/game/weapons/registry.ts`의 `WEAPON_MODULES` 한 표로
   WeaponManager·레벨업 선택지·도감이 동작한다. 종류별 `switch` 를 새로 만들지 말고 등록표를 쓴다.
   `Record<WeaponType, …>` 타입 덕분에 등록 누락은 타입체크에서 실패한다.
3. **세이브 호환** — 저장 구조를 바꾸면 `src/game/core/storage.ts`의 `SAVE_SCHEMA_VERSION`을 올리고
   `MIGRATIONS`에 변환 함수를 추가한다. `STORAGE_KEY`("vs_proto_save")는 **절대 변경 금지**.
4. **문서 자동 생성** — 수치를 바꾸면 `npm run docs:spec`으로 `wiki/specs/generated/*.md`를 재생성한다(손으로 고치지 않음).
5. **버전·기록** — 사용자에게 보이는 변경은 `CHANGELOG.md`의 `Unreleased`에 적는다.
   릴리스는 `npm version patch|minor` → `git push --follow-tags` → CI가 exe를 Release에 첨부 →
   게임 로비가 새 버전을 알린다 (`src/ui/hooks/useUpdateCheck.ts`).
6. **설정은 한 파일** — 게임 제목·버전·저장소 주소는 `src/gameInfo.ts`.

### 2-3. 하드웨어를 많이 요구하는 렌더링을 피한다 (Low-spec first)

목표: 내장 그래픽 노트북(1366×768)에서도 60fps. 자세한 근거: [wiki/methodology/canvas-performance.md](wiki/methodology/canvas-performance.md)

| 금지 / 지양 | 대신 |
|---|---|
| `ctx.shadowBlur`, `ctx.filter`(매 프레임) | 반투명 굵은 선/원으로 halo, 필터는 오프스크린에 한 번 굽기 |
| 매 프레임 `createRadialGradient`/`createLinearGradient` 로 큰 면 채우기 | `render/sprites.ts`의 `getRadialSprite()` 캐시 + `drawImage` |
| 같은 모양 선을 여러 번 `stroke()` | 한 path에 모아 한 번 `stroke()` (배칭) |
| 정지·일시정지 중에도 계속 다시 그리기 | 엔진이 정지 화면 1장만 그림 (`frozenFrameDrawn`) |
| 루프 안에서 `Date.now()`/`performance.now()` 반복 호출, 매 프레임 객체·배열 대량 생성 | 프레임당 한 번 계산해 재사용, in-place 컬링 |
| CSS `backdrop-filter`·큰 `box-shadow` 를 애니메이션 위에 상시 사용 | 정적 화면에서만 사용 |
| devicePixelRatio 업스케일, WebGL 도입 | 960×720 고정 캔버스 + CSS 스케일 유지 |

- **장식은 `isLowQuality()`로 감싼다** (잔불, 깜빡임, 보석 광채, 엘리트 은은한 채움 등).
  게임플레이 정보(공격 범위, 적, 투사체, HP바)는 low 품질에서도 반드시 그린다.
- FPS 상한은 `CONFIG.render.fpsCap`(기본 60). 고주사율 모니터에서 불필요한 프레임을 그리지 않는다.
- 적·투사체 수를 늘리는 변경을 하면 `npm run dev`에서 그래픽 "저사양"으로 체감 확인 후,
  300개 이상이 되면 공간 분할(spatial hash) 도입을 검토한다.

## 3. 명령어

```bash
npm install          # 의존성
npm run dev          # 개발 서버 http://localhost:5173
npm run check        # typecheck + lint + build — 커밋 전 반드시 통과
npm run docs:spec    # 위키 수치표 재생성
npm run build:exe    # release/SurvivorsProto.exe (Windows 전용)
```

자동화된 단위 테스트는 아직 없다. 검증은 `npm run check` + 개발 서버에서 직접 플레이
(무기 1종 이상 Lv8·진화, 레벨업 모달, 게임오버, 로비 이동)로 한다.

## 4. 구조와 의존 방향

```
src/
├─ main.tsx · App.tsx         진입점, 화면 전환(state)
├─ gameInfo.ts                제목·버전·저장소 (단일 출처)
├─ launcherBridge.ts          원클릭 exe와의 통신 (ping/bye/세이브 미러)
├─ game/                      ── React 없이 동작하는 순수 게임 로직 ──
│  ├─ core/      GameEngine(루프·통합) · types · storage(세이브) · audio
│  ├─ data/      config(밸런스) · evolutions · progression(캐릭터·특성·업적·비용)
│  ├─ entities/  Player · EnemyManager · GemManager
│  ├─ systems/   WeaponManager · AccessoryManager · upgrades(레벨업 선택지) · traitHelper(배율 계산)
│  ├─ weapons/   무기별 로직/렌더 + registry.ts(등록표)
│  └─ render/    quality(저사양 판단) · sprites(오프스크린 캐시) · background(그리드)
└─ ui/                        ── React 화면 ──
   ├─ screens/   Lobby · GameCanvas · Gacha · Character · Traits · Codex · Achievements
   ├─ components/ HUD · UpgradeModal
   ├─ hooks/     useUpdateCheck
   └─ theme.ts   장신구 색·아이콘, 무기 색 (UI 공용 매핑)
```

**의존 규칙**
- `game/**` 는 `ui/**`·React를 import 하지 않는다. UI와는 `GameEngine` 공개 메서드 + `GameCallbacks`로만 통신.
- `game/data/**` 는 로직 모듈을 import 하지 않는다(타입 제외). 데이터는 위에서 아래로만 흐른다.
- 모든 import는 `@/` 별칭 (`@/game/...`, `@/ui/...`). 상대경로 `../../` 금지.
- 새 UI 라이브러리를 추가하지 않는다 (Tailwind + lucide-react 만).

## 5. 작업별 체크리스트

### 새 무기 추가
1. `game/core/types.ts` — `WeaponType` 유니온에 id 추가 (필요하면 상태 타입 추가)
2. `game/data/config.ts` — `weapons.<id>` 스탯 (name, desc, color, base*, *Growth, maxLevel)
3. `game/data/evolutions.ts` — 진화 정의 (짝 장신구, 이름, 설명)
4. `game/weapons/<Name>Weapon.ts` — `update*`, `render*`, `*LevelEffect`, (필요시) `reset*Ids`
5. `game/weapons/registry.ts` — 어댑터 작성 후 `WEAPON_MODULES`에 등록 (renderOrder 지정)
6. `game/data/progression.ts` — 업적 `evo_<id>` 추가 (진화 업적을 쓸 경우), `StartWeaponType` 갱신
7. `scripts/gen-spec.mjs` — `weaponTables`에 수치표 생성기 추가
8. `npm run check` → `npm run docs:spec` → CHANGELOG
9. (선택) 아이콘 후보: `wiki/design/assets/icons/`

### 새 장신구
`types.ts`의 `AccessoryType` → `config.ts` `accessories` → `systems/AccessoryManager.ts`의
`ALL_ACCESSORY_TYPES`·`computeMods`·`getLevelEffect` → `ui/theme.ts` 색·아이콘 → docs:spec

### 새 적
`config.ts`의 `enemyTypes`에 항목 추가(등장 시간·가중치·모양). 스프라이트 적은
`EnemyManager.ts`의 늑대 구현(16×16 프레임 시트, 지연 로딩)을 따른다. 도감 설명은 `CodexScreen.tsx`의 `ENEMY_DESCS`.

### 새 캐릭터
`data/progression.ts`의 `CHARACTERS`(패시브는 `PassiveType` + `GameEngine.updateWeaponMods`/`applyAccessoryMods`).
특수 캐릭터는 `special: true` + `unlockAchievement`.

### 세이브 구조 변경
`storage.ts`: `SAVE_SCHEMA_VERSION`++ → `MIGRATIONS[이전버전]` 추가 → `normalize` 기본값 → `docs` 갱신.
실행기 디스크 백업(`save.json`)도 같은 JSON을 그대로 저장하므로 별도 작업은 없다.

### 원클릭 실행기(launcher/) 수정
- `Launcher.cs` 는 **C# 5 문법만** (Windows 기본 csc.exe가 C# 5까지만 지원):
  문자열 보간 `$""`, `?.`, `nameof`, `out var`, 식 본문 멤버 사용 금지.
- 포트 후보 순서(37615 → 38917 → 41234)와 `--user-data-dir` 경로를 바꾸면 세이브 위치가 달라진다.
  디스크 미러가 있어 복구는 되지만 이유 없이 바꾸지 않는다.

## 6. 코드 스타일

- 파일 머리에 `// ====` 배너 + 한 줄 역할 설명 (기존 파일과 동일한 형식).
- 주석은 "왜"를 적는다. 한국어/영어 혼용 가능 — 주변 코드에 맞춘다.
- 쓰지 않는 인자는 `_` 접두사 (eslint 설정됨).
- 게임 루프 안 코드는 할당을 최소화한다 (in-place 컬링 패턴 유지).

## 7. 문서 유지 규칙

| 바꾼 것 | 같이 갱신할 문서 |
|---|---|
| 수치(config/progression/evolutions) | `npm run docs:spec` |
| 시스템 규칙·동작 | `wiki/specs/*.md` 해당 문서 |
| 방향·우선순위·결정 | `wiki/direction/README.md` (결정 기록) |
| 밸런스 의심점·설계-구현 불일치 | `wiki/direction/known-issues.md` |
| 렌더링 기법 | `wiki/methodology/canvas-performance.md` |
| 새 폴더 | 그 폴더의 `README.md` + 이 문서 4장 |
| 외부 에셋 추가 | `wiki/design/assets/CREDITS.md` (라이선스 필수, CC0/CC BY 우선) |

## 8. Git

- 커밋 메시지: Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `perf:`).
- `main` 에 강제 푸시 금지. 큰 작업은 브랜치 → PR.
- `release/`, `dist/`, `launcher/obj/` 는 커밋하지 않는다 (.gitignore).

## 9. 지식 지도

- 무엇을/왜: [wiki/overview/project-history.md](wiki/overview/project-history.md), [wiki/direction/](wiki/direction/README.md)
- 기능 명세: [wiki/specs/](wiki/specs/README.md)
- 레퍼런스 게임 비교: [wiki/references/](wiki/references/README.md)
- 개발 방법론: [wiki/methodology/](wiki/methodology/README.md)
- 커뮤니티 글 모음: [wiki/community/](wiki/community/README.md)
- 디자인: [wiki/design/](wiki/design/README.md)
