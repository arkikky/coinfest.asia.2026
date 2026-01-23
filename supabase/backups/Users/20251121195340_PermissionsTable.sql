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