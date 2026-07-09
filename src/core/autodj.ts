/**
 * AUTO DJ ENGINE
 * Prepara reproducción automática y maneja la cola de canciones
 */

import { Song, Mood } from './vibraState';
import { aiEngine } from './aiEngine';
import { playerEngine } from './playerEngine';
import { moodEngine } from './moodEngine';
import { musicCatalog } from './musicCatalog';
import { memoryEngine } from './memoryEngine';

export class AutoDJ {
  private queue: Song[] = [];
  private isRunning: boolean = false;
  private currentIndex: number = 0;

  /**
   * Iniciar reproducción automática
   */
  start(mood: Mood, startPlaylist?: Song[]): void {
    if (this.isRunning) return;

    this.isRunning = true;

    if (!startPlaylist || startPlaylist.length === 0) {
      this.queue = this.buildInitialQueue(mood, 20);
    } else {
      this.queue = startPlaylist;
    }

    this.currentIndex = 0;
    this.playNext();
  }

  /**
   * Parar reproducción automática
   */
  stop(): void {
    this.isRunning = false;
    playerEngine.stop();
    this.queue = [];
    this.currentIndex = 0;
  }

  /**
   * Reproducir siguiente canción
   */
  playNext(): void {
    if (!this.isRunning || this.queue.length === 0) {
      return;
    }

    if (this.currentIndex >= this.queue.length) {
      this.currentIndex = 0; // Loop
    }

    const song = this.queue[this.currentIndex];
    playerEngine.play(song);
    this.currentIndex++;

    if (this.currentIndex > this.queue.length - 5) {
      this.refillQueue(song.mood);
    }
  }

  /**
   * Reproducir anterior canción
   */
  playPrevious(): void {
    if (this.queue.length === 0) return;

    this.currentIndex = Math.max(0, this.currentIndex - 2);
    const song = this.queue[this.currentIndex];
    playerEngine.play(song);
    this.currentIndex++;
  }

  /**
   * Agregar canción a la cola
   */
  enqueue(song: Song): void {
    this.queue.push(song);
  }

  /**
   * Agregar múltiples canciones a la cola
   */
  enqueueMultiple(songs: Song[]): void {
    this.queue.push(...songs);
  }

  /**
   * Obtener cola actual
   */
  getQueue(): Song[] {
    return [...this.queue];
  }

  getUpcomingSongs(limit: number = 4): Song[] {
    return this.queue.slice(this.currentIndex, this.currentIndex + limit);
  }

  getRecommendedTrack(): Song | null {
    return this.queue[this.currentIndex] ?? null;
  }

  /**
   * Cambiar modo (mood)
   */
  changeMood(newMood: Mood): void {
    this.queue = this.buildInitialQueue(newMood, 20);
    this.currentIndex = 0;
    this.playNext();
  }

  /**
   * Obtener índice actual
   */
  getCurrentIndex(): number {
    return this.currentIndex;
  }

  /**
   * Verificar si está activo
   */
  isActive(): boolean {
    return this.isRunning;
  }

  private buildInitialQueue(mood: Mood, count: number): Song[] {
    const catalogTracks = moodEngine.getCatalogRecommendations(mood, count);
    if (catalogTracks.length > 0) {
      return catalogTracks.slice(0, count).map((track) => this.toSong(track, mood));
    }

    return aiEngine.generatePlaylist(mood, count);
  }

  private refillQueue(mood: Mood): void {
    const moodConfig = moodEngine.getMoodConfig(mood);
    const interactions = memoryEngine.getPlaybackInteractions().slice(0, 40);
    const frequentIds = new Set<string>();

    interactions.forEach((interaction) => {
      if (interaction.type === 'play' || interaction.type === 'replay') {
        frequentIds.add(interaction.songId);
      }
    });

    const catalogTracks = musicCatalog.querySmartPlaylists(
      {
        mood,
        bpmMin: Math.max(60, moodConfig.tempo - 20),
        bpmMax: moodConfig.tempo + 20,
        minPlayCount: 0,
      },
      12,
    );

    const favoredTracks = catalogTracks.filter((track) => frequentIds.has(track.id));
    const fallbackTracks = catalogTracks.filter((track) => !frequentIds.has(track.id));
    const predictedTracks = [...favoredTracks, ...fallbackTracks]
      .slice(0, 8)
      .map((track) => this.toSong(track, mood));

    const generatedTracks = predictedTracks.length > 0
      ? predictedTracks
      : aiEngine.generatePlaylist(mood, 8);

    this.queue.push(...generatedTracks);
  }

  private toSong(track: { id: string; title: string; artist: string; mood: Mood; duration: number; vibeLevel: number; audioUrl?: string }, mood: Mood): Song {
    return {
      id: track.id,
      title: track.title,
      artist: track.artist,
      mood: track.mood ?? mood,
      duration: track.duration,
      vibeLevel: track.vibeLevel,
      audioUrl: track.audioUrl,
    };
  }
}

export const autoDJ = new AutoDJ();
