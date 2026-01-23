DO $$ BEGIN
    CREATE TYPE public.record_status_enum AS ENUM ('draft', 'published', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.attendee (
    id SERIAL PRIMARY KEY,
    id_attendee UUID NOT NULL UNIQUE DEFAULT gen_random_uuid (),
    id_events UUID NOT NULL REFERENCES public.events (id_events) ON DELETE CASCADE,
    id_customers UUID REFERENCES public.customers (id_customers) ON DELETE SET NULL,
    attendee_id VARCHAR(50) NOT NULL, -- format: "A-{random char+number}"
    first_name TEXT NOT NULL,
    last_name TEXT,
    email TEXT,
    country TEXT,
    position TEXT,
    company_name TEXT,
    company_website TEXT,
    company_focus TEXT,
    company_size TEXT,
    social_accounts JSONB, -- format: [{ type: 'twitter', url: 'https://twitter.com/username' }, ...]
    custom_questions JSONB, -- format: [{ question: 'How did you hear about us?', answer: 'Social Media' }, ...]
    self_edited BOOLEAN NOT NULL DEFAULT FALSE,
    is_customer BOOLEAN NOT NULL DEFAULT FALSE,
    is_approved BOOLEAN NOT NULL DEFAULT FALSE,
    approved_at TIMESTAMPTZ,
    created_by UUID REFERENCES public.users (id_users) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.users (id_users) ON DELETE SET NULL,
    rank_record INTEGER DEFAULT 0,
    record_status public.record_status_enum NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- @security
ALTER TABLE public.attendee ENABLE ROW LEVEL SECURITY;

-- @policies
-- @view
CREATE POLICY "attendee_select_policy" ON public.attendee FOR
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
                    JOIN public.roles r ON ur.id_roles = r.id_roles
                WHERE
                    r.role_name = 'Crew'
                    AND ur.record_status = 'published'
                    AND r.record_status = 'published'
            )
        )
        OR (
            record_status = 'published'
            AND is_approved = TRUE
            AND (
                SELECT auth.role ()
            ) IN ('authenticated', 'anon')
        )
    );

-- @create
CREATE POLICY "attendee_insert_policy" ON public.attendee FOR
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
                    'Crew'
                )
                AND ur.record_status = 'published'
                AND r.record_status = 'published'
        )
    );

-- @update
CREATE POLICY "attendee_update_policy" ON public.attendee FOR
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
    OR (
        record_status = 'published'
        AND (
            SELECT auth.uid ()
        ) IN (
            SELECT ur.id_users
            FROM public.user_roles ur
                JOIN public.roles r ON ur.id_roles = r.id_roles
            WHERE
                r.role_name = 'Crew'
                AND ur.record_status = 'published'
                AND r.record_status = 'published'
        )
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
                    'Crew'
                )
                AND ur.record_status = 'published'
                AND r.record_status = 'published'
        )
    );

-- @delete
CREATE POLICY "attendee_delete_policy" ON public.attendee FOR DELETE USING (
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
-- DROP POLICY IF EXISTS "attendee_select_policy" ON public.attendee;
-- DROP POLICY IF EXISTS "attendee_insert_policy" ON public.attendee;
-- DROP POLICY IF EXISTS "attendee_update_policy" ON public.attendee;
-- DROP POLICY IF EXISTS "attendee_delete_policy" ON public.attendee;

-- @unique attendee_id (primary search key)
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS uq_attendee_attendee_id ON public.attendee (attendee_id);

-- @foreign id_events
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_attendee_id_events ON public.attendee (id_events);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_attendee_id_customers ON public.attendee (id_customers);

-- @search email
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_attendee_email ON public.attendee (email)
WHERE
    email IS NOT NULL;

-- @search approval status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_attendee_approval_status ON public.attendee (is_approved, record_status)
WHERE
    record_status = 'published';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_attendee_approved_at ON public.attendee (approved_at DESC)
WHERE
    approved_at IS NOT NULL;

-- @search actived records only
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_attendee_status_actived ON public.attendee (record_status)
WHERE
    record_status = 'published';

-- @search event + status (most common query)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_attendee_events_status ON public.attendee (
    id_events,
    record_status,
    created_at DESC
)
WHERE
    record_status = 'published';

-- @search latest actived attendees
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_attendee_latest ON public.attendee (
    created_at DESC,
    id_attendee DESC
)
WHERE
    record_status = 'published';

-- @search fuzzy search: name, email, company
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_attendee_search_name ON public.attendee USING GIN (
    (
        first_name || ' ' || COALESCE(last_name, '')
    ) gin_trgm_ops
);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_attendee_search_email ON public.attendee USING GIN (email gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_attendee_search_company ON public.attendee USING GIN (company_name gin_trgm_ops);

-- @index(search) JSONB indexes for flexible fields
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_attendee_custom_questions ON public.attendee USING GIN (custom_questions);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_attendee_social_accounts ON public.attendee USING GIN (social_accounts);

-- @rollback
-- DROP INDEX IF EXISTS uq_attendee_attendee_id;
-- DROP INDEX IF EXISTS idx_attendee_id_events;
-- DROP INDEX IF EXISTS idx_attendee_id_customers;
-- DROP INDEX IF EXISTS idx_attendee_email;
-- DROP INDEX IF EXISTS idx_attendee_is_customer;
-- DROP INDEX IF EXISTS idx_attendee_is_approved;
-- DROP INDEX IF EXISTS idx_attendee_approved_at;
-- DROP INDEX IF EXISTS idx_attendee_rank_record;
-- DROP INDEX IF EXISTS idx_attendee_status_actived;
-- DROP INDEX IF EXISTS idx_attendee_events_status;
-- DROP INDEX IF EXISTS idx_attendee_search_name;
-- DROP INDEX IF EXISTS idx_attendee_search_email;
-- DROP INDEX IF EXISTS idx_attendee_search_company;
-- DROP INDEX IF EXISTS idx_attendee_custom_questions;
-- DROP INDEX IF EXISTS idx_attendee_social_accounts;