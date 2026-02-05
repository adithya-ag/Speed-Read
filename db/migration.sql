-- MIGRATION: Add word_hash column and new tables for local-first architecture
-- Run this against your Supabase database

-- Step 1: Add word_hash to documents table
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS word_hash TEXT;

-- Step 2: User stats table (for cross-device gamification sync)
CREATE TABLE IF NOT EXISTS public.user_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
    current_streak INTEGER DEFAULT 0,
    last_read_date DATE,
    streak_freeze_active BOOLEAN DEFAULT FALSE,
    streak_freeze_used_at TIMESTAMP WITH TIME ZONE,
    total_words_read BIGINT DEFAULT 0,
    total_documents_completed INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own stats"
    ON user_stats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own stats"
    ON user_stats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own stats"
    ON user_stats FOR UPDATE USING (auth.uid() = user_id);

-- Step 3: Reading sessions table (for WPM trend tracking)
CREATE TABLE IF NOT EXISTS public.reading_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL,
    document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
    words_read INTEGER DEFAULT 0,
    duration_seconds INTEGER DEFAULT 0,
    avg_wpm INTEGER DEFAULT 0,
    session_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.reading_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
    ON reading_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions"
    ON reading_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- NOTE: After all clients have migrated to local-first (wait ~2 weeks),
-- you can optionally drop the content column to save space:
-- ALTER TABLE public.documents DROP COLUMN content;
