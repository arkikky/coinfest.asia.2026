DO $$ BEGIN
    CREATE TYPE public.record_status_enum AS ENUM ('draft', 'published', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.customers (
    id SERIAL PRIMARY KEY,
    id_customers UUID NOT NULL UNIQUE DEFAULT gen_random_uuid (),
    id_events UUID NOT NULL REFERENCES public.events (id_events) ON DELETE CASCADE,
    billing_id VARCHAR(50) NOT NULL,
    billing_name TEXT NOT NULL,
    billing_email TEXT,
    billing_company TEXT,
    billing_country TEXT,
    billing_website_url TEXT,
    is_approved BOOLEAN NOT NULL DEFAULT FALSE,
    created_by UUID REFERENCES public.users (id_users) ON DELETE CASCADE,
    updated_by UUID REFERENCES public.users (id_users) ON DELETE CASCADE,
    rank_record INTEGER DEFAULT 0,
    record_status public.record_status_enum NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- @security
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- @policies
-- @view
CREATE POLICY "customers_select_policy" ON public.customers FOR
SELECT USING (
        (
            SELECT auth.uid ()
        ) IN (
            SELECT ur.id_users
            FROM public.user_roles ur
                JOIN public.roles r ON ur.id_roles = r.id_roles
            WHERE
                r.role_name IN ('Super Admin', 'Admin','Marketing')
                AND ur.record_status = 'published'
                AND r.record_status = 'published'
        )
        OR (
            record_status = 'published'
            AND (
                SELECT auth.role ()
            ) IN ('authenticated', 'anon')
        )
    );

-- @create
CREATE POLICY "customers_insert_policy" ON public.customers FOR
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
                r.role_name IN ('Super Admin', 'Admin','Marketing')
                AND ur.record_status = 'published'
                AND r.record_status = 'published'
        )
    );

-- @update
CREATE POLICY "customers_update_policy" ON public.customers FOR
UPDATE USING (
    (
        SELECT auth.uid ()
    ) IN (
        SELECT ur.id_users
        FROM public.user_roles ur
            JOIN public.roles r ON ur.id_roles = r.id_roles
        WHERE
            r.role_name IN ('Super Admin', 'Admin','Marketing')
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
                r.role_name IN ('Super Admin', 'Admin','Marketing')
                AND ur.record_status = 'published'
                AND r.record_status = 'published'
        )
    );

-- @delete
CREATE POLICY "customers_delete_policy" ON public.customers FOR DELETE USING (
    (
        SELECT auth.uid ()
    ) IN (
        SELECT ur.id_users
        FROM public.user_roles ur
            JOIN public.roles r ON ur.id_roles = r.id_roles
        WHERE
            r.role_name IN ('Super Admin', 'Admin','Marketing')
            AND ur.record_status = 'published'
            AND r.record_status = 'published'
    )
);

-- @policies
-- DROP POLICY IF EXISTS "super_admin_admin_full_access_customers" ON public.customers;
-- DROP POLICY IF EXISTS "authenticated_read_actived_customers" ON public.customers;
-- DROP POLICY IF EXISTS "customers_select_policy" ON public.customers;
-- DROP POLICY IF EXISTS "customers_insert_policy" ON public.customers;
-- DROP POLICY IF EXISTS "customers_update_policy" ON public.customers;
-- DROP POLICY IF EXISTS "customers_delete_policy" ON public.customers;

-- @indexes(policy)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_roles_policy_check ON public.user_roles (
    id_users,
    id_roles,
    record_status
)
WHERE
    record_status = 'published';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_roles_name_status ON public.roles (role_name, record_status)
WHERE
    record_status = 'published';

-- @rollback
-- DROP INDEX IF EXISTS idx_user_roles_policy_check ON public.user_roles;
-- DROP INDEX IF EXISTS idx_roles_name_status ON public.roles;

-- CREATE OR REPLACE FUNCTION public.update_customers_audit()
-- RETURNS TRIGGER
-- LANGUAGE plpgsql
-- SECURITY DEFINER
-- AS $$
-- BEGIN
--     NEW.updated_by := (SELECT auth.uid());
--     NEW.updated_at := NOW();
--     RETURN NEW;
-- END;
-- $$;

-- DROP TRIGGER IF EXISTS trg_customers_audit ON public.customers;

-- CREATE TRIGGER trg_customers_audit
--     BEFORE UPDATE ON public.customers
--     FOR EACH ROW
--     EXECUTE FUNCTION public.update_customers_audit();