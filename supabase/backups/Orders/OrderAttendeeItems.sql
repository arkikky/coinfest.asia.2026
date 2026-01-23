DO $$ BEGIN
    CREATE TYPE public.record_status_enum AS ENUM (
        'draft', 'published', 'archived'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.order_item_attendees (
    id SERIAL PRIMARY KEY,
    order_item_attendees UUID NOT NULL UNIQUE DEFAULT gen_random_uuid (),
    id_order_items UUID NOT NULL REFERENCES public.order_items (id_order_items) ON DELETE CASCADE,
    id_attendee UUID NOT NULL REFERENCES public.attendee (id_attendee) ON DELETE CASCADE,
    created_by UUID REFERENCES public.users (id_users) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.users (id_users) ON DELETE SET NULL,
    rank_record INTEGER DEFAULT 0,
    record_status public.record_status_enum NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (id_order_items, id_attendee)
);

-- @security
ALTER TABLE public.order_item_attendees ENABLE ROW LEVEL SECURITY;

-- @policies
-- @view
CREATE POLICY "order_item_attendees_select_policy" ON public.order_item_attendees FOR
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
            AND id_order_items IN (
                SELECT id_orders
                FROM public.order_items
                WHERE
                    id_orders IN (
                        SELECT id_orders
                        FROM public.orders
                        WHERE
                            created_by = (
                                SELECT auth.uid ()
                            )
                    )
            )
        )
    );

-- @insert
CREATE POLICY "order_item_attendees_insert_policy" ON public.order_item_attendees FOR
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
CREATE POLICY "order_item_attendees_update_policy" ON public.order_item_attendees FOR
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
);

-- @delete
CREATE POLICY "order_item_attendees_delete_policy" ON public.order_item_attendees FOR DELETE USING (
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
-- DROP POLICY IF EXISTS order_item_attendees_select_policy ON public.order_item_attendees;
-- DROP POLICY IF EXISTS order_item_attendees_insert_policy ON public.order_item_attendees;
-- DROP POLICY IF EXISTS order_item_attendees_update_policy ON public.order_item_attendees;
-- DROP POLICY IF EXISTS order_item_attendees_delete_policy ON public.order_item_attendees;

-- @indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_item_attendees_order_item ON public.order_item_attendees (id_order_items);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_item_attendees_attendee ON public.order_item_attendees (id_attendee);

-- @rollback(indexes)
-- DROP INDEX IF EXISTS idx_order_item_attendees_order_item;
-- DROP INDEX IF EXISTS idx_order_item_attendees_attendee;