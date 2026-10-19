# Changelog

형식: [Keep a Changelog](https://keepachangelog.com/ko/1.1.0/) · 버전: [SemVer](https://semver.org/lang/ko/)
릴리스 방법: [wiki/methodology/release-and-updates.md](wiki/methodology/release-and-updates.md)

## [Unreleased]

## [0.1.0] - 2026-10-19

Bolt.new 프로토타입을 저장소로 정리한 첫 버전. **게임플레이·밸런스 변경 없음.**

### Added
- 원클릭 Windows 실행기 `SurvivorsProto.exe` (`npm run build:exe`) — 설치 없이 Edge 앱 창으로 실행,
  세이브를 `%LOCALAPPDATA%\SurvivorsProto\save.json` 에도 백업
- 그래픽 품질 설정(자동/높음/저사양) — 자동은 프레임이 떨어지면 장식 효과를 줄임
- 로비에 버전 표시 및 새 버전(GitHub Release) 알림
- 개발 위키 `wiki/` (기능 명세·레퍼런스·방법론·커뮤니티·방향성·디자인), `AGENTS.md`
- 수치표 자동 생성 `npm run docs:spec`

### Changed
- 소스 구조 재편: `src/game/{core,data,entities,systems,weapons,render}`, `src/ui/{screens,components,hooks}`
- 무기 등록표(`weapons/registry.ts`)로 무기별 분기 제거, 레벨업 선택지 로직 분리(`systems/upgrades.ts`)
- 세이브 스키마 버전 관리 + 마이그레이션 (기존 세이브 호환 유지)
- 렌더링 경량화: 60fps 상한, 일시정지 중 재렌더 중단, shadowBlur 제거, 그라디언트 캐시, 그리드 패턴화, 불투명 캔버스
- 게임 화면이 창 높이에 맞춰 축소 (1366×768 노트북 대응)
- 로비 제목을 `src/gameInfo.ts` 로 분리 ("Survivors")

### Fixed
- HUD에서 야생의 발톱·자연의 축복 색이 회색으로 표시되던 문제
- 게임 시작 직후 HUD가 선택 캐릭터와 무관하게 "라이플"을 표시하던 문제
- 깨진 주석 문자열(돌파), ESLint 오류 23건

### Removed
- 사용하지 않는 `@supabase/supabase-js` 의존성, 중복 `assets/` 폴더, Bolt 전용 `.bolt/`
