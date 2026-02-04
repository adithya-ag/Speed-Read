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
     * Save Reading Progress (Example)
     */
    async saveProgress(textId, wordIndex) {
        if (!this.user || !this.client) return;

        // Implementation depends on DB Schema
        // const { error } = await this.client.from('progress').upsert({ ... })
    }
};
