import { useState, useCallback, useEffect, useRef } from "react";
import { ArrowLeft, Sparkles, Check, Lock } from "lucide-react";
import { PixelFace, PixelWalker } from "@/ui/components/PixelSprite";
import { GameIcon } from "@/ui/components/GameIcon";
import { UI_ICONS } from "@/ui/icons";
import { readableAccent } from "@/ui/theme";
import {
  CHARACTERS,
  GACHA_COST,
  DUPE_MEMORY_REWARD,
  type CharacterDef,
} from "@/game/data/progression";
import type { SaveData } from "@/game/core/storage";

interface GachaScreenProps {
  onBack: () => void;
  save: SaveData;
  onUpdate: (save: SaveData) => void;
}

type GachaState = "idle" | "rolling" | "result";

interface PullResult {
  char: CharacterDef;
  isDupe: boolean;
  memoriesGained: number;
}

const MULTI_PULL_COUNT = 10;
const MULTI_PULL_COST = GACHA_COST * MULTI_PULL_COUNT;

function processPick(save: SaveData, picked: CharacterDef): {
  newSave: SaveData;
  isDupe: boolean;
  memoriesGained: number;
} {
  const ownedIds = new Set(save.owned.map((o) => o.id));
  if (ownedIds.has(picked.id)) {
    const newOwned = save.owned.map((o) =>
      o.id === picked.id ? { ...o, memories: o.memories + DUPE_MEMORY_REWARD } : o
    );
    return { newSave: { ...save, owned: newOwned }, isDupe: true, memoriesGained: DUPE_MEMORY_REWARD };
  }
  const newOwned = [...save.owned, { id: picked.id, level: 1, stars: 0, memories: 0, breakthrough: 0 }];
  return { newSave: { ...save, owned: newOwned }, isDupe: false, memoriesGained: 0 };
}

