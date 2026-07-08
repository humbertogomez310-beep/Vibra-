/**
 * MOOD ENGINE
 * Gestiona los diferentes estados de ánimo del usuario
 * Estados: chill, energy, sad, party
 */

import { Mood } from './vibraState';
import { musicCatalog, type LibraryTrack } from './musicCatalog';

export interface MoodConfig {
  name: string;
  emoji: string;
  description: string;
  color: string;
  tempo: number; // BPM
  intensity: number; // 0-100
}

const MOOD_CONFIGS: Record<Mood, MoodConfig> = {
  chill: {
    name: 'Chill',
    emoji: '🌙',
    description: 'Relajante y tranquilo',
    color: '#4f46e5', // Indigo
    tempo: 90,
    intensity: 20,
  },
  energy: {
    name: 'Energy',
    emoji: '⚡',
    description: 'Energético y motivador',
    color: '#dc2626', // Red
    tempo: 140,
    intensity: 80,
  },
  sad: {
    name: 'Sad',
    emoji: '💔',
    description: 'Melancólico y emotivo',
    color: '#7c3aed', // Violet
    tempo: 80,
    intensity: 40,
  },
  party: {
    name: 'Party',
    emoji: '🎉',
    description: 'Fiestas y celebraciones',
    color: '#ec4899', // Pink
    tempo: 130,
    intensity: 90,
  },
};

export class MoodEngine {
  private currentMood: Mood = 'chill';

  /**
   * Obtener configuración del mood actual
   */
  getCurrentMoodConfig(): MoodConfig {
    return MOOD_CONFIGS[this.currentMood];
  }

  /**
   * Cambiar mood
   */
  setMood(mood: Mood): MoodConfig {
    this.currentMood = mood;
    return this.getCurrentMoodConfig();
  }

  /**
   * Obtener todos los moods disponibles
   */
  getAvailableMoods(): Mood[] {
    return Object.keys(MOOD_CONFIGS) as Mood[];
  }

  /**
   * Obtener configuración de un mood específico
   */
  getMoodConfig(mood: Mood): MoodConfig {
    return MOOD_CONFIGS[mood];
  }

  /**
   * Obtener recomendación de playlist según mood
   */
  getCatalogRecommendations(mood: Mood, limit: number = 10): LibraryTrack[] {
    const moodConfig = this.getMoodConfig(mood);
    const tempoRange = this.getTempoRange(moodConfig.tempo);

    const matchingTracks = musicCatalog.querySmartPlaylists(
      {
        mood,
        bpmMin: tempoRange.min,
        bpmMax: tempoRange.max,
        minPlayCount: 0,
      },
      limit,
    );

    if (matchingTracks.length > 0) {
      return matchingTracks;
    }

    return musicCatalog.querySmartPlaylists({ mood }, limit);
  }

  getPlaylistRecommendation(mood: Mood): string[] {
    const catalogTracks = this.getCatalogRecommendations(mood, 6);

    if (catalogTracks.length > 0) {
      return catalogTracks.map((track) => track.id);
    }

    return [
      `${mood}-track-1`,
      `${mood}-track-2`,
      `${mood}-track-3`,
    ];
  }

  private getTempoRange(tempo: number): { min: number; max: number } {
    const tolerance = Math.max(12, Math.round(tempo * 0.18));
    return {
      min: Math.max(60, tempo - tolerance),
      max: tempo + tolerance,
    };
  }
}

export const moodEngine = new MoodEngine();
