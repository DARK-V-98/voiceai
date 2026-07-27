/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GeneratedAudioItem } from '../types';

const DB_NAME = 'AIVoiceStudioDB';
const DB_VERSION = 1;
const STORE_NAME = 'audio_history';
const LEGACY_STORAGE_KEY = 'ai_voice_studio_history_v1';

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        reject(new Error('IndexedDB is not supported in this browser.'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = (event) => {
        console.error('IndexedDB error:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }
  return dbPromise;
}

/**
 * Migrate legacy items from localStorage to IndexedDB to free up quota.
 */
async function migrateLegacyStorage(): Promise<void> {
  try {
    const saved = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (saved) {
      const parsed: GeneratedAudioItem[] = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const db = await getDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        for (const item of parsed) {
          store.put(item);
        }
        await new Promise((resolve) => {
          tx.oncomplete = resolve;
          tx.onerror = resolve; // Continue even if duplicate id
        });
      }
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      console.log('Successfully migrated localStorage history to IndexedDB and cleared quota.');
    }
  } catch (e) {
    console.warn('Notice: Could not migrate legacy storage:', e);
  }
}

export async function loadHistoryFromDB(): Promise<GeneratedAudioItem[]> {
  try {
    await migrateLegacyStorage();
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('timestamp');
      const request = index.openCursor(null, 'prev'); // Sort descending by timestamp

      const results: GeneratedAudioItem[] = [];
      request.onsuccess = (event) => {
        const cursor = request.result;
        if (cursor) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.warn('IndexedDB unavailable, checking localStorage fallback:', e);
    try {
      const saved = localStorage.getItem(LEGACY_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }
}

export async function saveItemToDB(item: GeneratedAudioItem): Promise<void> {
  try {
    const db = await getDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.warn('IndexedDB save failed, using safe localStorage fallback:', e);
    // Safe fallback to localStorage without throwing QuotaExceededError
    try {
      const existing = localStorage.getItem(LEGACY_STORAGE_KEY);
      const parsed: GeneratedAudioItem[] = existing ? JSON.parse(existing) : [];
      const updated = [item, ...parsed.filter((i) => i.id !== item.id)];
      
      // Try saving; if quota exceeded, keep trimming until it fits
      let trimCount = updated.length;
      while (trimCount > 0) {
        try {
          localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(updated.slice(0, trimCount)));
          break;
        } catch (err: any) {
          if (err.name === 'QuotaExceededError' || err.message?.includes('quota') || trimCount > 1) {
            trimCount -= 1; // Drop oldest item and try again
          } else {
            break;
          }
        }
      }
    } catch (fallbackErr) {
      console.error('Storage save error:', fallbackErr);
    }
  }
}

export async function deleteItemFromDB(id: string): Promise<void> {
  try {
    const db = await getDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    try {
      const existing = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (existing) {
        const parsed: GeneratedAudioItem[] = JSON.parse(existing);
        const filtered = parsed.filter((i) => i.id !== id);
        localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(filtered));
      }
    } catch (err) {
      console.error('Delete fallback error:', err);
    }
  }
}

export async function clearAllFromDB(): Promise<void> {
  try {
    const db = await getDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    try {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch (err) {
      console.error('Clear fallback error:', err);
    }
  }
}
