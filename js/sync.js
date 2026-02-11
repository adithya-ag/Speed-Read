/**
 * SYNC MANAGER
 * Coordinates between IndexedDB (local) and Supabase (cloud)
 * Only active when user is signed in. Supabase stores metadata only (no content).
 */

const SyncManager = {
    /**
     * Run full sync: migrate old data, pull remote, push local
     * Returns list of remote docs that need re-upload on this device
     */
    async syncAll() {
        if (!SupabaseClient.user || !SupabaseClient.client) return [];
        if (typeof DB === 'undefined' || !DB.db) return [];

        try {
            await this.migrateFromOldSchema();
            const needsReupload = await this.syncDocumentsDown();
            await this.syncDocumentsUp();
            await this.syncStats();
            return needsReupload;
        } catch (err) {
            console.error('Sync failed:', err);
            return [];
        }
    },

    /**
     * One-time migration: pull old Supabase docs that still have content
     * and save them to IndexedDB
     */
    async migrateFromOldSchema() {
        const migrated = localStorage.getItem('speedReader_migrated');
        if (migrated) return;

        const { data: remoteDocs, error } = await SupabaseClient.getDocuments();
        if (error || !remoteDocs) return;

        for (const rdoc of remoteDocs) {
            // Old schema docs have content but no word_hash
            if (rdoc.content && !rdoc.word_hash) {
                const wordHash = await generateWordHash(rdoc.content);

                // Save to IndexedDB
                const localDoc = {
                    id: crypto.randomUUID(),
                    title: rdoc.title || 'Untitled',
                    content: rdoc.content,
                    wordHash: wordHash,
                    totalWords: rdoc.total_words || rdoc.content.split(/\s+/).length,
                    bookmarkIndex: rdoc.bookmark_index || 0,
                    source: 'upload',
                    createdAt: rdoc.created_at || new Date().toISOString(),
                    lastReadAt: rdoc.last_read_at || new Date().toISOString(),
                    supabaseId: rdoc.id
                };

                // Check if already exists locally
                const existing = await DB.getDocumentByHash(wordHash);
                if (!existing) {
                    await DB.saveDocument(localDoc);
                } else {
                    // Link existing local doc to Supabase
                    existing.supabaseId = rdoc.id;
                    if (rdoc.bookmark_index > existing.bookmarkIndex) {
                        existing.bookmarkIndex = rdoc.bookmark_index;
                    }
                    await DB.saveDocument(existing);
                }

                // Update Supabase record with word_hash
                try {
                    await SupabaseClient.client
                        .from('documents')
                        .update({ word_hash: wordHash })
                        .eq('id', rdoc.id);
                } catch (e) {
                    console.warn('Could not update word_hash on remote:', e);
                }
            }
        }

        localStorage.setItem('speedReader_migrated', 'true');
    },

    /**
     * Pull documents from Supabase, merge with local
     * Returns list of remote docs that need re-upload on this device
     */
    async syncDocumentsDown() {
        const { data: remoteDocs, error } = await SupabaseClient.getDocuments();

        if (error) {
            console.error('Sync: Failed to fetch remote documents:', error);
            return [];
        }

        if (!remoteDocs || remoteDocs.length === 0) {
            console.log('Sync: No remote documents found');
            return [];
        }

        console.log(`Sync: Found ${remoteDocs.length} remote document(s)`);

        const needsReupload = [];

        for (const rdoc of remoteDocs) {
            // Try to find local match by supabaseId first, then wordHash
            let localDoc = null;
            const allLocal = await DB.getAllDocuments();
            localDoc = allLocal.find(d => d.supabaseId === rdoc.id);

            if (!localDoc && rdoc.word_hash) {
                localDoc = await DB.getDocumentByHash(rdoc.word_hash);
            }

            if (localDoc) {
                // Merge: link and take the further-along bookmark
                localDoc.supabaseId = rdoc.id;
                const remoteIndex = rdoc.bookmark_index || 0;
                if (remoteIndex > localDoc.bookmarkIndex) {
                    localDoc.bookmarkIndex = remoteIndex;
                    localDoc.lastReadAt = rdoc.last_read_at || localDoc.lastReadAt;
                }
                // If this was a ghost, convert it to a real doc (keep content if exists)
                if (localDoc.isGhost) {
                    delete localDoc.isGhost;
                }
                await DB.saveDocument(localDoc);
            } else {
                // Remote doc exists but no local content — save as "ghost" document
                // Ghost docs have metadata but no content, shown differently in library
                const ghostDoc = {
                    id: crypto.randomUUID(),
                    title: rdoc.title || 'Untitled',
                    content: '', // No content for ghost
                    wordHash: rdoc.word_hash,
                    totalWords: rdoc.total_words || 0,
                    bookmarkIndex: rdoc.bookmark_index || 0,
                    source: 'sync',
                    createdAt: rdoc.created_at || new Date().toISOString(),
                    lastReadAt: rdoc.last_read_at || new Date().toISOString(),
                    supabaseId: rdoc.id,
                    isGhost: true // Flag to identify ghost documents
                };
                await DB.saveDocument(ghostDoc);
                console.log(`Sync: Created ghost document "${ghostDoc.title}" with ${ghostDoc.bookmarkIndex}/${ghostDoc.totalWords} progress`);
                needsReupload.push({
                    id: rdoc.id,
                    title: rdoc.title,
                    wordHash: rdoc.word_hash,
                    bookmarkIndex: rdoc.bookmark_index || 0,
                    totalWords: rdoc.total_words || 0
                });
            }
        }

        return needsReupload;
    },

    /**
     * Push local documents to Supabase (create new or update progress)
     */
    async syncDocumentsUp() {
        const localDocs = await DB.getAllDocuments();

        for (const doc of localDocs) {
            if (doc.supabaseId) {
                // Already synced — update progress if local is ahead
                await SupabaseClient.saveProgress(
                    doc.supabaseId,
                    doc.bookmarkIndex,
                    doc.totalWords
                );
            } else {
                // Not synced yet — create new
                const { data, error } = await SupabaseClient.saveDocument(
                    doc.title,
                    doc.wordHash,
                    doc.totalWords,
                    doc.bookmarkIndex
                );

                if (data && !error) {
                    doc.supabaseId = data.id;
                    await DB.saveDocument(doc);
                }
            }
        }
    },

    /**
     * Sync a single document's metadata to Supabase
     */
    async syncDocument(localDoc) {
        if (!SupabaseClient.user || !SupabaseClient.client) return;

        if (localDoc.supabaseId) {
            // Update existing
            await SupabaseClient.saveProgress(
                localDoc.supabaseId,
                localDoc.bookmarkIndex,
                localDoc.totalWords
            );
        } else {
            // Create new
            const { data, error } = await SupabaseClient.saveDocument(
                localDoc.title,
                localDoc.wordHash,
                localDoc.totalWords,
                localDoc.bookmarkIndex
            );
            if (data && !error) {
                localDoc.supabaseId = data.id;
                await DB.saveDocument(localDoc);
            }
        }
    },

    /**
     * Sync stats to/from Supabase user_stats table
     */
    async syncStats() {
        try {
            const localStreak = await DB.getStreak();
            const localLifetime = await DB.getLifetimeStats();
            const remoteStats = await SupabaseClient.getUserStats();

            if (remoteStats && remoteStats.data) {
                const remote = remoteStats.data;
                // Merge: take higher values
                if (localStreak) {
                    if (remote.current_streak > localStreak.currentStreak) {
                        localStreak.currentStreak = remote.current_streak;
                        await DB.db.put('meta', localStreak);
                    }
                }
                if (localLifetime) {
                    if (remote.total_words_read > localLifetime.totalWordsRead) {
                        localLifetime.totalWordsRead = remote.total_words_read;
                    }
                    if (remote.total_documents_completed > localLifetime.totalDocumentsCompleted) {
                        localLifetime.totalDocumentsCompleted = remote.total_documents_completed;
                    }
                    await DB.db.put('meta', localLifetime);
                }
            }

            // Push local stats up
            await SupabaseClient.saveUserStats({
                current_streak: localStreak?.currentStreak || 0,
                last_read_date: localStreak?.lastReadDate || null,
                streak_freeze_active: localStreak?.streakFreezeActive || false,
                streak_freeze_used_at: localStreak?.streakFreezeUsedAt || null,
                total_words_read: localLifetime?.totalWordsRead || 0,
                total_documents_completed: localLifetime?.totalDocumentsCompleted || 0
            });
        } catch (err) {
            console.warn('Stats sync failed:', err);
        }
    }
};
