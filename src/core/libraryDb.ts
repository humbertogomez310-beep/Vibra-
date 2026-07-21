/**
 * LIBRARY DB
 *
 * Persistencia real de la biblioteca musical usando IndexedDB.
 * Los metadatos (título, artista, álbum, etc.) se guardan por separado
 * de los blobs de audio y portada para que las lecturas de metadatos
 * sean rápidas y los binarios pesados solo se carguen cuando se necesitan.
 *
 * Esta es la ÚNICA capa de almacenamiento binario de la biblioteca.
 * No crear un segundo almacén paralelo: memoryEngine delega aquí.
 */

import type { LibraryTrack } from './musicCatalog';

const DB_NAME = 'vibra-pro-library';
const DB_VERSION = 1;
const META_STORE = 'tracks-meta';
const AUDIO_STORE = 'tracks-audio';
const COVER_STORE = 'tracks-cover';

/** Metadatos persistidos. Nunca incluye audioUrl/cover/fileUrl: esas son
 * URLs de blob efímeras, válidas solo durante la sesión actual. */
export type StoredTrackMeta = Omit<LibraryTrack, 'audioUrl' | 'cover' | 'fileUrl'>;

interface AudioRecord {
  id: string;
  blob: Blob;
}

interface CoverRecord {
  id: string;
  blob: Blob;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function isIndexedDbAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';
}

function openDb(): Promise<IDBDatabase> {
  if (!isIndexedDbAvailable()) {
    return Promise.reject(new Error('IndexedDB no está disponible en este entorno'));
  }

  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(META_STORE)) {
        const metaStore = db.createObjectStore(META_STORE, { keyPath: 'id' });
        metaStore.createIndex('fingerprint', 'fingerprint', { unique: false });
      }

      if (!db.objectStoreNames.contains(AUDIO_STORE)) {
        db.createObjectStore(AUDIO_STORE, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(COVER_STORE)) {
        db.createObjectStore(COVER_STORE, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error('No se pudo abrir la base de datos de la biblioteca'));
    request.onblocked = () =>
      reject(new Error('La base de datos de la biblioteca está bloqueada por otra pestaña'));
  });

  return dbPromise;
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Error en la operación de IndexedDB'));
  });
}

function runTransaction<T>(
  storeNames: string[],
  mode: IDBTransactionMode,
  executor: (transaction: IDBTransaction) => Promise<T> | T,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(storeNames, mode);
        let result: T;

        transaction.oncomplete = () => resolve(result);
        transaction.onerror = () =>
          reject(transaction.error ?? new Error('Error de transacción en IndexedDB'));
        transaction.onabort = () =>
          reject(transaction.error ?? new Error('Transacción de IndexedDB abortada'));

        Promise.resolve(executor(transaction))
          .then((value) => {
            result = value;
          })
          .catch(reject);
      }),
  );
}

/** Elimina las URLs de blob efímeras antes de persistir metadatos. */
function sanitizeMeta(track: LibraryTrack): StoredTrackMeta {
  const clone: LibraryTrack = { ...track };
  delete clone.audioUrl;
  delete clone.cover;
  delete clone.fileUrl;
  return clone as StoredTrackMeta;
}

class LibraryDb {
  isAvailable(): boolean {
    return isIndexedDbAvailable();
  }

  async getAllTrackMeta(): Promise<StoredTrackMeta[]> {
    if (!isIndexedDbAvailable()) return [];

    return runTransaction([META_STORE], 'readonly', (transaction) =>
      requestToPromise(transaction.objectStore(META_STORE).getAll() as IDBRequest<StoredTrackMeta[]>),
    );
  }

  async putTracksMeta(tracks: LibraryTrack[]): Promise<void> {
    if (!isIndexedDbAvailable() || tracks.length === 0) return;

    await runTransaction([META_STORE], 'readwrite', (transaction) => {
      const store = transaction.objectStore(META_STORE);
      tracks.forEach((track) => {
        store.put(sanitizeMeta(track));
      });
    });
  }

  async deleteTrack(id: string): Promise<void> {
    if (!isIndexedDbAvailable()) return;

    await runTransaction([META_STORE, AUDIO_STORE, COVER_STORE], 'readwrite', (transaction) => {
      transaction.objectStore(META_STORE).delete(id);
      transaction.objectStore(AUDIO_STORE).delete(id);
      transaction.objectStore(COVER_STORE).delete(id);
    });
  }

  async putTrackAudio(id: string, blob: Blob): Promise<void> {
    if (!isIndexedDbAvailable()) return;

    await runTransaction([AUDIO_STORE], 'readwrite', (transaction) => {
      const record: AudioRecord = { id, blob };
      transaction.objectStore(AUDIO_STORE).put(record);
    });
  }

  async putTrackCover(id: string, blob: Blob): Promise<void> {
    if (!isIndexedDbAvailable()) return;

    await runTransaction([COVER_STORE], 'readwrite', (transaction) => {
      const record: CoverRecord = { id, blob };
      transaction.objectStore(COVER_STORE).put(record);
    });
  }

  async getTrackAudioBlob(id: string): Promise<Blob | null> {
    if (!isIndexedDbAvailable()) return null;

    const record = await runTransaction([AUDIO_STORE], 'readonly', (transaction) =>
      requestToPromise(transaction.objectStore(AUDIO_STORE).get(id) as IDBRequest<AudioRecord | undefined>),
    );

    return record?.blob ?? null;
  }

  async getTrackCoverBlob(id: string): Promise<Blob | null> {
    if (!isIndexedDbAvailable()) return null;

    const record = await runTransaction([COVER_STORE], 'readonly', (transaction) =>
      requestToPromise(transaction.objectStore(COVER_STORE).get(id) as IDBRequest<CoverRecord | undefined>),
    );

    return record?.blob ?? null;
  }

  /** Huellas (fingerprints) de todas las pistas ya importadas, para detectar duplicados. */
  async getExistingFingerprints(): Promise<Set<string>> {
    const allMeta = await this.getAllTrackMeta();
    const fingerprints = new Set<string>();
    allMeta.forEach((meta) => {
      if (meta.fingerprint) {
        fingerprints.add(meta.fingerprint);
      }
    });
    return fingerprints;
  }

  async clearAll(): Promise<void> {
    if (!isIndexedDbAvailable()) return;

    await runTransaction([META_STORE, AUDIO_STORE, COVER_STORE], 'readwrite', (transaction) => {
      transaction.objectStore(META_STORE).clear();
      transaction.objectStore(AUDIO_STORE).clear();
      transaction.objectStore(COVER_STORE).clear();
    });
  }
}

export const libraryDb = new LibraryDb();
