DO $$ BEGIN
    CREATE TYPE public.record_status_enum AS ENUM ('draft', 'published', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.products (
    id SERIAL PRIMARY KEY,
    id_products UUID NOT NULL UNIQUE DEFAULT gen_random_uuid (),
    id_events UUID REFERENCES public.events (id_events) ON DELETE CASCADE,
    id_type_products UUID NOT NULL REFERENCES public.type_products (id_type_products) ON DELETE RESTRICT,
    product_id VARCHAR(50) NOT NULL,
    product_name TEXT NOT NULL,
    product_description TEXT,
    price NUMERIC(12, 2) NOT NULL,
    price_sale NUMERIC(12, 2),
    product_stock INTEGER NOT NULL DEFAULT 0,
    product_usage INTEGER NOT NULL DEFAULT 0,
    variant_product VARCHAR(7),
    is_group BOOLEAN NOT NULL DEFAULT FALSE,
    total_group INTEGER NOT NULL DEFAULT 0,
    is_sale_active BOOLEAN NOT NULL DEFAULT FALSE,
    sale_start TIMESTAMPTZ,
    sale_end TIMESTAMPTZ,
    sale_banner_label TEXT,
    created_by UUID REFERENCES public.users (id_users) ON DELETE CASCADE,
    updated_by UUID REFERENCES public.users (id_users) ON DELETE CASCADE,
    rank_record INTEGER DEFAULT 0,
    record_status public.record_status_enum NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- @security
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- @policies
-- @view
CREATE POLICY "products_select_policy" ON public.products FOR
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
            record_status = 'published'
            AND (
                SELECT auth.role ()
            ) = 'authenticated'
        )
        OR (
            record_status = 'published'
            AND (
                SELECT auth.role ()
            ) = 'anon'
        )
    );

-- @create
CREATE POLICY "products_insert_policy" ON public.products FOR
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
CREATE POLICY "products_update_policy" ON public.products FOR
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
    );

-- @delete
CREATE POLICY "products_delete_policy" ON public.products FOR DELETE USING (
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
-- DROP POLICY IF EXISTS "products_select_policy" ON public.products;
-- DROP POLICY IF EXISTS "products_insert_policy" ON public.products;
-- DROP POLICY IF EXISTS "products_update_policy" ON public.products;
-- DROP POLICY IF EXISTS "products_delete_policy" ON public.products;

-- @index(policy)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_roles_policy_check ON public.user_roles (
    id_users,
    id_roles,
    record_status
)
WHERE
    record_status = 'published';

-- @roles lookup optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_roles_name_status ON public.roles (role_name, record_status)
WHERE
    record_status = 'published';

-- @covering index untuk JOIN (ULTIMATE SPEED)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_roles_admin_check ON public.user_roles (id_users) INCLUDE (id_roles, record_status)
WHERE
    record_status = 'published';

-- @rollback(index policy)
-- DROP INDEX IF EXISTS idx_user_roles_policy_check;
-- DROP INDEX IF EXISTS idx_roles_name_status;
-- DROP INDEX IF EXISTS idx_user_roles_admin_check;

-- @index
-- @partial index wajib untuk record_status = 'published' (homepage & API)
CREATE INDEX IF NOT EXISTS idx_products_status_published ON public.products (record_status)
WHERE
    record_status = 'published';

-- @count total per status (dashboard) - index-only scan super cepat
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_record_status ON public.products (record_status);

-- @lookup cepat berdasarkan product_id (human-readable ID)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_product_id ON public.products (product_id);

-- @relation to events (join sering dipakai)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_id_events ON public.products (id_events);

-- @homepage / API: Published products dengan pagination & sorting (latest first)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_published_latest ON public.products (
    created_at DESC,
    id_products DESC
)
WHERE
    record_status = 'published';

-- @search product + filter by event (JOIN optimization)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_events_search ON public.products (
    id_events,
    record_status,
    created_at DESC
)
WHERE
    record_status = 'published';

-- @upcoming / active sale products
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_sale_active ON public.products (
    sale_start DESC,
    sale_end DESC
)
WHERE
    record_status = 'published'
    AND is_sale_active = TRUE;

-- @filter dashboard: created_at + record_status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_status_created_filter ON public.products (
    record_status,
    created_at DESC
);

-- @fuzzy search product_name (paling sering dipakai user)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_search_trgm ON public.products USING GIN (product_name gin_trgm_ops);

-- @rollback(index)
-- DROP INDEX IF EXISTS idx_products_status_created_filter;
-- DROP INDEX IF EXISTS idx_products_search_trgm;
-- DROP INDEX IF EXISTS idx_products_sale_active;
-- DROP INDEX IF EXISTS idx_products_events_search;
-- DROP INDEX IF EXISTS idx_products_published_latest;
-- DROP INDEX IF EXISTS idx_products_id_events;
-- DROP INDEX IF EXISTS idx_products_product_id;
-- DROP INDEX IF EXISTS idx_products_record_status;
-- DROP INDEX IF EXISTS idx_products_status_published