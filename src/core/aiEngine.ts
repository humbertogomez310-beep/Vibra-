/**
 * AI ENGINE
 * Selecciona canciones basadas en mood y preferencias del usuario
 * Preparado para futuras integraciones con INSTINTO
 */

import { Song, Mood } from './vibraState';
import { moodEngine } from './moodEngine';

export interface SongRecommendation {
  song: Song;
  score: number; // 0-100
  reason: string;
}

export class AIEngine {
  /**
   * Generar recomendación de canción según mood
   */
  recommendSong(mood: Mood, _userHistory?: Song[]): Song {
    const moodConfig = moodEngine.getMoodConfig(mood);
    
    // Crear canción simulada basada en el mood
    const song: Song = {
      id: `song-${Date.now()}`,
      title: `${moodConfig.name} Track ${Math.floor(Math.random() * 1000)}`,
      artist: 'VIBRA AI',
      mood: mood,
      duration: 180,
      vibeLevel: moodConfig.intensity,
    };

    return song;
  }

  /**
   * Generar playlist personalizada
   */
  generatePlaylist(mood: Mood, count: number = 10): Song[] {
    const playlist: Song[] = [];
    
    for (let i = 0; i < count; i++) {
      playlist.push(this.recommendSong(mood));
    }

    return playlist;
  }

  /**
   * Obtener puntuación de compatibilidad
   */
  getSongCompatibility(song: Song, mood: Mood, userHistory?: Song[]): number {
    const moodConfig = moodEngine.getMoodConfig(mood);
    let score = 0;

    // Match de mood
    if (song.mood === mood) {
      score += 40;
    } else if (this.isMoodCompatible(song.mood, mood)) {
      score += 20;
    }

    // Match de intensidad
    const intensityDiff = Math.abs(song.vibeLevel - moodConfig.intensity);
    score += Math.max(0, 30 - intensityDiff / 2);

    // Evitar repetición reciente
    if (userHistory && userHistory.length > 0) {
      const recentSongs = userHistory.slice(0, 10);
      if (!recentSongs.some(s => s.id === song.id)) {
        score += 30;
      }
    }

    return Math.min(100, score);
  }

  /**
   * Verificar compatibilidad de moods
   */
  private isMoodCompatible(songMood: Mood, targetMood: Mood): boolean {
    const compatibility: Record<Mood, Mood[]> = {
      chill: ['sad'],
      energy: ['party'],
      sad: ['chill'],
      party: ['energy'],
    };

    return compatibility[songMood]?.includes(targetMood) || false;
  }

  /**
   * Analizar patrón de usuario para predicción (preparado para INSTINTO)
   */
  analyzeUserPattern(history: Song[]): {
    preferredMood: Mood;
    averageVibeLevel: number;
    mostActiveHour: number;
  } {
    if (history.length === 0) {
      return {
        preferredMood: 'chill',
        averageVibeLevel: 50,
        mostActiveHour: 12,
      };
    }

    // Contar moods
    const moodCounts = history.reduce((acc, song) => {
      acc[song.mood] = (acc[song.mood] || 0) + 1;
      return acc;
    }, {} as Record<Mood, number>);

    const preferredMood = Object.entries(moodCounts)
      .sort(([, a], [, b]) => b - a)[0][0] as Mood;

    // Calcular vibe promedio
    const averageVibeLevel = Math.round(
      history.reduce((sum, song) => sum + song.vibeLevel, 0) / history.length
    );

    return {
      preferredMood,
      averageVibeLevel,
      mostActiveHour: Math.floor(Math.random() * 24),
    };
  }
}

export const aiEngine = new AIEngine();
