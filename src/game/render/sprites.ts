// ============================================================
//  render/sprites.ts — 미리 그려둔(pre-rendered) 오프스크린 스프라이트 캐시
//
//  매 프레임 그라디언트를 새로 만들어 큰 원을 칠하는 대신, 같은 모양을 한 번만
//  오프스크린 캔버스에 그려두고 drawImage로 재사용한다. (MDN "Optimizing canvas" 권장)
//  캐시 키는 색상·반지름(정수 반올림)이라 레벨업으로 크기가 바뀔 때만 새로 만든다.
// ============================================================

const radialCache = new Map<string, HTMLCanvasElement>();
const MAX_CACHE = 64;

/**
 * 원형 그라디언트 스프라이트를 반환한다. 크기는 (2r × 2r).
 * @param stops [offset(0~1), CSS 색] 목록
 * @param innerRatio 그라디언트가 시작하는 안쪽 반지름 비율 (0 = 중심부터)
 */
export function getRadialSprite(
  radius: number,
  stops: ReadonlyArray<readonly [number, string]>,
  innerRatio = 0,
): HTMLCanvasElement {
  const r = Math.max(1, Math.round(radius));
  const key = `${r}|${innerRatio}|${stops.map((s) => s.join(":")).join(",")}`;
  const hit = radialCache.get(key);
  if (hit) return hit;

  const cv = document.createElement("canvas");
  cv.width = r * 2;
  cv.height = r * 2;
  const g = cv.getContext("2d");
  if (g) {
    const grad = g.createRadialGradient(r, r, r * innerRatio, r, r, r);
    for (const [offset, color] of stops) grad.addColorStop(offset, color);
    g.fillStyle = grad;
    g.beginPath();
    g.arc(r, r, r, 0, Math.PI * 2);
    g.fill();
  }

  if (radialCache.size >= MAX_CACHE) {
    // 가장 오래된 항목 제거 (Map은 삽입 순서를 유지)
    const oldest = radialCache.keys().next().value;
    if (oldest !== undefined) radialCache.delete(oldest);
  }
  radialCache.set(key, cv);
  return cv;
}

/** 스프라이트를 (x, y) 중심, 반지름 drawRadius로 그린다 */
export function drawCentered(
  ctx: CanvasRenderingContext2D,
  sprite: HTMLCanvasElement,
  x: number,
  y: number,
  drawRadius: number,
): void {
  ctx.drawImage(sprite, x - drawRadius, y - drawRadius, drawRadius * 2, drawRadius * 2);
}
