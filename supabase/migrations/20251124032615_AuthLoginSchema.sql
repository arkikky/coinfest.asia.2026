-- ============================================
-- Database Schema : Auth Login, Register, Role Management, Reset Password & Email Verification
-- ============================================

-- @users(table)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

CREATE TYPE public.active_status_enum AS ENUM ('active', 'inactive');

CREATE TYPE public.record_status_enum AS ENUM ('draft', 'published', 'archived');

CREATE TABLE IF NOT EXISTS public.users (
    id SERIAL PRIMARY KEY,
    id_users UUID NOT NULL UNIQUE DEFAULT gen_random_uuid (),
    username TEXT NOT NULL UNIQUE,
    full_name TEXT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    users_status public.active_status_enum NOT NULL DEFAULT 'inactive',
    rank_record INTEGER,
    record_status public.record_status_enum NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- @security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- @rollback
-- DROP EXTENSION IF EXISTS pg_trgm;
-- DROP INDEX IF EXISTS public.idx_users_status_count;
-- DROP INDEX IF EXISTS public.idx_users_record_count;
-- DROP INDEX IF EXISTS public.idx_users_search_trgm;
-- DROP INDEX IF EXISTS public.idx_users_public_list;
-- DROP INDEX IF EXISTS public.idx_users_admin_panel;

-- @indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_status_count ON public.users (users_status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_record_count ON public.users (record_status);

-- @indexes(search)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_search_trgm ON public.users USING gin (
    username gin_trgm_ops,
    full_name gin_trgm_ops,
    email gin_trgm_ops
);

-- @indexes(list active & published)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_public_list ON public.users (created_at DESC, id DESC)
WHERE
    users_status = 'active'
    AND record_status = 'published';

-- @indexes(filter + sorting + pagination)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_admin_panel ON public.users (
    users_status,
    record_status,
    created_at DESC,
    id DESC
);

-- @roles(table)
CREATE TYPE public.role_name AS ENUM ('Super Admin', 'Admin', 'Marketing', 'Finance', 'Crew');

CREATE TABLE IF NOT EXISTS public.roles (
    id SERIAL PRIMARY KEY,
    id_roles UUID NOT NULL UNIQUE DEFAULT gen_random_uuid (),
    role_name public.role_name NOT NULL UNIQUE,
    short_desc TEXT,
    rank_record INTEGER,
    record_status public.record_status_enum NOT NULL DEFAULT 'published',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- @constraints
ALTER TABLE public.roles
ADD CONSTRAINT chk_short_desc_not_empty CHECK (
    short_desc IS NULL
    OR trim(short_desc) <> ''
);

-- @security
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- @rollback
DROP INDEX IF EXISTS public.idx_roles_active_unique;

DROP INDEX IF EXISTS public.idx_roles_admin_filter;

-- @indexes
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_roles_active_unique ON public.roles (role_name)
WHERE
    record_status = 'published';

-- @indexes(filter + sorting + pagination)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_roles_admin_filter ON public.roles (
    record_status,
    created_at DESC
);

-- @permissions(table)
CREATE TABLE IF NOT EXISTS public.permissions (
    id SERIAL PRIMARY KEY,
    id_permissions UUID NOT NULL UNIQUE DEFAULT gen_random_uuid (),
    permission_name TEXT NOT NULL UNIQUE,
    short_desc TEXT,
    permissions_status public.active_status_enum NOT NULL DEFAULT 'inactive',
    rank_record INTEGER,
    record_status public.record_status_enum NOT NULL DEFAULT 'published',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- @constraints
ALTER TABLE public.permissions
ADD CONSTRAINT chk_permission_name_not_empty CHECK (trim(permission_name) <> '');

ALTER TABLE public.permissions
ADD CONSTRAINT chk_short_desc_not_empty CHECK (
    short_desc IS NULL
    OR trim(short_desc) <> ''
);

-- @security
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

-- @rollback
-- DROP INDEX IF EXISTS public.idx_permissions_active_unique;
-- DROP INDEX IF EXISTS public.idx_permissions_admin_filter;

-- @indexes
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_permissions_active_unique ON public.permissions (permission_name)
WHERE
    permissions_status = 'active'
    AND record_status = 'published';

-- @indexes(filter + sorting + pagination)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_permissions_admin_filter ON public.permissions (
    permissions_status,
    record_status,
    created_at DESC
);

-- @user_roles(table)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id SERIAL PRIMARY KEY,
    id_user_roles UUID NOT NULL UNIQUE DEFAULT gen_random_uuid (),
    id_users UUID NOT NULL REFERENCES public.users (id_users) ON DELETE CASCADE,
    id_roles UUID NOT NULL REFERENCES public.roles (id_roles) ON DELETE RESTRICT,
    rank_record INTEGER,
    record_status public.record_status_enum NOT NULL DEFAULT 'published',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- @security
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- @rollback
-- DROP INDEX IF EXISTS public.uq_user_roles_active;
-- DROP INDEX IF EXISTS public.idx_user_roles_by_role_active;
-- DROP INDEX IF EXISTS public.idx_user_roles_admin;

-- @indexes(auth, middleware)
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS uq_user_roles_active ON public.user_roles (id_users, id_roles)
WHERE
    record_status = 'published';

-- @indexes(lookup role)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_roles_by_role_active ON public.user_roles (id_roles, id_users)
WHERE
    record_status = 'published';

-- @indexes(filter + sorting + pagination)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_roles_admin ON public.user_roles (
    record_status,
    created_at DESC,
    id_users,
    id_roles
);

-- @role_permissions(table)
CREATE TABLE IF NOT EXISTS public.role_permissions (
    id SERIAL PRIMARY KEY,
    id_role_permissions UUID NOT NULL UNIQUE DEFAULT gen_random_uuid (),
    id_roles UUID NOT NULL REFERENCES public.roles (id_roles) ON DELETE CASCADE,
    id_permissions UUID NOT NULL REFERENCES public.permissions (id_permissions) ON DELETE CASCADE,
    rank_record INTEGER,
    record_status public.record_status_enum NOT NULL DEFAULT 'published',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- @security
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- @rollback
-- DROP INDEX IF EXISTS public.uq_role_perm_active;
-- DROP INDEX IF EXISTS public.idx_role_perm_by_permission;
-- DROP INDEX IF EXISTS public.idx_role_perm_admin;

-- @indexes(check permission, authorization middleware)
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS uq_role_perm_active ON public.role_permissions (id_roles, id_permissions)
WHERE
    record_status = 'published';

-- @indexes(permission admin)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_role_perm_by_permission ON public.role_permissions (id_permissions, id_roles)
WHERE
    record_status = 'published';

-- @indexes(assignment (active/inactive/draft)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_role_perm_admin ON public.role_permissions (
    record_status,
    created_at DESC,
    id_roles,
    id_permissions
);

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