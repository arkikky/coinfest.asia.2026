-- @rollback(index policy)
DROP INDEX IF EXISTS idx_user_roles_policy_check;

DROP INDEX IF EXISTS idx_roles_name_status;

DROP INDEX IF EXISTS idx_user_roles_admin_check;

-- @index(policy)
-- @subquery optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_roles_policy_check ON public.user_roles (
    id_users,
    id_roles,
    record_status
)
WHERE
    record_status = 'published';

-- @roles lookup optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_roles_name_status ON public.roles (role_name, record_status)
WHERE
    record_status = 'published';

-- @covering index untuk JOIN (ULTIMATE SPEED)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_roles_admin_check ON public.user_roles (id_users) INCLUDE (id_roles, record_status)
WHERE
    record_status = 'published';

-- @rollback(index)
DROP INDEX IF EXISTS idx_products_status_created_filter;

DROP INDEX IF EXISTS idx_products_search_trgm;

DROP INDEX IF EXISTS idx_products_sale_active;

DROP INDEX IF EXISTS idx_products_events_search;

DROP INDEX IF EXISTS idx_products_published_latest;

DROP INDEX IF EXISTS idx_products_id_events;

DROP INDEX IF EXISTS idx_products_product_id;

DROP INDEX IF EXISTS idx_products_record_status;

DROP INDEX IF EXISTS idx_products_status_published;

-- @index
-- @partial index wajib untuk record_status = 'published' (homepage & API)
CREATE INDEX IF NOT EXISTS idx_products_status_published ON public.products (record_status)
WHERE
    record_status = 'published';

-- @count total per status (dashboard) - index-only scan super cepat
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_record_status ON public.products (record_status);

-- @lookup cepat berdasarkan product_id (human-readable ID)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_product_id ON public.products (product_id);

-- @relation to events (join sering dipakai)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_id_events ON public.products (id_events);

-- @homepage / API: Published products dengan pagination & sorting (latest first)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_published_latest ON public.products (
    created_at DESC,
    id_products DESC
)
WHERE
    record_status = 'published';

-- @search product + filter by event (JOIN optimization)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_events_search ON public.products (
    id_events,
    record_status,
    created_at DESC
)
WHERE
    record_status = 'published';

-- @upcoming / active sale products
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_sale_active ON public.products (
    sale_start DESC,
    sale_end DESC
)
WHERE
    record_status = 'published'
    AND is_sale_active = TRUE;

-- @filter dashboard: created_at + record_status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_status_created_filter ON public.products (
    record_status,
    created_at DESC
);

-- @fuzzy search product_name (paling sering dipakai user)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_search_trgm ON public.products USING GIN (product_name gin_trgm_ops);