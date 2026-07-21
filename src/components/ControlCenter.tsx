import React, { useState, useEffect } from 'react';
import { hbgCore } from '../core/hbgCore';
import { getState, subscribe } from '../core/vibraState';

export const ControlCenter: React.FC = () => {
  const [volume, setVolume] = useState(getState().volume);
  const [isAutoPlay, setIsAutoPlay] = useState(getState().isAutoPlay);

  useEffect(() => {
    const unsubscribe = subscribe((state) => {
      setVolume(state.volume);
      setIsAutoPlay(state.isAutoPlay);
    });

    return unsubscribe;
  }, []);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setVolume(value);
    hbgCore.setVolume(value);
  };

  const handleAutoPlayToggle = () => {
    if (isAutoPlay) {
      hbgCore.stopAutoPlay();
    } else {
      hbgCore.startAutoPlay();
    }
  };

  return (
    <div className="control-center">
      <div className="control-group">
        <label htmlFor="volume-slider">🔊 Volumen</label>
        <input
          id="volume-slider"
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={handleVolumeChange}
          className="volume-slider"
        />
        <span className="volume-value">{volume}%</span>
      </div>

      <div className="control-group">
        <button
          className={`toggle-btn ${isAutoPlay ? 'active' : ''}`}
          onClick={handleAutoPlayToggle}
          title={isAutoPlay ? 'Desactivar Auto Play' : 'Activar Auto Play'}
        >
          🤖 Auto Play {isAutoPlay ? '✓' : ''}
        </button>
      </div>

      <div className="control-group">
        <button
          className="info-btn"
          onClick={() => {
            const mode = hbgCore.getMode();
            alert(`Modo: ${mode}\n\nVIBRA ${mode.split('_')[1]}`);
          }}
        >
          ℹ️ Información
        </button>
      </div>
    </div>
  );
};
