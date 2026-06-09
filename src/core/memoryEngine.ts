/**
 * MEMORY ENGINE
 * Gestiona el historial y preferencias del usuario en localStorage
 */

import { Song } from './vibraState';
import { Mood } from './vibraState';

const STORAGE_KEYS = {
  HISTORY: 'vibra_history',
  FAVORITES: 'vibra_favorites',
  PREFERENCES: 'vibra_preferences',
  MOOD_HISTORY: 'vibra_mood_history',
};

export interface UserPreferences {
  preferredMood: Mood;
  volume: number;
  darkMode: boolean;
  autoPlayEnabled: boolean;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  preferredMood: 'chill',
  volume: 75,
  darkMode: true,
  autoPlayEnabled: true,
};

export class MemoryEngine {
  /**
   * Guardar canción en historial
   */
  addToHistory(song: Song): void {
    const history = this.getHistory();
    history.unshift(song);
    // Mantener solo últimas 100 canciones
    const limited = history.slice(0, 100);
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(limited));
  }

  /**
   * Obtener historial de canciones
   */
  getHistory(): Song[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  /**
   * Agregar a favoritos
   */
  addToFavorites(song: Song): void {
    const favorites = this.getFavorites();
    if (!favorites.some(s => s.id === song.id)) {
      favorites.push(song);
      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
    }
  }

  /**
   * Obtener favoritos
   */
  getFavorites(): Song[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FAVORITES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  /**
   * Remover de favoritos
   */
  removeFromFavorites(songId: string): void {
    const favorites = this.getFavorites();
    const filtered = favorites.filter(s => s.id !== songId);
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(filtered));
  }

  /**
   * Guardar preferencias
   */
  savePreferences(prefs: Partial<UserPreferences>): void {
    const current = this.getPreferences();
    const updated = { ...current, ...prefs };
    localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(updated));
  }

  /**
   * Obtener preferencias
   */
  getPreferences(): UserPreferences {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
      return data ? { ...DEFAULT_PREFERENCES, ...JSON.parse(data) } : DEFAULT_PREFERENCES;
    } catch {
      return DEFAULT_PREFERENCES;
    }
  }

  /**
   * Registrar cambio de mood
   */
  logMoodChange(mood: Mood, timestamp: number = Date.now()): void {
    const history = this.getMoodHistory();
    history.push({ mood, timestamp });
    localStorage.setItem(STORAGE_KEYS.MOOD_HISTORY, JSON.stringify(history));
  }

  /**
   * Obtener historial de moods
   */
  getMoodHistory(): Array<{ mood: Mood; timestamp: number }> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MOOD_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  /**
   * Limpiar todo
   */
  clearAll(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }
}

export const memoryEngine = new MemoryEngine();
