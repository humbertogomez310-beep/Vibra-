/**
 * MEMORY ENGINE
 * Gestiona el historial y preferencias del usuario en localStorage
 */

import { Song } from './vibraState';
import { Mood } from './vibraState';
import { LibraryTrack } from './musicCatalog';

const STORAGE_KEYS = {
  HISTORY: 'vibra_history',
  FAVORITES: 'vibra_favorites',
  PREFERENCES: 'vibra_preferences',
  MOOD_HISTORY: 'vibra_mood_history',
  LIBRARY_TRACKS: 'vibra_library_tracks',
  PLAYBACK_INTERACTIONS: 'vibra_playback_interactions',
};

export interface UserPreferences {
  preferredMood: Mood;
  volume: number;
  darkMode: boolean;
  autoPlayEnabled: boolean;
}

export type PlaybackInteractionType = 'play' | 'skip' | 'replay';

export interface PlaybackInteraction {
  songId: string;
  songTitle: string;
  type: PlaybackInteractionType;
  mood: Mood;
  timestamp: number;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  preferredMood: 'chill',
  volume: 75,
  darkMode: true,
  autoPlayEnabled: true,
};

export class MemoryEngine {
  private getStorage(): Storage | null {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      return window.localStorage;
    } catch {
      return null;
    }
  }

  private getItem(key: string): string | null {
    const storage = this.getStorage();
    return storage ? storage.getItem(key) : null;
  }

  private setItem(key: string, value: string): void {
    const storage = this.getStorage();
    if (storage) {
      storage.setItem(key, value);
    }
  }

  private removeItem(key: string): void {
    const storage = this.getStorage();
    if (storage) {
      storage.removeItem(key);
    }
  }

  /**
   * Guardar canción en historial
   */
  addToHistory(song: Song): void {
    const history = this.getHistory();
    history.unshift(song);
    // Mantener solo últimas 100 canciones
    const limited = history.slice(0, 100);
    this.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(limited));
  }

  /**
   * Obtener historial de canciones
   */
  getHistory(): Song[] {
    try {
      const data = this.getItem(STORAGE_KEYS.HISTORY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  /**
   * Guardar catálogo local de canciones
   */
  saveLibraryTracks(tracks: LibraryTrack[]): void {
    this.setItem(STORAGE_KEYS.LIBRARY_TRACKS, JSON.stringify(tracks));
  }

  /**
   * Obtener catálogo local de canciones
   */
  getLibraryTracks(): LibraryTrack[] {
    try {
      const data = this.getItem(STORAGE_KEYS.LIBRARY_TRACKS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  recordPlaybackInteraction(song: Song, type: PlaybackInteractionType): void {
    const interaction: PlaybackInteraction = {
      songId: song.id,
      songTitle: song.title,
      type,
      mood: song.mood,
      timestamp: Date.now(),
    };

    const interactions = this.getPlaybackInteractions();
    interactions.unshift(interaction);
    const limited = interactions.slice(0, 200);
    this.setItem(STORAGE_KEYS.PLAYBACK_INTERACTIONS, JSON.stringify(limited));
  }

  getPlaybackInteractions(): PlaybackInteraction[] {
    try {
      const data = this.getItem(STORAGE_KEYS.PLAYBACK_INTERACTIONS);
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
      this.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
    }
  }

  /**
   * Obtener favoritos
   */
  getFavorites(): Song[] {
    try {
      const data = this.getItem(STORAGE_KEYS.FAVORITES);
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
    this.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(filtered));
  }

  /**
   * Guardar preferencias
   */
  savePreferences(prefs: Partial<UserPreferences>): void {
    const current = this.getPreferences();
    const updated = { ...current, ...prefs };
    this.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(updated));
  }

  /**
   * Obtener preferencias
   */
  getPreferences(): UserPreferences {
    try {
      const data = this.getItem(STORAGE_KEYS.PREFERENCES);
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
    this.setItem(STORAGE_KEYS.MOOD_HISTORY, JSON.stringify(history));
  }

  /**
   * Obtener historial de moods
   */
  getMoodHistory(): Array<{ mood: Mood; timestamp: number }> {
    try {
      const data = this.getItem(STORAGE_KEYS.MOOD_HISTORY);
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
      this.removeItem(key);
    });
  }
}

export const memoryEngine = new MemoryEngine();
