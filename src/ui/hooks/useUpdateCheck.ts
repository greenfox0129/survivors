// ============================================================
//  useUpdateCheck — GitHub Releases 최신 버전 확인 (로비 배너용)
//
//  - 실패(오프라인, 레이트리밋, 릴리스 없음)는 조용히 무시한다.
//  - 결과는 세션당 1회만 조회하도록 sessionStorage에 캐시한다.
//  - 끄려면 src/gameInfo.ts 의 updateCheck 를 false 로.
// ============================================================

import { useEffect, useState } from "react";
import { GAME_INFO } from "@/gameInfo";

export interface UpdateInfo {
  version: string;
  url: string;
}

const CACHE_KEY = "survivors_proto_update_check";

/** "v1.2.3" / "1.2.3" 비교. a > b 이면 양수 */
export function compareVersions(a: string, b: string): number {
  const pa = a.replace(/^v/, "").split(/[.-]/).map((n) => parseInt(n, 10) || 0);
  const pb = b.replace(/^v/, "").split(/[.-]/).map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}

function readCache(): UpdateInfo | null | undefined {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    return raw === null ? undefined : (JSON.parse(raw) as UpdateInfo | null);
  } catch {
    return undefined;
  }
}

function writeCache(v: UpdateInfo | null): void {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(v));
  } catch {
    // ignore
  }
}

export function useUpdateCheck(): UpdateInfo | null {
  const [info, setInfo] = useState<UpdateInfo | null>(() => readCache() ?? null);

  useEffect(() => {
    if (!GAME_INFO.updateCheck || readCache() !== undefined) return;
    const ctrl = new AbortController();
    fetch(`https://api.github.com/repos/${GAME_INFO.repo}/releases/latest`, {
      signal: ctrl.signal,
      headers: { Accept: "application/vnd.github+json" },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { tag_name?: string; html_url?: string } | null) => {
        const tag = data?.tag_name;
        const next =
          tag && data?.html_url && compareVersions(tag, GAME_INFO.version) > 0
            ? { version: tag.replace(/^v/, ""), url: data.html_url }
            : null;
        writeCache(next);
        setInfo(next);
      })
      .catch(() => {
        // 오프라인 등 — 무시
      });
    return () => ctrl.abort();
  }, []);

  return info;
}
