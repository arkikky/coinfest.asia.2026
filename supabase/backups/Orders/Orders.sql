DO $$ BEGIN
    CREATE TYPE public.order_payment_status_enum AS ENUM (
        'pending', 'paid', 'failed', 'cancelled', 'refunded'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.order_merchant_enum AS ENUM (
        'online', 'offline'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.record_status_enum AS ENUM (
        'draft', 'published', 'archived'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.orders (
    id SERIAL PRIMARY KEY,
    id_orders UUID NOT NULL UNIQUE DEFAULT gen_random_uuid (),
    id_events UUID REFERENCES public.events (id_events) ON DELETE SET NULL,
    id_customers UUID REFERENCES public.customers (id_customers) ON DELETE SET NULL,
    id_coupons UUID REFERENCES public.coupons (id_coupons) ON DELETE SET NULL,
    order_id VARCHAR(50) NOT NULL, -- format: "ORD-{random}"
    order_notes TEXT,
    order_subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    grand_order_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
    payment_method TEXT,
    payment_provider TEXT,
    payment_intent_id TEXT,
    payment_status public.order_payment_status_enum NOT NULL DEFAULT 'pending',
    expired_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    refunded_at TIMESTAMPTZ,
    created_by UUID REFERENCES public.users (id_users) ON DELETE CASCADE,
    updated_by UUID REFERENCES public.users (id_users) ON DELETE CASCADE,
    rank_record INTEGER DEFAULT 0,
    order_merchant public.order_merchant_enum NOT NULL DEFAULT 'online',
    record_status public.record_status_enum NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- @security
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- @policies
-- @view
CREATE POLICY "orders_select_policy" ON public.orders FOR
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
            AND id_customers IN (
                SELECT id_customers
                FROM public.customers
                WHERE
                    created_by = (
                        SELECT auth.uid ()
                    )
            )
        )
    );

-- @create
CREATE POLICY "orders_insert_policy" ON public.orders FOR
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
CREATE POLICY "orders_update_policy" ON public.orders FOR
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
CREATE POLICY "orders_delete_policy" ON public.orders FOR DELETE USING (
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
-- DROP POLICY IF EXISTS "orders_select_policy" ON public.orders;
-- DROP POLICY IF EXISTS "orders_insert_policy" ON public.orders;
-- DROP POLICY IF EXISTS "orders_update_policy" ON public.orders;
-- DROP POLICY IF EXISTS "orders_delete_policy" ON public.orders;

-- @indexes
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS uq_orders_order_id ON public.orders (order_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_id_events ON public.orders (id_events);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_id_customers ON public.orders (id_customers);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_id_coupons ON public.orders (id_coupons);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_payment_status ON public.orders (
    payment_status,
    created_at DESC
);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_customer_history ON public.orders (id_customers, created_at DESC)
WHERE
    record_status = 'published';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_payment_status_date ON public.orders (
    payment_status,
    created_at DESC,
    grand_order_total
)
WHERE
    record_status = 'published';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_pending_expired ON public.orders (expired_at ASC)
WHERE
    payment_status = 'pending'
    AND expired_at > NOW();

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_latest ON public.orders (
    created_at DESC,
    id_orders DESC
)
WHERE
    record_status = 'published';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_status_created ON public.orders (
    record_status,
    created_at DESC
);

CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_id_unique ON public.orders (id_orders);

-- @rollback
-- DROP POLICY IF EXISTS "uq_orders_order_id" ON public.orders;
-- DROP POLICY IF EXISTS "idx_orders_id_events" ON public.orders;
-- DROP POLICY IF EXISTS "idx_orders_id_customers" ON public.orders;
-- DROP POLICY IF EXISTS "idx_orders_id_coupons" ON public.orders;
-- DROP POLICY IF EXISTS "idx_orders_payment_status" ON public.orders;
-- DROP POLICY IF EXISTS "idx_orders_customer_history" ON public.orders;
-- DROP POLICY IF EXISTS "idx_orders_payment_status_date" ON public.orders;
-- DROP POLICY IF EXISTS "idx_orders_pending_expired" ON public.orders;
-- DROP POLICY IF EXISTS "idx_orders_latest" ON public.orders;
-- DROP POLICY IF EXISTS "idx_orders_status_created" ON public.orders;
-- DROP POLICY IF EXISTS "idx_orders_id_unique" ON public.orders;