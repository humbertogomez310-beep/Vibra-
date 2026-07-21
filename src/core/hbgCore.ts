/**
 * HBG CORE
 * Cerebro central del sistema VIBRA
 * 
 * Arquitectura:
 * INSTINTO (entrada) → HBG CORE (procesamiento) → VIBRA (salida)
 * 
 * HBG Core integrará:
 * - Mood Engine (emoción)
 * - AI Engine (inteligencia)
 * - Player Engine (reproducción)
 * - AutoDJ (automatización)
 * - Memory Engine (memoria)
 * - Vibra State (estado global)
 */

import { Mood, Song, VibraState, getState, setState, subscribe } from './vibraState';
import { moodEngine } from './moodEngine';
import { aiEngine } from './aiEngine';
import { playerEngine, type EqualizerPreset } from './playerEngine';
import { autoDJ } from './autodj';
import { memoryEngine } from './memoryEngine';

export interface HBGConfig {
  version: string;
  mode: 'VIBRA_FREE' | 'VIBRA_PRO';
  autoPlay: boolean;
  intelligenceLevel: number; // 0-100
}

export class HBGCore {
  private config: HBGConfig;
  private stateUnsubscribe: (() => void) | null = null;

  constructor(config: Partial<HBGConfig> = {}) {
    this.config = {
      version: '1.0.0',
      mode: 'VIBRA_FREE',
      autoPlay: false,
      intelligenceLevel: 75,
      ...config,
    };

    this.initialize();
  }

  /**
   * Inicializar HBG Core
   */
  private initialize(): void {
    // Cargar preferencias guardadas
    const prefs = memoryEngine.getPreferences();
    
    setState({
      currentMood: prefs.preferredMood,
      volume: prefs.volume,
      isAutoPlay: prefs.autoPlayEnabled,
    });

    // Suscribirse a cambios de estado
    this.stateUnsubscribe = subscribe((newState) => {
      this.onStateChange(newState);
    });

    console.log(`🌌 HBG Core inicializado - Modo: ${this.config.mode}`);
  }

  /**
   * Cambiar mood
   */
  changeMood(mood: Mood): void {
    const moodConfig = moodEngine.setMood(mood);
    setState({ currentMood: mood });
    memoryEngine.logMoodChange(mood);
    memoryEngine.savePreferences({ preferredMood: mood });

    console.log(`🎵 Mood cambiado a: ${mood} (${moodConfig.emoji})`);

    if (this.config.autoPlay) {
      autoDJ.changeMood(mood);
    }
  }

  /**
   * Reproducir canción
   */
  play(song: Song, audioUrl?: string): void {
    playerEngine.play(song, audioUrl);
    setState({
      currentSong: song,
      playbackState: 'playing',
    });
    memoryEngine.addToHistory(song);
    memoryEngine.recordPlaybackInteraction(song, 'play');

    console.log(`▶️ Reproduciendo: ${song.title}`);
  }

  /**
   * Pausar
   */
  pause(): void {
    playerEngine.pause();
    setState({ playbackState: 'paused' });
    console.log('⏸️ Pausado');
  }

  /**
   * Reanudar
   */
  resume(): void {
    playerEngine.resume();
    setState({ playbackState: 'playing' });
    console.log('▶️ Reanudando');
  }

  /**
   * Siguiente
   */
  next(): void {
    const currentSong = getState().currentSong;
    if (currentSong) {
      memoryEngine.recordPlaybackInteraction(currentSong, 'skip');
    }

    const nextSong = playerEngine.next();
    if (nextSong) {
      setState({
        currentSong: nextSong,
        playbackState: 'playing',
      });
    }
    console.log('⏭️ Siguiente canción');
  }

  /**
   * Anterior
   */
  previous(): void {
    const currentSong = getState().currentSong;
    if (currentSong) {
      memoryEngine.recordPlaybackInteraction(currentSong, 'replay');
    }

    const previousSong = playerEngine.previous();
    if (previousSong) {
      setState({
        currentSong: previousSong,
        playbackState: 'playing',
      });
    }
    console.log('⏮️ Canción anterior');
  }

  /**
   * Establecer volumen
   */
  setVolume(volume: number): void {
    const normalized = Math.max(0, Math.min(volume, 100));
    playerEngine.setVolume(normalized);
    setState({ volume: normalized });
    memoryEngine.savePreferences({ volume: normalized });
  }

  setEqualizerPreset(preset: EqualizerPreset): void {
    playerEngine.setEqualizerPreset(preset);
  }

  /**
   * Nodo analizador FFT de la reproducción actual, para Party Mode.
   * La UI nunca debe acceder a PlayerEngine directamente: pasa por aquí.
   */
  getAnalyserNode(): AnalyserNode | null {
    return playerEngine.getAnalyserNode();
  }

  /**
   * Buscar una posición de la canción actual (segundos).
   */
  seek(time: number): void {
    playerEngine.seek(time);
  }

  /**
   * Tiempo actual de reproducción (segundos).
   */
  getCurrentTime(): number {
    return playerEngine.getCurrentTime();
  }

  /**
   * Duración de la canción actual (segundos).
   */
  getDuration(): number {
    return playerEngine.getDuration();
  }

  /**
   * Suscribirse a eventos de bajo nivel del reproductor (timeupdate,
   * loadedmetadata, seek, etc.) sin que la UI acceda a PlayerEngine
   * directamente. Devuelve una función para cancelar la suscripción.
   */
  onPlayerEvent(event: string, handler: (data?: unknown) => void): () => void {
    playerEngine.on(event, handler);
    return () => playerEngine.off(event, handler);
  }

  /**
   * Activar reproducción automática
   */
  startAutoPlay(): void {
    const state = getState();
    autoDJ.start(state.currentMood);
    setState({ isAutoPlay: true });
    memoryEngine.savePreferences({ autoPlayEnabled: true });
    console.log('🤖 Auto Play activado');
  }

  /**
   * Detener reproducción automática
   */
  stopAutoPlay(): void {
    autoDJ.stop();
    setState({ isAutoPlay: false });
    memoryEngine.savePreferences({ autoPlayEnabled: false });
    console.log('🤖 Auto Play detenido');
  }

  /**
   * Obtener recomendación de siguiente canción
   */
  getNextRecommendation(): Song {
    const state = getState();
    const catalogMatches = moodEngine.getCatalogRecommendations(state.currentMood, 1);

    if (catalogMatches.length > 0) {
      return catalogMatches[0];
    }

    return aiEngine.recommendSong(state.currentMood, state.history);
  }

  /**
   * Obtener modo actual
   */
  getMode(): string {
    return this.config.mode;
  }

  /**
   * Obtener configuración
   */
  getConfig(): HBGConfig {
    return { ...this.config };
  }

  /**
   * Obtener estado global
   */
  getState(): VibraState {
    return getState();
  }

  /**
   * Destruir HBG Core
   */
  destroy(): void {
    if (this.stateUnsubscribe) {
      this.stateUnsubscribe();
    }
    autoDJ.stop();
    playerEngine.stop();
  }

  /**
   * Manejar cambios de estado
   */
  private onStateChange(_newState: VibraState): void {
    // Hook para futuras integraciones
    // Aquí se puede conectar con INSTINTO para feedback
  }
}

// Instancia global de HBG Core
export const hbgCore = new HBGCore({
  mode: 'VIBRA_PRO',
  intelligenceLevel: 85,
});
