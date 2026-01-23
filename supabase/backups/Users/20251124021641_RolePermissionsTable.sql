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

-- @indexes(assignment (active/archived/draft)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_role_perm_admin ON public.role_permissions (
    record_status,
    created_at DESC,
    id_roles,
    id_permissions
);