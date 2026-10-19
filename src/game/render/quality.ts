// ============================================================
//  render/quality.ts — 그래픽 품질 (저사양 대응)
//
//  "auto"  : 프레임 간격이 일정 시간 이상 느리면 자동으로 low 전환 (세션 동안 유지)
//  "high"  : 모든 장식 효과 표시
//  "low"   : 게임플레이 정보가 아닌 순수 장식(잔불, 깜빡임, 보석 광채 등)을 생략
//
//  규칙: 게임플레이에 필요한 정보(공격 범위, 적, 투사체)는 low에서도 반드시 그린다.
//        low에서 빼도 되는 "장식"만 isLowQuality()로 감싼다.
//  The setting itself lives in core/settings.ts (shared with the sound settings).
// ============================================================

import { CONFIG } from "@/game/data/config";
import { getSettings, updateSettings, type QualitySetting } from "@/game/core/settings";

export type { QualitySetting } from "@/game/core/settings";

let autoLow = false;
let frameMsAvg = 1000 / 60;
let slowSeconds = 0;

export function getQualitySetting(): QualitySetting {
  return getSettings().quality;
}

export function setQualitySetting(next: QualitySetting): void {
  updateSettings({ quality: next });
}

/** 현재 프레임에서 장식 효과를 생략해야 하는지 */
export function isLowQuality(): boolean {
  const q = getSettings().quality;
  return q === "low" || (q === "auto" && autoLow);
}

/** auto 모드에서 low로 내려갔는지 (UI 표시용) */
export function isAutoDowngraded(): boolean {
  return getSettings().quality === "auto" && autoLow;
}

/**
 * 게임 루프가 매 렌더 프레임마다 호출한다.
 * @param frameMs 직전 렌더 프레임과의 간격(ms)
 */
export function reportFrameTime(frameMs: number): void {
  // Gaps over 100ms are hiccups or browser throttling (hidden/occluded tab), not render
  // cost — ignore them entirely so they can't trigger a false "low" downgrade.
  if (frameMs > 100) return;
  if (typeof document !== "undefined" && document.hidden) return;
  const ms = frameMs;
  frameMsAvg = frameMsAvg * 0.9 + ms * 0.1;
  if (getSettings().quality !== "auto" || autoLow) return;
  if (frameMsAvg > CONFIG.render.autoLowFrameMs) {
    slowSeconds += ms / 1000;
    if (slowSeconds >= CONFIG.render.autoLowAfterSec) autoLow = true;
  } else {
    slowSeconds = 0;
  }
}

/** 평균 프레임 시간(ms) — 디버그/표시용 */
export function getAverageFrameMs(): number {
  return frameMsAvg;
}
