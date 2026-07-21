import React, { useState, useEffect, useMemo, useRef } from 'react';
import { hbgCore } from '../core/hbgCore';
import { moodEngine } from '../core/moodEngine';
import { getState, subscribe, Mood } from '../core/vibraState';
import { subscribeToCatalogEvents } from '../core/eventBus';
import { autoDJ } from '../core/autodj';
import { musicCatalog, type LibraryTrack } from '../core/musicCatalog';
import { memoryEngine, type PlaybackInteraction } from '../core/memoryEngine';
import { scanAndImportFiles, SUPPORTED_AUDIO_EXTENSIONS, type ScanProgress, type ScanSummary } from '../core/libraryScanner';

interface Playlist {
  id: string;
  name: string;
  trackIds: string[];
}

type FilterField = 'all' | 'title' | 'artist' | 'album' | 'genre' | 'mood';
type SmartPlaylistId = 'favorites' | 'most-played' | 'recently-added' | 'mood';

const DEFAULT_LIBRARY_TRACKS: LibraryTrack[] = [
  {
    id: 'library-track-chill-1',
    title: 'Midnight Drift',
    artist: 'Luna Vale',
    mood: 'chill',
    duration: 214,
    vibeLevel: 82,
    album: 'Night Bloom',
    genre: 'ambient',
    tags: ['dreamy', 'late-night'],
    playCount: 4,
    addedAt: Date.now(),
    favorite: true,
  },
  {
    id: 'library-track-energy-1',
    title: 'Neon Pulse',
    artist: 'Kai Flux',
    mood: 'energy',
    duration: 196,
    vibeLevel: 88,
    album: 'Electric City',
    genre: 'electro',
    tags: ['uplifting', 'drive'],
    playCount: 7,
    addedAt: Date.now(),
    favorite: false,
  },
  {
    id: 'library-track-sad-1',
    title: 'Velvet Rain',
    artist: 'Mina Sol',
    mood: 'sad',
    duration: 231,
    vibeLevel: 74,
    album: 'Afterglow',
    genre: 'indie',
    tags: ['melancholic', 'soft'],
    playCount: 2,
    addedAt: Date.now(),
    favorite: true,
  },
  {
    id: 'library-track-party-1',
    title: 'After Hours',
    artist: 'Nova Pulse',
    mood: 'party',
    duration: 182,
    vibeLevel: 91,
    album: 'Festival Lights',
    genre: 'house',
    tags: ['night', 'party'],
    playCount: 9,
    addedAt: Date.now(),
    favorite: false,
  },
];

