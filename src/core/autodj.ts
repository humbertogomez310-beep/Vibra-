/**
 * AUTO DJ ENGINE
 * Prepara reproducción automática y maneja la cola de canciones
 */

import { Song, Mood } from './vibraState';
import { aiEngine } from './aiEngine';
import { playerEngine } from './playerEngine';

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
    
    // Generar playlist inicial
    if (!startPlaylist || startPlaylist.length === 0) {
      this.queue = aiEngine.generatePlaylist(mood, 20);
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

    // Generar más canciones si estamos llegando al final
    if (this.currentIndex > this.queue.length - 5) {
      const mood = song.mood;
      const newSongs = aiEngine.generatePlaylist(mood, 10);
      this.queue.push(...newSongs);
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

  /**
   * Cambiar modo (mood)
   */
  changeMood(newMood: Mood): void {
    this.queue = aiEngine.generatePlaylist(newMood, 20);
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
}

export const autoDJ = new AutoDJ();
