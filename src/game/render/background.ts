// ============================================================
//  render/background.ts — 월드 배경 + 스크롤 그리드
//
//  원본은 매 프레임 선 ~45개를 stroke 했다. 40×40 타일 1장을 패턴으로 만들어
//  fillRect 한 번으로 그린다. (이동감을 주는 그리드는 저사양 모드에서도 유지)
// ============================================================

import { CONFIG } from "@/game/data/config";

const GRID = 40;
const GRID_COLOR = "rgba(255,255,255,0.03)";

let pattern: CanvasPattern | null = null;
let patternCtx: CanvasRenderingContext2D | null = null;

function getGridPattern(ctx: CanvasRenderingContext2D): CanvasPattern | null {
  if (pattern && patternCtx === ctx) return pattern;
  const tile = document.createElement("canvas");
  tile.width = GRID;
  tile.height = GRID;
  const g = tile.getContext("2d");
  if (!g) return null;
  g.fillStyle = GRID_COLOR;
  g.fillRect(0, 0, 1, GRID); // 세로선
  g.fillRect(0, 0, GRID, 1); // 가로선
  pattern = ctx.createPattern(tile, "repeat");
  patternCtx = ctx;
  return pattern;
}

/** 화면 좌표계에서 배경을 칠한다. camX/camY는 화면 좌상단의 월드 좌표. */
export function drawBackground(ctx: CanvasRenderingContext2D, camX: number, camY: number): void {
  const w = CONFIG.canvasWidth;
  const h = CONFIG.canvasHeight;
  ctx.fillStyle = CONFIG.worldBgColor;
  ctx.fillRect(0, 0, w, h);

  const p = getGridPattern(ctx);
  if (!p) return;
  // 그리드 선이 월드 좌표 GRID 배수에 오도록 패턴 원점을 맞춘다
  const ox = ((camX % GRID) + GRID) % GRID;
  const oy = ((camY % GRID) + GRID) % GRID;
  ctx.save();
  ctx.translate(-ox, -oy);
  ctx.fillStyle = p;
  ctx.fillRect(0, 0, w + GRID, h + GRID);
  ctx.restore();
}
