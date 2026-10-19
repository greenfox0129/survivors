import { useState } from "react";
import { ArrowLeft, Star, ChevronUp, RotateCcw, X } from "lucide-react";
import { TRAITS, TRAIT_UPGRADE_COST, traitTotalSpent } from "@/game/data";
import type { SaveData } from "@/game/storage";

interface TraitsScreenProps {
  onBack: () => void;
  save: SaveData;
  onUpdate: (save: SaveData) => void;
}

export function TraitsScreen({ onBack, save, onUpdate }: TraitsScreenProps) {
  const [showReset, setShowReset] = useState(false);

  const totalSpent = TRAITS.reduce(
    (sum, t) => sum + traitTotalSpent(save.traitLevels[t.id] ?? 0),
    0
  );
  const canReset = totalSpent > 0;

  function handleUpgrade(traitId: string) {
    const trait = TRAITS.find((t) => t.id === traitId);
    if (!trait) return;
    const currentLevel = save.traitLevels[traitId] ?? 0;
    if (currentLevel >= trait.maxLevel) return;
    const cost = TRAIT_UPGRADE_COST(currentLevel);
    if (save.gold < cost) return;
    onUpdate({
      ...save,
      gold: save.gold - cost,
      traitLevels: {
        ...save.traitLevels,
        [traitId]: currentLevel + 1,
      },
    });
  }

  function handleResetAll() {
    const resetLevels = Object.fromEntries(TRAITS.map((t) => [t.id, 0]));
    onUpdate({
      ...save,
      gold: save.gold + totalSpent,
      traitLevels: resetLevels,
    });
    setShowReset(false);
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-3xl">
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
            <Star className="w-4 h-4 text-amber-400" />
            <span className="text-amber-300 font-mono font-bold tabular-nums">{save.gold}</span>
            <span className="text-slate-500 text-xs">G</span>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-slate-100 mb-1">특성</h1>
        <p className="text-slate-500 text-sm mb-6">
          모든 캐릭터에 적용되는 영구 성장 요소입니다
        </p>

        {/* Trait list */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {TRAITS.map((trait) => {
            const level = save.traitLevels[trait.id] ?? 0;
            const isMax = level >= trait.maxLevel;
            const cost = TRAIT_UPGRADE_COST(level);
            const canAfford = save.gold >= cost;
            const isReady = !isMax && canAfford;

            return (
              <div
                key={trait.id}
                className="rounded-xl border-2 border-slate-700 bg-slate-900/40 p-5 flex flex-col"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-slate-100 font-bold text-base">{trait.name}</h3>
                    <p className="text-slate-500 text-xs mt-1 leading-snug">{trait.desc}</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-slate-300 font-mono text-sm font-bold whitespace-nowrap">
                      Lv {level}/{trait.maxLevel}
                    </span>
                  </div>
                </div>

                {/* Level dots */}
                <div className="flex items-center gap-1.5 mb-4">
                  {Array.from({ length: trait.maxLevel }).map((_, i) => (
                    <div
                      key={i}
                      className={`flex-1 h-2 rounded-full transition-colors ${
                        i < level
                          ? "bg-emerald-400"
                          : "bg-slate-800"
                      }`}
                    />
                  ))}
                </div>

                {/* Current effect + upgrade preview */}
                <div className="flex flex-col gap-1 mt-auto mb-3">
                  <span className="text-slate-300 text-sm font-semibold">
                    {trait.effectLabel(level)}
                  </span>
                  {!isMax && (
                    <span className="text-emerald-300 text-xs font-semibold">
                      → 강화 시 {trait.effectLabel(level + 1)}
                    </span>
                  )}
                </div>

                {/* Upgrade button */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-xs">
                    {isMax ? "최대 달성" : ""}
                  </span>
                  <button
                    onClick={() => handleUpgrade(trait.id)}
                    disabled={!isReady}
                    className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all active:scale-95
                      ${isReady
                        ? "bg-emerald-600 text-white hover:bg-emerald-500"
                        : "bg-slate-800 text-slate-500 cursor-not-allowed"
                      }`}
                  >
                    <ChevronUp className="w-4 h-4" />
                    {isMax ? (
                      <span>MAX</span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        {cost}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Reset all traits */}
        {canReset && (
          <button
            onClick={() => setShowReset(true)}
            className="mt-6 w-full flex items-center justify-center gap-2 rounded-lg border border-slate-700/50 bg-slate-800/30 px-4 py-2.5
                       text-slate-400 text-sm font-medium transition-all
                       hover:border-slate-500 hover:text-slate-200 active:scale-[0.98]"
          >
            <RotateCcw className="w-4 h-4" />
            특성 전체 초기화
            <span className="text-amber-300/70 text-xs font-mono">
              (환불 +{totalSpent} G)
            </span>
          </button>
        )}
      </div>

      {/* Reset confirmation modal */}
      {showReset && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          onClick={() => setShowReset(false)}
        >
          <div
            className="rounded-2xl border-2 border-slate-700 bg-slate-900 p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-slate-300" />
                <h3 className="text-slate-100 font-bold text-lg">특성 전체 초기화</h3>
              </div>
              <button
                onClick={() => setShowReset(false)}
                className="text-slate-500 hover:text-slate-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-1">
              모든 특성 레벨을 0으로 초기화합니다.
            </p>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              사용한 골드를 전액 환불받습니다.
            </p>
            <div className="rounded-lg bg-slate-800/60 px-4 py-3 mb-5 flex items-center justify-between">
              <span className="text-slate-300 text-sm">환불 예정</span>
              <span className="text-amber-300 font-mono font-bold flex items-center gap-1">
                <Star className="w-4 h-4" />
                +{totalSpent} G
              </span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowReset(false)}
                className="flex-1 rounded-lg border border-slate-700 bg-slate-800/60 px-4 py-2.5
                           text-slate-300 text-sm font-semibold transition-all
                           hover:bg-slate-700/60 active:scale-95"
              >
                취소
              </button>
              <button
                onClick={handleResetAll}
                className="flex-1 rounded-lg bg-amber-500 px-4 py-2.5
                           text-slate-900 text-sm font-bold transition-all
                           hover:bg-amber-400 active:scale-95"
              >
                초기화
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
