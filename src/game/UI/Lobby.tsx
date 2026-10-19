import { Play, Gift, BookOpen, Trophy, Users, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type Screen = "lobby" | "game" | "gacha" | "codex" | "achievements" | "characters" | "traits";

interface LobbyProps {
  onNavigate: (screen: Screen) => void;
}

interface MenuCard {
  title: string;
  desc: string;
  icon: LucideIcon;
  color: string;
  hoverColor: string;
  glow: string;
  screen: Screen;
}

const MENU_ITEMS: MenuCard[] = [
  {
    title: "게임 시작",
    desc: "끝없이 몰려오는 적과 싸워 살아남으세요",
    icon: Play,
    color: "border-cyan-500/40 bg-cyan-950/30",
    hoverColor: "hover:border-cyan-400 hover:bg-cyan-900/40",
    glow: "group-hover:shadow-cyan-500/20",
    screen: "game",
  },
  {
    title: "캐릭터 뽑기",
    desc: "새로운 캐릭터를 뽑아 전투에 활용하세요",
    icon: Gift,
    color: "border-amber-500/40 bg-amber-950/30",
    hoverColor: "hover:border-amber-400 hover:bg-amber-900/40",
    glow: "group-hover:shadow-amber-500/20",
    screen: "gacha",
  },
  {
    title: "캐릭터 관리",
    desc: "보유한 캐릭터를 선택하고 강화하세요",
    icon: Users,
    color: "border-sky-500/40 bg-sky-950/30",
    hoverColor: "hover:border-sky-400 hover:bg-sky-900/40",
    glow: "group-hover:shadow-sky-500/20",
    screen: "characters",
  },
  {
    title: "특성",
    desc: "모든 캐릭터에 적용되는 영구 성장",
    icon: Sparkles,
    color: "border-violet-500/40 bg-violet-950/30",
    hoverColor: "hover:border-violet-400 hover:bg-violet-900/40",
    glow: "group-hover:shadow-violet-500/20",
    screen: "traits",
  },
  {
    title: "도감",
    desc: "발견한 적과 캐릭터를 확인하세요",
    icon: BookOpen,
    color: "border-emerald-500/40 bg-emerald-950/30",
    hoverColor: "hover:border-emerald-400 hover:bg-emerald-900/40",
    glow: "group-hover:shadow-emerald-500/20",
    screen: "codex",
  },
  {
    title: "업적",
    desc: "달성한 업적을 추적하세요",
    icon: Trophy,
    color: "border-rose-500/40 bg-rose-950/30",
    hoverColor: "hover:border-rose-400 hover:bg-rose-900/40",
    glow: "group-hover:shadow-rose-500/20",
    screen: "achievements",
  },
];

export function Lobby({ onNavigate }: LobbyProps) {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4 py-12">
      {/* Title */}
      <div className="text-center mb-10">
        <h1 className="text-5xl font-extrabold text-slate-100 tracking-tight">
          Vampire Survivors
        </h1>
        <p className="text-cyan-400 text-lg font-semibold tracking-widest mt-1">
          PROTOTYPE
        </p>
        <p className="text-slate-500 text-sm mt-3">
          끝없이 몰려오는 적을 처치하고 살아남으세요
        </p>
      </div>

      {/* Menu grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-3xl">
        {MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.screen}
              onClick={() => onNavigate(item.screen)}
              className={`group relative flex items-center gap-5 rounded-2xl border-2 ${item.color} ${item.hoverColor}
                         px-6 py-6 text-left transition-all duration-300
                         hover:scale-[1.02] active:scale-[0.99] shadow-lg ${item.glow}
                         hover:shadow-xl`}
            >
              <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-slate-900/60 flex items-center justify-center
                              transition-transform duration-300 group-hover:scale-110">
                <Icon className="w-7 h-7 text-slate-200" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-slate-100 mb-0.5">
                  {item.title}
                </h2>
                <p className="text-slate-400 text-sm leading-snug">
                  {item.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer hint */}
      <p className="text-slate-600 text-xs mt-8 tracking-wider">
        WASD / 방향키 — 이동 · 공격은 자동
      </p>
    </div>
  );
}
