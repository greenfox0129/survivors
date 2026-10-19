# 프로젝트 내력 — "이 폴더는 무엇이었나"

## 출발점 (2026-10-19 확인)

- 위치: `Downloads/project-bolt-sb1-mwjsmrcu/project` — **Bolt.new** (StackBlitz의 AI 웹앱 생성기)에서 내려받은 프로젝트.
  - 근거: `.bolt/config.json` 의 템플릿 `bolt-vite-react-ts`, `.bolt/prompt` 의 Bolt 기본 지시문,
    `index.html` 의 bolt.new OG 이미지, 폴더 이름 패턴 `project-bolt-sb1-*`.
- 정체: **"Vampire Survivors Style Game Prototype"** (원래 `<title>`). 로비 제목도 "Vampire Survivors / PROTOTYPE".
- 상태: git 없음, README 없음, 타입체크·빌드는 통과, ESLint 오류 23건, 사용하지 않는 Supabase 의존성,
  `assets/` 와 `public/assets/` 에 같은 이미지 중복, 일부 주석 문자 깨짐("돌파" → `㴼ヂ`).

## 원본이 이미 갖추고 있던 것

| 영역 | 내용 |
|---|---|
| 인게임 | 무한 월드 이동, 자동 공격 무기 7종(레벨 1–8 + 진화), 장신구 9종, 적 7종 + 엘리트, 경험치 보석 병합, 레벨업 3지선다 + 리롤, 보물 상자 |
| 메타 | 골드, 캐릭터 7명(뽑기·레벨·각성·돌파·기억), 특성 7종, 진화 업적 7개(특수 캐릭터 해금), 도감 |
| 기술 | React + Canvas 2D, 엔진은 React와 분리된 모듈 구조, localStorage 세이브, WebAudio 합성음 |

→ 이미 "플레이 가능한 수직 단면(vertical slice)" 수준이다. 그래서 이번 정리는 **게임을 바꾸지 않고**
구조·성능·배포·문서를 갖추는 데 집중했다.

## 이번 정리에서 한 일 (v0.1.0)

| 분류 | 변경 | 이유 |
|---|---|---|
| 구조 | `src/game/{core,data,entities,systems,weapons,render}` + `src/ui/{screens,components,hooks}` | 역할별로 찾기 쉽게, 다른 AI가 붙어도 길을 잃지 않게 |
| 확장성 | 무기 등록표, 레벨업 로직 분리, 세이브 스키마 버전, `gameInfo.ts` | 업데이트를 한 곳 수정으로 |
| 성능 | FPS 상한, 일시정지 재렌더 중단, shadowBlur 제거, 그라디언트 캐시, 그리드 패턴, 불투명 캔버스, 자동 저사양 | 저사양 PC 대응 |
| 배포 | 원클릭 exe(380KB), GitHub Actions(CI·Release), 로비 업데이트 알림 | 설치 없이 실행, 업데이트 편의 |
| 문서 | AGENTS.md, 디렉토리별 README, 이 위키, 자동 수치표 | 인수인계 |
| 이름 | 로비 제목 "Vampire Survivors" → "Survivors" (`src/gameInfo.ts`) | 공개 저장소에서 타 게임 상표를 제목으로 쓰지 않기 위해. 한 줄로 되돌릴 수 있다 |

변경 상세: [CHANGELOG.md](../../CHANGELOG.md) · 커밋 이력 (`git log`) 첫 커밋이 원본 그대로의 스냅샷이다.

## 하지 않은 것 (의도적으로)

- 밸런스 수치, 무기·적·캐릭터 구성, 화면 구성, 아트 스타일 변경.
- 발견한 설계-구현 불일치(진화 무기가 Lv8보다 약해지는 문제 등)는 고치지 않고
  [direction/known-issues.md](../direction/known-issues.md) 에 기록 — 게임 디자인 결정이기 때문.
