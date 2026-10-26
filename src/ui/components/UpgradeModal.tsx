import { useEffect } from "react";
import type { UpgradeOption } from "@/game/core/types";
import { CONFIG } from "@/game/data/config";
import { accessoryColor, weaponColor } from "@/ui/theme";
import { GameIcon } from "@/ui/components/GameIcon";
import { UI_ICONS, upgradeIcon } from "@/ui/icons";

interface UpgradeModalProps {
  options: UpgradeOption[];
  onSelect: (index: number) => void;
  onReroll: () => void;
  rerollsLeft: number;
  /** Additional level-up picks queued after this one */
  pendingAfter?: number;
}

interface KindStyle {
  badge: string;
  badgeClass: string;
  border: string;
  sub: string;
}

const KIND_STYLE: Record<UpgradeOption["kind"], KindStyle> = {
  newWeapon: {
    badge: "NEW",
    badgeClass: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    border: "border-emerald-600 hover:border-emerald-400",
    sub: "새 무기 추가",
  },
  weaponLevel: {
    badge: "UP",
    badgeClass: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    border: "border-amber-600/50 hover:border-amber-400",
    sub: "기존 무기 강화",
  },
  weaponEvolve: {
    badge: "EVOLVE",
    badgeClass: "bg-amber-400 text-slate-900 border-amber-300",
    border: "border-amber-400 hover:border-amber-200 shadow-[0_0_0_1px_rgba(251,191,36,0.35)]",
    sub: "★ 무기 진화 — 최종 형태",
  },
  newAccessory: {
    badge: "NEW",
    badgeClass: "bg-violet-500/20 text-violet-300 border-violet-500/40",
    border: "border-violet-600 hover:border-violet-400",
    sub: "새 장신구 획득",
  },
  accessoryLevel: {
    badge: "UP",
    badgeClass: "bg-violet-500/20 text-violet-200 border-violet-500/40",
    border: "border-violet-600/50 hover:border-violet-400",
    sub: "기존 장신구 강화",
  },
};

function optionColor(opt: UpgradeOption): string {
  if (opt.weaponType) return weaponColor(opt.weaponType);
  if (opt.accessoryType) return accessoryColor(opt.accessoryType);
  return "#fbbf24";
}

function optionDesc(opt: UpgradeOption): string | null {
  if (opt.kind === "newWeapon" && opt.weaponType) return CONFIG.weapons[opt.weaponType].desc;
  if (opt.kind === "newAccessory" && opt.accessoryType) return CONFIG.accessories[opt.accessoryType].desc;
  return null;
}

export function UpgradeModal({ options, onSelect, onReroll, rerollsLeft, pendingAfter = 0 }: UpgradeModalProps) {
  const canReroll = rerollsLeft > 0;

  // Keyboard: 1/2/3 to pick, R to reroll
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 1 && n <= options.length) {
        e.preventDefault();
        onSelect(n - 1);
      } else if ((e.key === "r" || e.key === "R") && canReroll) {
        e.preventDefault();
        onReroll();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [options, onSelect, onReroll, canReroll]);

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center overflow-y-auto bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md px-6 py-4">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-2xl font-bold text-amber-300 tracking-wide">
            LEVEL UP
            {pendingAfter > 0 && (
              <span className="ml-2 align-middle text-xs font-semibold text-amber-200/80">+{pendingAfter} 대기</span>
            )}
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
            <GameIcon name={UI_ICONS.reroll} size={14} />
            리롤
            <span className="font-mono">({rerollsLeft})</span>
            <kbd className="ml-0.5 rounded bg-black/30 px-1 font-mono text-[10px] opacity-70">R</kbd>
          </button>
        </div>
        <p className="text-center text-slate-400 text-sm mb-6">
          강화를 선택하세요 <span className="text-slate-600">({options.map((_, i) => i + 1).join(" · ")})</span>
        </p>

        <div className="flex flex-col gap-3">
          {options.map((opt, i) => {
            const style = KIND_STYLE[opt.kind];
            const color = optionColor(opt);
            const desc = optionDesc(opt);
            return (
              <button
                key={`${opt.kind}-${opt.weaponType ?? opt.accessoryType ?? ""}-${i}`}
                onClick={() => onSelect(i)}
                className={`group relative flex items-center gap-4 rounded-lg border-2 ${style.border} bg-slate-800/70 px-4 py-3.5
                           text-left transition-all duration-200 hover:bg-slate-700/70 active:scale-[0.98]`}
              >
                <kbd className="absolute right-2 top-2 rounded bg-slate-900/70 px-1.5 font-mono text-[10px] text-slate-500">
                  {i + 1}
                </kbd>
                <div
                  className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${color}1f`, border: `1px solid ${color}55` }}
                >
                  <GameIcon name={upgradeIcon(opt)} size={30} color={color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`rounded border px-1.5 py-px text-[10px] font-bold tracking-wider ${style.badgeClass}`}>
                      {style.badge}
                    </span>
                    <span className="text-slate-100 font-medium text-[15px] truncate">{opt.label}</span>
                  </div>
                  <span className="mt-0.5 block text-xs text-slate-400">{desc ?? style.sub}</span>
                  {opt.effectDesc && (
                    <span className="block mt-0.5 text-cyan-300 text-xs font-semibold">
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
