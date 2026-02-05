-- AUTO-CLEANUP: Schedule via pg_cron on Supabase (runs daily at 3 AM UTC)
-- Enable pg_cron extension first: CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Delete documents for users who haven't shown up for 7 days (no freeze active)
SELECT cron.schedule('cleanup-stale-documents', '0 3 * * *', $$
    -- Remove docs for inactive users without streak freeze
    DELETE FROM public.documents d
    WHERE d.last_read_at < NOW() - INTERVAL '7 days'
    AND NOT EXISTS (
        SELECT 1 FROM public.user_stats us
        WHERE us.user_id = d.user_id
        AND us.streak_freeze_active = true
        AND us.streak_freeze_used_at > NOW() - INTERVAL '7 days'
    );

    -- Remove docs for inactive users WITH streak freeze (14-day grace)
    DELETE FROM public.documents d
    WHERE d.last_read_at < NOW() - INTERVAL '14 days';

    -- Deactivate expired streak freezes (older than 7 days)
    UPDATE public.user_stats
    SET streak_freeze_active = false
    WHERE streak_freeze_active = true
    AND streak_freeze_used_at < NOW() - INTERVAL '7 days';

    -- Clean up orphaned reading sessions (older than 30 days)
    DELETE FROM public.reading_sessions
    WHERE created_at < NOW() - INTERVAL '30 days';
$$);
