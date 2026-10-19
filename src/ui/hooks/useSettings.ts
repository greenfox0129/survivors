// React binding for game/core/settings.ts (re-renders when settings change anywhere).

import { useEffect, useState } from "react";
import { getSettings, subscribeSettings, updateSettings, type GameSettings } from "@/game/core/settings";

export function useSettings(): [Readonly<GameSettings>, (patch: Partial<GameSettings>) => void] {
  const [settings, setSettings] = useState<Readonly<GameSettings>>(getSettings);
  useEffect(() => subscribeSettings(setSettings), []);
  return [settings, updateSettings];
}
