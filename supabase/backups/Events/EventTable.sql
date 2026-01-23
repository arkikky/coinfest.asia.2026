DO $$ BEGIN
    CREATE TYPE public.record_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.events (
    id SERIAL PRIMARY KEY,
    id_events UUID NOT NULL UNIQUE DEFAULT gen_random_uuid (),
    event_thumbnail_url_image TEXT,
    event_name TEXT NOT NULL,
    event_description TEXT,
    event_location TEXT,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    website_url TEXT,
    created_by UUID REFERENCES public.users (id_users) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.users (id_users) ON DELETE SET NULL,
    rank_record INTEGER DEFAULT 0,
    record_status public.record_status NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- @security
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- @policies
-- @view
CREATE POLICY events_select_policy ON public.events FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.user_roles ur
                JOIN public.roles r ON r.id_roles = ur.id_roles
            WHERE
                ur.id_users = (
                    SELECT auth.uid ()
                )
                AND ur.record_status = 'published'
                AND r.record_status = 'published'
                AND r.role_name IN ('Super Admin', 'Admin')
        )
        OR (
            record_status IN ('published')
            AND EXISTS (
                SELECT 1
                FROM public.user_roles ur
                    JOIN public.roles r ON r.id_roles = ur.id_roles
                WHERE
                    ur.id_users = (
                        SELECT auth.uid ()
                    )
                    AND ur.record_status = 'published'
                    AND r.record_status = 'published'
            )
        )
    );

-- @create
CREATE POLICY events_insert_policy ON public.events FOR
INSERT
WITH
    CHECK (
        EXISTS (
            SELECT 1
            FROM public.user_roles ur
                JOIN public.roles r ON r.id_roles = ur.id_roles
            WHERE
                ur.id_users = (
                    SELECT auth.uid ()
                )
                AND ur.record_status = 'published'
                AND r.record_status = 'published'
                AND r.role_name IN ('Super Admin', 'Admin')
        )
    );

-- @update
CREATE POLICY events_update_policy ON public.events FOR
UPDATE USING (
    EXISTS (
        SELECT 1
        FROM public.user_roles ur
            JOIN public.roles r ON r.id_roles = ur.id_roles
        WHERE
            ur.id_users = (
                SELECT auth.uid ()
            )
            AND ur.record_status = 'published'
            AND r.record_status = 'published'
            AND r.role_name IN ('Super Admin', 'Admin')
    )
)
WITH
    CHECK (
        EXISTS (
            SELECT 1
            FROM public.user_roles ur
                JOIN public.roles r ON r.id_roles = ur.id_roles
            WHERE
                ur.id_users = (
                    SELECT auth.uid ()
                )
                AND ur.record_status = 'published'
                AND r.record_status = 'published'
                AND r.role_name IN ('Super Admin', 'Admin')
        )
    );

-- @delete
CREATE POLICY events_delete_policy ON public.events FOR DELETE USING (
    EXISTS (
        SELECT 1
        FROM public.user_roles ur
            JOIN public.roles r ON r.id_roles = ur.id_roles
        WHERE
            ur.id_users = (
                SELECT auth.uid ()
            )
            AND ur.record_status = 'published'
            AND r.record_status = 'published'
            AND r.role_name IN ('Super Admin', 'Admin')
    )
);

-- @rollback
-- DROP POLICY IF EXISTS events_select_policy ON public.events;
-- DROP POLICY IF EXISTS events_insert_policy ON public.events;
-- DROP POLICY IF EXISTS events_update_policy ON public.events;
-- DROP POLICY IF EXISTS events_delete_policy ON public.events;

-- @indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_status_published ON public.events (record_status)
WHERE
    record_status = 'published';

-- @count total per status)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_record_status ON public.events (record_status);

-- @filter + sorting + pagination)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_upcoming ON public.events (start_date ASC, id_events ASC)
WHERE
    record_status = 'published';

-- @sorting latest events)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_published_latest ON public.events (
    start_date DESC,
    id_events DESC
)
WHERE
    record_status = 'published';

-- @event_name + event_location)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_search_trgm ON public.events USING GIN (
    event_name gin_trgm_ops,
    COALESCE(event_location, '') gin_trgm_ops
);

-- @filtered created_at + record_status (count & list per hari/minggu/bulan))
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_created_at_status ON public.events (
    created_at DESC,
    record_status
);

-- @tracking by creator)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_created_by ON public.events (created_by)
WHERE
    created_by IS NOT NULL;

-- @tracking by last updater)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_updated_by ON public.events (updated_by)
WHERE
    updated_by IS NOT NULL;

-- @rollback
-- DROP INDEX IF EXISTS public.idx_events_status_published;
-- DROP INDEX IF EXISTS public.idx_events_record_status;
-- DROP INDEX IF EXISTS public.idx_events_upcoming;
-- DROP INDEX IF EXISTS public.idx_events_published_latest;
-- DROP INDEX IF EXISTS public.idx_events_search_trgm;
-- DROP INDEX IF EXISTS public.idx_events_created_at_status;
-- DROP INDEX IF EXISTS public.idx_events_created_by;
-- DROP INDEX IF EXISTS public.idx_events_updated_by