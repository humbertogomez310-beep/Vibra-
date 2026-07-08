/**
 * MUSIC CATALOG
 * Index local tracks in-memory for low-latency search and dynamic playlist evaluation.
 */

import { Mood, Song } from './vibraState';
import { memoryEngine } from './memoryEngine';
import { eventBus } from './eventBus';

export interface LibraryTrack extends Song {
  album?: string;
  genre?: string;
  tags?: string[];
  bpm?: number;
  playCount?: number;
  addedAt?: number;
  lastPlayedAt?: number;
  favorite?: boolean;
}

export interface TrackFilterCriteria {
  mood?: Mood | Mood[];
  genre?: string | string[];
  album?: string | string[];
  tags?: string[] | string;
  bpmMin?: number;
  bpmMax?: number;
  minPlayCount?: number;
  maxPlayCount?: number;
  favorite?: boolean;
  query?: string;
}

export interface SmartPlaylistDefinition {
  id: string;
  name: string;
  description: string;
  criteria: TrackFilterCriteria;
  limit?: number;
}

const LIBRARY_TRACK_EVENTS = {
  HYDRATED: 'library:tracks:hydrated',
  ADDED: 'library:tracks:added',
  UPDATED: 'library:tracks:updated',
  REMOVED: 'library:tracks:removed',
} as const;

export class LocalMusicCatalog {
  private tracks: LibraryTrack[] = [];
  private index: Map<string, Set<string>> = new Map();
  private lookup: Map<string, LibraryTrack> = new Map();

  constructor(initialTracks: LibraryTrack[] = []) {
    this.attachEventHandlers();
    this.hydrate(initialTracks);
  }

  hydrate(tracks?: LibraryTrack[]): LibraryTrack[] {
    const source = tracks && tracks.length > 0 ? tracks : memoryEngine.getLibraryTracks();
    this.tracks = source.map((track) => this.normalizeTrack(track));
    this.rebuildIndex();
    eventBus.emit(LIBRARY_TRACK_EVENTS.HYDRATED, this.getTracks());
    return this.getTracks();
  }

  getTracks(): LibraryTrack[] {
    return [...this.tracks];
  }

  search(query: string): LibraryTrack[] {
    const normalizedQuery = this.normalizeToken(query);
    if (!normalizedQuery) {
      return this.sortTracks(this.tracks, { query: '' });
    }

    const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean);
    const matchedIds = new Set<string>();

    queryTokens.forEach((token) => {
      const ids = this.index.get(token);
      if (!ids) {
        return;
      }

      ids.forEach((id) => matchedIds.add(id));
    });

