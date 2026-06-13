import { Player } from "./components/Player";
import { ControlCenter } from "./components/ControlCenter";
import { MoodPanel } from "./components/MoodPanel";
import { PartyMode } from "./components/PartyMode";
import { MusicLibrary } from "./components/MusicLibrary";
import "./ui/styles.css";

function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">🌌 VIBRA PRO</h1>
        <p className="app-subtitle">Universo HBG</p>
      </header>

      <main className="app-content">
        <Player />
        <MoodPanel />
        <MusicLibrary />
        <ControlCenter />
        <PartyMode />
      </main>
    </div>
  );
}

export default App;
