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
import { playerEngine } from './playerEngine';
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
    playerEngine.next();
    autoDJ.playNext();
    console.log('⏭️ Siguiente canción');
  }

  /**
   * Anterior
   */
  previous(): void {
    playerEngine.previous();
    autoDJ.playPrevious();
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