    const results = this.tracks.filter((track) => matchedIds.has(track.id));
    return this.sortTracks(results, { query: normalizedQuery });
  }

  filter(criteria: TrackFilterCriteria): LibraryTrack[] {
    const results = this.tracks.filter((track) => this.matchesCriteria(track, criteria));
    return this.sortTracks(results, criteria);
  }

  createSmartPlaylist(definition: SmartPlaylistDefinition): LibraryTrack[] {
    return this.querySmartPlaylists(definition.criteria, definition.limit ?? 20);
  }

  querySmartPlaylists(criteria: TrackFilterCriteria, limit: number = 20): LibraryTrack[] {
    return this.filter(criteria).slice(0, limit);
  }

  getDefaultSmartPlaylists(): SmartPlaylistDefinition[] {
    return [
      {
        id: 'top-played',
        name: 'Top 20 Most Played',
        description: 'Tracks with the highest playback counts',
        criteria: { minPlayCount: 1 },
        limit: 20,
      },
      {
        id: 'recently-added',
        name: 'Recently Added',
        description: 'Most recently added tracks',
        criteria: {},
        limit: 20,
      },
      {
        id: 'energy-boost',
        name: 'Energy Boost',
        description: 'Energetic tracks with a strong vibe profile',
        criteria: { mood: ['energy', 'party'], bpmMin: 120, minPlayCount: 0 },
        limit: 20,
      },
    ];
  }

  addTracks(tracks: LibraryTrack[]): LibraryTrack[] {
    const nextTracks = [...this.tracks];

    tracks.forEach((track) => {
      const normalized = this.normalizeTrack(track);
      const existingIndex = nextTracks.findIndex((item) => item.id === normalized.id);
      if (existingIndex >= 0) {
        nextTracks[existingIndex] = normalized;
      } else {
        nextTracks.push(normalized);
      }
    });

    this.tracks = nextTracks;
    this.rebuildIndex();
    this.persist();
    eventBus.emit(LIBRARY_TRACK_EVENTS.ADDED, this.getTracks());
    return this.getTracks();
  }

  updateTrack(track: LibraryTrack): LibraryTrack | null {
    const normalized = this.normalizeTrack(track);
    const existingIndex = this.tracks.findIndex((item) => item.id === normalized.id);

    if (existingIndex >= 0) {
      this.tracks[existingIndex] = normalized;
      this.rebuildIndex();
      this.persist();
      eventBus.emit(LIBRARY_TRACK_EVENTS.UPDATED, this.tracks[existingIndex]);
      return this.tracks[existingIndex];
    }

    this.addTracks([normalized]);
    return normalized;
  }

  removeTrack(trackId: string): LibraryTrack | null {
    const existingIndex = this.tracks.findIndex((track) => track.id === trackId);
    if (existingIndex < 0) {
      return null;
    }

    const removedTrack = this.tracks.splice(existingIndex, 1)[0];
    this.rebuildIndex();
    this.persist();
    eventBus.emit(LIBRARY_TRACK_EVENTS.REMOVED, removedTrack);
    return removedTrack;
  }

  recordPlayback(song: Song): LibraryTrack | null {
    const existing = this.lookup.get(song.id);
    if (existing) {
      existing.playCount = (existing.playCount ?? 0) + 1;
      existing.lastPlayedAt = Date.now();
      return this.updateTrack(existing);
    }

    const track = this.normalizeTrack({
      ...song,
      playCount: 1,
      lastPlayedAt: Date.now(),
      addedAt: Date.now(),
    });
    this.addTracks([track]);
    return track;
  }

  private attachEventHandlers(): void {
    eventBus.on(LIBRARY_TRACK_EVENTS.HYDRATED, this.handleTrackIndexRefresh);
    eventBus.on(LIBRARY_TRACK_EVENTS.ADDED, this.handleTrackIndexRefresh);
    eventBus.on(LIBRARY_TRACK_EVENTS.UPDATED, this.handleTrackIndexRefresh);
    eventBus.on(LIBRARY_TRACK_EVENTS.REMOVED, this.handleTrackIndexRefresh);
  }

  private handleTrackIndexRefresh = (): void => {
    this.rebuildIndex();
  };

  private normalizeTrack(track: LibraryTrack): LibraryTrack {
    return {
      ...track,
      album: track.album ?? 'Unknown Album',
      genre: track.genre ?? 'ambient',
      tags: track.tags ?? [],
      bpm: track.bpm ?? 120,
      playCount: track.playCount ?? 0,
      addedAt: track.addedAt ?? Date.now(),
      lastPlayedAt: track.lastPlayedAt ?? undefined,
      favorite: Boolean(track.favorite),
    };
  }

  private rebuildIndex(): void {
    this.index = new Map();
    this.lookup = new Map();

    this.tracks.forEach((track) => {
      this.lookup.set(track.id, track);
      this.getTokens(track).forEach((token) => {
        const bucket = this.index.get(token) ?? new Set<string>();
        bucket.add(track.id);
        this.index.set(token, bucket);
      });
    });
  }

  private getTokens(track: LibraryTrack): string[] {
    const tokens = new Set<string>();
    [track.title, track.artist, track.album, track.genre, track.mood]
      .filter(Boolean)
      .forEach((value) => this.addTokenValue(tokens, value));

    (track.tags ?? []).forEach((tag) => this.addTokenValue(tokens, tag));
    return Array.from(tokens);
  }

  private addTokenValue(tokens: Set<string>, value: string | undefined): void {
    if (!value) {
      return;
    }

    const normalized = this.normalizeToken(value);
    if (normalized) {
      tokens.add(normalized);
    }
  }

  private normalizeToken(value: string): string {
    return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, ' ');
  }

  private matchesCriteria(track: LibraryTrack, criteria: TrackFilterCriteria): boolean {
    if (criteria.query) {
      const tokens = this.normalizeToken(criteria.query).split(/\s+/).filter(Boolean);
      const haystack = this.normalizeToken(`${track.title} ${track.artist} ${track.album ?? ''} ${track.genre ?? ''} ${track.mood}`).split(/\s+/);
      const found = tokens.every((token) => haystack.includes(token));
      if (!found) {
        return false;
      }
    }

    if (criteria.mood) {
      const allowedMoods = Array.isArray(criteria.mood) ? criteria.mood : [criteria.mood];
      if (!allowedMoods.includes(track.mood)) {
        return false;
      }
    }

    if (criteria.genre) {
      const allowedGenres = Array.isArray(criteria.genre) ? criteria.genre : [criteria.genre];
      if (!allowedGenres.map((entry) => this.normalizeToken(entry)).includes(this.normalizeToken(track.genre ?? ''))) {
        return false;
      }
    }

    if (criteria.album) {
      const allowedAlbums = Array.isArray(criteria.album) ? criteria.album : [criteria.album];
      if (!allowedAlbums.map((entry) => this.normalizeToken(entry)).includes(this.normalizeToken(track.album ?? ''))) {
        return false;
      }
    }

    if (criteria.tags) {
      const requiredTags = Array.isArray(criteria.tags) ? criteria.tags : [criteria.tags];
      const trackTags = (track.tags ?? []).map((tag) => this.normalizeToken(tag));
      const match = requiredTags.every((tag) => trackTags.includes(this.normalizeToken(tag)));
      if (!match) {
        return false;
      }
    }

    if (typeof criteria.bpmMin === 'number' && (track.bpm ?? 0) < criteria.bpmMin) {
      return false;
    }

    if (typeof criteria.bpmMax === 'number' && (track.bpm ?? 0) > criteria.bpmMax) {
      return false;
    }

    if (typeof criteria.minPlayCount === 'number' && (track.playCount ?? 0) < criteria.minPlayCount) {
      return false;
    }

    if (typeof criteria.maxPlayCount === 'number' && (track.playCount ?? 0) > criteria.maxPlayCount) {
      return false;
    }

    if (typeof criteria.favorite === 'boolean' && (track.favorite ?? false) !== criteria.favorite) {
      return false;
    }

    return true;
  }

  private sortTracks(tracks: LibraryTrack[], criteria: TrackFilterCriteria): LibraryTrack[] {
    return [...tracks].sort((left, right) => {
      if (criteria.query) {
        const leftScore = this.scoreTrack(left, criteria.query);
        const rightScore = this.scoreTrack(right, criteria.query);
        if (leftScore !== rightScore) {
          return rightScore - leftScore;
        }
      }

      const leftPlayCount = left.playCount ?? 0;
      const rightPlayCount = right.playCount ?? 0;
      if (leftPlayCount !== rightPlayCount) {
        return rightPlayCount - leftPlayCount;
      }

      const leftAdded = left.addedAt ?? 0;
      const rightAdded = right.addedAt ?? 0;
      return rightAdded - leftAdded;
    });
  }

  private scoreTrack(track: LibraryTrack, query: string): number {
    const normalizedQuery = this.normalizeToken(query);
    const haystack = this.normalizeToken(`${track.title} ${track.artist} ${track.album ?? ''} ${track.genre ?? ''} ${track.mood}`).split(/\s+/);
    const matches = normalizedQuery.split(/\s+/).filter(Boolean).filter((token) => haystack.includes(token));
    return matches.length;
  }

  private persist(): void {
    memoryEngine.saveLibraryTracks(this.tracks);
  }
}

export const musicCatalog = new LocalMusicCatalog();
