import { ArrowLeft, Check, Lock } from "lucide-react";
import { GameIcon } from "@/ui/components/GameIcon";
import { PixelFace } from "@/ui/components/PixelSprite";
import { UI_ICONS, weaponIcon } from "@/ui/icons";
import { weaponColor } from "@/ui/theme";
import type { WeaponType } from "@/game/core/types";
import { ACHIEVEMENTS } from "@/game/data/progression";
import { weaponName } from "@/game/systems/WeaponManager";
import type { SaveData } from "@/game/core/storage";

interface AchievementsScreenProps {
  onBack: () => void;
  save: SaveData;
}

const ACHIEVEMENT_WEAPON_MAP: Record<string, WeaponType> = {
  evo_bullet: "bullet",
  evo_melee: "melee",
  evo_bomb: "bomb",
  evo_trap: "trap",
  evo_aura: "aura",
  evo_shuriken: "shuriken",
  evo_claw: "claw",
  evo_fist: "fist",
  evo_axe: "axe",
};

export function AchievementsScreen({ onBack, save }: AchievementsScreenProps) {
  const completed = new Set(save.completedAchievements);
  const totalCompleted = completed.size;
  const totalAchievements = ACHIEVEMENTS.length;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">로비로</span>
          </button>
          <div className="flex items-center gap-2 bg-slate-800/60 rounded-lg px-4 py-2 border border-slate-700">
            <GameIcon name={UI_ICONS.star} size={16} className="text-cyan-400" />
            <span className="text-cyan-300 font-mono font-bold tabular-nums">{save.stars}</span>
            <span className="text-slate-500 text-xs">별</span>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-rose-950/40 border-2 border-rose-500/30 mb-3">
            <GameIcon name={UI_ICONS.achievements} size={30} className="text-rose-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">업적</h1>
          <p className="text-slate-500 text-sm mt-2">
            업적 달성 시 별을 획득할 수 있습니다
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-6 rounded-xl border border-slate-700 bg-slate-900/40 px-5 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm">달성 현황</span>
            <span className="text-slate-200 text-sm font-mono font-bold">
              {totalCompleted} / {totalAchievements}
            </span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-rose-500 to-amber-400 transition-all duration-500"
              style={{ width: `${(totalCompleted / totalAchievements) * 100}%` }}
            />
          </div>
        </div>

        {/* Achievement list */}
        <div className="grid grid-cols-1 gap-3">
          {ACHIEVEMENTS.map((ach) => {
            const isDone = completed.has(ach.id);
            const weaponType = ACHIEVEMENT_WEAPON_MAP[ach.id];
            const weaponDisplayName = weaponType ? weaponName(weaponType) : "";

            return (
              <div
                key={ach.id}
                className={`relative flex items-center gap-4 rounded-xl border-2 px-5 py-4 transition-all
                  ${isDone
                    ? "border-amber-600/40 bg-amber-950/20"
                    : "border-slate-700 bg-slate-900/40"
                  }`}
              >
                {/* Icon */}
                <div
                  className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all
                    ${isDone
                      ? "bg-amber-500/20 border border-amber-500/40"
                      : "bg-slate-800/60 border border-slate-700"
                    }`}
                >
                  {ach.enemy ? (
                    <span className="relative">
                      <PixelFace
                        kind="enemy"
                        id={ach.enemy}
                        size={32}
                        className={isDone ? "" : "grayscale"}
                      />
                      {!isDone && <Lock className="absolute -bottom-1 -right-1.5 w-3.5 h-3.5 text-slate-400" />}
                    </span>
                  ) : weaponType ? (
                    <span className="relative">
                      <GameIcon
                        name={weaponIcon(weaponType, true)}
                        size={28}
                        color={isDone ? weaponColor(weaponType) : "#475569"}
                      />
                      {!isDone && <Lock className="absolute -bottom-1 -right-1.5 w-3.5 h-3.5 text-slate-400" />}
                    </span>
                  ) : (
                    <GameIcon name={UI_ICONS.achievements} size={24} className={isDone ? "text-amber-400" : "text-slate-600"} />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className={`font-bold text-sm ${isDone ? "text-amber-200" : "text-slate-200"}`}>
                      {ach.name}
                    </h3>
                    {isDone && (
                      <span className="flex items-center gap-0.5 rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-400">
                        <Check className="w-2.5 h-2.5" /> 달성
                      </span>
                    )}
                  </div>
                  <p className="text-slate-500 text-xs leading-snug">{ach.desc}</p>
                  {weaponDisplayName && (
                    <p className="text-slate-600 text-xs mt-1">
                      대상 무기: {weaponDisplayName}
                    </p>
                  )}
                </div>

                {/* Reward */}
                <div className={`flex-shrink-0 flex items-center gap-1 rounded-lg px-3 py-2
                  ${isDone ? "bg-cyan-500/15 border border-cyan-500/30" : "bg-slate-800/40 border border-slate-700/50"}`}>
                  <GameIcon name={UI_ICONS.star} size={16} className={isDone ? "text-cyan-400" : "text-slate-600"} />
                  <span className={`text-sm font-mono font-bold ${isDone ? "text-cyan-300" : "text-slate-500"}`}>
                    +{ach.reward}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {totalCompleted === totalAchievements && (
          <div className="mt-6 rounded-xl border-2 border-amber-500/40 bg-amber-950/20 px-6 py-4 text-center">
            <p className="text-amber-300 font-bold text-sm">
              모든 업적을 달성했습니다!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
