# Plan Prompt – Fitur "Attendee" (Mirip Halaman "Products")
## Context
Pada Schema SQL berikut tabel `auth_logs`:
```sql
-- @role(table)
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

-- @rollback
DROP INDEX IF EXISTS uq_attendee_attendee_id;
DROP INDEX IF EXISTS idx_attendee_id_events;
DROP INDEX IF EXISTS idx_attendee_id_customers;
DROP INDEX IF EXISTS idx_attendee_email;
DROP INDEX IF EXISTS idx_attendee_is_customer;
DROP INDEX IF EXISTS idx_attendee_is_approved;
DROP INDEX IF EXISTS idx_attendee_approved_at;
DROP INDEX IF EXISTS idx_attendee_rank_record;
DROP INDEX IF EXISTS idx_attendee_status_actived;
DROP INDEX IF EXISTS idx_attendee_events_status;
DROP INDEX IF EXISTS idx_attendee_search_name;
DROP INDEX IF EXISTS idx_attendee_search_email;
DROP INDEX IF EXISTS idx_attendee_search_company;
DROP INDEX IF EXISTS idx_attendee_custom_questions;
DROP INDEX IF EXISTS idx_attendee_social_accounts;
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
```

## Overview
Pattern tampilan dan struktur mirip dengan halaman **"Products"** yang sudah ada di project (table, filters, pagination, form create modal, form edit modal dsb).

## Tugas
Buatkan seluruh bagian fitur **"Attendee"** yang mirip dengan halaman **"Products"**, termasuk:

### 1. Endpoint API
Buat route handlers pada file `/api/v1/attendee` untuk:
- **List Attendee** (filter, search, pagination, sorting)
- **Get detail Attendee** berdasarkan `id_attendee`
- **View Attendee**
- **Delete Attendee**

### 2. Halaman Frontend `/dashboard/attendee`
Buat halaman frontend `/dashboard/attendee` dengan:
- Layout mirip dengan halaman **"Products"**
- Fitur:
  - Search (id_attendee, attendee_id, first_name, last_name, email, company_name, id_events by event_name)
  - Filter (`record_status`)
- Table Attendee dengan kolom:
  - `No.` (row number)
  - Attendee as `attendee_id` & (`first_name` & `last_name`) - sortable
  - Contact as `company_name` && `email`  - sortable
  - `id_events` (relation data dengan data "Products" menampilkan "event_name") - sortable
  - `self_edited` - sortable
  - `is_approved` - sortable
  - `actions` (View Attendee, Delete Attendee) - only for Super Admin
  - Actions dropdown with "View Attendee", "Published", "Unpublished" and "Delete" options
  - Follow same pattern as `src/components/Tables/Products/columns.tsx`
  - Pagination (mengikuti pola pagination yang sama dengan halaman Products).

### 3. Komponen Reusable
Gunakan struktur komponen reusable sebagai berikut:
- **Table + columns definition** di file `@/components/Tables/`
- **AttendeeForm** (View Attendee) di file `@/components/Tables/Attendee/Modal`
- **AttendeeActionsDropdown** (View Attendee, Delete Attendee)

### 4. Integrasi Permission
Integrasikan permission dengan ketentuan:
- Hanya user dengan role **"Super Admin"** yang bisa:
  - View detail Attendee
  - Published or Unpublished
  - Delete Attendee
- User tanpa permission hanya bisa melihat list Attendee (read-only).

## Notes
- Use existing `StatusBadge` component for status display
- Use existing `BooleanStatusBadge` component for booleen display
- Use existing `BoxBadge` component for status display
- Use existing `DateTimeCellTables` component for date formatting
- Follow existing code patterns and naming conventions
- Ensure TypeScript types match SQL schema exactly
- Soft Delete by setting
- Jangan menggunakan implementasikan "any" dan pada route API juga jangan menggunakan implementasikan "any"

## Output yang Diharapkan

- Berikan contoh struktur file/folder yang rapi.
- Berikan contoh kode untuk setiap bagian (API routes, hooks, komponen React) dengan penulisan yang konsisten dengan pola **Next.js + Tailwind + shadcn**.
- Gunakan **TypeScript** dan tipe data yang sesuai dengan schema SQL di atas.
