// ============================================================
//  GemManager.ts — XP gem drops, magnet pickup, rendering
// ============================================================

import { CONFIG } from "@/game/data/config";
import type { EnemyState, Gem, PlayerState } from "@/game/core/types";
import { isLowQuality } from "@/game/render/quality";
import { getIconSprite, drawSpriteCentered } from "@/game/render/iconSprites";
import { UI_ICONS } from "@/assets/icons/map";

let idCounter = 9000;

export function resetGemManager(): void {
  idCounter = 9000;
}

export function dropGem(enemy: EnemyState): Gem {
  return {
    id: ++idCounter,
    x: enemy.x + (Math.random() - 0.5) * 10,
    y: enemy.y + (Math.random() - 0.5) * 10,
    radius: CONFIG.gem.radius,
    value: 1,
    alive: true,
  };
}

export function dropTreasure(enemy: EnemyState): Gem {
  return {
    id: ++idCounter,
    x: enemy.x,
    y: enemy.y,
    radius: 12,
    value: 0,
    alive: true,
    isTreasure: true,
  };
}

/** Updates gems — magnet pull + collection. Returns { xp, treasure } separately. */
export interface GemUpdateResult {
  xp: number;
  treasure: boolean;
}

export function updateGems(gems: Gem[], player: PlayerState, dt: number): GemUpdateResult {
  let collectedXp = 0;
  let treasure = false;

  for (const g of gems) {
    if (!g.alive) continue;

    if (g.isTreasure) {
      // Treasure has larger pickup radius
      const tdx = player.x - g.x;
      const tdy = player.y - g.y;
      const tdist2 = tdx * tdx + tdy * tdy;
      const pickupR2 = player.pickupRadius * player.pickupRadius;
      if (tdist2 < pickupR2) {
        const dist = Math.sqrt(tdist2);
        if (dist > 0.1) {
          g.x += (tdx / dist) * CONFIG.gem.magnetSpeed * dt;
          g.y += (tdy / dist) * CONFIG.gem.magnetSpeed * dt;
        }
      }
      const collectR = player.radius + g.radius + 5;
      if (tdist2 < collectR * collectR) {
        g.alive = false;
        treasure = true;
      }
      continue;
    }

    const dx = player.x - g.x;
    const dy = player.y - g.y;
    const dist2 = dx * dx + dy * dy;

    // Magnet pull
    if (dist2 < player.pickupRadius * player.pickupRadius) {
      const dist = Math.sqrt(dist2);
      if (dist > 0.1) {
        g.x += (dx / dist) * CONFIG.gem.magnetSpeed * dt;
        g.y += (dy / dist) * CONFIG.gem.magnetSpeed * dt;
      }
    }

    // Collection
    const collectR = player.radius + g.radius;
    if (dist2 < collectR * collectR) {
      g.alive = false;
      collectedXp += g.value;
    }
  }

  return { xp: collectedXp, treasure };
}

export function cullGems(gems: Gem[]): Gem[] {
  // In-place compaction: swap dead gems to end, then truncate
  let write = 0;
  for (let i = 0; i < gems.length; i++) {
    if (gems[i].alive) {
      if (write !== i) gems[write] = gems[i];
      write++;
    }
  }
  gems.length = write;
  return gems;
}

/**
 * Merges gems that are too far from the player into the nearest in-range gem,
 * adding their value. If no in-range gem exists, the far gem is teleported
 * to the edge of the range so it stays collectable.
 */
export function mergeFarGems(gems: Gem[], px: number, py: number, maxDist: number): Gem[] {
  const maxDist2 = maxDist * maxDist;
  const inRange: Gem[] = [];
  const far: Gem[] = [];
  for (const g of gems) {
    if (!g.alive) continue;
    const dx = g.x - px;
    const dy = g.y - py;
    if (dx * dx + dy * dy > maxDist2) {
      far.push(g);
    } else {
      inRange.push(g);
    }
  }

  for (const f of far) {
    // Find nearest in-range gem to merge into
    let nearest: Gem | null = null;
    let nearestDist2 = Infinity;
    for (const ir of inRange) {
      const dx = ir.x - f.x;
      const dy = ir.y - f.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < nearestDist2) {
        nearestDist2 = d2;
        nearest = ir;
      }
    }
    if (nearest) {
      nearest.value += f.value;
      // Grow radius slightly to reflect merged value
      nearest.radius = Math.min(nearest.radius + 0.5, 10);
      f.alive = false;
    } else {
      // No in-range gem — pull the far gem to the edge of range toward the player
      const dx = px - f.x;
      const dy = py - f.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0.1) {
        f.x = px - (dx / dist) * maxDist;
        f.y = py - (dy / dist) * maxDist;
      }
      inRange.push(f);
    }
  }

  return inRange;
}

/**
 * When the gem count exceeds a threshold, merges nearby gems together to keep
 * the field manageable. Each gem merges into the closest other gem within
 * `mergeRadius`, accumulating value and radius.
 */
