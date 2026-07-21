/**
 * PLAYER ENGINE
 * Gestiona la reproducción de audio con ecualizador, crossfade y cola avanzada
 */

import { Song, PlaybackState } from './vibraState';
import { aiEngine } from './aiEngine';

export interface PlayerControls {
  play(song: Song, audioUrl?: string): void;
  pause(): void;
  resume(): void;
  stop(): void;
  next(): Song | null;
  previous(): Song | null;
  seek(time: number): void;
  setVolume(volume: number): void;
}

export interface PlayerQueueSnapshot {
  queue: Song[];
  history: Song[];
  priorityQueue: Song[];
}

export type EqualizerPreset = 'default' | 'vibrant' | 'warm' | 'bass' | 'treble';

interface AudioGraph {
  source: MediaElementAudioSourceNode;
  preGain: GainNode;
  outputGain: GainNode;
  filters: BiquadFilterNode[];
  analyser: AnalyserNode;
}

interface CrossfadeSession {
  outgoing: HTMLAudioElement;
  incoming: HTMLAudioElement;
}

export class PlayerEngine implements PlayerControls {
  private primaryAudioElement: HTMLAudioElement | null = null;
  private secondaryAudioElement: HTMLAudioElement | null = null;
  private activeElement: HTMLAudioElement | null = null;
  private inactiveElement: HTMLAudioElement | null = null;
  private currentTime: number = 0;
  private duration: number = 0;
  private listeners: Map<string, Array<(data?: unknown) => void>> = new Map();
  private audioContext: AudioContext | null = null;
  private graphs: Map<HTMLAudioElement, AudioGraph> = new Map();
  private queue: Song[] = [];
  private history: Song[] = [];
  private priorityQueue: Song[] = [];
  private volume: number = 0.75;
  private currentSong: Song | null = null;
  private crossfadeEnabled: boolean = true;
  private crossfadeDuration: number = 0.35;
  private crossfadeTimer: number | null = null;
  private activeCrossfade: CrossfadeSession | null = null;
  private currentPreset: EqualizerPreset = 'default';
  private readonly eqBands = [
    { frequency: 32, gain: 0 },
    { frequency: 125, gain: 0 },
    { frequency: 1000, gain: 0 },
    { frequency: 4000, gain: 0 },
    { frequency: 16000, gain: 0 },
  ];
  private readonly eqPresets: Record<EqualizerPreset, number[]> = {
    default: [0, 0, 0, 0, 0],
    vibrant: [2, 1.5, 0.5, 1, 1.5],
    warm: [1.5, 1, 0, -0.5, -1],
    bass: [3, 2, 0.5, -0.25, -0.5],
    treble: [-0.5, -0.25, 0.5, 2, 3],
  };

  constructor() {
    this.initAudioElement();
  }

  private createAudioElement(): HTMLAudioElement | null {
    if (typeof window === 'undefined' || typeof Audio === 'undefined') {
      return null;
    }

    return new Audio();
  }

  /**
   * Inicializar elementos de audio
   */
  private initAudioElement(): void {
    this.primaryAudioElement = this.createAudioElement();
    this.secondaryAudioElement = this.createAudioElement();

    [this.primaryAudioElement, this.secondaryAudioElement].forEach((element) => {
      if (!element) return;
      element.addEventListener('ended', () => {
        if (element === this.activeElement) {
          this.handleSongEnd();
        }
      });
      element.addEventListener('timeupdate', () => {
        if (element === this.activeElement) {
          this.handleTimeUpdate();
        }
      });
      element.addEventListener('loadedmetadata', () => {
        if (element === this.activeElement) {
          this.handleMetadata();
        }
      });
    });

    this.activeElement = this.primaryAudioElement;
    this.inactiveElement = this.secondaryAudioElement;
  }

