/**
 * SYNC MANAGER
 * Coordinates between IndexedDB (local) and Supabase (cloud)
 * Only active when user is signed in. Supabase stores metadata only (no content).
 */

const SyncManager = {
    /**
     * Run full sync: migrate old data, pull remote, push local
     */
    async syncAll() {
        if (!SupabaseClient.user || !SupabaseClient.client) return;
        if (typeof DB === 'undefined' || !DB.db) return;

        try {
            await this.migrateFromOldSchema();
            await this.syncDocumentsDown();
            await this.syncDocumentsUp();
            await this.syncStats();
        } catch (err) {
            console.error('Sync failed:', err);
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
     */
    async syncDocumentsDown() {
        const { data: remoteDocs, error } = await SupabaseClient.getDocuments();
        if (error || !remoteDocs) return;

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
                await DB.saveDocument(localDoc);
            }
            // If no local match and no content in remote, it's a "needs re-upload" doc
            // We skip it — user needs to re-upload the file on this device
        }
    },

    /**
     * Push local documents that aren't yet synced to Supabase
     */
    async syncDocumentsUp() {
        const localDocs = await DB.getAllDocuments();

        for (const doc of localDocs) {
            if (doc.supabaseId) continue; // Already synced

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
