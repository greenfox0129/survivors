import { useState } from "react";
import { ArrowLeft, ChevronUp, Lock, RotateCcw, X } from "lucide-react";
import { GameIcon } from "@/ui/components/GameIcon";
import { UI_ICONS, accessoryIconName, traitIcon, weaponIcon } from "@/ui/icons";
import { accessoryName, allAccessoryTypes } from "@/game/systems/AccessoryManager";
import { allWeaponTypes, weaponName } from "@/game/systems/WeaponManager";
import type { AccessoryType, WeaponType } from "@/game/core/types";
import {
  GOLD_SEAL_TRAITS,
  STAR_TRAITS,
  TRAITS,
  TRAIT_UPGRADE_COST,
  isStarTraitsUnlocked,
  starTraitCost,
  starTraitTotalSpent,
  traitTotalSpent,
  type TraitDef,
} from "@/game/data/progression";
import type { SaveData } from "@/game/core/storage";

interface TraitsScreenProps {
  onBack: () => void;
  save: SaveData;
  onUpdate: (save: SaveData) => void;
}

type TraitTab = "gold" | "star";
type SealTrait = "weaponSeal" | "accessorySeal" | "weaponSealGold" | "accessorySealGold";

function isSealTrait(id: string): id is SealTrait {
  return id === "weaponSeal" || id === "accessorySeal" || id === "weaponSealGold" || id === "accessorySealGold";
}

