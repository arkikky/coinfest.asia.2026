-- @password_reset_tokens(table)
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
    id SERIAL PRIMARY KEY,
    id_tokens UUID NOT NULL UNIQUE DEFAULT gen_random_uuid (),
    id_users UUID NOT NULL REFERENCES public.users (id_users) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_valid_token_lifetime CHECK (
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
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- @indexes(search token hash)
CREATE UNIQUE INDEX idx_prt_one_active_per_user ON password_reset_tokens (id_users)
WHERE
    used_at IS NULL;

-- @indexes(cleanup otomatis - (DELETE WHERE expires_at < NOW() - interval '7 days'))
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_prt_cleanup ON public.password_reset_tokens (expires_at)
WHERE
    used_at IS NULL;