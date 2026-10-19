# scripts/

| 스크립트 | npm 명령 | 하는 일 |
|---|---|---|
| `build-exe.mjs` | `npm run build:exe` (`-- --skip-web` 로 웹 빌드 생략) | `vite build` → `dist/` 파일(.md 제외)을 리소스로 넣어 `launcher/Launcher.cs` 컴파일 → `release/SurvivorsProto.exe`. package.json 버전을 파일 속성에 기록, 크기·SHA-256 출력 |
| `gen-spec.mjs` | `npm run docs:spec` | Vite SSR 로 `src/game` 모듈을 불러와 `wiki/specs/generated/*.md` 수치표 생성 |
| `sim.mjs` | `npm run sim` (`-- --minutes N`) | 헤드리스 게임플레이 회귀 테스트: 캐릭터 7명 × N분(기본 6) 자동 플레이 + 레벨업 큐·선택지 소진 검사. 실패 시 exit 1 |

## Rules

- Node 18+ ESM (`.mjs`), no extra packages besides Vite.
- Generated output (`release/`, `wiki/specs/generated/`) is never edited by hand. Commit `generated/`, not `release/`.
- Adding a weapon: add its table function to `gen-spec.mjs` `weaponTables`. `sim.mjs` needs no change.
