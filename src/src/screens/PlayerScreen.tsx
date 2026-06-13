import React from "react";

export const PlayerScreen: React.FC = () => {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">🌌 VIBRA PRO</h1>
        <p className="app-subtitle">Universo HBG</p>
      </header>

      <main className="app-content">
        <div className="player">

          <div className="player-now-playing">
            <div className="song-info">
              <h3>La Voz del Lobo</h3>
              <p>HBG</p>
              <div className="song-mood">CHILL</div>
            </div>
          </div>

          <div className="player-controls">
            <button className="control-btn">⏮️</button>

            <button className="control-btn play-btn">
              ▶️
            </button>

            <button className="control-btn">
              ⏭️
            </button>
          </div>

        </div>
      </main>
    </div>
  );
};
