/**
 * SUPABASE CLIENT WRAPPER
 * Handles all backend interactions
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
        // Trigger generic event for App to listen to
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

    /**
     * Get All Documents for User
     */
    async getDocuments() {
        if (!this.client) return { error: 'Not initialized' };

        const { data, error } = await this.client
            .from('documents')
            .select('*')
            .order('last_read_at', { ascending: false });

        return { data, error };
    },

    /**
     * Save/Upload a new Document
     */
    async saveDocument(title, content) {
        if (!this.user || !this.client) return { error: 'Not logged in' };

        const { data, error } = await this.client
            .from('documents')
            .insert([
                {
                    user_id: this.user.id,
                    title: title || 'Untitled',
                    content: content,
                    total_words: content.split(/\s+/).length, // simple count
                    bookmark_index: 0
                }
            ])
            .select()
            .single();

        return { data, error };
    },

    /**
     * Save Reading Progress
     * Debounced in App, but here handles the DB call
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
    }
};
