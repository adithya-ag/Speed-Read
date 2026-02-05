/**
 * SUPABASE CLIENT WRAPPER
 * Handles authentication and cloud sync (metadata only, no content)
 */

const SupabaseClient = {
    client: null,
    user: null,

    /**
     * Initialize Supabase Client
     */
    init() {
        if (!window.supabase) {
            console.error('Supabase library not loaded');
            return;
        }

        if (!SUPABASE_CONFIG.ANON_KEY || SUPABASE_CONFIG.ANON_KEY.includes('PASTE')) {
            console.warn('Supabase Anon Key not configured');
            return;
        }

        this.client = window.supabase.createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.ANON_KEY);

        // Check for existing session
        this.client.auth.getSession().then(({ data: { session } }) => {
            this.updateUser(session?.user ?? null);
        });

        // Listen for auth changes
        this.client.auth.onAuthStateChange((_event, session) => {
            this.updateUser(session?.user ?? null);
        });
    },

    /**
     * Update local user state
     */
    updateUser(user) {
        this.user = user;
        window.dispatchEvent(new CustomEvent('auth:change', { detail: { user } }));
    },

    /**
     * Sign In with Google
     */
    async signInWithGoogle() {
        if (!this.client) return { error: { message: 'Supabase not initialized' } };

        return await this.client.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin
            }
        });
    },

    /**
     * Sign Out
     */
    async signOut() {
        if (!this.client) return;
        return await this.client.auth.signOut();
    },

    // ========== DOCUMENTS (metadata only) ==========

    /**
     * Get All Documents for User (metadata only, no content)
     */
    async getDocuments() {
        if (!this.client) return { error: 'Not initialized' };

        const { data, error } = await this.client
            .from('documents')
            .select('id, title, word_hash, total_words, bookmark_index, created_at, last_read_at, content')
            .order('last_read_at', { ascending: false });

        return { data, error };
    },

    /**
     * Save document metadata (no content stored remotely)
     */
    async saveDocument(title, wordHash, totalWords, bookmarkIndex) {
        if (!this.user || !this.client) return { error: 'Not logged in' };

        const { data, error } = await this.client
            .from('documents')
            .insert([{
                user_id: this.user.id,
                title: title || 'Untitled',
                word_hash: wordHash,
                total_words: totalWords,
                bookmark_index: bookmarkIndex || 0
            }])
            .select()
            .single();

        return { data, error };
    },

    /**
     * Find document by word hash (for cross-device matching)
     */
    async getDocumentByHash(wordHash) {
        if (!this.client) return { data: null, error: 'Not initialized' };

        const { data, error } = await this.client
            .from('documents')
            .select('id, title, word_hash, total_words, bookmark_index, created_at, last_read_at')
            .eq('word_hash', wordHash)
            .single();

        return { data, error };
    },

    /**
     * Save Reading Progress
     */
    async saveProgress(docId, wordIndex, totalWords) {
        if (!this.user || !this.client || !docId) return;

        const { error } = await this.client
            .from('documents')
            .update({
                bookmark_index: wordIndex,
                last_read_at: new Date(),
                total_words: totalWords
            })
            .eq('id', docId);

        if (error) console.error('Error saving progress:', error);
        return { error };
    },

    /**
     * Delete a document
     */
    async deleteDocument(docId) {
        if (!this.user || !this.client) return;

        const { error } = await this.client
            .from('documents')
            .delete()
            .eq('id', docId);

        return { error };
    },

    // ========== USER STATS ==========

    /**
     * Get user stats (streak, lifetime)
     */
    async getUserStats() {
        if (!this.user || !this.client) return { data: null, error: 'Not logged in' };

        const { data, error } = await this.client
            .from('user_stats')
            .select('*')
            .eq('user_id', this.user.id)
            .single();

        return { data, error };
    },

    /**
     * Save/update user stats (upsert)
     */
    async saveUserStats(stats) {
        if (!this.user || !this.client) return { error: 'Not logged in' };

        const { data, error } = await this.client
            .from('user_stats')
            .upsert({
                user_id: this.user.id,
                ...stats,
                updated_at: new Date()
            }, { onConflict: 'user_id' });

        return { data, error };
    },

    /**
     * Save a reading session record
     */
    async saveReadingSession(session) {
        if (!this.user || !this.client) return { error: 'Not logged in' };

        const { data, error } = await this.client
            .from('reading_sessions')
            .insert([{
                user_id: this.user.id,
                ...session
            }]);

        return { data, error };
    },

    /**
     * Get recent reading sessions
     */
    async getRecentSessions(limit = 7) {
        if (!this.user || !this.client) return { data: null, error: 'Not logged in' };

        const { data, error } = await this.client
            .from('reading_sessions')
            .select('*')
            .eq('user_id', this.user.id)
            .order('created_at', { ascending: false })
            .limit(limit);

        return { data, error };
    }
};
