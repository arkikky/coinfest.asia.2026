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