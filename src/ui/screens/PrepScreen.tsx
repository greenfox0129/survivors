// ============================================================
//  PrepScreen — Pull one companion for the next run.
// ============================================================

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Cat, Shield, Sword } from "lucide-react";
import {
  COMPANION_PULL_COST,
  COMPANIONS,
  companionLabel,
  mercenaryGear,
  rollCompanion,
  type CompanionKind,
  type CompanionRoll,
} from "@/game/data/companions";
import type { SaveData } from "@/game/core/storage";
import { GameIcon } from "@/ui/components/GameIcon";
import { UI_ICONS } from "@/ui/icons";

interface PrepScreenProps {
  onBack: () => void;
  save: SaveData;
  onUpdate: (save: SaveData) => void;
}

const KINDS: CompanionKind[] = ["mercenary", "cat", "warden"];

const ICONS = {
  mercenary: Sword,
  cat: Cat,
  warden: Shield,
} as const;

export function PrepScreen({ onBack, save, onUpdate }: PrepScreenProps) {
  const armed = save.companion;
  const [rolling, setRolling] = useState(false);
  const [flash, setFlash] = useState<CompanionKind | null>(null);
  const rollingRef = useRef(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
  }, []);

  function stopRoll() {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    timerRef.current = null;
    rollingRef.current = false;
    setRolling(false);
    setFlash(null);
  }

  function pull() {
    if (rollingRef.current || save.gold < COMPANION_PULL_COST) return;
    rollingRef.current = true;
    setRolling(true);
    let ticks = 0;
    timerRef.current = window.setInterval(() => {
      ticks += 1;
      setFlash(KINDS[ticks % KINDS.length]);
      if (ticks < 10) return;
      const result = rollCompanion();
      stopRoll();
      onUpdate({
        ...save,
        gold: save.gold - COMPANION_PULL_COST,
        companion: result,
      });
    }, 70);
  }

  const canPull = !rolling && save.gold >= COMPANION_PULL_COST;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm">로비로</span>
          </button>
          <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/60 px-4 py-2">
            <GameIcon name={UI_ICONS.gold} size={16} className="text-amber-400" />
            <span className="font-mono font-bold tabular-nums text-amber-300">{save.gold}</span>
            <span className="text-xs text-slate-500">G</span>
          </div>
        </div>

        <h1 className="mb-1 text-3xl font-bold text-slate-100">정비</h1>
        <p className="mb-6 text-sm text-slate-500">
          {COMPANION_PULL_COST}G로 다음 한 판의 동행자를 뽑습니다. 셋은 같은 확률입니다.
          다시 뽑으면 지금 동행자는 사라지고, 쓴 골드는 돌아오지 않습니다.
        </p>
        {armed && (
          <p className="mb-4 text-sm font-semibold text-lime-200">
            다음 판 · {companionLabel(armed)}
          </p>
        )}

        <div className="flex flex-col gap-3">
          {KINDS.map((kind) => (
            <CompanionRow
              key={kind}
              kind={kind}
              armed={armed}
              flash={rolling && flash === kind}
            />
          ))}
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={pull}
            disabled={!canPull}
            className="rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-bold text-slate-900 hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
          >
            {rolling ? "뽑는 중" : armed ? `${COMPANION_PULL_COST}G 다시 뽑기` : `${COMPANION_PULL_COST}G 뽑기`}
          </button>
        </div>
      </div>
    </div>
  );
}

function CompanionRow({
  kind,
  armed,
  flash,
}: {
  kind: CompanionKind;
  armed: CompanionRoll | null;
  flash: boolean;
}) {
  const def = COMPANIONS[kind];
  const Icon = ICONS[kind];
  const selected = armed?.kind === kind;
  const gear = selected && armed ? mercenaryGear(armed) : null;
  return (
    <div
      className={`flex items-center gap-4 rounded-2xl border-2 px-4 py-4 ${
        selected || flash ? "border-lime-500/50 bg-lime-950/30" : "border-slate-800 bg-slate-900/40"
      }`}
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900/70">
        <Icon className={`h-7 w-7 ${selected || flash ? "text-lime-300" : "text-slate-300"}`} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-bold text-slate-100">
          {def.name}
          {gear && <span className="ml-2 text-sm font-semibold text-lime-300">{gear}</span>}
        </div>
        <p className="text-sm text-slate-400">{def.desc}</p>
      </div>
    </div>
  );
}
