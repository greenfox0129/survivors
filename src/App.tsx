import { useState, useCallback } from "react";
import { Lobby, type Screen } from "@/game/UI/Lobby";
import { GameCanvas } from "@/game/UI/GameCanvas";
import { GachaScreen } from "@/game/UI/GachaScreen";
import { CodexScreen } from "@/game/UI/CodexScreen";
import { AchievementsScreen } from "@/game/UI/AchievementsScreen";
import { CharacterScreen } from "@/game/UI/CharacterScreen";
import { TraitsScreen } from "@/game/UI/TraitsScreen";
import { loadSave, saveSave, type SaveData } from "@/game/storage";

function App() {
  const [screen, setScreen] = useState<Screen>("lobby");
  const [save, setSave] = useState<SaveData>(() => loadSave());

  const goLobby = () => {
    setSave(loadSave());
    setScreen("lobby");
  };

  const handleSaveUpdate = useCallback((next: SaveData) => {
    setSave(next);
    saveSave(next);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950">
      {screen === "lobby" && <Lobby onNavigate={setScreen} />}
      {screen === "game" && <GameCanvas onExit={goLobby} save={save} />}
      {screen === "gacha" && (
        <GachaScreen onBack={goLobby} save={save} onUpdate={handleSaveUpdate} />
      )}
      {screen === "characters" && (
        <CharacterScreen onBack={goLobby} save={save} onUpdate={handleSaveUpdate} />
      )}
      {screen === "traits" && (
        <TraitsScreen onBack={goLobby} save={save} onUpdate={handleSaveUpdate} />
      )}
      {screen === "codex" && <CodexScreen onBack={goLobby} />}
      {screen === "achievements" && (
        <AchievementsScreen onBack={goLobby} save={save} />
      )}
    </div>
  );
}

export default App;
