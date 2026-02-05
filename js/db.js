/**
 * INDEXEDDB STORAGE LAYER
 * Local-first persistence using idb (IndexedDB wrapper)
 * This is the single source of truth for all app data
 */

const DB = {
    db: null,
    DB_NAME: 'speedReaderDB',
    DB_VERSION: 1,

    /**
     * Initialize the database
     */
    async init() {
        if (this.db) return;

        if (typeof idb === 'undefined') {
            console.error('idb library not loaded');
            return;
        }

        this.db = await idb.openDB(this.DB_NAME, this.DB_VERSION, {
            upgrade(db) {
                // Documents store
                if (!db.objectStoreNames.contains('documents')) {
                    const docStore = db.createObjectStore('documents', { keyPath: 'id' });
                    docStore.createIndex('wordHash', 'wordHash', { unique: false });
                    docStore.createIndex('lastReadAt', 'lastReadAt', { unique: false });
                    docStore.createIndex('createdAt', 'createdAt', { unique: false });
                }

                // Daily stats store
                if (!db.objectStoreNames.contains('stats')) {
                    db.createObjectStore('stats', { keyPath: 'date' });
                }

                // Meta store (streak, lifetime stats, etc.)
                if (!db.objectStoreNames.contains('meta')) {
                    db.createObjectStore('meta', { keyPath: 'key' });
                }
            }
        });
    },

    // ========== DOCUMENTS ==========

    async saveDocument(doc) {
        if (!this.db) return;
        await this.db.put('documents', doc);
        return doc;
    },

    async getDocument(id) {
        if (!this.db) return null;
        return await this.db.get('documents', id);
    },

    async getAllDocuments() {
        if (!this.db) return [];
        const docs = await this.db.getAll('documents');
        // Sort by lastReadAt descending (most recent first)
        return docs.sort((a, b) => new Date(b.lastReadAt) - new Date(a.lastReadAt));
    },

    async deleteDocument(id) {
        if (!this.db) return;
        await this.db.delete('documents', id);
    },

    async getDocumentByHash(wordHash) {
        if (!this.db) return null;
        return await this.db.getFromIndex('documents', 'wordHash', wordHash);
    },

    async updateProgress(id, bookmarkIndex) {
        if (!this.db || !id) return;
        const doc = await this.db.get('documents', id);
        if (!doc) return;
        doc.bookmarkIndex = bookmarkIndex;
        doc.lastReadAt = new Date().toISOString();
        await this.db.put('documents', doc);
    },

    // ========== STATS ==========

    async recordReadingSession(wordsRead, durationMs, avgWpm, completed) {
        if (!this.db) return;

        const today = new Date().toISOString().split('T')[0];
        let stats = await this.db.get('stats', today);

        if (!stats) {
            stats = {
                date: today,
                wordsRead: 0,
                readingTimeMs: 0,
                sessionsCount: 0,
                avgWpm: 0,
                documentsCompleted: 0
            };
        }

        stats.wordsRead += wordsRead;
        stats.readingTimeMs += durationMs;
        stats.sessionsCount += 1;
        // Running average WPM
        stats.avgWpm = Math.round(
            ((stats.avgWpm * (stats.sessionsCount - 1)) + avgWpm) / stats.sessionsCount
        );
        if (completed) {
            stats.documentsCompleted += 1;
        }

        await this.db.put('stats', stats);

        // Update lifetime stats
        let lifetime = await this.db.get('meta', 'lifetime');
        if (!lifetime) {
            lifetime = { key: 'lifetime', totalWordsRead: 0, totalDocumentsCompleted: 0 };
        }
        lifetime.totalWordsRead += wordsRead;
        if (completed) {
            lifetime.totalDocumentsCompleted += 1;
        }
        await this.db.put('meta', lifetime);
    },

    async getDailyStats(date) {
        if (!this.db) return null;
        return await this.db.get('stats', date);
    },

    async getStatsRange(startDate, endDate) {
        if (!this.db) return [];
        const all = await this.db.getAll('stats');
        return all.filter(s => s.date >= startDate && s.date <= endDate);
    },

    async getLifetimeStats() {
        if (!this.db) return null;
        return await this.db.get('meta', 'lifetime');
    },

    // ========== STREAK ==========

    async getStreak() {
        if (!this.db) return null;
        return await this.db.get('meta', 'streak');
    },

    async updateStreak() {
        if (!this.db) return;

        const today = new Date().toISOString().split('T')[0];
        let streak = await this.db.get('meta', 'streak');

        if (!streak) {
            streak = {
                key: 'streak',
                currentStreak: 1,
                lastReadDate: today,
                streakFreezeActive: false,
                streakFreezeUsedAt: null
            };
            await this.db.put('meta', streak);
            return streak;
        }

        // Already counted today
        if (streak.lastReadDate === today) return streak;

        const lastRead = new Date(streak.lastReadDate);
        const now = new Date(today);
        const diffDays = Math.floor((now - lastRead) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            // Consecutive day — increment
            streak.currentStreak += 1;
        } else if (diffDays === 2 && streak.streakFreezeActive) {
            // Missed 1 day but freeze was active — keep streak, deactivate freeze
            streak.currentStreak += 1;
            streak.streakFreezeActive = false;
        } else {
            // Streak broken
            streak.currentStreak = 1;
        }

        streak.lastReadDate = today;
        await this.db.put('meta', streak);
        return streak;
    },

    async activateStreakFreeze() {
        if (!this.db) return;
        let streak = await this.db.get('meta', 'streak');
        if (!streak) {
            streak = {
                key: 'streak',
                currentStreak: 0,
                lastReadDate: null,
                streakFreezeActive: false,
                streakFreezeUsedAt: null
            };
        }
        streak.streakFreezeActive = true;
        streak.streakFreezeUsedAt = new Date().toISOString();
        await this.db.put('meta', streak);
        return streak;
    },

    // ========== EXPORT / IMPORT ==========

    async exportAll() {
        if (!this.db) return null;
        const documents = await this.db.getAll('documents');
        const stats = await this.db.getAll('stats');
        const meta = await this.db.getAll('meta');
        return {
            version: 1,
            exportedAt: new Date().toISOString(),
            documents,
            stats,
            meta
        };
    },

    async importAll(data) {
        if (!this.db) return;
        if (!data || data.version !== 1) throw new Error('Unsupported backup format');

        const tx = this.db.transaction(['documents', 'stats', 'meta'], 'readwrite');
        const docStore = tx.objectStore('documents');
        const statsStore = tx.objectStore('stats');
        const metaStore = tx.objectStore('meta');

        // Merge documents (skip duplicates by wordHash)
        for (const doc of (data.documents || [])) {
            const existing = await docStore.index('wordHash').get(doc.wordHash);
            if (!existing) {
                doc.supabaseId = null; // clear sync state
                await docStore.put(doc);
            } else if (doc.bookmarkIndex > existing.bookmarkIndex) {
                existing.bookmarkIndex = doc.bookmarkIndex;
                existing.lastReadAt = doc.lastReadAt;
                await docStore.put(existing);
            }
        }

        // Merge stats (take higher values per day)
        for (const stat of (data.stats || [])) {
            const existing = await statsStore.get(stat.date);
            if (!existing) {
                await statsStore.put(stat);
            } else {
                existing.wordsRead = Math.max(existing.wordsRead, stat.wordsRead);
                existing.readingTimeMs = Math.max(existing.readingTimeMs, stat.readingTimeMs);
                existing.sessionsCount = Math.max(existing.sessionsCount, stat.sessionsCount);
                if (stat.documentsCompleted > existing.documentsCompleted) {
                    existing.documentsCompleted = stat.documentsCompleted;
                }
                await statsStore.put(existing);
            }
        }

        // Merge meta (take higher values)
        for (const m of (data.meta || [])) {
            const existing = await metaStore.get(m.key);
            if (!existing) {
                await metaStore.put(m);
            } else if (m.key === 'lifetime') {
                existing.totalWordsRead = Math.max(existing.totalWordsRead, m.totalWordsRead);
                existing.totalDocumentsCompleted = Math.max(existing.totalDocumentsCompleted, m.totalDocumentsCompleted);
                await metaStore.put(existing);
            } else if (m.key === 'streak') {
                if (m.currentStreak > existing.currentStreak) {
                    await metaStore.put(m);
                }
            }
        }

        await tx.done;
    }
};

/**
 * Generate a word hash for document fingerprinting
 * Uses first 50 + last 50 words + total count → SHA-256
 */
async function generateWordHash(text) {
    const words = text.trim().split(/\s+/).filter(w => w.length > 0);
    const first50 = words.slice(0, 50).map(w => w.toLowerCase());
    const last50 = words.slice(-50).map(w => w.toLowerCase());
    const fingerprint = first50.concat(last50).join('|') + '|' + words.length;

    const buffer = new TextEncoder().encode(fingerprint);
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
