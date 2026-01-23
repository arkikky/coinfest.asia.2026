DO $$ BEGIN
    CREATE TYPE public.record_status_enum AS ENUM ('draft', 'published', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.coupon_products (
    id SERIAL PRIMARY KEY,
    id_coupons UUID NOT NULL REFERENCES public.coupons (id_coupons) ON DELETE CASCADE,
    id_products UUID NOT NULL REFERENCES public.products (id_products) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES public.users (id_users) ON DELETE CASCADE,
    updated_by UUID NOT NULL REFERENCES public.users (id_users) ON DELETE CASCADE,
    rank_record INTEGER DEFAULT 0,
    record_status public.record_status_enum NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (id_coupons, id_products)
);

-- @security
ALTER TABLE public.coupon_products ENABLE ROW LEVEL SECURITY;

-- @policies
-- @view
CREATE POLICY "coupon_products_select_policy" ON public.coupon_products FOR
SELECT USING (
        (
            SELECT auth.uid ()
        ) IN (
            SELECT ur.id_users
            FROM public.user_roles ur
                JOIN public.roles r ON ur.id_roles = r.id_roles
            WHERE
                r.role_name IN (
                    'Super Admin', 'Admin', 'Marketing'
                )
                AND ur.record_status = 'published'
                AND r.record_status = 'published'
        )
        OR (
            record_status = 'published'
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
-- @insert
CREATE POLICY "coupon_products_insert_policy" ON public.coupon_products FOR
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
                    'Marketing'
                )
                AND ur.record_status = 'published'
                AND r.record_status = 'published'
        )
    );
-- @update
CREATE POLICY "coupon_products_update_policy" ON public.coupon_products FOR
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
                'Marketing'
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
                    'Marketing'
                )
                AND ur.record_status = 'published'
                AND r.record_status = 'published'
        )
    );
-- @delete
CREATE POLICY "coupon_products_delete_policy" ON public.coupon_products FOR DELETE USING (
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
                'Marketing'
            )
            AND ur.record_status = 'published'
            AND r.record_status = 'published'
    )
);

-- @rollback(policies)
-- DROP POLICY IF EXISTS "coupon_products_select_policy" ON public.coupon_products;
-- DROP POLICY IF EXISTS "coupon_products_insert_policy" ON public.coupon_products;
-- DROP POLICY IF EXISTS "coupon_products_update_policy" ON public.coupon_products;
-- DROP POLICY IF EXISTS "coupon_products_delete_policy" ON public.coupon_products;

-- @indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coupon_products_coupon ON public.coupon_products (id_coupons);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coupon_products_product ON public.coupon_products (id_products);

-- @rollback(indexes)
-- DROP INDEX IF EXISTS idx_coupon_products_coupon;
-- DROP INDEX IF EXISTS idx_coupon_products_product;