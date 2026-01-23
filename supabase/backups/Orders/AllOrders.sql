/*=============*/
-- @orders
/*=============*/
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
    order_merchant public.order_merchant_enum NOT NULL DEFAULT 'online',
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
    session_token UUID,
    session_expires_at TIMESTAMPTZ,
    created_by UUID REFERENCES public.users (id_users) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.users (id_users) ON DELETE SET NULL,
    rank_record INTEGER DEFAULT 0,
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
        -- Admins see all
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

/*=============*/
-- @order-items
/*=============*/
DO $$ BEGIN
    CREATE TYPE public.record_status_enum AS ENUM (
        'draft', 'published', 'archived'
    );

EXCEPTION WHEN duplicate_object THEN null;

END $$;

CREATE TABLE IF NOT EXISTS public.order_items (
    id SERIAL PRIMARY KEY,
    id_order_items UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    id_orders UUID NOT NULL REFERENCES public.orders(id_orders) ON DELETE CASCADE,
    id_products UUID NOT NULL REFERENCES public.products(id_products) ON DELETE RESTRICT,
    id_attendee UUID[],
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES public.users (id_users) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.users (id_users) ON DELETE SET NULL,
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

@indexes CREATE UNIQUE INDEX uq_order_items_attendee_product ON order_items (id_attendees, id_products)
WHERE
    product_type = 'Tickets'
    AND record_status = 'published';

/*=============*/
-- @order-logs
/*=============*/
DO $$ BEGIN
    CREATE TYPE public.record_status_enum AS ENUM (
        'draft', 'published', 'archived'
    );

EXCEPTION WHEN duplicate_object THEN null;

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
    created_by UUID REFERENCES public.users (id_users) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.users (id_users) ON DELETE SET NULL,
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

/*=============*/
-- @e-tickets
/*=============*/
DO $$ BEGIN
    CREATE TYPE public.order_merchant_enum AS ENUM (
        'online', 'offline'
    );

EXCEPTION WHEN duplicate_object THEN null;

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
    created_by UUID REFERENCES public.users (id_users) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.users (id_users) ON DELETE SET NULL,
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

/*=============*/
-- @invoices
/*=============*/
DO $$ BEGIN
    CREATE TYPE public.record_status_enum AS ENUM (
        'draft', 'published', 'archived'
    );

EXCEPTION WHEN duplicate_object THEN null;

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
    created_by UUID REFERENCES public.users (id_users) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.users (id_users) ON DELETE SET NULL,
    rank_record INTEGER DEFAULT 0,
    record_status public.record_status_enum NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.invoice ENABLE ROW LEVEL SECURITY;
-- @security

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