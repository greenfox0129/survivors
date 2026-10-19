import { useState } from "react";
import { Settings, X } from "lucide-react";
import { GAME_INFO } from "@/gameInfo";
import type { SaveData } from "@/game/core/storage";
import { CHARACTERS } from "@/game/data/progression";
import { weaponName } from "@/game/systems/WeaponManager";
import { PixelFace, PixelWalker } from "@/ui/components/PixelSprite";
import { GameIcon } from "@/ui/components/GameIcon";
import { SettingsPanel } from "@/ui/components/SettingsPanel";
import { UI_ICONS, weaponIcon } from "@/ui/icons";
import { readableAccent, weaponColor } from "@/ui/theme";

export type Screen = "lobby" | "game" | "gacha" | "codex" | "achievements" | "characters" | "traits";

interface LobbyProps {
  onNavigate: (screen: Screen) => void;
  save: SaveData;
}

interface MenuCard {
  title: string;
  desc: string;
  icon: string;
  iconColor: string;
  color: string;
  hoverColor: string;
  glow: string;
  screen: Screen;
}

const MENU_ITEMS: MenuCard[] = [
  {
    title: "게임 시작",
    desc: "끝없이 몰려오는 적과 싸워 살아남으세요",
    icon: UI_ICONS.play,
    iconColor: "#67e8f9",
    color: "border-cyan-500/40 bg-cyan-950/30",
    hoverColor: "hover:border-cyan-400 hover:bg-cyan-900/40",
    glow: "group-hover:shadow-cyan-500/20",
    screen: "game",
  },
  {
    title: "캐릭터 뽑기",
    desc: "새로운 캐릭터를 뽑아 전투에 활용하세요",
    icon: UI_ICONS.gacha,
    iconColor: "#fcd34d",
    color: "border-amber-500/40 bg-amber-950/30",
    hoverColor: "hover:border-amber-400 hover:bg-amber-900/40",
    glow: "group-hover:shadow-amber-500/20",
    screen: "gacha",
  },
  {
    title: "캐릭터 관리",
    desc: "보유한 캐릭터를 선택하고 강화하세요",
    icon: UI_ICONS.characters,
    iconColor: "#7dd3fc",
    color: "border-sky-500/40 bg-sky-950/30",
    hoverColor: "hover:border-sky-400 hover:bg-sky-900/40",
    glow: "group-hover:shadow-sky-500/20",
    screen: "characters",
  },
  {
    title: "특성",
    desc: "모든 캐릭터에 적용되는 영구 성장",
    icon: UI_ICONS.traits,
    iconColor: "#c4b5fd",
    color: "border-violet-500/40 bg-violet-950/30",
    hoverColor: "hover:border-violet-400 hover:bg-violet-900/40",
    glow: "group-hover:shadow-violet-500/20",
    screen: "traits",
  },
  {
    title: "도감",
    desc: "발견한 적과 캐릭터를 확인하세요",
    icon: UI_ICONS.codex,
    iconColor: "#6ee7b7",
    color: "border-emerald-500/40 bg-emerald-950/30",
    hoverColor: "hover:border-emerald-400 hover:bg-emerald-900/40",
    glow: "group-hover:shadow-emerald-500/20",
    screen: "codex",
  },
  {
    title: "업적",
    desc: "달성한 업적을 추적하세요",
    icon: UI_ICONS.achievements,
    iconColor: "#fda4af",
    color: "border-rose-500/40 bg-rose-950/30",
    hoverColor: "hover:border-rose-400 hover:bg-rose-900/40",
    glow: "group-hover:shadow-rose-500/20",
    screen: "achievements",
  },
];

/** Icon artists to credit (CC BY 3.0 requires attribution) — see src/assets/icons/credits.json */
const ICON_AUTHORS = "Lorc, Delapouite, Skoll, Sbed, DarkZaitzev, Willdabeast";

