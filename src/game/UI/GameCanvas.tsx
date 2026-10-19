import { useEffect, useRef, useState, useCallback } from "react";
import { Star } from "lucide-react";
import { GameEngine } from "@/game/GameEngine";
import { CONFIG } from "@/game/config";
import type { GameStats, UpgradeOption } from "@/game/types";
import { HUD } from "@/game/UI/HUD";
import { UpgradeModal } from "@/game/UI/UpgradeModal";
import type { SaveData } from "@/game/storage";
import { saveSave } from "@/game/storage";
import { ACHIEVEMENTS } from "@/game/data";

type Phase = "playing" | "levelup" | "gameover";

function scoreToGold(score: number): number {
  return Math.floor(score / 10);
}

const INITIAL_STATS: GameStats = {
  time: 0,
  kills: 0,
  level: 1,
  xp: 0,
  xpToNext: CONFIG.leveling.baseXpToNext,
  hp: CONFIG.player.maxHp,
  maxHp: CONFIG.player.maxHp,
  alive: true,
  score: 0,
  weapons: [{ type: "bullet", name: "라이플", level: 1, evolved: false }],
  accessories: [],
  rerolls: 0,
};

export function GameCanvas({ onExit, save }: { onExit: () => void; save: SaveData }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const saveRef = useRef<SaveData>(save);
  const [stats, setStats] = useState<GameStats>(INITIAL_STATS);
  const [phase, setPhase] = useState<Phase>("playing");
  const [upgradeOptions, setUpgradeOptions] = useState<UpgradeOption[]>([]);
  const [goldEarned, setGoldEarned] = useState(0);
  const [newAchIds, setNewAchIds] = useState<string[]>([]);
  const [starsGained, setStarsGained] = useState(0);

  // Init engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const engine = new GameEngine(ctx, {
      onStatsUpdate: (s) => setStats(s),
      onLevelUp: (opts) => {
        setUpgradeOptions(opts);
        setPhase("levelup");
      },
      onGameOver: (s) => {
        setStats(s);
        const earned = scoreToGold(s.score);
        setGoldEarned(earned);

        // Check achievements: any weapon evolved
        const alreadyCompleted = new Set(saveRef.current.completedAchievements);
        const newAchievements: string[] = [];
        let starsEarned = 0;
        for (const ach of ACHIEVEMENTS) {
          if (alreadyCompleted.has(ach.id)) continue;
          const weaponType = ach.id.replace("evo_", "");
          const weapon = s.weapons.find((w) => w.type === weaponType);
          if (weapon && weapon.evolved) {
            newAchievements.push(ach.id);
            starsEarned += ach.reward;
          }
        }

        const nextSave: SaveData = {
          ...saveRef.current,
          gold: saveRef.current.gold + earned,
          stars: saveRef.current.stars + starsEarned,
          completedAchievements: [...saveRef.current.completedAchievements, ...newAchievements],
        };
        saveRef.current = nextSave;
        saveSave(nextSave);
        setNewAchIds(newAchievements);
        setStarsGained(starsEarned);
        setPhase("gameover");
      },
    }, saveRef.current);
    engineRef.current = engine;
    engine.start();

    return () => engine.stop();
  }, []);

  // Keyboard input
  useEffect(() => {
    const handleKey = (e: KeyboardEvent, pressed: boolean) => {
      const key = e.key.toLowerCase();
      if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) {
        e.preventDefault();
        engineRef.current?.setInput(key, pressed);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => handleKey(e, true);
    const onKeyUp = (e: KeyboardEvent) => handleKey(e, false);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  const handleSelectUpgrade = useCallback((index: number) => {
    const opt = upgradeOptions[index];
    if (!opt) return;
    engineRef.current?.applyUpgrade(opt);
    setUpgradeOptions([]);
    setPhase("playing");
  }, [upgradeOptions]);

  const handleReroll = useCallback(() => {
    const newOpts = engineRef.current?.rerollUpgrades();
    if (!newOpts) return;
    setUpgradeOptions(newOpts);
    setStats((prev) => ({ ...prev, rerolls: engineRef.current?.getRerollsLeft() ?? 0 }));
  }, []);

  const handleRestart = useCallback(() => {
    engineRef.current?.reset();
    setPhase("playing");
    setStats(INITIAL_STATS);
    setGoldEarned(0);
    setNewAchIds([]);
    setStarsGained(0);
  }, []);

  const handleGiveUp = useCallback(() => {
    engineRef.current?.giveUp();
  }, []);

  return (
    <div
      className="relative mx-auto"
      style={{ width: CONFIG.canvasWidth, maxWidth: "100%" }}
    >
      <div className="relative rounded-xl overflow-hidden border-2 border-slate-700 shadow-2xl">
        <canvas
          ref={canvasRef}
          width={CONFIG.canvasWidth}
          height={CONFIG.canvasHeight}
          className="block w-full h-auto"
          style={{ imageRendering: "pixelated" }}
        />

        {/* HUD always visible during play and levelup */}
        {(phase === "playing" || phase === "levelup") && <HUD stats={stats} />}

        {/* Level up modal */}
        {phase === "levelup" && (
          <UpgradeModal options={upgradeOptions} onSelect={handleSelectUpgrade} onReroll={handleReroll} rerollsLeft={stats.rerolls} />
        )}

        {/* Game over screen */}
        {phase === "gameover" && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm px-6">
            <h2 className="text-3xl font-bold text-red-500 mb-4 tracking-wide">
              GAME OVER
            </h2>

            <div className="rounded-xl border border-slate-700 bg-slate-900/60 px-8 py-5 mb-5 flex flex-col gap-2 min-w-[220px]">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">생존 시간</span>
                <span className="text-cyan-300 font-mono font-bold">
                  {Math.floor(stats.time / 60)}:
                  {(Math.floor(stats.time % 60)).toString().padStart(2, "0")}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">처치 수</span>
                <span className="text-red-400 font-mono font-bold">{stats.kills}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">레벨</span>
                <span className="text-amber-300 font-mono font-bold">{stats.level}</span>
              </div>
              <div className="h-px bg-slate-700 my-1" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300 font-semibold">스코어</span>
                <span className="text-emerald-300 font-mono font-bold text-base">{stats.score}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-amber-400 font-semibold">획득 골드</span>
                <span className="text-amber-300 font-mono font-bold text-base flex items-center gap-1">
                  +{goldEarned} G
                </span>
              </div>
              {starsGained > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-cyan-400 font-semibold">업적 보상</span>
                  <span className="text-cyan-300 font-mono font-bold text-base flex items-center gap-1">
                    <Star className="w-4 h-4 fill-cyan-400 text-cyan-400" />
                    +{starsGained}
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={handleRestart}
              className="rounded-lg bg-cyan-500 px-8 py-3 font-bold text-slate-900
                         transition-all hover:bg-cyan-400 active:scale-95"
            >
              다시 시작
            </button>
            <button
              onClick={onExit}
              className="mt-3 text-slate-400 text-sm hover:text-slate-100 transition-colors"
            >
              로비로 돌아가기
            </button>
          </div>
        )}
      </div>

      {/* Controls hint + give up */}
      <div className="mt-4 flex items-center justify-between">
        <p className="text-slate-500 text-sm">
          WASD / 방향키로 이동 · 공격은 자동
        </p>
        <button
          onClick={handleGiveUp}
          disabled={phase !== "playing"}
          className="flex items-center gap-1.5 rounded-lg border border-red-800/50 bg-red-950/40 px-4 py-2
                     text-red-400 text-sm font-semibold transition-all
                     hover:border-red-500 hover:bg-red-900/40 hover:text-red-300 active:scale-95
                     disabled:opacity-30 disabled:cursor-not-allowed"
        >
          게임 포기
        </button>
      </div>
    </div>
  );
}
