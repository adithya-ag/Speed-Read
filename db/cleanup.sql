-- AUTO-CLEANUP OPTIONS FOR SUPABASE
-- Choose one of the following approaches:

-- ============================================================
-- OPTION 1: pg_cron (if available on your Supabase plan)
-- ============================================================
-- First, enable the extension in Supabase Dashboard:
-- Database → Extensions → Search "pg_cron" → Enable
--
-- Then run:
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
--
-- SELECT cron.schedule('cleanup-stale-documents', '0 3 * * *', $$
--     DELETE FROM public.documents WHERE last_read_at < NOW() - INTERVAL '7 days'
--     AND user_id NOT IN (
--         SELECT user_id FROM public.user_stats
--         WHERE streak_freeze_active = true AND streak_freeze_used_at > NOW() - INTERVAL '7 days'
--     );
--     DELETE FROM public.documents WHERE last_read_at < NOW() - INTERVAL '14 days';
-- $$);

-- ============================================================
-- OPTION 2: Manual cleanup (run periodically or skip entirely)
-- ============================================================
-- The app already prompts users locally about stale documents.
-- Cloud cleanup is optional since we only store metadata (not content).
-- Run this manually if you want to clean up:

DELETE FROM public.documents
WHERE last_read_at < NOW() - INTERVAL '7 days'
AND user_id NOT IN (
    SELECT user_id FROM public.user_stats
    WHERE streak_freeze_active = true
    AND streak_freeze_used_at > NOW() - INTERVAL '7 days'
);

DELETE FROM public.documents
WHERE last_read_at < NOW() - INTERVAL '14 days';

-- ============================================================
-- OPTION 3: Supabase Edge Function (alternative to pg_cron)
-- ============================================================
-- Create a Supabase Edge Function and use an external cron service
-- like cron-job.org to trigger it daily. See Supabase docs for setup.
