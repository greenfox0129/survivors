// ============================================================
//  launcherBridge.ts — 원클릭 실행기(launcher/)와의 연결
//
//  실행기는 게임을 http://127.0.0.1:<port>/?launcher=1 로 연다. 그때만:
//   1) 시작 시 실행기의 디스크 세이브(save.json)와 브라우저 세이브 중 최신 것을 고른다
//      → 포트가 바뀌어 브라우저 저장소(origin)가 달라져도 진행도가 이어진다
//   2) 이후 세이브할 때마다 디스크에도 미러링한다
//   3) 창이 열려 있는 동안 ping, 닫힐 때 bye 를 보내 실행기가 스스로 종료하게 한다
//  일반 브라우저(npm run dev / 정적 호스팅)에서는 아무 일도 하지 않는다.
// ============================================================

import { SAVE_STORAGE_KEY, setSaveMirror } from "@/game/core/storage";

const PING_INTERVAL_MS = 3000;
const SAVE_ENDPOINT = "/__launcher/save";

export function isLauncherMode(): boolean {
  return new URLSearchParams(window.location.search).has("launcher");
}

function updatedAtOf(json: string | null): number {
  if (!json) return -1;
  try {
    const v = (JSON.parse(json) as { updatedAt?: unknown }).updatedAt;
    return typeof v === "number" ? v : 0;
  } catch {
    return -1;
  }
}

function putSave(json: string): void {
  fetch(SAVE_ENDPOINT, {
    method: "PUT",
    body: json,
    keepalive: true,
    headers: { "Content-Type": "application/json" },
  }).catch(() => {
    // 실행기가 이미 종료된 경우 — 브라우저 저장소에는 남아 있다
  });
}

/** 디스크 세이브와 브라우저 세이브 중 더 최근 것을 양쪽에 맞춘다 */
async function syncSaveWithDisk(): Promise<void> {
  try {
    const res = await fetch(SAVE_ENDPOINT, { cache: "no-store" });
    const disk = res.status === 200 ? await res.text() : null;
    const local = localStorage.getItem(SAVE_STORAGE_KEY);
    const diskAt = updatedAtOf(disk);
    const localAt = updatedAtOf(local);
    if (disk && diskAt > localAt) localStorage.setItem(SAVE_STORAGE_KEY, disk);
    else if (local && localAt > diskAt) putSave(local);
  } catch {
    // 오프라인/실행기 종료 — 브라우저 세이브로 계속 진행
  }
}

/** main.tsx 에서 앱 렌더 전에 await 한다 */
export async function startLauncherBridge(): Promise<void> {
  if (!isLauncherMode()) return;

  await syncSaveWithDisk();
  setSaveMirror(putSave);

  const ping = () => {
    fetch("/__launcher/ping", { method: "POST", keepalive: true }).catch(() => {
      // 실행기가 이미 종료된 경우 — 무시
    });
  };
  ping();
  window.setInterval(ping, PING_INTERVAL_MS);
  window.addEventListener("pagehide", () => {
    navigator.sendBeacon("/__launcher/bye");
  });
}
