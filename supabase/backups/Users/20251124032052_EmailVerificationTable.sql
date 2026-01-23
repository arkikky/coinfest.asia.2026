-- @email_verification_tokens(table)
CREATE TABLE IF NOT EXISTS public.email_verification_tokens (
    id SERIAL PRIMARY KEY,
    id_tokens UUID NOT NULL UNIQUE DEFAULT gen_random_uuid (),
    id_users UUID NOT NULL REFERENCES public.users (id_users) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_evt_valid_lifetime CHECK (
        expires_at > created_at
        AND (
            used_at IS NULL
            OR used_at >= created_at
        )
        AND (
            used_at IS NULL
            OR used_at <= expires_at
        )
    )
);

-- @security
ALTER TABLE public.email_verification_tokens ENABLE ROW LEVEL SECURITY;

-- @indexes(search token hash)
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_evt_active_per_user ON public.email_verification_tokens (id_users)
WHERE
    used_at IS NULL;

-- @indexes(cleanup otomatis - (DELETE WHERE expires_at < NOW() - interval '7 days'))
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_evt_cleanup ON public.email_verification_tokens (expires_at)
WHERE
    used_at IS NULL;

-- @indexes(audit token user)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_evt_by_user_all ON public.email_verification_tokens (id_users, created_at DESC);