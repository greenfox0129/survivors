import { Sparkles, Plus, Heart, Wind, Gem as GemIcon, Zap, Shield, ShieldCheck, Sword, Magnet, RefreshCw, Leaf } from "lucide-react";
import type { UpgradeOption, AccessoryType } from "@/game/types";
import type { LucideIcon } from "lucide-react";

interface UpgradeModalProps {
  options: UpgradeOption[];
  onSelect: (index: number) => void;
  onReroll: () => void;
  rerollsLeft: number;
}

function getIcon(opt: UpgradeOption): LucideIcon {
  if (opt.kind === "newWeapon") return Plus;
  if (opt.kind === "weaponLevel") return Sparkles;
  if (opt.kind === "weaponEvolve") return Sparkles;
  if (opt.kind === "newAccessory" || opt.kind === "accessoryLevel") {
    return getAccessoryIcon(opt.accessoryType);
  }
  return Sparkles;
}

function getAccessoryIcon(type?: AccessoryType): LucideIcon {
  switch (type) {
    case "swiftBoots": return Wind;
    case "vitalRing": return Heart;
    case "magnetCharm": return Magnet;
    case "powerAmulet": return Sword;
    case "hastePendant": return Zap;
    case "xpcrystal": return GemIcon;
    case "thornArmor": return Shield;
    case "shieldForge": return ShieldCheck;
    case "natureBlessing": return Leaf;
    default: return Sparkles;
  }
}

function getIconColor(opt: UpgradeOption): string {
  if (opt.kind === "newWeapon") return "text-emerald-400";
  if (opt.kind === "weaponLevel") return "text-amber-400";
  if (opt.kind === "weaponEvolve") return "text-amber-300";
  if (opt.kind === "newAccessory") return "text-violet-400";
  if (opt.kind === "accessoryLevel") return "text-violet-300";
  return "text-amber-400";
}

function getBorderColor(opt: UpgradeOption): string {
  if (opt.kind === "newWeapon") return "border-emerald-600 hover:border-emerald-400";
  if (opt.kind === "weaponLevel") return "border-amber-600/50 hover:border-amber-400";
  if (opt.kind === "weaponEvolve") return "border-amber-400 hover:border-amber-300";
  if (opt.kind === "newAccessory") return "border-violet-600 hover:border-violet-400";
  if (opt.kind === "accessoryLevel") return "border-violet-600/50 hover:border-violet-400";
  return "border-slate-700 hover:border-slate-500";
}

export function UpgradeModal({ options, onSelect, onReroll, rerollsLeft }: UpgradeModalProps) {
  const canReroll = rerollsLeft > 0;
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md px-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-2xl font-bold text-amber-300 tracking-wide">
            LEVEL UP
          </h2>
          <button
            onClick={onReroll}
            disabled={!canReroll}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all active:scale-95
              ${canReroll
                ? "bg-sky-600/80 text-white hover:bg-sky-500"
                : "bg-slate-800 text-slate-600 cursor-not-allowed"
              }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            리롤
            <span className="font-mono">({rerollsLeft})</span>
          </button>
        </div>
        <p className="text-center text-slate-400 text-sm mb-6">
          강화를 선택하세요
        </p>

        <div className="flex flex-col gap-3">
          {options.map((opt, i) => {
            const Icon = getIcon(opt);
            const iconColor = getIconColor(opt);
            const borderColor = getBorderColor(opt);
            return (
              <button
                key={`${opt.kind}-${opt.weaponType ?? ""}-${i}`}
                onClick={() => onSelect(i)}
                className={`group flex items-center gap-4 rounded-lg border-2 ${borderColor} bg-slate-800/60 px-5 py-4
                           transition-all duration-200 hover:bg-slate-700/60 active:scale-[0.98]`}
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-slate-900/60 flex items-center justify-center
                                transition-transform group-hover:scale-110">
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
                <div className="flex-1 text-left">
                  <span className="text-slate-100 font-medium text-base block">
                    {opt.label}
                  </span>
                  {opt.kind === "newWeapon" && opt.weaponType && (
                    <span className="text-emerald-400/70 text-xs">새 무기 추가</span>
                  )}
                  {opt.kind === "weaponLevel" && opt.weaponType && (
                    <span className="text-amber-400/70 text-xs">기존 무기 강화</span>
                  )}
                  {opt.kind === "newAccessory" && opt.accessoryType && (
                    <span className="text-violet-400/70 text-xs">새 장신구 획득</span>
                  )}
                  {opt.kind === "accessoryLevel" && opt.accessoryType && (
                    <span className="text-violet-300/70 text-xs">기존 장신구 강화</span>
                  )}
                  {opt.kind === "weaponEvolve" && opt.weaponType && (
                    <span className="text-amber-300 text-xs font-bold">★ 무기 진화</span>
                  )}
                  {opt.effectDesc && (
                    <span className="block mt-0.5 text-cyan-400 text-xs font-semibold">
                      ✦ {opt.effectDesc}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
