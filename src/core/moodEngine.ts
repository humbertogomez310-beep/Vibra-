/**
 * MOOD ENGINE
 * Gestiona los diferentes estados de ánimo del usuario
 * Estados: chill, energy, sad, party
 */

import { Mood } from './vibraState';

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
  getPlaylistRecommendation(mood: Mood): string[] {
    // Aquí se pueden añadir recomendaciones más complejas
    // Por ahora retorna IDs de ejemplo
    return [
      `${mood}-track-1`,
      `${mood}-track-2`,
      `${mood}-track-3`,
    ];
  }
}

export const moodEngine = new MoodEngine();
