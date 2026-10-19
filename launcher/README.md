# launcher/ — 원클릭 실행기 (Windows exe)

`npm run build:exe` → `release/SurvivorsProto.exe` (약 380KB). 더블클릭 하나로 게임이 열린다.

## 왜 이 방식인가

| 후보 | 크기 | 추가 설치 | 판단 |
|---|---|---|---|
| Electron | 80MB+ | Node 패키지 수백 MB | 무겁다 (저사양 원칙에 어긋남) |
| Tauri | 5–10MB | Rust 툴체인 필요 | 이 PC/CI에 Rust 없음 |
| **C# 실행기 + 시스템 Edge 앱 모드** | **~0.4MB** | **없음** (Windows 기본 .NET Framework 4 `csc.exe`, Win10/11 기본 Edge) | **채택** |

## 동작

1. 단일 인스턴스 확인(Mutex). 이미 실행 중이면 기존 서버로 창만 하나 더 연다.
2. `127.0.0.1` 에 작은 HTTP 서버 — 포트 후보 `37615 → 38917 → 41234 → 임의`. exe에 내장된 `dist/` 를 메모리에서 서빙.
   Host 헤더 검사(DNS rebinding 방지), 루프백 전용.
3. Edge(없으면 Chrome, 둘 다 없으면 기본 브라우저)를 `--app` 모드 + 전용 프로필
   (`%LOCALAPPDATA%\SurvivorsProto\browser-profile`)로 실행. 창 크기는 화면의 92% 이내.
4. 페이지(`src/launcherBridge.ts`)가 3초마다 `/__launcher/ping`, 창을 닫을 때 `/__launcher/bye` →
   실행기가 bye 후 6초(새로고침 대기) 또는 ping 150초 무응답 시 종료.
5. **세이브 미러**: 게임이 저장할 때마다 `PUT /__launcher/save` → `%LOCALAPPDATA%\SurvivorsProto\save.json`
   (직전본 `save.json.bak`). 시작 시 디스크와 브라우저 중 `updatedAt` 이 최신인 쪽으로 맞춘다.

## 파일

| 파일 | 내용 |
|---|---|
| `Launcher.cs` | 실행기 전체 (**C# 5 문법만** — 문자열 보간·`?.`·`nameof` 금지) |
| `app.ico` | exe 아이콘 (favicon과 같은 모티프) |
| `obj/` | 빌드 중 생성되는 `AssemblyInfo.cs` (커밋 안 함) |

## 문제 해결

- **SmartScreen 경고**: 서명되지 않은 exe라 "추가 정보 → 실행"이 필요할 수 있다.
- **창이 안 뜸**: 브라우저에서 `http://127.0.0.1:37615/?launcher=1` 직접 열기. 포트는 `%LOCALAPPDATA%\SurvivorsProto\launcher.port`.
- **세이브 초기화**: 게임 종료 후 `%LOCALAPPDATA%\SurvivorsProto\` 폴더 삭제.
