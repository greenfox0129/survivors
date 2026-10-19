// ============================================================
//  EnemyShape — the enemy's in-game silhouette as an SVG
//  (mirrors drawShape() in game/entities/EnemyManager.ts so the codex matches the game).
// ============================================================

import type { EnemyState } from "@/game/core/types";

type Shape = Exclude<EnemyState["shape"], "sprite">;

function points(shape: Shape, r: number): string | null {
  const c = 50;
  const pts: [number, number][] = [];
  switch (shape) {
    case "triangle":
      pts.push([c, c - r], [c + r * 0.866, c + r * 0.5], [c - r * 0.866, c + r * 0.5]);
      break;
    case "diamond":
      pts.push([c, c - r], [c + r, c], [c, c + r], [c - r, c]);
      break;
    case "hexagon":
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI / 2;
        pts.push([c + r * Math.cos(a), c + r * Math.sin(a)]);
      }
      break;
    case "star":
      for (let i = 0; i < 10; i++) {
        const a = (Math.PI / 5) * i - Math.PI / 2;
        const rr = i % 2 === 0 ? r : r * 0.5;
        pts.push([c + rr * Math.cos(a), c + rr * Math.sin(a)]);
      }
      break;
    default:
      return null;
  }
  return pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
}

export function EnemyShape({
  shape,
  color,
  borderColor,
  size = 24,
}: {
  shape: Shape;
  color: string;
  borderColor: string;
  size?: number;
}) {
  const r = 40;
  const poly = points(shape, r);
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
      {shape === "circle" && <circle cx={50} cy={50} r={r} fill={color} stroke={borderColor} strokeWidth={6} />}
      {shape === "square" && (
        <rect x={50 - r} y={50 - r} width={r * 2} height={r * 2} fill={color} stroke={borderColor} strokeWidth={6} />
      )}
      {poly && <polygon points={poly} fill={color} stroke={borderColor} strokeWidth={6} strokeLinejoin="round" />}
    </svg>
  );
}
