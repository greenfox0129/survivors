// ============================================================
//  render/quality.ts — 그래픽 품질 (저사양 대응)
//
//  "auto"  : 프레임 간격이 일정 시간 이상 느리면 자동으로 low 전환 (세션 동안 유지)
//  "high"  : 모든 장식 효과 표시
//  "low"   : 게임플레이 정보가 아닌 순수 장식(잔불, 깜빡임, 보석 광채 등)을 생략
//
//  규칙: 게임플레이에 필요한 정보(공격 범위, 적, 투사체)는 low에서도 반드시 그린다.
//        low에서 빼도 되는 "장식"만 isLowQuality()로 감싼다.
// ============================================================

import { CONFIG } from "@/game/data/config";

export type QualitySetting = "auto" | "high" | "low";

const SETTINGS_KEY = "survivors_proto_settings";

interface StoredSettings {
  quality?: QualitySetting;
}

function readSettings(): StoredSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? (JSON.parse(raw) as StoredSettings) : {};
  } catch {
    return {};
  }
}

function writeSettings(next: StoredSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...readSettings(), ...next }));
  } catch {
    // 저장 실패는 무시 (시크릿 모드 등)
  }
}

let setting: QualitySetting = readSettings().quality ?? "auto";
let autoLow = false;
let frameMsAvg = 1000 / 60;
let slowSeconds = 0;

export function getQualitySetting(): QualitySetting {
  return setting;
}

export function setQualitySetting(next: QualitySetting): void {
  setting = next;
  writeSettings({ quality: next });
}

/** 현재 프레임에서 장식 효과를 생략해야 하는지 */
export function isLowQuality(): boolean {
  return setting === "low" || (setting === "auto" && autoLow);
}

/** auto 모드에서 low로 내려갔는지 (UI 표시용) */
export function isAutoDowngraded(): boolean {
  return setting === "auto" && autoLow;
}

/**
 * 게임 루프가 매 렌더 프레임마다 호출한다.
 * @param frameMs 직전 렌더 프레임과의 간격(ms)
 */
export function reportFrameTime(frameMs: number): void {
  // 탭 전환 등으로 생긴 큰 간격은 무시
  const ms = Math.min(frameMs, 100);
  frameMsAvg = frameMsAvg * 0.9 + ms * 0.1;
  if (setting !== "auto" || autoLow) return;
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