  /**
   * Cargar y reproducir canción
   */
  play(song: Song, audioUrl?: string): void {
    if (!this.primaryAudioElement || !this.secondaryAudioElement) return;

    const resolvedAudioUrl = this.getAudioUrl(song, audioUrl);
    this.currentSong = song;
    this.addToHistory(song);

    if (
      this.crossfadeEnabled &&
      this.activeElement &&
      this.inactiveElement &&
      this.activeElement !== this.inactiveElement &&
      !this.activeElement.paused &&
      this.activeElement.currentTime > 0.25
    ) {
      this.playWithCrossfade(song, resolvedAudioUrl);
      this.emit('play', song);
      return;
    }

    this.playDirect(song, resolvedAudioUrl);
    this.emit('play', song);
  }

  /**
   * Pausar reproducción
   */
  pause(): void {
    this.stopTransition();
    [this.primaryAudioElement, this.secondaryAudioElement].forEach((element) => {
      if (element) {
        element.pause();
      }
    });
    this.emit('pause');
  }

  /**
   * Reanudar reproducción
   */
  resume(): void {
    const target = this.activeElement ?? this.primaryAudioElement;
    if (!target) return;

    this.ensureAudioContext();
    target.play().catch((err) => {
      console.error('Error resuming audio:', err);
      this.emit('error', err);
    });
    this.emit('resume');
  }

  /**
   * Detener reproducción
   */
  stop(): void {
    this.stopTransition();
    [this.primaryAudioElement, this.secondaryAudioElement].forEach((element) => {
      if (element) {
        element.pause();
        element.currentTime = 0;
      }
    });
    this.currentTime = 0;
    this.duration = 0;
    this.emit('stop');
  }

  /**
   * Siguiente canción
   */
  next(): Song | null {
    const nextSong = this.dequeueNextSong();
    if (!nextSong) {
      this.emit('queueempty');
      return null;
    }

    this.play(nextSong);
    this.emit('next', nextSong);
    return nextSong;
  }

  /**
   * Canción anterior
   */
  previous(): Song | null {
    const previousSong = this.history[this.history.length - 2] ?? null;
    if (!previousSong) {
      this.emit('previous');
      return null;
    }

    this.play(previousSong);
    this.emit('previous', previousSong);
    return previousSong;
  }

  /**
   * Buscar en la canción
   */
  seek(time: number): void {
    const target = this.activeElement ?? this.primaryAudioElement;
    if (!target) return;

    target.currentTime = Math.max(0, Math.min(time, this.duration));
    this.emit('seek', time);
  }

  /**
   * Establecer volumen
   */
  setVolume(volume: number): void {
    const normalized = Math.max(0, Math.min(volume / 100, 1));
    this.volume = normalized;

    [this.primaryAudioElement, this.secondaryAudioElement].forEach((element) => {
      if (element) {
        element.volume = normalized;
      }
    });

    this.applyVolumeToGraphs();
    this.emit('volumechange', volume);
  }

  /**
   * Establecer preset de ecualizador
   */
  setEqualizerPreset(preset: EqualizerPreset): void {
    this.currentPreset = preset;
    this.applyEqualizerPreset();
    this.emit('equalizerchange', preset);
  }

  /**
   * Habilitar o deshabilitar crossfade
   */
  setCrossfadeEnabled(enabled: boolean): void {
    this.crossfadeEnabled = enabled;
    if (!enabled) {
      this.stopTransition();
    }
  }

  /**
   * Añadir canción a la cola de reproducción
   */
  enqueue(song: Song, priority: boolean = false): void {
    if (priority) {
      this.priorityQueue.push(song);
    } else {
      this.queue.push(song);
    }
    this.emit('queuechange', this.getQueueSnapshot());
  }

