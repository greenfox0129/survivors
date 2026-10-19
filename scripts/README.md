# scripts/

| 스크립트 | npm 명령 | 하는 일 |
|---|---|---|
| `build-exe.mjs` | `npm run build:exe` (`-- --skip-web` 로 웹 빌드 생략) | `vite build` → `dist/` 파일을 리소스로 넣어 `launcher/Launcher.cs` 컴파일 → `release/SurvivorsProto.exe`. package.json 버전을 exe 파일 속성에 기록, 크기·SHA-256 출력 |
| `gen-spec.mjs` | `npm run docs:spec` | Vite SSR로 `src/game` 모듈을 직접 불러와 `wiki/specs/generated/*.md` 수치표(무기·장신구·적·레벨·메타) 생성 |

## 규칙

- 스크립트는 Node 18+ ESM(`.mjs`), 외부 패키지 없이 (Vite 제외) 작성한다.
- 생성물(`release/`, `wiki/specs/generated/`)은 손으로 고치지 않는다. `generated/` 는 커밋하고, `release/` 는 커밋하지 않는다.
- 새 무기를 추가하면 `gen-spec.mjs` 의 `weaponTables` 에 수치표 함수를 추가한다.
