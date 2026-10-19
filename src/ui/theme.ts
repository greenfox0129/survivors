// ============================================================
//  ui/theme.ts — UI 공용 색상·아이콘 매핑 (단일 출처)
//  무기 색은 게임 데이터(CONFIG.weapons[type].color)를 그대로 쓰고,
//  장신구 색·아이콘은 여기서만 정의한다. (예전엔 HUD/도감/업그레이드 모달에 중복)
// ============================================================

import {
  Gem,
  Heart,
  Leaf,
  Magnet,
  Shield,
  ShieldCheck,
  Sparkles,
  Sword,
  Wind,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { CONFIG } from "@/game/data/config";
import type { AccessoryType, WeaponType } from "@/game/core/types";

export const ACCESSORY_COLORS: Record<AccessoryType, string> = {
  swiftBoots: "#22d3ee",
  vitalRing: "#fb7185",
  magnetCharm: "#60a5fa",
  powerAmulet: "#f59e0b",
  hastePendant: "#a78bfa",
  xpcrystal: "#34d399",
  thornArmor: "#f472b6",
  shieldForge: "#94a3b8",
  natureBlessing: "#4ade80",
};

export const ACCESSORY_ICONS: Record<AccessoryType, LucideIcon> = {
  swiftBoots: Wind,
  vitalRing: Heart,
  magnetCharm: Magnet,
  powerAmulet: Sword,
  hastePendant: Zap,
  xpcrystal: Gem,
  thornArmor: Shield,
  shieldForge: ShieldCheck,
  natureBlessing: Leaf,
};

export function accessoryColor(type?: AccessoryType): string {
  return (type && ACCESSORY_COLORS[type]) ?? "#888888";
}

export function accessoryIcon(type?: AccessoryType): LucideIcon {
  return (type && ACCESSORY_ICONS[type]) ?? Sparkles;
}

export function weaponColor(type: WeaponType): string {
  return CONFIG.weapons[type]?.color ?? "#888888";
}
