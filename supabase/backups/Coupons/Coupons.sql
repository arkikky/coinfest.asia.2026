-- @coupons(table)
DO $$ BEGIN
    CREATE TYPE public.record_status_enum AS ENUM ('draft', 'published', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.type_coupon_enum AS ENUM ('percentage', 'fixed_amount');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.coupons (
    id SERIAL PRIMARY KEY,
    id_coupons UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    id_events UUID NOT NULL REFERENCES public.events (id_events) ON DELETE CASCADE,
    id_type_coupons UUID NOT NULL REFERENCES public.type_coupons (id_type_coupons) ON DELETE RESTRICT,
    coupon_code_name VARCHAR(50) NOT NULL,
    type_coupon public.type_coupon_enum NOT NULL,
    amount NUMERIC(12,2),
    expired_date TIMESTAMPTZ,
    usage_limit INTEGER,
    current_usage INTEGER DEFAULT 0,
    included_products UUID[],
    min_total_purchase NUMERIC(12,2),
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    sale_label TEXT,
    sale_shortdesc TEXT,
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    created_by UUID NOT NULL REFERENCES public.users (id_users) ON DELETE CASCADE,
    updated_by UUID NOT NULL REFERENCES public.users (id_users) ON DELETE CASCADE,
    rank_record INTEGER DEFAULT 0,
    record_status public.record_status_enum NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- @security
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- @rollback(policies)
-- DROP POLICY IF EXISTS "coupons_select_policy" ON public.coupons;
-- DROP POLICY IF EXISTS "coupons_insert_policy" ON public.coupons;
-- DROP POLICY IF EXISTS "coupons_update_policy" ON public.coupons;
-- DROP POLICY IF EXISTS "coupons_delete_policy" ON public.coupons;

-- @policies
-- SELECT: Super Admin & Admin see all, other roles see published + active only
CREATE POLICY "coupons_select_policy" ON public.coupons FOR
SELECT USING (
        -- Super Admin & Admin: see all records
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
        OR
        -- Other authenticated roles: published + active + valid coupons only
        (
            record_status = 'published'
            AND is_active = TRUE
            AND (
                expired_date IS NULL
                OR expired_date > NOW()
            )
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

-- INSERT: Super Admin & Admin only
CREATE POLICY "coupons_insert_policy" ON public.coupons FOR
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

-- UPDATE: Super Admin & Admin only
CREATE POLICY "coupons_update_policy" ON public.coupons FOR
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

-- DELETE: Super Admin & Admin only
CREATE POLICY "coupons_delete_policy" ON public.coupons FOR DELETE USING (
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

-- @rollback(indexes)
-- DROP INDEX IF EXISTS public.uq_coupons_code;
-- DROP INDEX IF EXISTS public.idx_coupons_id_events;
-- DROP INDEX IF EXISTS public.idx_coupons_id_type_coupons;
-- DROP INDEX IF EXISTS public.idx_coupons_active_valid;
-- DROP INDEX IF EXISTS public.idx_coupons_public_active;
-- DROP INDEX IF EXISTS public.idx_coupons_expired_date;
-- DROP INDEX IF EXISTS public.idx_coupons_status_published;
-- DROP INDEX IF EXISTS public.idx_coupons_record_status;
-- DROP INDEX IF EXISTS public.idx_coupons_event_status;
-- DROP INDEX IF EXISTS public.idx_coupons_latest;
-- DROP INDEX IF EXISTS public.idx_coupons_code_lookup;
-- DROP INDEX IF EXISTS public.idx_coupons_usage_tracking;
-- DROP INDEX IF EXISTS public.idx_coupons_included_products;
-- DROP INDEX IF EXISTS public.idx_user_roles_policy_check;
-- DROP INDEX IF EXISTS public.idx_roles_name_status;

-- @indexes
-- 1. Unique coupon code (business rule)
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS uq_coupons_code ON public.coupons (coupon_code_name);

-- 2. Foreign key: coupons by event
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coupons_id_events ON public.coupons (id_events);

-- 3. Foreign key: coupons by type
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coupons_id_type_coupons ON public.coupons (id_type_coupons);

-- 4. E-commerce: active & valid coupons (CRITICAL)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coupons_active_valid ON public.coupons (
    is_active,
    expired_date,
    record_status
)
WHERE
    is_active = TRUE
    AND record_status = 'published';

-- 5. E-commerce: public coupons (homepage promo)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coupons_public_active ON public.coupons (
    is_public,
    is_active,
    expired_date
)
WHERE
    is_public = TRUE
    AND is_active = TRUE
    AND record_status = 'published';

-- 6. Cleanup: expired coupons (batch job)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coupons_expired_date ON public.coupons (expired_date)
WHERE
    expired_date IS NOT NULL
    AND is_active = TRUE;

-- 7. Dashboard: published coupons only
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coupons_status_published ON public.coupons (record_status)
WHERE
    record_status = 'published';

-- 8. Dashboard: count by status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coupons_record_status ON public.coupons (record_status);

-- 9. Dashboard: coupons by event + status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coupons_event_status ON public.coupons (
    id_events,
    record_status,
    is_active
);

-- 10. Dashboard: latest coupons (pagination)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coupons_latest ON public.coupons (
    created_at DESC,
    id_coupons DESC
)
WHERE
    record_status = 'published';

-- 11. Checkout: validate coupon code (case-insensitive)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coupons_code_lookup ON public.coupons (LOWER(coupon_code_name))
WHERE
    is_active = TRUE
    AND record_status = 'published';

-- 12. Analytics: usage tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coupons_usage_tracking ON public.coupons (current_usage, usage_limit)
WHERE
    usage_limit IS NOT NULL
    AND is_active = TRUE;

-- 13. Product-specific coupons (jika sering query by product)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coupons_included_products ON public.coupons USING GIN (included_products)
WHERE
    included_products IS NOT NULL;

-- 14. Policy checks: user roles lookup (RLS optimization)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_roles_policy_check ON public.user_roles (
    id_users,
    id_roles,
    record_status
)
WHERE
    record_status = 'published';

-- 15. Policy checks: roles lookup (RLS optimization)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_roles_name_status ON public.roles (role_name, record_status)
WHERE
    record_status = 'published';