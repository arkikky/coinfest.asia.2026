# Plan Prompt – Fitur "Products" (Mirip Halaman "Events")

## Context
Pada Schema SQL berikut tabel `products`:

```sql
-- @role(table)
CREATE TYPE public.record_status_enum AS ENUM ('draft', 'published', 'archived');

CREATE TABLE IF NOT EXISTS public.products (
    id SERIAL PRIMARY KEY,
    id_products UUID NOT NULL UNIQUE DEFAULT gen_random_uuid (),
    id_events UUID NOT NULL REFERENCES public.events (id_events) ON DELETE CASCADE,
    product_id VARCHAR(50) NOT NULL,
    product_name TEXT NOT NULL,
    product_description TEXT,
    price NUMERIC(12, 2) NOT NULL,
    price_sale NUMERIC(12, 2),
    product_stock INTEGER NOT NULL DEFAULT 0,
    variant_product VARCHAR(7),
    is_group BOOLEAN NOT NULL DEFAULT FALSE,
    is_sale_active BOOLEAN NOT NULL DEFAULT FALSE,
    sale_start TIMESTAMPTZ,
    sale_end TIMESTAMPTZ,
    sale_banner_url TEXT,
    created_by UUID NOT NULL REFERENCES public.users (id_users) ON DELETE CASCADE,
    updated_by UUID NOT NULL REFERENCES public.users (id_users) ON DELETE CASCADE,
    rank_record INTEGER DEFAULT 0,
    record_status public.record_status_enum NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- @security
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- @security: DROP old policies
DROP POLICY IF EXISTS "authenticated_read_published_products" ON public.products;
DROP POLICY IF EXISTS "super_admin_admin_full_access" ON public.products;
DROP POLICY IF EXISTS "authenticated_view_published_only" ON public.products;

-- @policy: Super Admin & Admin → Full Access (ALL)
CREATE POLICY "super_admin_admin_full_access" ON public.products FOR ALL USING (
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

-- @policy: Other Roles → View Published Only
CREATE POLICY "authenticated_view_published_only" ON public.products FOR
SELECT USING (
        record_status = 'published'
        AND (
            -- Authenticated users (Marketing, Finance, Crew, dll)
            (
                SELECT auth.role ()
            ) = 'authenticated'
            OR
            -- Anonymous users (public homepage)
            (
                SELECT auth.role ()
            ) = 'anon'
        )
    );

-- @policy subquery optimization
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
DROP INDEX IF EXISTS idx_products_id_products_unique;
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
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_published_latest ON public.products (    created_at DESC,
    id_products DESC
)
WHERE
    record_status = 'published';

-- @search product + filter by event (JOIN optimization)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_events_search ON public.products (    id_events,
    record_status,
    created_at DESC
)
WHERE
    record_status = 'published';

-- @upcoming / active sale products
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_sale_active ON public.products (    sale_start DESC,
    sale_end DESC
)
WHERE
    record_status = 'published'
    AND is_sale_active = TRUE;

-- @filter dashboard: created_at + record_status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_status_created_filter ON public.products (    record_status,
    created_at DESC
);

-- @fuzzy search product_name (paling sering dipakai user)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_search_trgm ON public.products USING GIN (product_name gin_trgm_ops);
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_products_id_products_unique ON public.products (id_products);
```

## Overview
Pattern tampilan dan struktur mirip halaman **"Events"** yang sudah ada di project (table, filters, pagination, form modal, dsb).

## Tugas
Buatkan seluruh bagian fitur **"Products"** yang mirip dengan halaman **"Events"**, termasuk:

### 1. Endpoint API
Buat route handlers pada file `/api/v1/products` untuk:

- **List Products** (filter, search, pagination, sorting)
- **Get detail Products** berdasarkan `id_products`
- **View Products**
- **Archive/soft-delete Products** dengan cara mengubah `record_status` (misalnya menjadi `archived`)

### 2. Halaman Frontend `/dashboard/products`
Buat halaman frontend `/dashboard/products` dengan:
- Layout mirip dengan halaman **"Events"**
- Fitur:
  - Search (product_name, event_name memanfaatkan relasi berikut id_events)
  - Filter (`record_status`)
- Table products dengan kolom:
  - `No.` (row number)
  - `Users` (fullname, email) - sortable using id_users from users
  - `product_name` - sortable
  - `id_events` (relation data dengan data "Events" menampilkan "event_name") - sortable
  - `price` - sortable
  - `price_sale` - sortable
  - `product_stock` - sortable
  - `product_name` - sortable
  - `is_sale_active` - sortable
  - `created_by` - sortable
  - `updated_by` - sortable
  - `actions` (View Products, Delete Products) - only for Super Admin
  - Actions dropdown with "View Products" and "Published", "Unpublished" "Delete" options
  - Follow same pattern as `src/components/Tables/Events/columns.tsx`
  - Pagination (mengikuti pola pagination yang sama dengan halaman "Events").

### 3. Komponen Reusable
Gunakan struktur komponen reusable sebagai berikut:
- **Table + columns definition** di file `@/components/Tables/`
- **ProductsForm** (New Products) di file `@/components/Tables/Modal`
- **ProductsForm** (View Products) di file `@/components/Tables/Modal`
- **ProductsActionsDropdown** (View Products, Delete Products)

### 4. Integrasi Permission
Integrasikan permission dengan ketentuan:
- Gunakan permission role seperti berikut ini :
  const { hasAnyRole } = useAuth();

  // @allowed-roles: Users with any of these roles can access this page
  const allowedRoles = ["Super Admin"];
  const hasAccess = hasAnyRole(allowedRoles);
- Hanya user dengan role **"Super Admin"** yang bisa:
  - Create detail Products
  - View detail Products
  - Archive/Delete Products
- User tanpa permission hanya bisa melihat list Products (read-only) dan berikut : 
  - View detail Products

## Notes
- Use existing `truncateText` component "import truncateText from "@/lib/utils/text-truncate";" for desc display
- Use existing `StatusBadge` component for status display
- Use existing `StatusBadge` component for status display
- Use existing `DateTimeCellTables` component for date formatting
- Follow existing code patterns and naming conventions
- Ensure TypeScript types match SQL schema exactly
- Archive = soft delete by setting `record_status` to `'archived'`
- Jangan menggunakan implementasikan "any" dan pada route API juga jangan menggunakan implementasikan "any"

## Output yang Diharapkan

- Berikan contoh struktur file/folder yang rapi.
- Berikan contoh kode untuk setiap bagian (API routes, hooks, komponen React) dengan penulisan yang konsisten dengan pola **Next.js + Tailwind + shadcn**.
- Gunakan **TypeScript** dan tipe data yang sesuai dengan schema SQL di atas.