export function Lobby({ onNavigate, save }: LobbyProps) {
  const [showSettings, setShowSettings] = useState(false);
  const charDef = CHARACTERS.find((c) => c.id === save.selectedCharacter) ?? CHARACTERS[0];
  const owned = save.owned.find((o) => o.id === charDef.id);

  return (
    <div className="relative min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4 py-12">
      {/* Top bar: currencies + settings */}
      <div className="absolute right-4 top-4 flex items-center gap-2">
        <span className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-1.5 text-sm">
          <GameIcon name={UI_ICONS.gold} size={16} className="text-amber-400" />
          <span className="font-mono font-bold text-amber-300">{save.gold}</span>
          <span className="text-xs text-slate-500">G</span>
        </span>
        <span className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-1.5 text-sm">
          <GameIcon name={UI_ICONS.star} size={16} className="text-cyan-400" />
          <span className="font-mono font-bold text-cyan-300">{save.stars}</span>
          <span className="text-xs text-slate-500">별</span>
        </span>
        <button
          onClick={() => setShowSettings(true)}
          className="rounded-lg border border-slate-800 bg-slate-900/70 p-2 text-slate-400 transition-colors hover:border-slate-600 hover:text-slate-100"
          aria-label="설정"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>

      {/* Title */}
      <div className="text-center mb-8">
        <h1 className="text-5xl font-extrabold text-slate-100 tracking-tight">
          {GAME_INFO.title}
        </h1>
        <p className="text-cyan-400 text-lg font-semibold tracking-widest mt-1">
          {GAME_INFO.subtitle}
        </p>
        <p className="text-slate-500 text-sm mt-3">
          {GAME_INFO.tagline}
        </p>
      </div>

      {/* Owned party walking on a strip of grass (selected character first) */}
      <div className="mb-5 flex items-end gap-1 rounded-xl border border-[#4d7a2a] bg-[#3f6b24] px-4 pb-1 pt-2 shadow-inner">
        {[charDef, ...CHARACTERS.filter((c) => c.id !== charDef.id && save.owned.some((o) => o.id === c.id))].map((c, i) => (
          <PixelWalker key={c.id} id={c.id} size={i === 0 ? 48 : 36} facing={i === 0 ? 0 : 2} />
        ))}
      </div>

      {/* Selected character */}
      <button
        onClick={() => onNavigate("characters")}
        className="group mb-6 flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2.5 transition-colors hover:border-slate-600"
      >
        <span
          className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-lg"
          style={{ border: `2px solid ${readableAccent(charDef.color)}` }}
        >
          <PixelFace kind="char" id={charDef.id} size={40} color={readableAccent(charDef.color)} />
        </span>
        <span className="text-left">
          <span className="block text-[11px] uppercase tracking-wider text-slate-500">플레이 캐릭터</span>
          <span className="flex items-center gap-2 text-sm font-bold text-slate-100">
            {charDef.name}
            <span className="font-mono text-xs font-normal text-slate-400">
              Lv{owned?.level ?? 1} · ★{owned?.stars ?? 0}
              {(owned?.breakthrough ?? 0) > 0 && ` · ${owned?.breakthrough}돌파`}
            </span>
          </span>
        </span>
        <span className="ml-2 flex items-center gap-1 rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-300">
          <GameIcon name={weaponIcon(charDef.startWeapon)} size={14} color={weaponColor(charDef.startWeapon)} />
          {weaponName(charDef.startWeapon)}
        </span>
      </button>

      {/* Menu grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-3xl">
        {MENU_ITEMS.map((item) => (
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
              <GameIcon name={item.icon} size={32} color={item.iconColor} />
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
        ))}
      </div>

      {/* Footer */}
      <p className="text-slate-600 text-xs mt-8 tracking-wider">
        WASD / 방향키 — 이동 · 공격은 자동 · ESC — 일시정지
      </p>
      <p className="mt-2 text-[11px] text-slate-700">
        v{GAME_INFO.version} · Icons by {ICON_AUTHORS} (game-icons.net, CC BY 3.0) · Pixel art: Ninja Adventure by Pixel-boy &amp; AAA (CC0) · 리냐: Universal LPC (CC BY-SA 3.0)
      </p>

      {/* Settings modal */}
      {showSettings && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/70 px-6"
          onClick={() => setShowSettings(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-100">설정</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                aria-label="닫기"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <SettingsPanel />
          </div>
        </div>
      )}
    </div>
  );
}
