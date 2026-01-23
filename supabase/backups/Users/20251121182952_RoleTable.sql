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

-- @security
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- @rollback
-- DROP INDEX IF EXISTS public.idx_roles_active_unique;
-- DROP INDEX IF EXISTS public.idx_roles_admin_filter;

-- @indexes
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_roles_active_unique ON public.roles (role_name)
WHERE
    record_status = 'published';

-- @indexes(filter + sorting + pagination)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_roles_admin_filter ON public.roles (
    record_status,
    created_at DESC
);