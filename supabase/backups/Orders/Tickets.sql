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

CREATE TABLE IF NOT EXISTS public.e_tickets (
    id SERIAL PRIMARY KEY,
    id_tickets UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    id_events UUID REFERENCES public.events (id_events) ON DELETE SET NULL,
    ticket_id VARCHAR(50) NOT NULL, -- format: "CAE-{random char+number}"
    id_order_items UUID NOT NULL REFERENCES public.order_items (id_order_items) ON DELETE CASCADE,
    order_merchant public.order_merchant_enum NOT NULL DEFAULT 'online',
    id_attendee UUID NOT NULL REFERENCES public.attendee (id_attendee) ON DELETE RESTRICT,
    qr_code TEXT,
    qr_code_id UUID,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_upgrade BOOLEAN NOT NULL DEFAULT FALSE,
    is_printed BOOLEAN NOT NULL DEFAULT FALSE,
    is_refunded BOOLEAN NOT NULL DEFAULT FALSE,
    created_by UUID NOT NULL REFERENCES public.users (id_users) ON DELETE CASCADE,
    updated_by UUID NOT NULL REFERENCES public.users (id_users) ON DELETE CASCADE,
    rank_record INTEGER DEFAULT 0,
    record_status public.record_status_enum NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- @security
ALTER TABLE public.e_tickets ENABLE ROW LEVEL SECURITY;

-- @policies
-- @view
CREATE POLICY "e_tickets_select_policy" ON public.e_tickets FOR
SELECT USING (
        (
            SELECT auth.uid ()
        ) IN (
            SELECT ur.id_users
            FROM public.user_roles ur
                JOIN public.roles r ON ur.id_roles = r.id_roles
            WHERE
                r.role_name IN (
                    'Super Admin', 'Admin', 'Marketing', 'Finance'
                )
                AND ur.record_status = 'published'
                AND r.record_status = 'published'
        )
        OR (
            record_status = 'published'
            AND id_order_items IN (
                SELECT oi.id_order_items
                FROM public.order_items oi
                    JOIN public.orders o ON o.id_orders = oi.id_orders
                WHERE
                    o.id_customers IN (
                        SELECT c.id_customers
                        FROM public.customers c
                        WHERE
                            c.created_by = (
                                SELECT auth.uid ()
                            )
                    )
            )
        )
    );

-- @create
CREATE POLICY "e_tickets_insert_policy" ON public.e_tickets FOR
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
                    'Marketing',
                    'Finance'
                )
                AND ur.record_status = 'published'
                AND r.record_status = 'published'
        )
    );

-- @update
CREATE POLICY "e_tickets_update_policy" ON public.e_tickets FOR
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
                'Marketing',
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
                    'Marketing',
                    'Finance'
                )
                AND ur.record_status = 'published'
                AND r.record_status = 'published'
        )
    );

-- @delete
CREATE POLICY "e_tickets_delete_policy" ON public.e_tickets FOR DELETE USING (
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
                'Marketing',
                'Finance'
            )
            AND ur.record_status = 'published'
            AND r.record_status = 'published'
    )
);

-- @rollback(policies)
-- DROP POLICY IF EXISTS "e_tickets_select_policy" ON public.e_tickets;
-- DROP POLICY IF EXISTS "e_tickets_insert_policy" ON public.e_tickets;
-- DROP POLICY IF EXISTS "e_tickets_update_policy" ON public.e_tickets;
-- DROP POLICY IF EXISTS "e_tickets_delete_policy" ON public.e_tickets;

-- @indexes
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS uq_e_tickets_ticket_id ON public.e_tickets (ticket_id);

CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS uq_e_tickets_id_order_items ON public.e_tickets (id_order_items);

CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS uq_e_tickets_qr_code_id ON public.e_tickets (qr_code_id)
WHERE
    qr_code_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_e_tickets_id_attendee ON public.e_tickets (id_attendee);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_e_tickets_metadata ON public.e_tickets USING GIN (metadata);