export function GachaScreen({ onBack, save, onUpdate }: GachaScreenProps) {
  const [state, setState] = useState<GachaState>("idle");
  const [mode, setMode] = useState<"single" | "multi">("single");
  const [results, setResults] = useState<PullResult[]>([]);
  const [rollFlash, setRollFlash] = useState<string>("#22d3ee");
  const [rollFlashId, setRollFlashId] = useState<string | null>(null);
  // Guards against a double click starting two rolls from the same save,
  // and lets us cancel a roll if the screen is left mid-animation (no gold is spent then).
  const rollingRef = useRef(false);
  const intervalRef = useRef<number | null>(null);
  useEffect(() => () => {
    if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
  }, []);

  const ownedIds = new Set(save.owned.map((o) => o.id));
  const unlockedSpecialIds = new Set(
    CHARACTERS
      .filter((c) => c.special && c.unlockAchievement && save.completedAchievements.includes(c.unlockAchievement))
      .map((c) => c.id)
  );
  const pool = CHARACTERS.filter((c) => !c.special || ownedIds.has(c.id) || unlockedSpecialIds.has(c.id));
  const unowned = pool.filter((c) => !ownedIds.has(c.id));
  const lockedSpecial = CHARACTERS.filter((c) => c.special && !ownedIds.has(c.id) && !unlockedSpecialIds.has(c.id));

  const canRollSingle = save.gold >= GACHA_COST && pool.length > 0 && state !== "rolling";
  const canRollMulti = save.gold >= MULTI_PULL_COST && pool.length > 0 && state !== "rolling";

  const runRoll = useCallback(
    (count: number, pullMode: "single" | "multi") => {
      if (rollingRef.current || save.gold < GACHA_COST * count || pool.length === 0) return;
      rollingRef.current = true;
      setState("rolling");
      setMode(pullMode);

      const duration = pullMode === "multi" ? 1500 : 1200;
      let elapsed = 0;
      intervalRef.current = window.setInterval(() => {
        elapsed += 80;
        const random = pool[Math.floor(Math.random() * pool.length)];
        setRollFlash(readableAccent(random.color));
        setRollFlashId(random.id);
        if (elapsed >= duration) {
          if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
          intervalRef.current = null;
          rollingRef.current = false;
          let working = { ...save, gold: save.gold - GACHA_COST * count };
          const pulls: PullResult[] = [];
          for (let i = 0; i < count; i++) {
            const picked = pool[Math.floor(Math.random() * pool.length)];
            const { newSave, isDupe, memoriesGained } = processPick(working, picked);
            working = newSave;
            pulls.push({ char: picked, isDupe, memoriesGained });
          }
          onUpdate(working);
          setResults(pulls);
          setState("result");
        }
      }, 80);
    },
    [save, pool, onUpdate]
  );

  const handleRoll = useCallback(() => runRoll(1, "single"), [runRoll]);
  const handleRoll10 = useCallback(() => runRoll(MULTI_PULL_COUNT, "multi"), [runRoll]);

  const handleRollAgain = useCallback(() => {
    if (mode === "multi") handleRoll10();
    else handleRoll();
  }, [mode, handleRoll, handleRoll10]);

  const isMultiResult = mode === "multi" && results.length > 1;
  const newCount = results.filter((r) => !r.isDupe).length;
  const totalMemories = results.reduce((s, r) => s + r.memoriesGained, 0);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">로비로</span>
          </button>
          <div className="flex items-center gap-2 bg-slate-800/60 rounded-lg px-4 py-2 border border-slate-700">
            <GameIcon name={UI_ICONS.gold} size={16} className="text-amber-400" />
            <span className="text-amber-300 font-mono font-bold tabular-nums">{save.gold}</span>
            <span className="text-slate-500 text-xs">G</span>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-950/40 border-2 border-amber-500/30 mb-4">
            <GameIcon name={UI_ICONS.gacha} size={36} className="text-amber-400" />
          </div>
          <h1 className="text-3xl font-bold text-slate-100">캐릭터 뽑기</h1>
          <p className="text-slate-500 text-sm mt-2">
            무작위로 캐릭터를 획득합니다 · 중복 시 기억 획득
          </p>
        </div>

        {/* Gacha area */}
        <div className="rounded-2xl border-2 border-slate-700 bg-slate-900/40 p-8 flex flex-col items-center">
          {/* Idle / Rolling display */}
          {state !== "result" && (
            <>
              <div
                className="relative w-32 h-32 rounded-full flex items-center justify-center mb-6 transition-all duration-100"
                style={{
                  backgroundColor: (state === "rolling" ? rollFlash : "#334155") + "22",
                  border: `2px solid ${state === "rolling" ? rollFlash : "#475569"}`,
                  boxShadow: state === "rolling"
                    ? `0 0 30px ${rollFlash}66`
                    : "none",
                }}
              >
                {state === "rolling" && rollFlashId ? (
                  <PixelFace kind="char" id={rollFlashId} size={76} color={rollFlash} className="rounded-lg" />
                ) : (
                  <GameIcon name={UI_ICONS.gacha} size={56} className="text-slate-500" />
                )}
              </div>

              {/* Roll buttons */}
              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
                <button
                  onClick={handleRoll}
                  disabled={!canRollSingle}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-6 py-4 text-base font-bold transition-all active:scale-95
                    ${canRollSingle
                      ? "bg-amber-500 text-slate-900 hover:bg-amber-400"
                      : "bg-slate-800 text-slate-500 cursor-not-allowed"
                    }`}
                >
                  <GameIcon name={UI_ICONS.gacha} size={20} />
                  1회 뽑기
                  <span className="flex items-center gap-1 text-sm">
                    <GameIcon name={UI_ICONS.gold} size={16} />
                    {GACHA_COST}
                  </span>
                </button>
                <button
                  onClick={handleRoll10}
                  disabled={!canRollMulti}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-6 py-4 text-base font-bold transition-all active:scale-95
                    ${canRollMulti
                      ? "bg-gradient-to-r from-violet-500 to-amber-500 text-slate-900 hover:from-violet-400 hover:to-amber-400"
                      : "bg-slate-800 text-slate-500 cursor-not-allowed"
                    }`}
                >
                  <Sparkles className="w-5 h-5" />
                  10연 뽑기
                  <span className="flex items-center gap-1 text-sm">
                    <GameIcon name={UI_ICONS.gold} size={16} />
                    {MULTI_PULL_COST}
                  </span>
                </button>
              </div>

              {unowned.length === 0 && pool.length > 0 && (
                <p className="text-emerald-400 text-sm mt-4 font-semibold">
                  모든 캐릭터 보유 중 — 중복 시 기억을 획득합니다!
                </p>
              )}
              {pool.length === 0 && (
                <p className="text-slate-500 text-sm mt-4">
                  뽑기 가능한 캐릭터가 없습니다
                </p>
              )}
              {pool.length > 0 && save.gold < GACHA_COST && (
                <p className="text-red-400 text-sm mt-4">
                  골드가 부족합니다
                </p>
              )}
              {save.gold >= GACHA_COST && save.gold < MULTI_PULL_COST && pool.length > 0 && (
                <p className="text-amber-400/70 text-xs mt-2">
                  10연 뽑기에는 {MULTI_PULL_COST} 골드가 필요합니다
                </p>
              )}
            </>
          )}

          {/* Result display — single */}
          {state === "result" && !isMultiResult && results.length === 1 && (
            <SingleResult
              result={results[0]}
              onRollAgain={handleRollAgain}
              onBack={onBack}
              canRollAgain={mode === "multi" ? save.gold >= MULTI_PULL_COST : save.gold >= GACHA_COST}
              rollAgainCost={mode === "multi" ? MULTI_PULL_COST : GACHA_COST}
              rollAgainLabel={mode === "multi" ? "10연 다시" : "한 번 더"}
              poolEmpty={pool.length === 0}
            />
          )}

          {/* Result display — 10-pull grid */}
          {state === "result" && isMultiResult && (
            <div className="flex flex-col items-center w-full">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-xl font-bold text-slate-100">10연 뽑기 결과</h2>
                {newCount > 0 && (
                  <span className="flex items-center gap-1 rounded-full bg-emerald-950/60 border border-emerald-700/50 px-2.5 py-0.5 text-xs font-bold text-emerald-300">
                    <Check className="w-3 h-3" /> NEW {newCount}
                  </span>
                )}
                {totalMemories > 0 && (
                  <span className="flex items-center gap-1 rounded-full bg-violet-950/60 border border-violet-700/50 px-2.5 py-0.5 text-xs font-bold text-violet-300">
                    <GameIcon name={UI_ICONS.memory} size={12} /> 기억 +{totalMemories}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-5 gap-2 sm:gap-3 w-full mb-6">
                {results.map((r, i) => (
                  <ResultCard key={i} result={r} />
                ))}
              </div>

              <div className="flex gap-3 w-full max-w-md">
                <button
                  onClick={handleRollAgain}
                  disabled={save.gold < MULTI_PULL_COST || pool.length === 0}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg border-2 border-violet-700 bg-violet-900/40 px-4 py-3
                             text-violet-200 text-sm font-semibold transition-all
                             hover:border-violet-500 hover:bg-violet-800/40 active:scale-95
                             disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Sparkles className="w-4 h-4" />
                  10연 다시
                  <span className="flex items-center gap-0.5 text-amber-300 text-xs font-mono">
                    <GameIcon name={UI_ICONS.gold} size={12} />
                    {MULTI_PULL_COST}
                  </span>
                </button>
                <button
                  onClick={onBack}
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-800/60 px-4 py-3
                             text-slate-300 text-sm font-semibold transition-all
                             hover:bg-slate-700/60 active:scale-95"
                >
                  로비로
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Character pool preview */}
        <div className="mt-6">
          <h3 className="text-slate-400 text-sm font-semibold mb-3">캐릭터 목록</h3>
          <div className="grid grid-cols-5 gap-3">
            {CHARACTERS.map((char) => {
              const isOwned = ownedIds.has(char.id);
              const isLockedSpecial = lockedSpecial.some((c) => c.id === char.id);
              return (
                <div
                  key={char.id}
                  className={`relative flex flex-col items-center rounded-xl border-2 px-2 py-3 transition-all
                    ${isOwned
                      ? "border-slate-700 bg-slate-900/40"
                      : isLockedSpecial
                        ? "border-amber-900/40 bg-amber-950/10"
                        : "border-slate-800 bg-slate-900/20"
                    }`}
                >
                  {!isOwned && (
                    <Lock className={`absolute top-1.5 right-1.5 w-3 h-3 ${isLockedSpecial ? "text-amber-600" : "text-slate-600"}`} />
                  )}
                  <div
                    className="w-10 h-10 rounded-lg mb-1.5 flex items-center justify-center overflow-hidden bg-[#2f4a1f]"
                    style={{ border: `2px solid ${readableAccent(char.color)}${isOwned ? "" : "55"}` }}
                  >
                    <PixelFace kind="char" id={char.id} size={36} color={readableAccent(char.color)} dimmed={!isOwned} />
                  </div>
                  <span className={`text-xs font-semibold ${isOwned ? "text-slate-200" : "text-slate-500"}`}>
                    {char.name}
                  </span>
                  {isOwned && (
                    <Check className="w-3 h-3 text-emerald-400 mt-1" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {lockedSpecial.length > 0 && (
          <div className="mt-4 rounded-lg border border-amber-900/40 bg-amber-950/20 px-4 py-3 flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <p className="text-amber-300/80 text-xs">
              {lockedSpecial.map((c) => c.name).join(", ")} — 해당 캐릭터의 진화 업적 달성 시 뽑기 풀에 추가됩니다
            </p>
          </div>
        )}

        <p className="text-violet-400/80 text-sm text-center mt-4">
          같은 캐릭터를 뽑으면 기억을 얻어 돌파할 수 있습니다.
        </p>
      </div>
    </div>
  );
}

function SingleResult({
  result,
  onRollAgain,
  onBack,
  canRollAgain,
  rollAgainCost,
  rollAgainLabel,
  poolEmpty,
}: {
  result: PullResult;
  onRollAgain: () => void;
  onBack: () => void;
  canRollAgain: boolean;
  rollAgainCost: number;
  rollAgainLabel: string;
  poolEmpty: boolean;
}) {
  const { char, isDupe, memoriesGained } = result;
  return (
    <div className="flex flex-col items-center w-full">
      <div
        className="w-32 h-32 rounded-full flex items-center justify-center mb-4"
        style={{
          backgroundColor: char.color + "22",
          border: `2px solid ${readableAccent(char.color)}`,
          boxShadow: `0 0 40px ${readableAccent(char.color)}44`,
        }}
      >
        <PixelWalker id={char.id} size={88} />
      </div>

      <div className="flex items-center gap-2 mb-2">
        <h2 className="text-2xl font-bold" style={{ color: readableAccent(char.color) }}>
          {char.name}
        </h2>
        {isDupe ? (
          <span className="flex items-center gap-1 rounded-full bg-violet-950/60 border border-violet-700/50 px-2.5 py-0.5 text-xs font-bold text-violet-300">
            <GameIcon name={UI_ICONS.memory} size={12} /> 기억 +{memoriesGained}
          </span>
        ) : (
          <span className="flex items-center gap-1 rounded-full bg-emerald-950/60 border border-emerald-700/50 px-2.5 py-0.5 text-xs font-bold text-emerald-300">
            <Check className="w-3 h-3" /> NEW
          </span>
        )}
      </div>
      <p className="text-slate-400 text-sm text-center mb-2 max-w-xs">
        {isDupe ? "중복 획득! 기억을 획득하여 돌파에 사용할 수 있습니다." : char.desc}
      </p>
      {isDupe && (
        <p className="text-violet-300/80 text-xs text-center mb-5 max-w-xs">
          기억을 모아 캐릭터 관리 화면에서 돌파를 진행하세요
        </p>
      )}

      {!isDupe && (
        <div className="grid grid-cols-2 gap-2 w-full max-w-xs mb-6">
          <StatChip label="체력" value={char.hpMult} />
          <StatChip label="이동속도" value={char.speedMult} />
          <StatChip label="공격력" value={char.damageMult} />
          <StatChip label="공격속도" value={1 / char.cooldownMult} />
        </div>
      )}
      {isDupe && <div className="mb-6" />}

      <div className="flex gap-3 w-full max-w-xs">
        <button
          onClick={onRollAgain}
          disabled={!canRollAgain || poolEmpty}
          className="flex-1 flex items-center justify-center gap-2 rounded-lg border-2 border-slate-700 bg-slate-800/60 px-4 py-3
                     text-slate-200 text-sm font-semibold transition-all
                     hover:border-slate-500 active:scale-95
                     disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <GameIcon name={UI_ICONS.gacha} size={16} />
          {rollAgainLabel}
          <span className="flex items-center gap-0.5 text-amber-300 text-xs font-mono">
            <GameIcon name={UI_ICONS.gold} size={12} />
            {rollAgainCost}
          </span>
        </button>
        <button
          onClick={onBack}
          className="flex-1 rounded-lg border border-slate-700 bg-slate-800/60 px-4 py-3
                     text-slate-300 text-sm font-semibold transition-all
                     hover:bg-slate-700/60 active:scale-95"
        >
          로비로
        </button>
      </div>
    </div>
  );
}

function ResultCard({ result }: { result: PullResult }) {
  const { char, isDupe } = result;
  return (
    <div
      className="relative flex flex-col items-center rounded-lg border-2 px-1.5 py-2.5 transition-all"
      style={{
        borderColor: isDupe ? "#7c3aed66" : readableAccent(char.color),
        backgroundColor: isDupe ? "#2a1740aa" : `${char.color}1a`,
        boxShadow: isDupe ? "none" : `0 0 12px ${readableAccent(char.color)}33`,
      }}
    >
      <div
        className="w-9 h-9 rounded-lg mb-1.5 flex items-center justify-center overflow-hidden bg-[#2f4a1f]"
        style={{ border: `2px solid ${readableAccent(char.color)}` }}
      >
        <PixelFace kind="char" id={char.id} size={32} color={readableAccent(char.color)} />
      </div>
      <span className="text-[10px] font-semibold text-slate-200 text-center leading-tight">
        {char.name}
      </span>
      {isDupe ? (
        <span className="flex items-center gap-0.5 mt-1 rounded-full bg-violet-950/80 px-1 py-0.5 text-[9px] font-bold text-violet-300">
          <GameIcon name={UI_ICONS.memory} size={10} />+1
        </span>
      ) : (
        <span className="flex items-center gap-0.5 mt-1 rounded-full bg-emerald-950/80 px-1 py-0.5 text-[9px] font-bold text-emerald-300">
          <Check className="w-2.5 h-2.5" />NEW
        </span>
      )}
    </div>
  );
}

function StatChip({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100);
  const color = value >= 1.2 ? "text-emerald-300" : value >= 0.9 ? "text-yellow-300" : "text-red-300";
  return (
    <div className="rounded-lg bg-slate-800/40 border border-slate-700/50 px-3 py-2 flex items-center justify-between">
      <span className="text-slate-400 text-xs">{label}</span>
      <span className={`text-xs font-mono font-bold ${color}`}>{pct}%</span>
    </div>
  );
}
