# Survivors Prototype

뱀서라이크(Vampire Survivors-like, "bullet heaven") **브라우저 로그라이트 프로토타입**.
WASD로 움직이기만 하면 무기가 자동으로 공격하고, 경험치를 모아 레벨업할 때마다 무기·장신구를 골라 빌드를 완성한다.
판이 끝나면 골드로 캐릭터 뽑기·강화·특성 같은 영구 성장을 한다.

![lobby](wiki/design/screenshots/01-lobby.png)

| 인게임 | 레벨업 |
|---|---|
| ![gameplay](wiki/design/screenshots/02-gameplay.jpg) | ![levelup](wiki/design/screenshots/03-levelup.jpg) |

## 바로 실행

| 방법 | 명령 | 비고 |
|---|---|---|
| **원클릭 exe (Windows)** | `npm run build:exe` → `release/SurvivorsProto.exe` 더블클릭 | 설치 불필요, Edge 앱 창으로 실행, 세이브는 `%LOCALAPPDATA%\SurvivorsProto\save.json` 에도 백업 |
| 개발 서버 | `npm install` → `npm run dev` → http://localhost:5173 | 코드 수정 시 즉시 반영 |
| 정적 빌드 | `npm run build` → `dist/` | 아무 정적 호스팅에 올리면 동작 |

조작: **WASD / 방향키** 이동 · 공격은 자동 · 레벨업 시 3개 중 1개 선택(리롤 가능)

## 게임 구성 (요약)

- **무기 7종** — 라이플 · 근접 회전검 · 폭발탄 · 설치형 트랩 · 화염 오오라 · 비도 · 야생의 발톱 (각 Lv8 + 짝 장신구 → **진화**)
- **장신구 9종** — 이동속도·체력·흡수범위·공격력·쿨다운·경험치·반사·피해감소·재생
- **적 7종 + 엘리트** — 시간이 지날수록 새 적이 합류, 60초마다 엘리트(처치 시 보물 상자)
- **메타 성장** — 골드 뽑기로 캐릭터 7명 수집, 레벨/각성(별)/돌파(기억), 특성 7종, 진화 업적

상세 수치·규칙은 [wiki/specs](wiki/specs/README.md) (수치표는 코드에서 자동 생성).

## 기술 스택

React 18 · TypeScript 5 · Vite 5 · Tailwind CSS 3 · Canvas 2D (엔진은 React와 독립) · lucide-react 아이콘
원클릭 실행기: C# (Windows 기본 .NET Framework 4 `csc.exe`로 빌드, 추가 설치 없음)

## 디렉토리

```
.
├─ AGENTS.md            ← AI 에이전트 작업 지침 (사람도 먼저 읽을 것)
├─ CHANGELOG.md         ← 버전별 변경 기록
├─ src/                 ← 게임 소스 (README 참고)
│  ├─ game/             ←   순수 게임 로직 (core · data · entities · systems · weapons · render)
│  └─ ui/               ←   React 화면 (screens · components · hooks · theme)
├─ public/              ← 런타임 에셋 (스프라이트, 파비콘)
├─ launcher/            ← 원클릭 exe 실행기 소스 (C#)
├─ scripts/             ← 빌드·문서 생성 스크립트
├─ wiki/                ← 개발 위키 (명세 · 레퍼런스 · 방법론 · 커뮤니티 · 방향성 · 디자인)
└─ .github/workflows/   ← CI (검사) · Release (태그 푸시 시 exe 자동 빌드)
```

## 명령어

| 명령 | 하는 일 |
|---|---|
| `npm run dev` | 개발 서버 |
| `npm run check` | 타입체크 + 린트 + 빌드 (커밋 전 필수) |
| `npm run build:exe` | 웹 빌드 + `release/SurvivorsProto.exe` 생성 (Windows) |
| `npm run docs:spec` | `wiki/specs/generated/*.md` 수치표 재생성 (밸런스 수정 후) |

## 업데이트 흐름

1. 콘텐츠/밸런스 수정 → `npm run check` → `npm run docs:spec`
2. `CHANGELOG.md` 의 `Unreleased` 에 기록
3. `npm version patch|minor` (package.json 버전 + git 태그) → `git push --follow-tags`
4. GitHub Actions가 exe를 빌드해 Release에 첨부 → 게임 로비에 "새 버전" 알림이 뜬다

자세한 내용: [wiki/methodology/release-and-updates.md](wiki/methodology/release-and-updates.md)

## 출처

- 원본: Bolt.new 로 생성된 프로토타입 (`bolt-vite-react-ts` 템플릿) — [wiki/overview](wiki/overview/project-history.md)
- 위키의 디자인 후보 에셋: game-icons.net (CC BY 3.0), Kenney.nl (CC0) — [CREDITS](wiki/design/assets/CREDITS.md)
- `public/assets/` 의 늑대·발톱 이미지는 원본 프로젝트에 포함되어 있던 파일로, 출처·라이선스 확인이 필요하다.
