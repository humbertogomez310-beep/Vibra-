import React, { useState, useEffect } from 'react';
import { hbgCore } from '../core/hbgCore';
import { moodEngine } from '../core/moodEngine';
import { getState, subscribe, Mood } from '../core/vibraState';

export const MoodPanel: React.FC = () => {
  const [currentMood, setCurrentMood] = useState(getState().currentMood);
  const moods = moodEngine.getAvailableMoods();

  useEffect(() => {
    const unsubscribe = subscribe((state) => {
      setCurrentMood(state.currentMood);
    });

    return unsubscribe;
  }, []);

  const handleMoodChange = (mood: Mood) => {
    hbgCore.changeMood(mood);
  };

  return (
    <div className="mood-panel">
      <h2>🌌 Elige tu Mood</h2>
      <div className="mood-grid">
        {moods.map((mood) => {
          const config = moodEngine.getMoodConfig(mood);
          const isActive = currentMood === mood;

          return (
            <button
              key={mood}
              className={`mood-btn ${isActive ? 'active' : ''}`}
              onClick={() => handleMoodChange(mood)}
              style={{
                borderColor: config.color,
                backgroundColor: isActive ? config.color : 'transparent',
              }}
              title={config.description}
            >
              <div className="mood-emoji">{config.emoji}</div>
              <div className="mood-name">{config.name}</div>
              <div className="mood-tempo">♪ {config.tempo} BPM</div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