const formatDuration = (duration: number): string => {
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const formatTimestamp = (timestamp: number): string => {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getCoverEmoji = (mood: Mood): string => {
  switch (mood) {
    case 'energy':
      return '⚡';
    case 'sad':
      return '💜';
    case 'party':
      return '🎉';
    default:
      return '🎵';
  }
};

export const MoodPanel: React.FC = () => {
  const [currentMood, setCurrentMood] = useState(getState().currentMood);
  const [catalogVersion, setCatalogVersion] = useState(0);
  const [predictiveQueue, setPredictiveQueue] = useState(autoDJ.getUpcomingSongs(4));
  const [recommendedTrack, setRecommendedTrack] = useState<LibraryTrack | null>(null);
  const [libraryTracks, setLibraryTracks] = useState<LibraryTrack[]>([]);
  const [libraryQuery, setLibraryQuery] = useState('');
  const [libraryFilterField, setLibraryFilterField] = useState<FilterField>('all');
  const [favoriteTrackIds, setFavoriteTrackIds] = useState<string[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>('');
  const [playlistName, setPlaylistName] = useState('');
  const [smartPlaylistId, setSmartPlaylistId] = useState<SmartPlaylistId>('favorites');
  const [historyEntries, setHistoryEntries] = useState<PlaybackInteraction[]>([]);
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'done'>('idle');
  const [scanProgress, setScanProgress] = useState<ScanProgress | null>(null);
  const [scanSummary, setScanSummary] = useState<ScanSummary | null>(null);
  const scanInputRef = useRef<HTMLInputElement>(null);
  const moods = moodEngine.getAvailableMoods();

  useEffect(() => {
    const unsubscribe = subscribe((state) => {
      setCurrentMood(state.currentMood);
      setHistoryEntries(memoryEngine.getPlaybackInteractions().slice(0, 8));
    });

    const handleCatalogRefresh = () => {
      setCatalogVersion((value) => value + 1);
      setLibraryTracks(musicCatalog.getTracks());
      setFavoriteTrackIds(memoryEngine.getFavorites().map((track) => track.id));
      setPredictiveQueue(autoDJ.getUpcomingSongs(4));
      setRecommendedTrack(autoDJ.getRecommendedTrack() as LibraryTrack | null);
      setHistoryEntries(memoryEngine.getPlaybackInteractions().slice(0, 8));
    };

    const bootstrapLibrary = async () => {
      await musicCatalog.hydrateFromStorage();
      const currentTracks = musicCatalog.getTracks();
      if (currentTracks.length === 0) {
        musicCatalog.addTracks(DEFAULT_LIBRARY_TRACKS);
      }
      setLibraryTracks(musicCatalog.getTracks());
      setFavoriteTrackIds(memoryEngine.getFavorites().map((track) => track.id));
      setHistoryEntries(memoryEngine.getPlaybackInteractions().slice(0, 8));
    };

    void bootstrapLibrary();
    const unsubscribeCatalog = subscribeToCatalogEvents(handleCatalogRefresh);

    return () => {
      unsubscribe();
      unsubscribeCatalog();
    };
  }, []);

  const handleMoodChange = (mood: Mood) => {
    hbgCore.changeMood(mood);
    setPredictiveQueue(autoDJ.getUpcomingSongs(4));
    setRecommendedTrack(autoDJ.getRecommendedTrack() as LibraryTrack | null);
  };

  const activeConfig = useMemo(() => moodEngine.getMoodConfig(currentMood), [currentMood]);

  const visibleLibraryTracks = useMemo(() => {
    const normalizedQuery = libraryQuery.trim().toLowerCase();
    const baseTracks = normalizedQuery ? musicCatalog.search(normalizedQuery) : libraryTracks;

    if (libraryFilterField === 'all') {
      return baseTracks;
    }

    return baseTracks.filter((track) => {
      const value = track[libraryFilterField as keyof LibraryTrack];
      if (typeof value === 'string') {
        return value.toLowerCase().includes(normalizedQuery || value.toLowerCase());
      }
      return false;
    });
  }, [libraryFilterField, libraryQuery, libraryTracks]);

  useEffect(() => {
    const nextQueue = autoDJ.getUpcomingSongs(4);
    setPredictiveQueue(nextQueue);
    setRecommendedTrack(autoDJ.getRecommendedTrack() as LibraryTrack | null);
    setHistoryEntries(memoryEngine.getPlaybackInteractions().slice(0, 8));
  }, [currentMood, catalogVersion]);

  const handleTrackPlay = (track: LibraryTrack) => {
    hbgCore.play(track);
  };

  const handleTrackRemove = (trackId: string) => {
    musicCatalog.removeTrack(trackId);
    setLibraryTracks(musicCatalog.getTracks());
    setFavoriteTrackIds(memoryEngine.getFavorites().map((track) => track.id));
    setPlaylists((current) =>
      current.map((playlist) => ({
        ...playlist,
        trackIds: playlist.trackIds.filter((id) => id !== trackId),
      })),
    );
  };

  const handleScanButtonClick = () => {
    scanInputRef.current?.click();
  };

  const handleFilesSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList || fileList.length === 0) {
      return;
    }

    const files = Array.from(fileList);
    setScanStatus('scanning');
    setScanSummary(null);
    setScanProgress({ total: files.length, processed: 0, added: 0, duplicates: 0, failed: 0 });

    try {
      const summary = await scanAndImportFiles(files, (progress) => {
        setScanProgress(progress);
      });
      setScanSummary(summary);
      setLibraryTracks(musicCatalog.getTracks());
    } catch (error) {
      console.error('Error al escanear música:', error);
      setScanSummary({ total: files.length, added: 0, duplicates: 0, failed: files.length });
    } finally {
      setScanStatus('done');
      // Permite volver a seleccionar los mismos archivos si el usuario repite el escaneo.
      event.target.value = '';
    }
  };

  const handleTrackFavoriteToggle = (track: LibraryTrack) => {
    const isFavorite = favoriteTrackIds.includes(track.id);
    if (isFavorite) {
      memoryEngine.removeFromFavorites(track.id);
    } else {
      memoryEngine.addToFavorites(track);
    }

    setFavoriteTrackIds(memoryEngine.getFavorites().map((favoriteTrack) => favoriteTrack.id));
  };

  const handleCreatePlaylist = () => {
    const name = playlistName.trim();
    if (!name) {
      return;
    }

    const newPlaylist: Playlist = {
      id: `playlist-${Date.now()}`,
      name,
      trackIds: [],
    };

    setPlaylists((current) => [newPlaylist, ...current]);
    setSelectedPlaylistId(newPlaylist.id);
    setPlaylistName('');
  };

  const handleRenamePlaylist = (playlistId: string) => {
    const target = playlists.find((playlist) => playlist.id === playlistId);
    if (!target) {
      return;
    }

    const nextName = window.prompt('Rename playlist', target.name);
    if (!nextName) {
      return;
    }

    setPlaylists((current) =>
      current.map((playlist) => (playlist.id === playlistId ? { ...playlist, name: nextName.trim() } : playlist)),
    );
  };

  const handleDeletePlaylist = (playlistId: string) => {
    setPlaylists((current) => current.filter((playlist) => playlist.id !== playlistId));
    if (selectedPlaylistId === playlistId) {
      setSelectedPlaylistId('');
    }
  };

  const handleAddTrackToPlaylist = (playlistId: string, trackId: string) => {
    setPlaylists((current) =>
      current.map((playlist) => {
        if (playlist.id !== playlistId) {
          return playlist;
        }

        if (playlist.trackIds.includes(trackId)) {
          return playlist;
        }

        return { ...playlist, trackIds: [...playlist.trackIds, trackId] };
      }),
    );
  };

  const handleRemoveTrackFromPlaylist = (playlistId: string, trackId: string) => {
    setPlaylists((current) =>
      current.map((playlist) =>
        playlist.id === playlistId ? { ...playlist, trackIds: playlist.trackIds.filter((id) => id !== trackId) } : playlist,
      ),
    );
  };

  const selectedPlaylist = playlists.find((playlist) => playlist.id === selectedPlaylistId) ?? null;
  const selectedPlaylistTracks = useMemo(() => {
    if (!selectedPlaylist) {
      return [] as LibraryTrack[];
    }

    return selectedPlaylist.trackIds
      .map((trackId) => libraryTracks.find((track) => track.id === trackId))
      .filter((track): track is LibraryTrack => Boolean(track));
  }, [libraryTracks, selectedPlaylist]);

  const smartPlaylistTracks = useMemo(() => {
    if (smartPlaylistId === 'favorites') {
      return libraryTracks.filter((track) => favoriteTrackIds.includes(track.id));
    }

    if (smartPlaylistId === 'most-played') {
      return musicCatalog.querySmartPlaylists({ minPlayCount: 1 }, 6);
    }

    if (smartPlaylistId === 'recently-added') {
      return musicCatalog.querySmartPlaylists({}, 6);
    }

    return musicCatalog.querySmartPlaylists({ mood: currentMood }, 6);
  }, [currentMood, favoriteTrackIds, libraryTracks, smartPlaylistId]);

  const smartPlaylistConfig: Record<SmartPlaylistId, { label: string; description: string }> = {
    favorites: { label: 'Favorites', description: 'Pinned tracks' },
    'most-played': { label: 'Most played', description: 'High replay value' },
    'recently-added': { label: 'Recently added', description: 'Fresh picks' },
    mood: { label: `Mood: ${currentMood}`, description: 'Best fit for the active mood' },
  };

  return (
    <div className="mood-panel">
      <div className="mood-status-card">
        <div>
          <p className="mood-status-label">Active mood</p>
          <h2>{activeConfig.name}</h2>
        </div>
        <div className="mood-status-pill" style={{ color: activeConfig.color }}>
          {activeConfig.emoji} {activeConfig.tempo} BPM
        </div>
      </div>

      <div className="mood-grid">
        {moods.map((mood) => {
          const config = moodEngine.getMoodConfig(mood);
          const isActive = currentMood === mood;

          return (
            <button
              key={mood}
              className={`mood-btn ${isActive ? 'active' : ''}`}
              onClick={() => handleMoodChange(mood)}
              style={{
                borderColor: config.color,
                backgroundColor: isActive ? config.color : 'transparent',
              }}
              title={config.description}
            >
              <div className="mood-emoji">{config.emoji}</div>
              <div className="mood-name">{config.name}</div>
              <div className="mood-tempo">♪ {config.tempo} BPM</div>
            </button>
          );
        })}
      </div>

      <div className="predictive-track-card">
        <div className="predictive-track-header">
          <span>AutoDJ</span>
          <small>Catalog sync {catalogVersion}</small>
        </div>
        <div className="predictive-track-list">
          {recommendedTrack ? (
            <div className="predictive-track-item featured">
              <strong>Recommended now</strong>
              <span>{recommendedTrack.title} · {recommendedTrack.artist}</span>
            </div>
          ) : (
            <div className="predictive-track-empty">No recommendation yet. Start playback to seed the queue.</div>
          )}
          {predictiveQueue.length > 0 ? (
            predictiveQueue.map((song) => (
              <div key={song.id} className="predictive-track-item">
                <strong>{song.title}</strong>
                <span>{song.artist}</span>
              </div>
            ))
          ) : (
            <div className="predictive-track-empty">No upcoming songs yet.</div>
          )}
        </div>
      </div>

      <div className="library-panel">
        <input
          ref={scanInputRef}
          type="file"
          multiple
          accept={`${SUPPORTED_AUDIO_EXTENSIONS.join(',')},audio/*`}
          onChange={handleFilesSelected}
          className="scan-music-input"
          aria-hidden="true"
        />

        <button
          type="button"
          className="scan-music-btn"
          onClick={handleScanButtonClick}
          disabled={scanStatus === 'scanning'}
        >
          {scanStatus === 'scanning' ? 'Escaneando…' : '🎵 Escanear música'}
        </button>

        {scanStatus === 'scanning' && scanProgress && (
          <div className="scan-progress-panel">
            <div className="scan-progress-bar">
              <div
                className="scan-progress-fill"
                style={{
                  width: scanProgress.total > 0 ? `${(scanProgress.processed / scanProgress.total) * 100}%` : '0%',
                }}
              />
            </div>
            <div className="scan-progress-status">
              <span>
                {scanProgress.processed} / {scanProgress.total} canciones encontradas
              </span>
              {scanProgress.currentFileName && <span className="scan-progress-file">{scanProgress.currentFileName}</span>}
            </div>
          </div>
        )}

        {scanStatus === 'done' && scanSummary && (
          <div className="scan-summary-panel">
            <strong>Escaneo completado</strong>
            <span>{scanSummary.added} canciones agregadas</span>
            {scanSummary.duplicates > 0 && <span>{scanSummary.duplicates} duplicadas omitidas</span>}
            {scanSummary.failed > 0 && <span>{scanSummary.failed} no se pudieron importar</span>}
            <button type="button" className="scan-summary-dismiss" onClick={() => setScanStatus('idle')}>
              Cerrar
            </button>
          </div>
        )}

        <div className="library-panel-header">
          <div>
            <p className="mood-status-label">Library</p>
            <h3>Music library</h3>
          </div>
          <span className="library-count">{libraryTracks.length} songs</span>
        </div>

        <div className="library-search-row">
          <label className="library-search" htmlFor="library-search-input">
            <span className="library-search-icon">🔎</span>
            <input
              id="library-search-input"
              type="text"
              value={libraryQuery}
              onChange={(event) => setLibraryQuery(event.target.value)}
              placeholder="Search by title, artist, album, genre or mood"
            />
          </label>
          <select
            className="library-filter-select"
            value={libraryFilterField}
            onChange={(event) => setLibraryFilterField(event.target.value as FilterField)}
          >
            <option value="all">All fields</option>
            <option value="title">Title</option>
            <option value="artist">Artist</option>
            <option value="album">Album</option>
            <option value="genre">Genre</option>
            <option value="mood">Mood</option>
          </select>
        </div>

        <div className="library-stack">
          <div className="library-section-card">
            <div className="library-section-title-row">
              <h4>Smart playlists</h4>
              <span>{smartPlaylistConfig[smartPlaylistId].description}</span>
            </div>
            <div className="library-pill-row">
              {Object.entries(smartPlaylistConfig).map(([id, config]) => (
                <button
                  key={id}
                  className={`library-pill ${smartPlaylistId === id ? 'active' : ''}`}
                  onClick={() => setSmartPlaylistId(id as SmartPlaylistId)}
                >
                  {config.label}
                </button>
              ))}
            </div>
            <div className="library-list compact">
              {smartPlaylistTracks.length > 0 ? (
                smartPlaylistTracks.map((track) => (
                  <div key={track.id} className="library-mini-card">
                    <strong>{track.title}</strong>
                    <span>{track.artist}</span>
                  </div>
                ))
              ) : (
                <div className="predictive-track-empty">No smart playlist results yet.</div>
              )}
            </div>
          </div>

          <div className="library-section-card">
            <div className="library-section-title-row">
              <h4>Playlists</h4>
              <span>{selectedPlaylist ? selectedPlaylist.name : 'Pick a playlist'}</span>
            </div>
            <div className="library-playlist-create">
              <input
                type="text"
                value={playlistName}
                onChange={(event) => setPlaylistName(event.target.value)}
                placeholder="Create playlist"
              />
              <button type="button" onClick={handleCreatePlaylist}>
                Create
              </button>
            </div>
            <div className="library-playlist-list">
              {playlists.length > 0 ? (
                playlists.map((playlist) => (
                  <div key={playlist.id} className={`library-playlist-item ${selectedPlaylistId === playlist.id ? 'active' : ''}`}>
                    <button type="button" className="playlist-select-btn" onClick={() => setSelectedPlaylistId(playlist.id)}>
                      {playlist.name}
                    </button>
                    <div className="library-track-actions compact">
                      <button type="button" className="library-action-btn favorite" onClick={() => handleRenamePlaylist(playlist.id)}>
                        ✏️
                      </button>
                      <button type="button" className="library-action-btn remove" onClick={() => handleDeletePlaylist(playlist.id)}>
                        🗑
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="predictive-track-empty">No playlists yet. Create one to organize your library.</div>
              )}
            </div>
            {selectedPlaylist && (
              <div className="library-playlist-detail">
                <div className="library-section-title-row">
                  <h5>{selectedPlaylist.name}</h5>
                  <span>{selectedPlaylist.trackIds.length} songs</span>
                </div>
                <div className="library-list compact">
                  {selectedPlaylistTracks.length > 0 ? (
                    selectedPlaylistTracks.map((track) => (
                      <div key={track.id} className="library-mini-card">
                        <strong>{track.title}</strong>
                        <button type="button" className="library-action-btn remove" onClick={() => handleRemoveTrackFromPlaylist(selectedPlaylist.id, track.id)}>
                          −
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="predictive-track-empty">Add songs from the library to this playlist.</div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="library-section-card">
            <div className="library-section-title-row">
              <h4>Recent</h4>
              <span>Latest plays</span>
            </div>
            <div className="library-list compact">
              {historyEntries.length > 0 ? (
                historyEntries.map((entry) => (
                  <div key={`${entry.songId}-${entry.timestamp}`} className="library-mini-card">
                    <strong>{entry.songTitle}</strong>
                    <span>{formatTimestamp(entry.timestamp)} · {entry.mood}</span>
                  </div>
                ))
              ) : (
                <div className="predictive-track-empty">No recent songs yet. Start playback to build history.</div>
              )}
            </div>
          </div>
        </div>

        <div className="library-list">
          {visibleLibraryTracks.length > 0 ? (
            visibleLibraryTracks.map((track) => (
              <article key={track.id} className="library-track-card">
                <div className="library-cover">
                  {track.cover ? (
                    <img src={track.cover} alt="" className="library-cover-img" />
                  ) : (
                    getCoverEmoji(track.mood)
                  )}
                </div>
                <div className="library-track-main">
                  <div className="library-track-title-row">
                    <strong>{track.title}</strong>
                    <span>{formatDuration(track.duration)}</span>
                  </div>
                  <div className="library-track-meta">
                    <span>{track.artist}</span>
                    <span>{track.album ?? 'Unknown Album'}</span>
                    <span>{track.genre ?? 'ambient'}</span>
                  </div>
                </div>
                <div className="library-track-actions">
                  <button
                    className="library-action-btn favorite"
                    onClick={() => handleTrackFavoriteToggle(track)}
                    title={favoriteTrackIds.includes(track.id) ? 'Remove favorite' : 'Mark favorite'}
                  >
                    {favoriteTrackIds.includes(track.id) ? '❤️' : '🤍'}
                  </button>
                  <button
                    className="library-action-btn play"
                    onClick={() => handleTrackPlay(track)}
                    title="Play track"
                  >
                    ▶
                  </button>
                  <button
                    className="library-action-btn remove"
                    onClick={() => handleTrackRemove(track.id)}
                    title="Remove track"
                  >
                    🗑
                  </button>
                  <button
                    className="library-action-btn favorite"
                    onClick={() => {
                      if (selectedPlaylistId) {
                        handleAddTrackToPlaylist(selectedPlaylistId, track.id);
                      }
                    }}
                    title={selectedPlaylist ? `Add to ${selectedPlaylist.name}` : 'Select a playlist'}
                    disabled={!selectedPlaylistId}
                  >
                    ➕
                  </button>
                </div>
              </article>
            ))
          ) : (
            <div className="predictive-track-empty">No tracks match your search yet.</div>
          )}
        </div>
      </div>
    </div>
  );
};
