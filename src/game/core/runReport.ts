// ============================================================
//  runReport.ts — Damage taken and dealt during one run.
//  Weapons record through damageEnemy while a source is set.
//  Reset with the run. Nothing here touches the DOM.
// ============================================================

import type { WeaponType } from "@/game/core/types";

export type DamageSource = WeaponType | "reflect";

let source: DamageSource | null = null;
const dealt = new Map<DamageSource, number>();
let taken = 0;
let healed = 0;

export function resetRunReport(): void {
  source = null;
  dealt.clear();
  taken = 0;
  healed = 0;
}

/** Attribute the next damageEnemy calls to this weapon. Pass null when the update ends. */
export function setDamageSource(next: WeaponType | null): void {
  source = next;
}

/** Final hit damage, including crits and overkill. Ignored when no weapon is current. */
export function noteDamageDealt(amount: number): void {
  if (amount <= 0 || source == null) return;
  dealt.set(source, (dealt.get(source) ?? 0) + amount);
}

/** Thorn armor and guardian reflection. Not a weapon. */
export function noteReflectDamage(amount: number): void {
  if (amount <= 0) return;
  dealt.set("reflect", (dealt.get("reflect") ?? 0) + amount);
}

/** A hit that actually landed, after shields. Invulnerable frames add nothing. */
export function noteDamageTaken(amount: number): void {
  if (amount > 0) taken += amount;
}

/** HP actually restored. Max-HP increases are not healing. */
export function noteHealing(amount: number): void {
  if (amount > 0) healed += amount;
}

export function runReport(): {
  taken: number;
  healed: number;
  dealt: Partial<Record<WeaponType, number>>;
  reflect: number;
} {
  const byWeapon: Partial<Record<WeaponType, number>> = {};
  let reflect = 0;
  for (const [key, value] of dealt) {
    if (key === "reflect") reflect = value;
    else byWeapon[key] = value;
  }
  return { taken, healed, dealt: byWeapon, reflect };
}
