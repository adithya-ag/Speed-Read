/**
 * STATS ENGINE
 * Tracks reading sessions, calculates streaks, and provides gamification data
 */

const StatsEngine = {
    sessionStartTime: null,
    sessionStartIndex: null,

    /**
     * Start tracking a reading session
     */
    startSession(startIndex) {
        this.sessionStartTime = Date.now();
        this.sessionStartIndex = startIndex;
    },

    /**
     * End a reading session and record stats
     */
    async endSession(endIndex, wpm, completed = false) {
        if (this.sessionStartTime === null) return;

        const durationMs = Date.now() - this.sessionStartTime;
        const wordsRead = Math.max(0, endIndex - this.sessionStartIndex);
        const durationSeconds = Math.round(durationMs / 1000);
        const avgWpm = durationSeconds > 0
            ? Math.round((wordsRead / durationSeconds) * 60)
            : wpm;

        this.sessionStartTime = null;
        this.sessionStartIndex = null;

        // Skip trivial sessions (less than 2 seconds or 0 words)
        if (durationMs < 2000 || wordsRead === 0) return;

        // Save to IndexedDB
        if (typeof DB !== 'undefined' && DB.db) {
            await DB.recordReadingSession(wordsRead, durationMs, avgWpm, completed);

            // Update streak if read >= 1 minute
            if (durationMs >= 60000) {
                await DB.updateStreak();
            }
        }

        // Sync to Supabase if signed in
        if (typeof SupabaseClient !== 'undefined' && SupabaseClient.user) {
            try {
                await SupabaseClient.saveReadingSession({
                    words_read: wordsRead,
                    duration_seconds: durationSeconds,
                    avg_wpm: avgWpm,
                    session_date: new Date().toISOString().split('T')[0]
                });
            } catch (e) {
                console.warn('Failed to sync reading session:', e);
            }
        }
    },

    /**
     * Get display-ready stats for the dashboard
     */
    async getDisplayStats() {
        if (typeof DB === 'undefined' || !DB.db) {
            return {
                currentStreak: 0,
                streakFreezeActive: false,
                totalWordsRead: 0,
                wordsReadToday: 0,
                documentsCompleted: 0,
                averageWpm: 0
            };
        }

        const lifetime = await DB.getLifetimeStats();
        const streak = await DB.getStreak();
        const today = new Date().toISOString().split('T')[0];
        const todayStats = await DB.getDailyStats(today);

        // Calculate 7-day average WPM
        const wpmValues = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const stats = await DB.getDailyStats(d.toISOString().split('T')[0]);
            if (stats && stats.avgWpm > 0) {
                wpmValues.push(stats.avgWpm);
            }
        }

        const averageWpm = wpmValues.length > 0
            ? Math.round(wpmValues.reduce((a, b) => a + b, 0) / wpmValues.length)
            : 0;

        return {
            currentStreak: streak?.currentStreak || 0,
            streakFreezeActive: streak?.streakFreezeActive || false,
            totalWordsRead: lifetime?.totalWordsRead || 0,
            wordsReadToday: todayStats?.wordsRead || 0,
            documentsCompleted: lifetime?.totalDocumentsCompleted || 0,
            averageWpm
        };
    }
};
