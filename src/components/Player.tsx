import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { hbgCore } from '../core/hbgCore';
import { getState, subscribe } from '../core/vibraState';
import { subscribeToCatalogEvents } from '../core/eventBus';

type AudioPresetKey = 'vibrant' | 'warm' | 'bass' | 'treble';

const AUDIO_PRESETS: Record<AudioPresetKey, { label: string; description: string; gains: number[] }> = {
  vibrant: { label: 'Vibrant', description: 'Bright and airy', gains: [70, 55, 40, 30, 20] },
  warm: { label: 'Warm', description: 'Rounded and cozy', gains: [45, 60, 55, 35, 25] },
  bass: { label: 'Bass', description: 'Deep low-end focus', gains: [30, 40, 60, 50, 45] },
  treble: { label: 'Treble', description: 'Sharper highs and clarity', gains: [65, 50, 35, 55, 70] },
};

export const Player: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState(getState().currentSong);
  const [activePreset, setActivePreset] = useState<AudioPresetKey>('vibrant');
  const [catalogVersion, setCatalogVersion] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribe((state) => {
      setCurrentSong(state.currentSong);
      setIsPlaying(state.playbackState === 'playing');
    });

    const unsubscribeCatalog = subscribeToCatalogEvents(() => setCatalogVersion((value) => value + 1));

    return () => {
      unsubscribe();
      unsubscribeCatalog();
    };
  }, []);

  const handlePlay = useCallback(() => {
    if (isPlaying) {
      hbgCore.pause();
    } else if (currentSong) {
      hbgCore.resume();
    } else {
      const song = hbgCore.getNextRecommendation();
      hbgCore.play(song);
    }
  }, [currentSong, isPlaying]);

  const handlePause = useCallback(() => {
    hbgCore.pause();
  }, []);

  const handleNext = useCallback(() => {
    hbgCore.next();
  }, []);

  const presetSummary = useMemo(() => AUDIO_PRESETS[activePreset], [activePreset]);
  const presetOptions = useMemo(() => Object.entries(AUDIO_PRESETS) as Array<[AudioPresetKey, (typeof AUDIO_PRESETS)[AudioPresetKey]]>, []);

  const handlePresetChange = useCallback((presetKey: AudioPresetKey) => {
    setActivePreset(presetKey);
    hbgCore.setEqualizerPreset(presetKey);
  }, []);

  return (
    <div className="player">
      <div className="player-now-playing">
        {currentSong ? (
          <div className="song-info">
            <h3>{currentSong.title}</h3>
            <p>{currentSong.artist}</p>
            <div className="song-mood">{currentSong.mood}</div>
          </div>
        ) : (
          <div className="song-info">
            <h3>Selecciona un mood para comenzar</h3>
            <p>VIBRA PRO</p>
          </div>
        )}
      </div>

      <div className="player-controls">
        <button
          className="control-btn play-btn"
          onClick={handlePlay}
          title={isPlaying ? 'Pausar' : 'Reproducir'}
        >
          {isPlaying ? '⏸️' : '▶️'}
        </button>

        <button
          className="control-btn next-btn"
          onClick={handleNext}
          title="Siguiente"
        >
          ⏭️
        </button>
      </div>

      <div className="audio-preset-panel">
        <div className="preset-header">
          <span className="preset-title">🎛️ Equalizer</span>
          <span className="preset-active">{presetSummary.label}</span>
        </div>

        <div className="preset-options">
          {presetOptions.map(([presetKey, preset]) => {
            const isActive = activePreset === presetKey;

            return (
              <button
                key={presetKey}
                className={`preset-chip ${isActive ? 'active' : ''}`}
                onClick={() => handlePresetChange(presetKey)}
                title={`${preset.label}: ${preset.description}`}
              >
                <span>{preset.label}</span>
                <small>{preset.description}</small>
              </button>
            );
          })}
        </div>

        <div className="preset-bars" aria-label="Preset intensity preview">
          {presetSummary.gains.map((gain, index) => (
            <div key={`${activePreset}-${index}`} className="preset-bar-track">
              <div className="preset-bar-fill" style={{ height: `${gain}%` }} />
            </div>
          ))}
        </div>
      </div>

      <div className="player-progress">
        <div className="progress-bar">
          <div className="progress-fill"></div>
        </div>
        <div className="preset-status">
          <span>Live catalog sync: {catalogVersion}</span>
          <span>Preset ready: {presetSummary.label}</span>
        </div>
      </div>
    </div>
  );
};