  /**
   * Obtener snapshot de cola
   */
  getQueueSnapshot(): PlayerQueueSnapshot {
    return {
      queue: [...this.queue],
      history: [...this.history],
      priorityQueue: [...this.priorityQueue],
    };
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
   * Obtener el estado actual
   */
  getState(): PlaybackState {
    const target = this.activeElement ?? this.primaryAudioElement;
    if (!target) return 'stopped';
    if (target.paused) return 'paused';
    return 'playing';
  }

  /**
   * Nodo analizador FFT real de la pista que suena actualmente.
   * Party Mode lo usa para sincronizar su visualizador con el audio real.
   * Devuelve null si aún no hay ningún grafo de audio inicializado
   * (por ejemplo, antes de la primera reproducción).
   */
  getAnalyserNode(): AnalyserNode | null {
    const target = this.activeElement ?? this.primaryAudioElement;
    if (!target) return null;
    return this.graphs.get(target)?.analyser ?? null;
  }

  private getAudioUrl(song: Song, audioUrl?: string): string | undefined {
    if (audioUrl) return audioUrl;
    return (song as Song & { audioUrl?: string }).audioUrl;
  }

  private playDirect(song: Song, audioUrl?: string): void {
    const target = this.activeElement ?? this.primaryAudioElement;
    if (!target) return;

    this.prepareTrack(target, song, audioUrl);
    this.ensureAudioContext();
    this.ensureGraph(target);
    this.applyEqualizerPreset();
    this.applyVolumeToGraphs();
    target.play().catch((err) => {
      console.error('Error playing audio:', err);
      this.emit('error', err);
    });
  }

  private playWithCrossfade(song: Song, audioUrl?: string): void {
    const outgoing = this.activeElement;
    const incoming = this.inactiveElement;

    if (!outgoing || !incoming || outgoing === incoming) {
      this.playDirect(song, audioUrl);
      return;
    }

    this.stopTransition();
    this.prepareTrack(incoming, song, audioUrl);
    this.ensureAudioContext();
    this.ensureGraph(incoming);
    this.applyEqualizerPreset();
    this.applyVolumeToGraphs();

    this.setElementVolume(incoming, 0);
    incoming.play().catch((err) => {
      console.error('Error playing crossfade target:', err);
      this.emit('error', err);
    });

    this.crossfadeStartTime = Date.now();
    this.activeCrossfade = { outgoing, incoming };
    this.crossfadeTimer = window.setInterval(() => {
      const elapsed = (Date.now() - this.crossfadeStartTime) / 1000;
      const progress = Math.min(elapsed / this.crossfadeDuration, 1);
      const incomingGain = progress;
      const outgoingGain = 1 - progress;

      this.setElementVolume(outgoing, outgoingGain * this.volume);
      this.setElementVolume(incoming, incomingGain * this.volume);

      if (progress >= 1) {
        this.finishCrossfade();
      }
    }, 16) as unknown as number;
  }

  private crossfadeStartTime: number = 0;

  private finishCrossfade(): void {
    if (!this.activeCrossfade) return;

    const { outgoing, incoming } = this.activeCrossfade;
    this.stopTransition();
    outgoing.pause();
    outgoing.currentTime = 0;
    this.setElementVolume(outgoing, 0);
    this.setElementVolume(incoming, this.volume);
    this.activeElement = incoming;
    this.inactiveElement = outgoing;
    this.activeCrossfade = null;
    this.emit('crossfadecomplete', this.currentSong);
  }

  private stopTransition(): void {
    if (this.crossfadeTimer !== null) {
      window.clearInterval(this.crossfadeTimer);
      this.crossfadeTimer = null;
    }

    if (this.activeCrossfade) {
      const { outgoing, incoming } = this.activeCrossfade;
      this.setElementVolume(outgoing, this.volume);
      this.setElementVolume(incoming, this.volume);
      this.activeCrossfade = null;
    }
  }

  private prepareTrack(audioElement: HTMLAudioElement, song: Song, audioUrl?: string): void {
    const resolvedAudioUrl = this.getAudioUrl(song, audioUrl);
    if (resolvedAudioUrl) {
      audioElement.src = resolvedAudioUrl;
      audioElement.load();
    }
    audioElement.currentTime = 0;
  }

  private ensureAudioContext(): void {
    if (typeof window === 'undefined' || typeof AudioContext === 'undefined') {
      return;
    }

    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => undefined);
    }
  }

  private ensureGraph(audioElement: HTMLAudioElement): AudioGraph | null {
    if (this.graphs.has(audioElement)) {
      return this.graphs.get(audioElement) ?? null;
    }

    this.ensureAudioContext();
    if (!this.audioContext) {
      return null;
    }

    try {
      const source = this.audioContext.createMediaElementSource(audioElement);
      const preGain = this.audioContext.createGain();
      const outputGain = this.audioContext.createGain();
      const filters = this.eqBands.map((band) => {
        const filter = this.audioContext!.createBiquadFilter();
        filter.type = 'peaking';
        filter.frequency.value = band.frequency;
        filter.Q.value = 1;
        filter.gain.value = band.gain;
        return filter;
      });

      source.connect(preGain);
      let nextNode: AudioNode = preGain;
      filters.forEach((filter) => {
        nextNode.connect(filter);
        nextNode = filter;
      });
      nextNode.connect(outputGain);
      outputGain.connect(this.audioContext.destination);

      // Analizador FFT real para Party Mode. Es un "tap" paralelo: recibe
      // la misma señal que sale por outputGain pero no se conecta a nada
      // más, así que no altera el audio que escucha el usuario.
      const analyser = this.audioContext.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.82;
      outputGain.connect(analyser);

      const graph = { source, preGain, outputGain, filters, analyser };
      this.graphs.set(audioElement, graph);
      this.applyEqualizerPreset();
      this.applyVolumeToGraphs();
      return graph;
    } catch (error) {
      console.warn('Web Audio graph unavailable:', error);
      return null;
    }
  }

  private applyEqualizerPreset(): void {
    this.graphs.forEach((graph) => {
      const gains = this.eqPresets[this.currentPreset];
      graph.filters.forEach((filter, index) => {
        filter.gain.value = gains[index] ?? 0;
      });
    });
  }

  private applyVolumeToGraphs(): void {
    this.graphs.forEach((graph) => {
      graph.outputGain.gain.value = this.volume;
    });
  }

  private setElementVolume(audioElement: HTMLAudioElement, volume: number): void {
    const normalized = Math.max(0, Math.min(volume, 1));
    audioElement.volume = normalized;
    const graph = this.graphs.get(audioElement);
    if (graph) {
      graph.outputGain.gain.value = normalized;
    }
  }

  private addToHistory(song: Song): void {
    if (!song.id || this.history.some((entry) => entry.id === song.id)) {
      return;
    }

    this.history.push(song);
    if (this.history.length > 25) {
      this.history.shift();
    }
  }

  private dequeueNextSong(): Song | null {
    if (this.priorityQueue.length > 0) {
      return this.priorityQueue.shift() ?? null;
    }

    if (this.queue.length > 0) {
      return this.queue.shift() ?? null;
    }

    const fallbackMood = this.currentSong?.mood ?? 'chill';
    const fallbackSong = aiEngine.recommendSong(fallbackMood, this.history);
    return fallbackSong;
  }

  private handleTimeUpdate(): void {
    const target = this.activeElement ?? this.primaryAudioElement;
    if (!target) return;
    this.currentTime = target.currentTime;
    this.emit('timeupdate', this.currentTime);
  }

  private handleMetadata(): void {
    const target = this.activeElement ?? this.primaryAudioElement;
    if (!target) return;
    this.duration = target.duration || 0;
    this.emit('loadedmetadata', this.duration);
  }

  private handleSongEnd(): void {
    const nextSong = this.dequeueNextSong();
    if (nextSong) {
      this.play(nextSong);
      return;
    }

    this.emit('ended');
  }

  // Event system
  private emit(event: string, data?: unknown): void {
    const handlers = this.listeners.get(event) || [];
    handlers.forEach((handler) => handler(data));
  }

  public on(event: string, handler: (data?: unknown) => void): () => void {
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

  public off(event: string, handler: (data?: unknown) => void): void {
    const handlers = this.listeners.get(event) || [];
    const index = handlers.indexOf(handler);
    if (index > -1) handlers.splice(index, 1);
  }
}

export const playerEngine = new PlayerEngine();
