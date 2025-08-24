/**
 * IndexedDB service for storing practice session scores and song data
 */

interface SessionScore {
  id: string;
  songName: string;
  songHash: string; // Hash of song content for identification
  timestamp: number;
  duration: number; // Session duration in ms
  gameMode: 'practice' | 'score';
  
  // Score details
  totalScore: number;
  accuracy: number;
  stars: number;
  
  // Detailed stats
  totalNotes: number;
  hitNotes: number;
  perfectHits: number;
  goodHits: number;
  earlyHits: number;
  lateHits: number;
  missedNotes: number;
  extraNotes: number;
  maxStreak: number;
  
  // Metadata
  device?: string; // MIDI device used
  tempo?: number; // BPM during practice
}

interface SongData {
  id: string;
  name: string;
  hash: string;
  fileData: ArrayBuffer;
  metadata: {
    artist?: string;
    album?: string;
    tracks: number;
    duration?: number;
  };
  lastPlayed: number;
  playCount: number;
  bestScore?: SessionScore;
  averageAccuracy?: number;
}

class ScoreStorageService {
  private dbName = 'AlphaDrumsDB';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create stores if they don't exist
        if (!db.objectStoreNames.contains('scores')) {
          const scoresStore = db.createObjectStore('scores', { keyPath: 'id' });
          scoresStore.createIndex('songHash', 'songHash', { unique: false });
          scoresStore.createIndex('timestamp', 'timestamp', { unique: false });
          scoresStore.createIndex('gameMode', 'gameMode', { unique: false });
        }

        if (!db.objectStoreNames.contains('songs')) {
          const songsStore = db.createObjectStore('songs', { keyPath: 'id' });
          songsStore.createIndex('hash', 'hash', { unique: true });
          songsStore.createIndex('name', 'name', { unique: false });
          songsStore.createIndex('lastPlayed', 'lastPlayed', { unique: false });
        }
      };
    });
  }

  private ensureDB(): IDBDatabase {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.');
    }
    return this.db;
  }

  // Song management
  async saveSong(songData: Omit<SongData, 'id' | 'lastPlayed' | 'playCount'>): Promise<string> {
    const db = this.ensureDB();
    const id = `song_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const song: SongData = {
      ...songData,
      id,
      lastPlayed: Date.now(),
      playCount: 0,
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['songs'], 'readwrite');
      const store = transaction.objectStore('songs');
      const request = store.add(song);

      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(new Error('Failed to save song'));
    });
  }

  async getSong(id: string): Promise<SongData | null> {
    const db = this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['songs'], 'readonly');
      const store = transaction.objectStore('songs');
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(new Error('Failed to get song'));
    });
  }

  async getSongByHash(hash: string): Promise<SongData | null> {
    const db = this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['songs'], 'readonly');
      const store = transaction.objectStore('songs');
      const index = store.index('hash');
      const request = index.get(hash);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(new Error('Failed to get song by hash'));
    });
  }

  async getAllSongs(): Promise<SongData[]> {
    const db = this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['songs'], 'readonly');
      const store = transaction.objectStore('songs');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('Failed to get all songs'));
    });
  }

  async updateSongPlayCount(songId: string): Promise<void> {
    const db = this.ensureDB();
    const song = await this.getSong(songId);
    
    if (!song) {
      throw new Error('Song not found');
    }

    song.playCount += 1;
    song.lastPlayed = Date.now();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['songs'], 'readwrite');
      const store = transaction.objectStore('songs');
      const request = store.put(song);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to update song play count'));
    });
  }

  // Score management
  async saveScore(score: Omit<SessionScore, 'id'>): Promise<string> {
    const db = this.ensureDB();
    const id = `score_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const sessionScore: SessionScore = {
      ...score,
      id,
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['scores'], 'readwrite');
      const store = transaction.objectStore('scores');
      const request = store.add(sessionScore);

      request.onsuccess = () => {
        // Update song's best score if this is better
        this.updateSongBestScore(score.songHash, sessionScore);
        resolve(id);
      };
      request.onerror = () => reject(new Error('Failed to save score'));
    });
  }

  private async updateSongBestScore(songHash: string, newScore: SessionScore): Promise<void> {
    try {
      const song = await this.getSongByHash(songHash);
      if (!song) return;

      // Update best score if this is better (higher total score)
      if (!song.bestScore || newScore.totalScore > song.bestScore.totalScore) {
        song.bestScore = newScore;
      }

      // Update average accuracy
      const scores = await this.getScoresForSong(songHash);
      const totalAccuracy = scores.reduce((sum, score) => sum + score.accuracy, 0);
      song.averageAccuracy = totalAccuracy / scores.length;

      const db = this.ensureDB();
      const transaction = db.transaction(['songs'], 'readwrite');
      const store = transaction.objectStore('songs');
      store.put(song);
    } catch (error) {
      console.warn('Failed to update song best score:', error);
    }
  }

  async getScore(id: string): Promise<SessionScore | null> {
    const db = this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['scores'], 'readonly');
      const store = transaction.objectStore('scores');
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(new Error('Failed to get score'));
    });
  }

  async getScoresForSong(songHash: string): Promise<SessionScore[]> {
    const db = this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['scores'], 'readonly');
      const store = transaction.objectStore('scores');
      const index = store.index('songHash');
      const request = index.getAll(songHash);

      request.onsuccess = () => {
        const scores = request.result.sort((a, b) => b.timestamp - a.timestamp);
        resolve(scores);
      };
      request.onerror = () => reject(new Error('Failed to get scores for song'));
    });
  }

  async getRecentScores(limit = 10): Promise<SessionScore[]> {
    const db = this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['scores'], 'readonly');
      const store = transaction.objectStore('scores');
      const index = store.index('timestamp');
      const request = index.openCursor(null, 'prev');
      
      const scores: SessionScore[] = [];
      let count = 0;

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor && count < limit) {
          scores.push(cursor.value);
          count++;
          cursor.continue();
        } else {
          resolve(scores);
        }
      };

      request.onerror = () => reject(new Error('Failed to get recent scores'));
    });
  }

  async deleteScore(id: string): Promise<void> {
    const db = this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['scores'], 'readwrite');
      const store = transaction.objectStore('scores');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to delete score'));
    });
  }

  async deleteSong(id: string): Promise<void> {
    const db = this.ensureDB();
    
    // First delete all scores for this song
    const song = await this.getSong(id);
    if (song) {
      const scores = await this.getScoresForSong(song.hash);
      await Promise.all(scores.map(score => this.deleteScore(score.id)));
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['songs'], 'readwrite');
      const store = transaction.objectStore('songs');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to delete song'));
    });
  }

  // Utility functions
  async clearAllData(): Promise<void> {
    const db = this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['songs', 'scores'], 'readwrite');
      
      let completed = 0;
      const checkComplete = () => {
        completed++;
        if (completed === 2) resolve();
      };

      transaction.objectStore('songs').clear().onsuccess = checkComplete;
      transaction.objectStore('scores').clear().onsuccess = checkComplete;
      
      transaction.onerror = () => reject(new Error('Failed to clear data'));
    });
  }

  // Generate a simple hash for song content identification
  static async generateSongHash(fileData: ArrayBuffer): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(new Uint8Array(fileData).toString());
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}

// Export singleton instance
export const scoreStorage = new ScoreStorageService();
export type { SessionScore, SongData };