export function consolidateGems(gems: Gem[], maxCount: number, mergeRadius: number): Gem[] {
  const alive = gems.filter((g) => g.alive);
  if (alive.length <= maxCount) return alive;

  // Single-pass greedy merge: merge each gem into the nearest already-visited gem if within mergeRadius.
  const mergeR2 = mergeRadius * mergeRadius;
  const merged: Gem[] = [];
  for (const g of alive) {
    let best: Gem | null = null;
    let bestDist2 = mergeR2;
    for (const m of merged) {
      const dx = m.x - g.x;
      const dy = m.y - g.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < bestDist2) {
        bestDist2 = d2;
        best = m;
      }
    }
    if (best) {
      const total = best.value + g.value;
      best.x = (best.x * best.value + g.x * g.value) / total;
      best.y = (best.y * best.value + g.y * g.value) / total;
      best.value = total;
      best.radius = Math.min(best.radius + 0.5, 12);
    } else {
      merged.push(g);
    }
  }

  // If still over cap (no close pairs left), force-merge excess into nearest neighbor
  while (merged.length > maxCount) {
    const last = merged.pop()!;
    if (merged.length === 0) {
      merged.push(last);
      break;
    }
    let nearestIdx = 0;
    let nearestDist2 = Infinity;
    for (let i = 0; i < merged.length; i++) {
      const dx = merged[i].x - last.x;
      const dy = merged[i].y - last.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < nearestDist2) {
        nearestDist2 = d2;
        nearestIdx = i;
      }
    }
    const target = merged[nearestIdx];
    const total = target.value + last.value;
    target.x = (target.x * target.value + last.x * last.value) / total;
    target.y = (target.y * target.value + last.y * last.value) / total;
    target.value = total;
    target.radius = Math.min(target.radius + 0.5, 12);
  }

  return merged;
}

// Value-based gem tiers for clear visual distinction
interface GemTier {
  fill: string;
  stroke: string;
  glow: string;
  radiusBonus: number;
}

// Pre-defined gem tiers to avoid per-frame object allocation
const GEM_TIERS: GemTier[] = [
  { fill: CONFIG.gem.color, stroke: "#93c5fd", glow: "", radiusBonus: 0 },          // value < 2
  { fill: "#a78bfa", stroke: "#ddd6fe", glow: "rgba(167, 139, 250, 0.28)", radiusBonus: 1.5 }, // value 2-4
  { fill: "#34d399", stroke: "#a7f3d0", glow: "rgba(52, 211, 153, 0.30)", radiusBonus: 2.5 }, // value 5-9
  { fill: "#f472b6", stroke: "#fbcfe8", glow: "rgba(244, 114, 182, 0.30)", radiusBonus: 3.5 }, // value 10-19
  { fill: "#fbbf24", stroke: "#fde68a", glow: "rgba(251, 191, 36, 0.35)", radiusBonus: 5 },   // value 20+
];

function getGemTier(value: number): GemTier {
  if (value >= 20) return GEM_TIERS[4];
  if (value >= 10) return GEM_TIERS[3];
  if (value >= 5)  return GEM_TIERS[2];
  if (value >= 2)  return GEM_TIERS[1];
  return GEM_TIERS[0];
}

export function renderGems(ctx: CanvasRenderingContext2D, gems: Gem[]): void {
  const low = isLowQuality();
  const pulse = 0.7 + Math.sin(performance.now() * 0.006) * 0.3;
  for (const g of gems) {
    if (!g.alive) continue;

    if (g.isTreasure) {
      // Pulsing golden treasure chest
      ctx.fillStyle = `rgba(251, 191, 36, ${pulse * 0.3})`;
      ctx.beginPath();
      ctx.arc(g.x, g.y, g.radius + 8, 0, Math.PI * 2);
      ctx.fill();

      const chest = getIconSprite(UI_ICONS.treasure, "#fbbf24", Math.round(g.radius * 2.6));
      if (chest) {
        drawSpriteCentered(ctx, chest, g.x, g.y);
        continue;
      }
      // Fallback while the chest image loads: original golden orb
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath();
      ctx.arc(g.x, g.y, g.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#fde68a";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Star sparkle in center
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      ctx.beginPath();
      ctx.arc(g.x, g.y, g.radius * 0.35, 0, Math.PI * 2);
      ctx.fill();
      continue;
    }

    const tier = getGemTier(g.value);
    const r = g.radius + tier.radiusBonus;

    // Glow for merged gems (decoration — skipped in low quality)
    if (tier.glow && !low) {
      ctx.fillStyle = tier.glow;
      ctx.beginPath();
      ctx.arc(g.x, g.y, r + 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = tier.fill;
    ctx.beginPath();
    ctx.arc(g.x, g.y, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = tier.stroke;
    ctx.lineWidth = g.value > 1 ? 1.5 : 1;
    ctx.stroke();

    // Inner sparkle for high-value gems (decoration)
    if (g.value >= 5 && !low) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      ctx.beginPath();
      ctx.arc(g.x - r * 0.25, g.y - r * 0.25, r * 0.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
