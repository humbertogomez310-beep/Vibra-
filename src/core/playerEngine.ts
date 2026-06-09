/**
 * PLAYER ENGINE
 * Gestiona la reproducción de audio
 */

import { Song, PlaybackState } from './vibraState';

export interface PlayerControls {
  play(song: Song, audioUrl?: string): void;
  pause(): void;
  resume(): void;
  stop(): void;
  next(): void;
  previous(): void;
  seek(time: number): void;
  setVolume(volume: number): void;
}

export class PlayerEngine implements PlayerControls {
  private audioElement: HTMLAudioElement | null = null;
  private currentTime: number = 0;
  private duration: number = 0;
  private listeners: Map<string, Function[]> = new Map();

  constructor() {
    this.initAudioElement();
  }

  /**
   * Inicializar elemento de audio
   */
  private initAudioElement(): void {
    if (typeof window !== 'undefined') {
      this.audioElement = new Audio();
      this.audioElement.addEventListener('ended', () => this.handleSongEnd());
      this.audioElement.addEventListener('timeupdate', () => this.handleTimeUpdate());
      this.audioElement.addEventListener('loadedmetadata', () => this.handleMetadata());
    }
  }

  /**
   * Cargar y reproducir canción
   */
  play(song: Song, audioUrl?: string): void {
    if (!this.audioElement) return;

    if (audioUrl) {
      this.audioElement.src = audioUrl;
    }

    this.audioElement.play().catch(err => {
      console.error('Error playing audio:', err);
      this.emit('error', err);
    });
    this.emit('play', song);
  }

  /**
   * Pausar reproducción
   */
  pause(): void {
    if (!this.audioElement) return;
    this.audioElement.pause();
    this.emit('pause');
  }

  /**
   * Reanudar reproducción
   */
  resume(): void {
    if (!this.audioElement) return;
    this.audioElement.play().catch(err => {
      console.error('Error resuming audio:', err);
    });
    this.emit('resume');
  }

  /**
   * Detener reproducción
   */
  stop(): void {
    if (!this.audioElement) return;
    this.audioElement.pause();
    this.audioElement.currentTime = 0;
    this.currentTime = 0;
    this.emit('stop');
  }

  /**
   * Siguiente canción (simulado)
   */
  next(): void {
    this.emit('next');
  }

  /**
   * Canción anterior (simulado)
   */
  previous(): void {
    this.emit('previous');
  }

  /**
   * Buscar en la canción
   */
  seek(time: number): void {
    if (!this.audioElement) return;
    this.audioElement.currentTime = Math.max(0, Math.min(time, this.duration));
    this.emit('seek', time);
  }

  /**
   * Establecer volumen
   */
  setVolume(volume: number): void {
    if (!this.audioElement) return;
    const normalized = Math.max(0, Math.min(volume / 100, 1));
    this.audioElement.volume = normalized;
    this.emit('volumechange', volume);
  }

  /**
   * Obtener tiempo actual
   */
  getCurrentTime(): number {
    return this.currentTime;
  }

  /**
   * Obtener duración
   */
  getDuration(): number {
    return this.duration;
  }

  /**
   * Obtener estado actual
   */
  getState(): PlaybackState {
    if (!this.audioElement) return 'stopped';
    if (this.audioElement.paused) return 'paused';
    return 'playing';
  }

  // Private handlers
  private handleTimeUpdate(): void {
    if (!this.audioElement) return;
    this.currentTime = this.audioElement.currentTime;
    this.emit('timeupdate', this.currentTime);
  }

  private handleMetadata(): void {
    if (!this.audioElement) return;
    this.duration = this.audioElement.duration;
    this.emit('loadedmetadata', this.duration);
  }

  private handleSongEnd(): void {
    this.emit('ended');
  }

  // Event system
  private emit(event: string, data?: any): void {
    const handlers = this.listeners.get(event) || [];
    handlers.forEach(handler => handler(data));
  }

  public on(event: string, handler: Function): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(handler);

    return () => {
      const handlers = this.listeners.get(event) || [];
      const index = handlers.indexOf(handler);
      if (index > -1) handlers.splice(index, 1);
    };
  }

  public off(event: string, handler: Function): void {
    const handlers = this.listeners.get(event) || [];
    const index = handlers.indexOf(handler);
    if (index > -1) handlers.splice(index, 1);
  }
}

export const playerEngine = new PlayerEngine();
