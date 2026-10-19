# 버전 관리와 업데이트

배포하지 않는 토이 프로젝트 — CI·릴리스 자동화·자동 업데이트는 두지 않는다. 대신 **업데이트가 깨지지 않게** 하는 장치에 집중한다.

## 변경 → 확인 → 기록

```bash
npm run check        # 타입체크 + 린트 + 헤드리스 시뮬레이션 + 빌드
npm run docs:spec    # 수치를 바꿨다면
```
1. `CHANGELOG.md` 의 `[Unreleased]` 에 한 줄 ([Keep a Changelog](https://keepachangelog.com/ko/1.1.0/) 형식)
2. 의미 있는 묶음이 되면 `npm version patch|minor --no-git-tag-version` 으로 버전 올리고 CHANGELOG 제목을 버전으로
   ([SemVer](https://semver.org/lang/ko/): 세이브 호환이 깨지면 minor 이상)
3. `npm run build:exe` 로 실행 파일 재생성 → 로비 하단 버전 표시로 확인

## 세이브 호환 (가장 중요)

| 하면 안 됨 | 해야 함 |
|---|---|
| `STORAGE_KEY` 변경 | 그대로 둔다 |
| 필드 이름 변경·삭제를 그냥 함 | `SAVE_SCHEMA_VERSION` +1, `MIGRATIONS[이전]` 에 변환 함수 |
| 새 필드를 필수로 가정 | `normalize()` 에 기본값 |
| 캐릭터/특성 id 변경 | id 는 영구. 표시 이름만 바꾼다 |

마이그레이션 함수는 입력을 바꾸지 말고 새 객체를 반환한다. 실행기 디스크 백업(`save.json`)은 같은 JSON 이라 따로 할 일이 없다.

## 실행 파일

- `npm run build:exe` → `release/SurvivorsProto.exe` (package.json 버전이 파일 속성에 기록됨)
- 세이브는 브라우저 저장소 + `%LOCALAPPDATA%\SurvivorsProto\save.json` 양쪽에 있고 최신 쪽이 이긴다 → exe 를 새로 만들어 덮어써도 진행도 유지
- 실행기 코드(`launcher/Launcher.cs`)를 고칠 때는 C# 5 문법만 ([launcher/README.md](../../launcher/README.md))

## 되돌리기

- 코드: `git revert <커밋>` (강제 푸시 금지)
- 세이브: `%LOCALAPPDATA%\SurvivorsProto\save.json.bak` 이 직전 저장본
