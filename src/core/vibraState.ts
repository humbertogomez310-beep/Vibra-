/**
 * VIBRA STATE
 * Gestión centralizada del estado de la aplicación
 */

export type Mood = 'chill' | 'energy' | 'sad' | 'party';
export type PlaybackState = 'playing' | 'paused' | 'stopped';

export interface Song {
  id: string;
  title: string;
  artist: string;
  mood: Mood;
  duration: number;
  vibeLevel: number; // 0-100
}

export interface VibraState {
  currentMood: Mood;
  currentSong: Song | null;
  playbackState: PlaybackState;
  queue: Song[];
  history: Song[];
  volume: number; // 0-100
  isAutoPlay: boolean;
}

const initialState: VibraState = {
  currentMood: 'chill',
  currentSong: null,
  playbackState: 'stopped',
  queue: [],
  history: [],
  volume: 75,
  isAutoPlay: false,
};

let state = { ...initialState };
let listeners: ((newState: VibraState) => void)[] = [];

/**
 * Obtener estado actual
 */
export function getState(): VibraState {
  return { ...state };
}

/**
 * Actualizar estado
 */
export function setState(updates: Partial<VibraState>): void {
  state = { ...state, ...updates };
  notifyListeners();
}

/**
 * Suscribirse a cambios de estado
 */
export function subscribe(listener: (newState: VibraState) => void): () => void {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter(l => l !== listener);
  };
}

/**
 * Notificar a los listeners
 */
function notifyListeners(): void {
  listeners.forEach(listener => listener({ ...state }));
}

/**
 * Reset al estado inicial
 */
export function resetState(): void {
  state = { ...initialState };
  notifyListeners();
}
