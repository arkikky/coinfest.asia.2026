DO $$ BEGIN
    CREATE TYPE public.record_status_enum AS ENUM (
        'draft', 'published', 'archived'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.invoice_status_enum AS ENUM (
        'send', 'unsend'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.invoice (
    id SERIAL PRIMARY KEY,
    id_invoice UUID NOT NULL UNIQUE DEFAULT gen_random_uuid (),
    id_orders UUID NOT NULL REFERENCES public.orders (id_orders) ON DELETE CASCADE,
    invoice_id VARCHAR(50) NOT NULL, -- format: "INV-{random char+number}"
    pdf_url TEXT,
    amount_due NUMERIC(12, 2) NOT NULL DEFAULT 0,
    paid_at TIMESTAMPTZ,
    invoice_status public.invoice_status_enum NOT NULL DEFAULT 'unsend',
    payment_method TEXT,
    payment_provider TEXT,
    payment_intent_id TEXT,
    created_by UUID REFERENCES public.users (id_users) ON DELETE CASCADE,
    updated_by UUID REFERENCES public.users (id_users) ON DELETE CASCADE,
    rank_record INTEGER DEFAULT 0,
    record_status public.record_status_enum NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- @security
ALTER TABLE public.invoice ENABLE ROW LEVEL SECURITY;

-- @policies
-- @view
CREATE POLICY "invoice_select_policy" ON public.invoice FOR
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
CREATE POLICY "invoice_insert_policy" ON public.invoice FOR
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
CREATE POLICY "invoice_update_policy" ON public.invoice FOR
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
CREATE POLICY "invoice_delete_policy" ON public.invoice FOR DELETE USING (
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
-- DROP POLICY IF EXISTS "invoice_select_policy" ON public.invoice;
-- DROP POLICY IF EXISTS "invoice_insert_policy" ON public.invoice;
-- DROP POLICY IF EXISTS "invoice_update_policy" ON public.invoice;
-- DROP POLICY IF EXISTS "invoice_delete_policy" ON public.invoice;

-- @indexes
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS uq_invoice_invoice_id ON public.invoice (invoice_id);

CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS uq_invoice_id_orders ON public.invoice (id_orders);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoice_status_date ON public.invoice (
    invoice_status,
    created_at DESC
)
WHERE
    record_status = 'published';