DO $$ BEGIN
    CREATE TYPE public.record_status_enum AS ENUM (
        'draft', 'published', 'archived'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.order_logs (
    id SERIAL PRIMARY KEY,
    id_order_logs UUID NOT NULL UNIQUE DEFAULT gen_random_uuid (),
    id_orders UUID NOT NULL REFERENCES public.orders (id_orders) ON DELETE CASCADE,
    log_event_type TEXT NOT NULL,
    old_value JSONB,
    new_value JSONB,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    changed_by UUID REFERENCES public.users (id_users) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    notes TEXT,
    rank_record INTEGER DEFAULT 0,
    created_by UUID REFERENCES public.users (id_users) ON DELETE CASCADE,
    updated_by UUID REFERENCES public.users (id_users) ON DELETE CASCADE,
    record_status public.record_status_enum NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- @security
ALTER TABLE public.order_logs ENABLE ROW LEVEL SECURITY;

-- @policies
-- @view
CREATE POLICY "order_logs_select_policy" ON public.order_logs FOR
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
CREATE POLICY "order_logs_insert_policy" ON public.order_logs FOR
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
CREATE POLICY "order_logs_update_policy" ON public.order_logs FOR
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
CREATE POLICY "order_logs_delete_policy" ON public.order_logs FOR DELETE USING (
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
-- DROP POLICY IF EXISTS "order_logs_select_policy" ON public.order_logs;
-- DROP POLICY IF EXISTS "order_logs_insert_policy" ON public.order_logs;
-- DROP POLICY IF EXISTS "order_logs_update_policy" ON public.order_logs;
-- DROP POLICY IF EXISTS "order_logs_delete_policy" ON public.order_logs;

-- @indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_logs_id_orders ON public.order_logs (id_orders, changed_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_logs_event_type_date ON public.order_logs (
    log_event_type,
    changed_at DESC
);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_logs_changed_by ON public.order_logs (changed_by, changed_at DESC)
WHERE
    changed_by IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_logs_changed_at ON public.order_logs (changed_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_logs_old_value ON public.order_logs USING GIN (old_value);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_logs_new_value ON public.order_logs USING GIN (new_value);

CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_order_logs_id_unique ON public.order_logs (id_order_logs);