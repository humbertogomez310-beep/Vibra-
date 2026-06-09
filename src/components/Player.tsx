import React, { useState, useEffect } from 'react';
import { hbgCore } from '../core/hbgCore';
import { getState, subscribe } from '../core/vibraState';

export const Player: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState(getState().currentSong);

  useEffect(() => {
    const unsubscribe = subscribe((state) => {
      setCurrentSong(state.currentSong);
      setIsPlaying(state.playbackState === 'playing');
    });

    return unsubscribe;
  }, []);

  const handlePlay = () => {
    if (isPlaying) {
      hbgCore.pause();
    } else if (currentSong) {
      hbgCore.resume();
    } else {
      // Reproducir siguiente recomendación
      const song = hbgCore.getNextRecommendation();
      hbgCore.play(song);
    }
  };

  const handlePause = () => {
    hbgCore.pause();
  };

  const handleNext = () => {
    hbgCore.next();
  };

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

        {isPlaying && (
          <button
            className="control-btn pause-btn"
            onClick={handlePause}
            title="Pausar"
          >
            ⏸️
          </button>
        )}

        <button
          className="control-btn next-btn"
          onClick={handleNext}
          title="Siguiente"
        >
          ⏭️
        </button>
      </div>

      <div className="player-progress">
        <div className="progress-bar">
          <div className="progress-fill"></div>
        </div>
      </div>
    </div>
  );
};
