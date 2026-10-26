// ============================================================
//  SettingsPanel — graphics quality + sound volume (pause menu and the settings screen).
// ============================================================

import { Volume2, VolumeX } from "lucide-react";
import type { QualitySetting, WeaponOpacityLayer } from "@/game/core/settings";
import { setWeaponOpacity, WEAPON_OPACITY_LAYERS } from "@/game/core/settings";
import { isAutoDowngraded } from "@/game/render/quality";
import { playUiSound } from "@/game/core/audio";
import { useSettings } from "@/ui/hooks/useSettings";
import { GameIcon } from "@/ui/components/GameIcon";
import { weaponIcon } from "@/ui/icons";

const QUALITY_OPTIONS: { value: QualitySetting; label: string; hint: string }[] = [
  { value: "auto", label: "자동", hint: "프레임이 떨어지면 장식 효과를 줄입니다" },
  { value: "high", label: "높음", hint: "모든 효과 표시" },
  { value: "low", label: "저사양", hint: "장식 효과 생략 (게임 정보는 그대로)" },
];

function VolumeRow({
  label,
  volume,
  muted,
  onVolume,
  onToggleMute,
  onPreview,
}: {
  label: string;
  volume: number;
  muted: boolean;
  onVolume: (volume: number) => void;
  onToggleMute: () => void;
  onPreview?: () => void;
}) {
  const pct = Math.round(volume * 100);
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-200">{label}</span>
        <span className="font-mono text-xs text-slate-400">{muted ? "음소거" : `${pct}%`}</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleMute}
          className="rounded-md border border-slate-700 bg-slate-900/60 p-1.5 text-slate-300 hover:border-slate-500 hover:text-slate-100"
          aria-label={muted ? `${label} 음소거 해제` : `${label} 음소거`}
        >
          {muted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={pct}
          onChange={(e) => onVolume(Number(e.target.value) / 100)}
          onPointerUp={onPreview}
          onKeyUp={onPreview}
          className="h-1.5 flex-1 cursor-pointer accent-cyan-400"
          aria-label={`${label} 볼륨`}
        />
      </div>
    </div>
  );
}

export function SettingsPanel() {
  const [settings, update] = useSettings();
  const downgraded = settings.quality === "auto" && isAutoDowngraded();

  return (
    <div className="flex flex-col gap-4 text-left">
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-200">그래픽 품질</span>
          {downgraded && <span className="text-[11px] text-amber-400">자동 → 저사양 적용 중</span>}
        </div>
        <div className="grid grid-cols-3 gap-1.5 rounded-lg bg-slate-950/60 p-1">
          {QUALITY_OPTIONS.map((q) => (
            <button
              key={q.value}
              onClick={() => update({ quality: q.value })}
              title={q.hint}
              className={`rounded-md px-2 py-1.5 text-xs font-semibold transition-colors ${
                settings.quality === q.value
                  ? "bg-cyan-500 text-slate-900"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              {q.label}
            </button>
          ))}
        </div>
        <p className="mt-1 text-[11px] text-slate-500">
          {QUALITY_OPTIONS.find((q) => q.value === settings.quality)?.hint}
        </p>
      </div>

      <div>
        <div className="mb-1.5 text-sm font-semibold text-slate-200">브레스 방향</div>
        <div className="grid grid-cols-2 gap-1.5 rounded-lg bg-slate-950/60 p-1">
          <button
            onClick={() => update({ breathMouseAim: false })}
            className={`rounded-md px-2 py-1.5 text-xs font-semibold transition-colors ${
              settings.breathMouseAim
                ? "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                : "bg-cyan-500 text-slate-900"
            }`}
          >
            이동
          </button>
          <button
            onClick={() => update({ breathMouseAim: true })}
            className={`rounded-md px-2 py-1.5 text-xs font-semibold transition-colors ${
              settings.breathMouseAim
                ? "bg-cyan-500 text-slate-900"
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            마우스
          </button>
        </div>
        <p className="mt-1 text-[11px] text-slate-500">
          {settings.breathMouseAim
            ? "브레스가 마우스 쪽을 향합니다. 쏘는 중에도 따라갑니다"
            : "브레스가 이동 방향을 향합니다. 서 있으면 마지막 방향을 유지합니다"}
        </p>
      </div>

      <VolumeRow
        label="로비 음악"
        volume={settings.lobbyVolume}
        muted={settings.lobbyMuted}
        onVolume={(lobbyVolume) => update({ lobbyVolume, lobbyMuted: false })}
        onToggleMute={() => update({ lobbyMuted: !settings.lobbyMuted })}
      />
      <VolumeRow
        label="인게임 음악"
        volume={settings.ingameVolume}
        muted={settings.ingameMuted}
        onVolume={(ingameVolume) => update({ ingameVolume, ingameMuted: false })}
        onToggleMute={() => update({ ingameMuted: !settings.ingameMuted })}
      />
      <VolumeRow
        label="효과음"
        volume={settings.sfxVolume}
        muted={settings.sfxMuted}
        onVolume={(sfxVolume) => update({ sfxVolume, sfxMuted: false })}
        onToggleMute={() => update({ sfxMuted: !settings.sfxMuted })}
        onPreview={playUiSound}
      />

      <div>
        <div className="mb-1 text-sm font-semibold text-slate-200">무기 투명도</div>
        <p className="mb-2 text-[11px] text-slate-500">
          0%여도 피해는 그대로입니다. 그림이 나뉘면 그 칸만 따로 조절합니다.
        </p>
        <div className="flex flex-col gap-2">
          {WEAPON_OPACITY_LAYERS.map((layer) => (
            <OpacityRow
              key={layer.id}
              layer={layer}
              value={settings.weaponOpacity[layer.id] ?? 1}
              onChange={(value) => setWeaponOpacity(layer.id, value)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function OpacityRow({
  layer,
  value,
  onChange,
}: {
  layer: WeaponOpacityLayer;
  value: number;
  onChange: (value: number) => void;
}) {
  const pct = Math.round(value * 100);
  return (
    <div className={layer.sub ? "pl-7" : ""}>
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className={`flex min-w-0 items-center gap-1.5 text-xs font-semibold ${layer.sub ? "text-slate-400" : "text-slate-200"}`}>
          {!layer.sub && <GameIcon name={weaponIcon(layer.weapon)} size={14} />}
          <span className="truncate">{layer.label}</span>
        </span>
        <span className="font-mono text-[11px] text-slate-500">{pct}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={pct}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        className="h-1.5 w-full cursor-pointer accent-cyan-400"
        aria-label={`${layer.label} 투명도`}
      />
    </div>
  );
}
