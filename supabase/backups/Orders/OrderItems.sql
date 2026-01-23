DO $$ BEGIN
    CREATE TYPE public.record_status_enum AS ENUM (
        'draft', 'published', 'archived'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.order_items (
    id SERIAL PRIMARY KEY,
    id_order_items UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    id_orders UUID REFERENCES public.orders(id_orders) ON DELETE CASCADE,
    id_products UUID REFERENCES public.products(id_products) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL DEFAULT 1,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES public.users(id_users) ON DELETE CASCADE,
    updated_by UUID REFERENCES public.users(id_users) ON DELETE CASCADE,
    rank_record INTEGER DEFAULT 0,
    record_status public.record_status_enum NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- @security
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- @policies
-- @view
CREATE POLICY "order_items_select_policy" ON public.order_items FOR
SELECT USING (
        (
            SELECT auth.uid ()
        ) IN (
            SELECT ur.id_users
            FROM public.user_roles ur
                JOIN public.roles r ON ur.id_roles = r.id_roles
            WHERE
                r.role_name IN (
                    'Super Admin', 'Admin', 'Finance'
                )
                AND ur.record_status = 'published'
                AND r.record_status = 'published'
        )
        OR (
            record_status = 'published'
            AND id_orders IN (
                SELECT id_orders
                FROM public.orders
                WHERE
                    id_customers IN (
                        SELECT id_customers
                        FROM public.customers
                        WHERE
                            created_by = (
                                SELECT auth.uid ()
                            )
                    )
            )
        )
    );

-- @create
CREATE POLICY "order_items_insert_policy" ON public.order_items FOR
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
                    'Finance'
                )
                AND ur.record_status = 'published'
                AND r.record_status = 'published'
        )
    );

-- @update
CREATE POLICY "order_items_update_policy" ON public.order_items FOR
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
                'Finance'
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
                    'Finance'
                )
                AND ur.record_status = 'published'
                AND r.record_status = 'published'
        )
    );

-- @delete
CREATE POLICY "order_items_delete_policy" ON public.order_items FOR DELETE USING (
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
                'Finance'
            )
            AND ur.record_status = 'published'
            AND r.record_status = 'published'
    )
);

-- @rollback(policies)
-- DROP POLICY IF EXISTS "order_items_select_policy" ON public.order_items;
-- DROP POLICY IF EXISTS "order_items_insert_policy" ON public.order_items;
-- DROP POLICY IF EXISTS "order_items_update_policy" ON public.order_items;
-- DROP POLICY IF EXISTS "order_items_delete_policy" ON public.order_items;

-- @indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_items_id_orders ON public.order_items (id_orders);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_items_id_products ON public.order_items (id_products, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_items_id_attendee ON public.order_items (id_attendee);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_items_metadata ON public.order_items USING GIN (metadata);

CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_order_items_id_unique ON public.order_items (id_order_items);