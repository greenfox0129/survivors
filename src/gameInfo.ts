// ============================================================
//  gameInfo.ts — 게임 메타 정보 (제목·버전·저장소)
//  제목/부제를 바꾸려면 이 파일만 수정하면 된다.
// ============================================================

export const GAME_INFO = {
  /** 로비 큰 제목 */
  title: "Survivors",
  /** 로비 부제 */
  subtitle: "PROTOTYPE",
  /** 로비 안내 문구 */
  tagline: "끝없이 몰려오는 적을 처치하고 살아남으세요",
  /** package.json 의 version (빌드 시 Vite가 주입) */
  version: __APP_VERSION__,
  /** GitHub repository "owner/name" (docs/links only — the game makes no network calls) */
  repo: "greenfox0129/survivors",
} as const;
