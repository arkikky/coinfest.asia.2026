-- @users(table)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

DO $$ BEGIN
    CREATE TYPE public.active_status_enum AS ENUM ('active', 'inactive');

EXCEPTION WHEN duplicate_object THEN null;

END $$;

DO $$ BEGIN
    CREATE TYPE public.record_status_enum AS ENUM ('draft', 'published', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

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

-- @policies
-- @view
CREATE POLICY "users_select_policy" ON public.users FOR
SELECT USING (
        (
            SELECT auth.uid ()
        ) IN (
            SELECT ur.id_users
            FROM public.user_roles ur
                JOIN public.roles r ON ur.id_roles = r.id_roles
            WHERE
                r.role_name IN ('Super Admin', 'Admin')
                AND ur.record_status = 'published'
                AND r.record_status = 'published'
        )
        OR (
            users_status = 'active'
            AND record_status = 'published'
            AND (
                SELECT auth.uid ()
            ) IN (
                SELECT ur.id_users
                FROM public.user_roles ur
                WHERE
                    ur.record_status = 'published'
            )
        )
        OR id_users = (
            SELECT auth.uid ()
        )
    );

-- @create
CREATE POLICY "users_insert_policy" ON public.users FOR
INSERT
WITH
    CHECK (
        (
            SELECT auth.uid ()
        ) IN (
            SELECT ur.id_users
            FROM public.user_roles ur
                JOIN public.roles r ON ur.id_roles = r.id_roles
            WHERE
                r.role_name IN ('Super Admin', 'Admin')
                AND ur.record_status = 'published'
                AND r.record_status = 'published'
        )
    );

-- @update
CREATE POLICY "users_update_policy" ON public.users FOR
UPDATE USING (
    (
        SELECT auth.uid ()
    ) IN (
        SELECT ur.id_users
        FROM public.user_roles ur
            JOIN public.roles r ON ur.id_roles = r.id_roles
        WHERE
            r.role_name IN ('Super Admin', 'Admin')
            AND ur.record_status = 'published'
            AND r.record_status = 'published'
    )
    OR id_users = (
        SELECT auth.uid ()
    )
)
WITH
    CHECK (
        (
            SELECT auth.uid ()
        ) IN (
            SELECT ur.id_users
            FROM public.user_roles ur
                JOIN public.roles r ON ur.id_roles = r.id_roles
            WHERE
                r.role_name IN ('Super Admin', 'Admin')
                AND ur.record_status = 'published'
                AND r.record_status = 'published'
        )
        OR (
            id_users = (
                SELECT auth.uid ()
            )
        )
    );

-- @delete
CREATE POLICY "users_delete_policy" ON public.users FOR DELETE USING (
    (
        SELECT auth.uid ()
    ) IN (
        SELECT ur.id_users
        FROM public.user_roles ur
            JOIN public.roles r ON ur.id_roles = r.id_roles
        WHERE
            r.role_name IN ('Super Admin', 'Admin')
            AND ur.record_status = 'published'
            AND r.record_status = 'published'
    )
);

-- @rollback(policies)
-- DROP POLICY IF EXISTS "users_select_policy" ON public.users;
-- DROP POLICY IF EXISTS "users_insert_policy" ON public.users;
-- DROP POLICY IF EXISTS "users_update_policy" ON public.users;
-- DROP POLICY IF EXISTS "users_delete_policy" ON public.users;

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

-- @rollback
-- DROP EXTENSION IF EXISTS pg_trgm;
-- DROP INDEX IF EXISTS public.idx_users_status_count;
-- DROP INDEX IF EXISTS public.idx_users_record_count;
-- DROP INDEX IF EXISTS public.idx_users_search_trgm;
-- DROP INDEX IF EXISTS public.idx_users_public_list;
-- DROP INDEX IF EXISTS public.idx_users_admin_panel;