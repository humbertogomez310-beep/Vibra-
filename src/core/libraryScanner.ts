/**
 * LIBRARY SCANNER
 *
 * Lee los archivos de audio seleccionados por el usuario (botón
 * "🎵 Escanear música"), extrae sus metadatos reales (título, artista,
 * álbum, duración, portada, género) y los integra en la biblioteca
 * EXISTENTE (musicCatalog / HBGCore). No crea un catálogo paralelo:
 * reutiliza musicCatalog.addTracks() y persiste vía libraryDb.
 */

import { parseBlob } from 'music-metadata';
import { musicCatalog, type LibraryTrack } from './musicCatalog';
import { libraryDb } from './libraryDb';
import type { Mood } from './vibraState';

export const SUPPORTED_AUDIO_EXTENSIONS = ['.mp3', '.flac', '.wav', '.ogg', '.aac', '.m4a'];

const SUPPORTED_AUDIO_MIME_TYPES = [
  'audio/mpeg',
  'audio/flac',
  'audio/x-flac',
  'audio/wav',
  'audio/x-wav',
  'audio/wave',
  'audio/ogg',
  'audio/aac',
  'audio/mp4',
  'audio/x-m4a',
  'audio/m4a',
];

export interface ScanProgress {
  total: number;
  processed: number;
  added: number;
  duplicates: number;
  failed: number;
  currentFileName?: string;
}

export interface ScanSummary {
  total: number;
  added: number;
  duplicates: number;
  failed: number;
}

function isSupportedAudioFile(file: File): boolean {
  const lowerName = file.name.toLowerCase();
  const hasSupportedExtension = SUPPORTED_AUDIO_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
  const hasSupportedMime = file.type ? SUPPORTED_AUDIO_MIME_TYPES.includes(file.type) : false;
  return hasSupportedExtension || hasSupportedMime;
}

/** Huella para detectar duplicados: nombre + tamaño + fecha de modificación. */
function buildFingerprint(file: File): string {
  return `${file.name.toLowerCase()}::${file.size}::${file.lastModified}`;
}

function inferTitleFromFileName(fileName: string): string {
  const withoutExtension = fileName.replace(/\.[^/.]+$/, '');
  const cleaned = withoutExtension.replace(/[_-]+/g, ' ').trim();
  return cleaned || fileName;
}

/** Heurística simple de mood a partir del género leído del archivo. */
function inferMoodFromGenre(genre?: string): Mood {
  if (!genre) return 'chill';
  const normalized = genre.toLowerCase();

  if (/(house|edm|dance|techno|trance|party|reggaeton|festival)/.test(normalized)) return 'party';
  if (/(rock|metal|punk|drum|electro|hardcore|hip.?hop|trap)/.test(normalized)) return 'energy';
  if (/(blues|acoustic|piano|sad|soul|ballad|melanch)/.test(normalized)) return 'sad';
  return 'chill';
}

function extractCoverBlob(picture: { data: Uint8Array; format?: string } | undefined): Blob | null {
  if (!picture || !picture.data || picture.data.length === 0) return null;

  try {
    return new Blob([picture.data], { type: picture.format || 'image/jpeg' });
  } catch {
    return null;
  }
}

async function buildTrackFromFile(file: File): Promise<{ track: LibraryTrack; coverBlob: Blob | null }> {
  const id = `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const fingerprint = buildFingerprint(file);

  let title = inferTitleFromFileName(file.name);
  let artist = 'Unknown Artist';
  let album: string | undefined;
  let genre: string | undefined;
  let duration = 0;
  let coverBlob: Blob | null = null;

  try {
    const metadata = await parseBlob(file, { skipCovers: false, duration: true });
    title = metadata.common.title?.trim() || title;
    artist = metadata.common.artist?.trim() || metadata.common.albumartist?.trim() || artist;
    album = metadata.common.album?.trim() || undefined;
    genre = metadata.common.genre?.[0]?.trim() || undefined;
    duration = metadata.format.duration ? Math.round(metadata.format.duration) : 0;
    coverBlob = extractCoverBlob(metadata.common.picture?.[0]);
  } catch (error) {
    // No bloquea la importación: el archivo se agrega igual con datos básicos.
    console.warn(`No se pudieron leer los metadatos de "${file.name}":`, error);
  }

  const track: LibraryTrack = {
    id,
    title,
    artist,
    mood: inferMoodFromGenre(genre),
    duration,
    vibeLevel: 60,
    album,
    genre,
    tags: [],
    bpm: 120,
    playCount: 0,
    addedAt: Date.now(),
    favorite: false,
    fingerprint,
    hasAudio: true,
    hasCover: Boolean(coverBlob),
    audioUrl: URL.createObjectURL(file),
    cover: coverBlob ? URL.createObjectURL(coverBlob) : undefined,
  };

  return { track, coverBlob };
}

/**
 * Escanea los archivos seleccionados, extrae metadatos, omite duplicados
 * ya presentes en la biblioteca y agrega el resto a musicCatalog
 * (persistido automáticamente vía HBGCore/memoryEngine → IndexedDB).
 */
export async function scanAndImportFiles(
  files: File[],
  onProgress?: (progress: ScanProgress) => void,
): Promise<ScanSummary> {
  const supportedFiles = files.filter(isSupportedAudioFile);

  const inMemoryFingerprints = new Set(
    musicCatalog
      .getTracks()
      .map((track) => track.fingerprint)
      .filter((value): value is string => Boolean(value)),
  );
  const persistedFingerprints = await libraryDb.getExistingFingerprints();
  const knownFingerprints = new Set([...inMemoryFingerprints, ...persistedFingerprints]);

  const summary: ScanSummary = { total: supportedFiles.length, added: 0, duplicates: 0, failed: 0 };
  const newTracks: LibraryTrack[] = [];

  for (let index = 0; index < supportedFiles.length; index += 1) {
    const file = supportedFiles[index];
    const fingerprint = buildFingerprint(file);

    onProgress?.({
      total: supportedFiles.length,
      processed: index,
      added: summary.added,
      duplicates: summary.duplicates,
      failed: summary.failed,
      currentFileName: file.name,
    });

    if (knownFingerprints.has(fingerprint)) {
      summary.duplicates += 1;
      continue;
    }

    try {
      const { track, coverBlob } = await buildTrackFromFile(file);
      await libraryDb.putTrackAudio(track.id, file);
      if (coverBlob) {
        await libraryDb.putTrackCover(track.id, coverBlob);
      }
      newTracks.push(track);
      knownFingerprints.add(fingerprint);
      summary.added += 1;
    } catch (error) {
      console.error(`No se pudo importar "${file.name}":`, error);
      summary.failed += 1;
    }
  }

  if (newTracks.length > 0) {
    // Único punto de entrada a la biblioteca: HBGCore/musicCatalog.
    // Esto dispara el evento 'library:tracks:added', que actualiza
    // la UI automáticamente sin recargar la aplicación.
    musicCatalog.addTracks(newTracks);
  }

  onProgress?.({
    total: supportedFiles.length,
    processed: supportedFiles.length,
    added: summary.added,
    duplicates: summary.duplicates,
    failed: summary.failed,
  });

  return summary;
}
