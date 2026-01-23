-- @notifications_system(tables)
DO $$ BEGIN
    CREATE TYPE public.notification_priority_enum AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.record_status_enum AS ENUM ('draft', 'published', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.notifications (
    id SERIAL PRIMARY KEY,
    id_notifications UUID NOT NULL UNIQUE DEFAULT gen_random_uuid (),
    notification_type TEXT NOT NULL,
    notification_title TEXT NOT NULL,
    notification_message TEXT NOT NULL,
    notification_priority public.notification_priority_enum NOT NULL DEFAULT 'medium',
    id_recipient UUID NOT NULL REFERENCES public.users (id_users) ON DELETE CASCADE,
    entity_type TEXT, -- 'event', 'customer', 'attendee', 'order', 'order_log'
    entity_id UUID, -- id_events, id_users, id_attendees, id_orders, id_order_logs
    entity_data JSONB, -- snapshot of relevant data
    action_url TEXT, -- e.g., '/orders/ORD-ABC123', '/events/uuid-123'
    action_label TEXT, -- e.g., 'View Order', 'View Event', 'Check Details'
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    archived_at TIMESTAMPTZ,
    sent_email BOOLEAN NOT NULL DEFAULT FALSE,
    sent_push BOOLEAN NOT NULL DEFAULT FALSE,
    sent_sms BOOLEAN NOT NULL DEFAULT FALSE,
    metadata JSONB,
    expires_at TIMESTAMPTZ,
    created_by UUID REFERENCES public.users (id_users) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.users (id_users) ON DELETE SET NULL,
    rank_record INTEGER DEFAULT 0,
    record_status public.record_status_enum NOT NULL DEFAULT 'published',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- @security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- @rollback(policies)
-- DROP POLICY IF EXISTS "notifications_select_policy" ON public.notifications;
-- DROP POLICY IF EXISTS "notifications_insert_policy" ON public.notifications;
-- DROP POLICY IF EXISTS "notifications_update_policy" ON public.notifications;
-- DROP POLICY IF EXISTS "notifications_delete_policy" ON public.notifications;

-- SELECT: Admins see all, users see only their own notifications
CREATE POLICY "notifications_select_policy" ON public.notifications FOR
SELECT USING (
        -- Super Admin & Admin: see all notifications
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
        -- Users: see only their own notifications
        id_recipient = (
            SELECT auth.uid ()
        )
    );

-- INSERT: Admins + System
CREATE POLICY "notifications_insert_policy" ON public.notifications FOR
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

-- UPDATE: Admins can update all, users can mark their own as read/archived
CREATE POLICY "notifications_update_policy" ON public.notifications FOR
UPDATE USING (
    -- Super Admin & Admin: can update any notification
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
    -- Users: can update their own notifications (mark as read/archived)
    id_recipient = (
        SELECT auth.uid ()
    )
)
WITH
    CHECK (
        -- Super Admin & Admin: can set any values
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
        -- Users: can only update read/archived status of their own notifications
        id_recipient = (
            SELECT auth.uid ()
        )
    );

-- DELETE: Super Admin only
CREATE POLICY "notifications_delete_policy" ON public.notifications FOR DELETE USING (
    (
        SELECT auth.uid ()
    ) IN (
        SELECT ur.id_users
        FROM public.user_roles ur
            JOIN public.roles r ON ur.id_roles = r.id_roles
        WHERE
            r.role_name = 'Super Admin'
            AND ur.record_status = 'published'
            AND r.record_status = 'published'
    )
);

-- @indexes
--  @Recipient lookup (CRITICAL for user notification feed)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_recipient ON public.notifications (id_recipient, created_at DESC)
WHERE
    record_status = 'published';

--  @Unread notifications (notification badge count)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_recipient_unread ON public.notifications (
    id_recipient,
    is_read,
    created_at DESC
)
WHERE
    is_read = FALSE
    AND is_archived = FALSE
    AND record_status = 'published';

--  @Notifications by type (analytics)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_type ON public.notifications (
    notification_type,
    created_at DESC
);

--  @Entity reference (find notifications for specific entity)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_entity ON public.notifications (entity_type, entity_id)
WHERE
    entity_type IS NOT NULL
    AND entity_id IS NOT NULL;

--  @Priority notifications (urgent alerts)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_priority ON public.notifications (
    notification_priority,
    created_at DESC
)
WHERE
    notification_priority IN ('high', 'urgent')
    AND record_status = 'published';

--  @Notifications by date (admin dashboard)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_created_at ON public.notifications (created_at DESC);

--  @Expired notifications cleanup (batch job)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_expires_at ON public.notifications (expires_at)
WHERE
    expires_at IS NOT NULL
    AND is_archived = FALSE;

--  @User's latest notifications (notification feed)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_recipient_latest ON public.notifications (
    id_recipient,
    is_archived,
    created_at DESC
)
WHERE
    record_status = 'published';

--  @JSONB index for entity_data queries (optional, if needed)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_entity_data ON public.notifications USING GIN (entity_data)
WHERE
    entity_data IS NOT NULL;