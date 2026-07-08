import React, { useState, useEffect, useMemo } from 'react';
import { hbgCore } from '../core/hbgCore';
import { moodEngine } from '../core/moodEngine';
import { getState, subscribe, Mood } from '../core/vibraState';
import { eventBus } from '../core/eventBus';
import { autoDJ } from '../core/autodj';

export const MoodPanel: React.FC = () => {
  const [currentMood, setCurrentMood] = useState(getState().currentMood);
  const [catalogVersion, setCatalogVersion] = useState(0);
  const [predictiveQueue, setPredictiveQueue] = useState(autoDJ.getQueue());
  const moods = moodEngine.getAvailableMoods();

  useEffect(() => {
    const unsubscribe = subscribe((state) => {
      setCurrentMood(state.currentMood);
    });

    const handleCatalogRefresh = () => setCatalogVersion((value) => value + 1);
    eventBus.on('library:tracks:hydrated', handleCatalogRefresh);
    eventBus.on('library:tracks:added', handleCatalogRefresh);
    eventBus.on('library:tracks:updated', handleCatalogRefresh);
    eventBus.on('library:tracks:removed', handleCatalogRefresh);

    return () => {
      unsubscribe();
      eventBus.off('library:tracks:hydrated', handleCatalogRefresh);
      eventBus.off('library:tracks:added', handleCatalogRefresh);
      eventBus.off('library:tracks:updated', handleCatalogRefresh);
      eventBus.off('library:tracks:removed', handleCatalogRefresh);
    };
  }, []);

  const handleMoodChange = (mood: Mood) => {
    hbgCore.changeMood(mood);
    setPredictiveQueue(autoDJ.getQueue().slice(0, 4));
  };

  const activeConfig = useMemo(() => moodEngine.getMoodConfig(currentMood), [currentMood]);

  useEffect(() => {
    const nextQueue = autoDJ.getQueue().slice(0, 4);
    if (nextQueue.length > 0) {
      setPredictiveQueue(nextQueue);
    }
  }, [currentMood, catalogVersion]);

  return (
    <div className="mood-panel">
      <div className="mood-status-card">
        <div>
          <p className="mood-status-label">Active mood</p>
          <h2>{activeConfig.name}</h2>
        </div>
        <div className="mood-status-pill" style={{ color: activeConfig.color }}>
          {activeConfig.emoji} {activeConfig.tempo} BPM
        </div>
      </div>

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

      <div className="predictive-track-card">
        <div className="predictive-track-header">
          <span>Predictive queue</span>
          <small>Catalog sync {catalogVersion}</small>
        </div>
        <div className="predictive-track-list">
          {predictiveQueue.length > 0 ? (
            predictiveQueue.map((song) => (
              <div key={song.id} className="predictive-track-item">
                <strong>{song.title}</strong>
                <span>{song.artist}</span>
              </div>
            ))
          ) : (
            <div className="predictive-track-empty">No predictive tracks yet. Start playback to seed the queue.</div>
          )}
        </div>
      </div>
    </div>
  );
};
