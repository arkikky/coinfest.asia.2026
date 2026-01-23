# Plan Prompt – Fitur "Customers" (Mirip Halaman "Products")
## Context
Pada Schema SQL berikut tabel `auth_logs`:
```sql
DO $$ BEGIN
    CREATE TYPE public.record_status_enum AS ENUM ('draft', 'actived', 'inactive');
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
    created_by UUID NOT NULL REFERENCES public.users (id_users) ON DELETE CASCADE,
    updated_by UUID NOT NULL REFERENCES public.users (id_users) ON DELETE CASCADE,
    rank_record INTEGER DEFAULT 0,
    record_status public.record_status_enum NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- @security
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- @indexes(policy performance optimization)
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
```

## Overview
Pattern tampilan dan struktur mirip halaman **"Products"** yang sudah ada di project (table, filters, pagination, form modal, dsb).

## Tugas
Buatkan seluruh bagian fitur **"Customers"** yang mirip dengan halaman **"Products"**, termasuk:

### 1. Endpoint API
Buat route handlers pada file `/api/v1/customers` untuk:
- **List Customers** (filter, search, pagination, sorting)
- **Get detail Customers** berdasarkan `id_customers`
- **View Customers**
- **Delete Customers**

### 2. Halaman Frontend `/dashboard/customers`
Buat halaman frontend `/dashboard/customers` dengan:
- Layout mirip dengan halaman **"Products"**
- Fitur:
  - Search (id_customers, billing_id, billing_name, billing_email, billing_company, id_events by event_name)
  - Filter (`record_status`)
- Table Customers dengan kolom:
  - `No.` (row number)
  - `billing_id`
  - `billing_name` - sortable
  - `billing_email` - sortable
  - `id_events` (relation data dengan data "Products" menampilkan "event_name") - sortable
  - `is_approved` - sortable
  - `actions` (View Customers, Delete Customers) - only for Super Admin
  - Actions dropdown with "View Customers" and "Delete" options
  - Follow same pattern as `src/components/Tables/Products/columns.tsx`
  - Pagination (mengikuti pola pagination yang sama dengan halaman Products).

### 3. Komponen Reusable
Gunakan struktur komponen reusable sebagai berikut:
- **Table + columns definition** di file `@/components/Tables/`
- **CustomersForm** (View Customers) di file `@/components/Tables/Customers/Modal`
- **CustomersActionsDropdown** (View Customers, Delete Customers)

### 4. Integrasi Permission
Integrasikan permission dengan ketentuan:
- Hanya user dengan role **"Super Admin"** yang bisa:
  - View detail Customers
  - Delete Customers
- User tanpa permission hanya bisa melihat list Customers (read-only).

## Notes
- Use existing `StatusBadge` component for status display
- Use existing `DateTimeCellTables` component for date formatting
- Follow existing code patterns and naming conventions
- Ensure TypeScript types match SQL schema exactly
- Soft Delete by setting
- Jangan menggunakan implementasikan "any" dan pada route API juga jangan menggunakan implementasikan "any"

## Output yang Diharapkan

- Berikan contoh struktur file/folder yang rapi.
- Berikan contoh kode untuk setiap bagian (API routes, hooks, komponen React) dengan penulisan yang konsisten dengan pola **Next.js + Tailwind + shadcn**.
- Gunakan **TypeScript** dan tipe data yang sesuai dengan schema SQL di atas.
