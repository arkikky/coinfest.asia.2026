-- @rollback
-- DROP INDEX IF EXISTS idx_customers_status_actived;
-- DROP INDEX IF EXISTS idx_customers_record_status;
-- DROP INDEX IF EXISTS uq_customers_billing_id;
-- DROP INDEX IF EXISTS idx_customers_id_events;
-- DROP INDEX IF EXISTS idx_customers_latest;
-- DROP INDEX IF EXISTS idx_customers_created_at_status;
-- DROP INDEX IF EXISTS idx_customers_is_approved;
-- DROP INDEX IF EXISTS idx_customers_search_billing_name;
-- DROP INDEX IF EXISTS idx_customers_search_billing_company;
-- DROP INDEX IF EXISTS idx_customers_search_billing_email;
-- DROP INDEX IF EXISTS idx_customers_search_billing_id;

-- @indexes
-- @partial index: actived customers only (homepage/API))
CREATE INDEX IF NOT EXISTS idx_customers_status_actived ON public.customers (record_status)
WHERE
    record_status = 'published';

-- @count by status (dashboard aggregation))
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_record_status ON public.customers (record_status);

-- @unique billing_id (primary search key))
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS uq_customers_billing_id ON public.customers (billing_id);

-- @foreign key to events)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_id_events ON public.customers (id_events);

-- @pagination: latest actived customers first)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_latest ON public.customers (
    created_at DESC,
    id_customers DESC
)
WHERE
    record_status = 'published';

-- @dashboard filter: status + date (FIXED ORDER))
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_status_created_filter ON public.customers (
    record_status,
    created_at DESC
);

-- @approval filter)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_is_approved ON public.customers (is_approved, record_status)
WHERE
    record_status = 'published';

-- @fuzzy search - separate indexes per column)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_search_billing_name ON public.customers USING GIN (billing_name gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_search_billing_company ON public.customers USING GIN (billing_company gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_search_billing_email ON public.customers USING GIN (billing_email gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_search_billing_id ON public.customers USING GIN (billing_id gin_trgm_ops);

-- @composite search optimization - for query with multiple filters)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_events_status_approved ON public.customers (
    id_events,
    record_status,
    is_approved
)
WHERE
    record_status = 'published';