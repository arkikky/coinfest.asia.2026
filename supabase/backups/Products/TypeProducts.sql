DO $$ BEGIN
    CREATE TYPE public.record_status_enum AS ENUM ('draft', 'published', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.type_products (
    id SERIAL PRIMARY KEY,
    id_events UUID NOT NULL REFERENCES public.events (id_events) ON DELETE CASCADE,
    id_type_products UUID NOT NULL UNIQUE DEFAULT gen_random_uuid (),
    type_product_name TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES public.users (id_users) ON DELETE CASCADE,
    updated_by UUID NOT NULL REFERENCES public.users (id_users) ON DELETE CASCADE,
    rank_record INTEGER DEFAULT 0,
    record_status public.record_status_enum NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- @security
ALTER TABLE public.type_products ENABLE ROW LEVEL SECURITY;

-- @rollback(policies)
-- DROP POLICY IF EXISTS "type_products_select_policy" ON public.type_products;
-- DROP POLICY IF EXISTS "type_products_insert_policy" ON public.type_products;
-- DROP POLICY IF EXISTS "type_products_update_policy" ON public.type_products;
-- DROP POLICY IF EXISTS "type_products_delete_policy" ON public.type_products;

-- @policies
-- @view
CREATE POLICY "type_products_select_policy" ON public.type_products FOR
SELECT USING (
        (
            SELECT auth.uid ()
        ) IN (
            SELECT ur.id_users
            FROM public.user_roles ur
                JOIN public.roles r ON ur.id_roles = r.id_roles
            WHERE
                r.role_name IN (
                    'Super Admin', 'Admin', 'Marketing'
                )
                AND ur.record_status = 'published'
                AND r.record_status = 'published'
        )
        OR (
            record_status = 'published'
            AND (
                SELECT auth.uid ()
            ) IN (
                SELECT ur.id_users
                FROM public.user_roles ur
                WHERE
                    ur.record_status = 'published'
            )
        )
    );

-- @insert
CREATE POLICY "type_products_insert_policy" ON public.type_products FOR
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
                r.role_name IN (
                    'Super Admin',
                    'Admin',
                    'Marketing'
                )
                AND ur.record_status = 'published'
                AND r.record_status = 'published'
        )
    );

-- @update
CREATE POLICY "type_products_update_policy" ON public.type_products FOR
UPDATE USING (
    (
        SELECT auth.uid ()
    ) IN (
        SELECT ur.id_users
        FROM public.user_roles ur
            JOIN public.roles r ON ur.id_roles = r.id_roles
        WHERE
            r.role_name IN (
                'Super Admin',
                'Admin',
                'Marketing'
            )
            AND ur.record_status = 'published'
            AND r.record_status = 'published'
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
                r.role_name IN (
                    'Super Admin',
                    'Admin',
                    'Marketing'
                )
                AND ur.record_status = 'published'
                AND r.record_status = 'published'
        )
    );

-- @delete
CREATE POLICY "type_products_delete_policy" ON public.type_products FOR DELETE USING (
    (
        SELECT auth.uid ()
    ) IN (
        SELECT ur.id_users
        FROM public.user_roles ur
            JOIN public.roles r ON ur.id_roles = r.id_roles
        WHERE
            r.role_name IN (
                'Super Admin',
                'Admin',
                'Marketing'
            )
            AND ur.record_status = 'published'
            AND r.record_status = 'published'
    )
);

-- @rollback(indexes)
-- DROP INDEX IF EXISTS public.idx_type_products_status_published;
-- DROP INDEX IF EXISTS public.idx_type_products_record_status;
-- DROP INDEX IF EXISTS public.idx_type_products_latest;
-- DROP INDEX IF EXISTS public.idx_type_products_status_created;
-- DROP INDEX IF EXISTS public.idx_type_products_search_name;
-- DROP INDEX IF EXISTS public.idx_user_roles_policy_check;
-- DROP INDEX IF EXISTS public.idx_roles_name_status;

-- @indexes
-- @foreign key(id_events)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_type_products_id_events 
ON public.type_products (id_events);

-- @foreign key(created_by)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_type_products_created_by 
ON public.type_products (created_by);

-- @foreign key(updated_by)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_type_products_updated_by
ON public.type_products (updated_by);

-- @rollback(table)
DROP INDEX IF EXISTS public.idx_type_products_id_events;
DROP INDEX IF EXISTS public.idx_type_products_created_by;
DROP INDEX IF EXISTS public.idx_type_products_updated_by;
