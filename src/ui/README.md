# src/ui/ — React 화면

| 폴더/파일 | 내용 |
|---|---|
| `screens/Lobby.tsx` | 메인 메뉴 6개 카드, 제목(`gameInfo.ts`), 버전·새 버전 알림 |
| `screens/GameCanvas.tsx` | 캔버스 + 엔진 생성/정리, 키 입력, 레벨업/게임오버 단계, 골드·업적 정산, **그래픽 품질 버튼**, 화면 높이 맞춤 |
| `screens/GachaScreen.tsx` | 캐릭터 뽑기(1회/10연), 중복 → 기억 |
| `screens/CharacterScreen.tsx` | 캐릭터 선택·레벨업·각성(별)·돌파·초기화 |
| `screens/TraitsScreen.tsx` | 특성 강화·초기화 |
| `screens/CodexScreen.tsx` | 도감 (적/무기/진화/장신구) — 레벨 효과는 무기 등록표에서 읽음 |
| `screens/AchievementsScreen.tsx` | 업적 목록 |
| `components/HUD.tsx` | 시간·처치·스코어·레벨·XP바·HP바·보유 무기/장신구 |
| `components/UpgradeModal.tsx` | 레벨업 3지선다 + 리롤 |
| `hooks/useUpdateCheck.ts` | GitHub Releases 최신 버전 확인 (세션당 1회, 실패 무시) |
| `theme.ts` | 장신구 색·아이콘, 무기 색 매핑 — **색/아이콘은 여기서만** |

## 규칙

- 스타일은 Tailwind 클래스, 아이콘은 `lucide-react` 만. 새 UI 라이브러리 금지.
- 게임 로직을 UI에 쓰지 않는다 — 엔진/데이터 함수를 호출만.
- 반투명 `backdrop-blur` 는 정지 화면(모달) 위에서만 쓴다. 엔진이 일시정지 중 재렌더하지 않으므로 비용이 낮다.
