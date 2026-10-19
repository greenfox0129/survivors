import type { GameStats } from "@/game/core/types";
import { accessoryColor, weaponColor } from "@/ui/theme";

interface HUDProps {
  stats: GameStats;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function HUD({ stats }: HUDProps) {
  const xpPercent = stats.xpToNext > 0 ? (stats.xp / stats.xpToNext) * 100 : 0;
  const hpPercent = stats.maxHp > 0 ? (stats.hp / stats.maxHp) * 100 : 0;

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {/* XP bar at top */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-slate-800/80">
        <div
          className="h-full bg-cyan-400 transition-all duration-150 ease-out"
          style={{ width: `${xpPercent}%` }}
        />
      </div>

      {/* Top-left: time, kills, score, level */}
      <div className="absolute top-4 left-4 flex flex-col gap-1.5">
        <div className="flex items-center gap-3">
          <span className="text-cyan-300 font-mono text-lg font-bold tabular-nums">
            {formatTime(stats.time)}
          </span>
          <span className="text-slate-400 text-xs uppercase tracking-wider">생존</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-red-400 font-mono text-lg font-bold tabular-nums">
            {stats.kills}
          </span>
          <span className="text-slate-400 text-xs uppercase tracking-wider">처치</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-emerald-300 font-mono text-lg font-bold tabular-nums">
            {stats.score}
          </span>
          <span className="text-slate-400 text-xs uppercase tracking-wider">스코어</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-amber-300 font-mono text-lg font-bold tabular-nums">
            Lv {stats.level}
          </span>
          <span className="text-slate-400 text-xs tabular-nums">
            {Math.floor(stats.xp)}/{stats.xpToNext}
          </span>
        </div>
      </div>

      {/* Top-right: HP bar */}
      <div className="absolute top-4 right-4 w-44">
        <div className="flex items-center justify-between mb-1">
          <span className="text-slate-300 text-xs uppercase tracking-wider">HP</span>
          <span className="text-slate-300 font-mono text-xs tabular-nums">
            {Math.ceil(stats.hp)}/{stats.maxHp}
          </span>
        </div>
        <div className="h-3 bg-slate-800/80 rounded-sm overflow-hidden border border-slate-700">
          <div
            className="h-full transition-all duration-200 ease-out"
            style={{
              width: `${hpPercent}%`,
              backgroundColor: hpPercent > 50 ? "#22c55e" : hpPercent > 25 ? "#eab308" : "#ef4444",
            }}
          />
        </div>
      </div>

      {/* Bottom-left: active weapons */}
      <div className="absolute bottom-3 left-4 flex flex-col gap-1.5 max-w-[60%]">
        <div className="flex flex-wrap gap-2">
          {stats.weapons.map((w, i) => (
            <div
              key={`${w.type}-${i}`}
              className="flex items-center gap-1.5 rounded-md bg-slate-900/70 border border-slate-700 px-2 py-1"
            >
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: weaponColor(w.type) }}
              />
              <span className="text-slate-300 text-xs font-medium">{w.name}</span>
              <span className={`text-xs tabular-nums ${w.evolved ? "text-amber-400 font-bold" : "text-slate-500"}`}>{w.evolved ? "MAX" : `Lv${w.level}`}</span>
            </div>
          ))}
        </div>
        {stats.accessories.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {stats.accessories.map((a, i) => (
              <div
                key={`${a.type}-${i}`}
                className="flex items-center gap-1 rounded-md bg-slate-900/50 border border-violet-900/50 px-1.5 py-0.5"
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: accessoryColor(a.type) }}
                />
                <span className="text-slate-400 text-[10px] font-medium">{a.name}</span>
                <span className="text-slate-600 text-[10px] tabular-nums">Lv{a.level}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
