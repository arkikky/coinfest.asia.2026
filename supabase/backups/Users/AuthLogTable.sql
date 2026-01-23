-- @auth_logs(table)
CREATE TABLE IF NOT EXISTS public.auth_logs (
    id SERIAL PRIMARY KEY,
    id_authlogs UUID NOT NULL UNIQUE DEFAULT gen_random_uuid (),
    id_users UUID NOT NULL REFERENCES public.users (id_users) ON DELETE CASCADE,
    ip_address INET,
    user_agent TEXT,
    token_hash TEXT NOT NULL,
    session_created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expired_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    rank_record INTEGER,
    record_status public.record_status_enum NOT NULL DEFAULT 'published',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_session_timing CHECK (
        (
            expired_at IS NULL
            OR expired_at > session_created_at
        )
        AND (
            revoked_at IS NULL
            OR revoked_at >= session_created_at
        )
        AND (
            last_activity_at >= session_created_at
        )
    )
);

-- @security
ALTER TABLE public.auth_logs ENABLE ROW LEVEL SECURITY;

-- @indexes(list session)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_auth_active_sessions ON public.auth_logs (
    id_users,
    session_created_at DESC
)
WHERE
    is_active = TRUE
    AND revoked_at IS NULL;

-- @indexes(JWT/refresh token validation)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_auth_token_hash ON public.auth_logs (token_hash)
WHERE
    is_active = TRUE
    AND revoked_at IS NULL;

-- @indexes(cron job harian)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_auth_cleanup ON public.auth_logs (last_activity_at)
WHERE
    is_active = FALSE
    OR revoked_at IS NOT NULL
    OR expired_at IS NOT NULL;

-- @indexes(audit log)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_auth_by_user_all ON public.auth_logs (
    id_users,
    session_created_at DESC
);