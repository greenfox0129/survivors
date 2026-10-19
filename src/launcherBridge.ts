// ============================================================
//  launcherBridge.ts — 원클릭 실행기(launcher/)와의 연결
//
//  실행기는 게임을 http://127.0.0.1:<port>/?launcher=1 로 연다.
//  그때만 창이 열려 있는 동안 주기적으로 ping을 보내고, 창이 닫힐 때 bye를 보내
//  실행기가 로컬 서버를 정리하고 종료할 수 있게 한다.
//  일반 브라우저(npm run dev / 정적 호스팅)에서는 아무 일도 하지 않는다.
// ============================================================

const PING_INTERVAL_MS = 3000;

export function startLauncherBridge(): void {
  if (!new URLSearchParams(window.location.search).has("launcher")) return;

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