export function TraitsScreen({ onBack, save, onUpdate }: TraitsScreenProps) {
  const [tab, setTab] = useState<TraitTab>("gold");
  const [showReset, setShowReset] = useState(false);
  const [picking, setPicking] = useState<SealTrait | null>(null);
  const [draft, setDraft] = useState<string | null>(null);
  const starUnlocked = isStarTraitsUnlocked(save.completedAchievements);
  const list = tab === "star" ? STAR_TRAITS : [...TRAITS, ...GOLD_SEAL_TRAITS];
  const spent = list.reduce((sum, trait) => sum + spentOn(trait), 0);

  function spentOn(trait: TraitDef): number {
    const level = save.traitLevels[trait.id] ?? 0;
    if (level <= 0) return 0;
    if (trait.goldCost) return trait.goldCost;
    return tab === "star" ? starTraitTotalSpent(trait, level) : traitTotalSpent(level);
  }

  function sealedId(traitId: SealTrait): string | null {
    if (traitId === "weaponSeal") return save.sealedWeapon;
    if (traitId === "weaponSealGold") return save.sealedWeaponGold;
    if (traitId === "accessorySeal") return save.sealedAccessory;
    return save.sealedAccessoryGold;
  }

  function otherSealedId(traitId: SealTrait): string | null {
    if (traitId === "weaponSeal") return save.sealedWeaponGold;
    if (traitId === "weaponSealGold") return save.sealedWeapon;
    if (traitId === "accessorySeal") return save.sealedAccessoryGold;
    return save.sealedAccessory;
  }

  function openSeal(traitId: SealTrait) {
    setPicking(traitId);
    setDraft(sealedId(traitId));
  }

  function confirmSeal() {
    if (!picking || !draft || draft === otherSealedId(picking)) return;
    const traits = tab === "star" ? STAR_TRAITS : GOLD_SEAL_TRAITS;
    const trait = traits.find((t) => t.id === picking)!;
    const owned = (save.traitLevels[picking] ?? 0) > 0;
    let gold = save.gold;
    let stars = save.stars;
    if (!owned) {
      if (tab === "star") {
        const price = starTraitCost(trait);
        if (save.stars < price) return;
        stars -= price;
      } else {
        const price = trait.goldCost ?? 0;
        if (save.gold < price) return;
        gold -= price;
      }
    }
    onUpdate({
      ...save,
      gold,
      stars,
      traitLevels: { ...save.traitLevels, [picking]: 1 },
      sealedWeapon: picking === "weaponSeal" ? (draft as WeaponType) : save.sealedWeapon,
      sealedWeaponGold: picking === "weaponSealGold" ? (draft as WeaponType) : save.sealedWeaponGold,
      sealedAccessory: picking === "accessorySeal" ? (draft as AccessoryType) : save.sealedAccessory,
      sealedAccessoryGold: picking === "accessorySealGold" ? (draft as AccessoryType) : save.sealedAccessoryGold,
    });
    setPicking(null);
  }

  function handleUpgrade(trait: TraitDef) {
    if (isSealTrait(trait.id)) {
      openSeal(trait.id);
      return;
    }
    const currentLevel = save.traitLevels[trait.id] ?? 0;
    if (currentLevel >= trait.maxLevel) return;
    if (tab === "star") {
      const price = starTraitCost(trait);
      if (!starUnlocked || save.stars < price) return;
      onUpdate({
        ...save,
        stars: save.stars - price,
        traitLevels: { ...save.traitLevels, [trait.id]: currentLevel + 1 },
      });
      return;
    }
    const cost = TRAIT_UPGRADE_COST(currentLevel);
    if (save.gold < cost) return;
    onUpdate({
      ...save,
      gold: save.gold - cost,
      traitLevels: { ...save.traitLevels, [trait.id]: currentLevel + 1 },
    });
  }

  function handleResetAll() {
    const traitLevels = { ...save.traitLevels };
    if (tab === "star") {
      for (const trait of STAR_TRAITS) traitLevels[trait.id] = 0;
      onUpdate({
        ...save,
        stars: save.stars + spent,
        traitLevels,
        sealedWeapon: null,
        sealedAccessory: null,
      });
    } else {
      for (const trait of [...TRAITS, ...GOLD_SEAL_TRAITS]) traitLevels[trait.id] = 0;
      onUpdate({
        ...save,
        gold: save.gold + spent,
        traitLevels,
        sealedWeaponGold: null,
        sealedAccessoryGold: null,
      });
    }
    setShowReset(false);
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">로비로</span>
          </button>
          <div className="flex items-center gap-2">
            <CurrencyPill icon={UI_ICONS.gold} value={save.gold} unit="G" tone="text-amber-300" />
            <CurrencyPill icon={UI_ICONS.star} value={save.stars} unit="별" tone="text-cyan-300" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-slate-100 mb-1">특성</h1>
        <p className="text-slate-500 text-sm mb-6">
          모든 캐릭터에 적용되는 영구 성장 요소입니다
        </p>

        <div className="flex gap-2 mb-6">
          <TabButton active={tab === "gold"} onClick={() => setTab("gold")} label="골드" icon={UI_ICONS.gold} tone="emerald" />
          <TabButton
            active={tab === "star"}
            onClick={() => setTab("star")}
            label="별 업그레이드"
            icon={UI_ICONS.star}
            tone="cyan"
            locked={!starUnlocked}
          />
        </div>

        {tab === "star" && !starUnlocked ? (
          <div className="flex flex-col items-center rounded-xl border-2 border-slate-700 bg-slate-900/40 px-6 py-16 text-center">
            <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-700 bg-slate-800/60">
              <Lock className="h-6 w-6 text-slate-500" />
            </span>
            <h2 className="text-lg font-bold text-slate-200">게임 클리어</h2>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
              거대 영혼을 쓰러뜨리면 별을 쓰는 특성이 열린다.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {list.map((trait) => {
              const level = save.traitLevels[trait.id] ?? 0;
              const seal = isSealTrait(trait.id);
              const chosen = seal ? sealedId(trait.id) : null;
              const sealedName = chosen
                ? (trait.id === "weaponSeal" || trait.id === "weaponSealGold" ? weaponName(chosen as WeaponType) : accessoryName(chosen as AccessoryType))
                : null;
              const icon = chosen
                ? (trait.id === "weaponSeal" || trait.id === "weaponSealGold" ? weaponIcon(chosen as WeaponType) : accessoryIconName(chosen as AccessoryType))
                : traitIcon(trait.id);
              return (
                <TraitCard
                  key={trait.id}
                  trait={trait}
                  level={level}
                  currency={tab}
                  canAfford={
                    tab === "star"
                      ? save.stars >= starTraitCost(trait)
                      : save.gold >= (trait.goldCost ?? TRAIT_UPGRADE_COST(level))
                  }
                  seal={seal}
                  status={sealedName}
                  icon={icon}
                  onUpgrade={() => handleUpgrade(trait)}
                />
              );
            })}
          </div>
        )}

        {spent > 0 && (tab === "gold" || starUnlocked) && (
          <button
            onClick={() => setShowReset(true)}
            className="mt-6 w-full flex items-center justify-center gap-2 rounded-lg border border-slate-700/50 bg-slate-800/30 px-4 py-2.5
                       text-slate-400 text-sm font-medium transition-all
                       hover:border-slate-500 hover:text-slate-200 active:scale-[0.98]"
          >
            <RotateCcw className="w-4 h-4" />
            {tab === "star" ? "별 특성 초기화" : "골드 특성 초기화"}
            <span className={`text-xs font-mono ${tab === "star" ? "text-cyan-300/70" : "text-amber-300/70"}`}>
              (환불 +{spent} {tab === "star" ? "별" : "G"})
            </span>
          </button>
        )}
      </div>

      {picking && (
        <SealPicker
          kind={picking}
          draft={draft}
          owned={(save.traitLevels[picking] ?? 0) > 0}
          pay={tab}
          blocked={otherSealedId(picking)}
          price={tab === "star"
            ? starTraitCost(STAR_TRAITS.find((t) => t.id === picking)!)
            : (GOLD_SEAL_TRAITS.find((t) => t.id === picking)?.goldCost ?? 0)}
          onDraft={setDraft}
          onClose={() => setPicking(null)}
          onConfirm={confirmSeal}
        />
      )}

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
                <h3 className="text-slate-100 font-bold text-lg">
                  {tab === "star" ? "별 특성 초기화" : "골드 특성 초기화"}
                </h3>
              </div>
              <button
                onClick={() => setShowReset(false)}
                className="text-slate-500 hover:text-slate-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-1">
              {tab === "star" ? "별 특성 레벨을 0으로 초기화합니다." : "골드 특성 레벨을 0으로 초기화합니다."}
            </p>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              {tab === "star" ? "사용한 별을 전액 환불받습니다." : "사용한 골드를 전액 환불받습니다."}
            </p>
            <div className="rounded-lg bg-slate-800/60 px-4 py-3 mb-5 flex items-center justify-between">
              <span className="text-slate-300 text-sm">환불 예정</span>
              <span className={`font-mono font-bold flex items-center gap-1 ${tab === "star" ? "text-cyan-300" : "text-amber-300"}`}>
                <GameIcon name={tab === "star" ? UI_ICONS.star : UI_ICONS.gold} size={16} />
                +{spent} {tab === "star" ? "별" : "G"}
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

function CurrencyPill({ icon, value, unit, tone }: { icon: string; value: number; unit: string; tone: string }) {
  return (
    <div className="flex items-center gap-2 bg-slate-800/60 rounded-lg px-4 py-2 border border-slate-700">
      <GameIcon name={icon} size={16} className={tone} />
      <span className={`${tone} font-mono font-bold tabular-nums`}>{value}</span>
      <span className="text-slate-500 text-xs">{unit}</span>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
  icon,
  tone,
  locked = false,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: string;
  tone: "emerald" | "cyan";
  locked?: boolean;
}) {
  const activeClass = tone === "cyan" ? "bg-cyan-600 text-slate-950" : "bg-emerald-600 text-white";
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all active:scale-95
        ${active ? activeClass : "bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-700/60"}`}
    >
      <GameIcon name={icon} size={16} />
      {label}
      {locked && <Lock className="h-3.5 w-3.5" />}
    </button>
  );
}

function SealPicker({
  kind,
  draft,
  owned,
  pay,
  blocked,
  price,
  onDraft,
  onClose,
  onConfirm,
}: {
  kind: SealTrait;
  draft: string | null;
  owned: boolean;
  pay: TraitTab;
  blocked: string | null;
  price: number;
  onDraft: (id: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const weapons = kind === "weaponSeal" || kind === "weaponSealGold";
  const items = weapons
    ? allWeaponTypes().map((id) => ({ id, name: weaponName(id), icon: weaponIcon(id) }))
    : allAccessoryTypes().map((id) => ({ id, name: accessoryName(id), icon: accessoryIconName(id) }));
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[80vh] w-full max-w-md flex-col rounded-2xl border-2 border-slate-700 bg-slate-900 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-100">{weapons ? "무기 봉인" : "장신구 봉인"}</h3>
            <p className="mt-1 text-sm text-slate-500">고른 하나는 레벨업에 나오지 않습니다.</p>
          </div>
          <button onClick={onClose} className="text-slate-500 transition-colors hover:text-slate-300">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 overflow-y-auto pr-1">
          {items.map((item) => {
            const selected = draft === item.id;
            const taken = item.id === blocked;
            const picked = pay === "star"
              ? "border-cyan-400 bg-cyan-950/50 text-cyan-100"
              : "border-emerald-400 bg-emerald-950/50 text-emerald-100";
            return (
              <button
                key={item.id}
                onClick={() => onDraft(item.id)}
                disabled={taken}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm font-semibold transition-all active:scale-[0.98]
                  ${taken ? "cursor-not-allowed border-slate-800 bg-slate-900/40 text-slate-600" : selected ? picked : "border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-500"}`}
              >
                <GameIcon name={item.icon} size={20} className={selected ? (pay === "star" ? "text-cyan-300" : "text-emerald-300") : "text-slate-400"} />
                <span className="leading-tight">{item.name}</span>
              </button>
            );
          })}
        </div>
        <button
          onClick={onConfirm}
          disabled={!draft}
          className={`mt-4 flex items-center justify-center gap-1 rounded-lg px-4 py-2.5 text-sm font-bold transition-all active:scale-95
            ${!draft ? "cursor-not-allowed bg-slate-800 text-slate-500" : pay === "star" ? "bg-cyan-500 text-slate-950 hover:bg-cyan-400" : "bg-emerald-600 text-white hover:bg-emerald-500"}`}
        >
          {owned ? "변경" : (
            <>
              <GameIcon name={pay === "star" ? UI_ICONS.star : UI_ICONS.gold} size={14} />
              {price}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function TraitCard({
  trait,
  level,
  currency,
  canAfford,
  seal = false,
  status = null,
  icon,
  onUpgrade,
}: {
  trait: TraitDef;
  level: number;
  currency: TraitTab;
  canAfford: boolean;
  seal?: boolean;
  status?: string | null;
  icon: string;
  onUpgrade: () => void;
}) {
  const isMax = level >= trait.maxLevel;
  const isReady = seal ? (level > 0 || canAfford) : !isMax && canAfford;
  const cost = currency === "star" ? starTraitCost(trait) : (trait.goldCost ?? TRAIT_UPGRADE_COST(level));
  const owned = level > 0;
  const accent = currency === "star" ? "cyan" : "emerald";
  const iconBox = owned
    ? accent === "cyan"
      ? "border-cyan-500/40 bg-cyan-950/40"
      : "border-emerald-500/40 bg-emerald-950/40"
    : "border-slate-700 bg-slate-800/60";
  const iconTone = owned ? (accent === "cyan" ? "text-cyan-300" : "text-emerald-300") : "text-slate-500";
  const fill = owned ? (accent === "cyan" ? "bg-cyan-400" : "bg-emerald-400") : "";
  const nextTone = accent === "cyan" ? "text-cyan-300" : "text-emerald-300";
  const readyClass = accent === "cyan" ? "bg-cyan-500 text-slate-950 hover:bg-cyan-400" : "bg-emerald-600 text-white hover:bg-emerald-500";

  return (
    <div className="rounded-xl border-2 border-slate-700 bg-slate-900/40 p-5 flex flex-col">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border ${iconBox}`}>
            <GameIcon name={icon} size={24} className={iconTone} />
          </span>
          <div>
            <h3 className="text-slate-100 font-bold text-base">{trait.name}</h3>
            <p className="text-slate-500 text-xs mt-1 leading-snug">{trait.desc}</p>
          </div>
        </div>
        <span className="text-slate-300 font-mono text-sm font-bold whitespace-nowrap">
          Lv {level}/{trait.maxLevel}
        </span>
      </div>

      <div className="flex items-center gap-1.5 mb-4">
        {Array.from({ length: trait.maxLevel }).map((_, i) => (
          <div key={i} className={`flex-1 h-2 rounded-full transition-colors ${i < level ? fill : "bg-slate-800"}`} />
        ))}
      </div>

      <div className="flex flex-col gap-1 mt-auto mb-3">
        <span className="text-slate-300 text-sm font-semibold">{status ?? trait.effectLabel(level)}</span>
        {!isMax && (
          <span className={`${nextTone} text-xs font-semibold`}>→ 강화 시 {trait.effectLabel(level + 1)}</span>
        )}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-slate-500 text-xs">{isMax ? "최대 달성" : ""}</span>
        <button
          onClick={onUpgrade}
          disabled={!isReady}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all active:scale-95
            ${isReady ? readyClass : "bg-slate-800 text-slate-500 cursor-not-allowed"}`}
        >
          <ChevronUp className="w-4 h-4" />
          {seal && level > 0 ? (
            <span>변경</span>
          ) : isMax ? (
            <span>MAX</span>
          ) : (
            <span className="flex items-center gap-1">
              <GameIcon name={currency === "star" ? UI_ICONS.star : UI_ICONS.gold} size={12} />
              {cost}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
