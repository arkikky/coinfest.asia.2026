# Plan Prompt – Fitur "TypeCoupons" (Mirip Halaman "Products")
## Context
Pada Schema SQL berikut tabel `typecoupons`:
```sql
-- @typecoupons(table)
DO $$ BEGIN
    CREATE TYPE public.record_status_enum AS ENUM ('draft', 'published', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.type_coupons (
    id SERIAL PRIMARY KEY,
    id_type_coupons UUID NOT NULL UNIQUE DEFAULT gen_random_uuid (),
    type_coupon_name TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES public.users (id_users) ON DELETE CASCADE,
    updated_by UUID NOT NULL REFERENCES public.users (id_users) ON DELETE CASCADE,
    rank_record INTEGER DEFAULT 0,
    record_status public.record_status_enum NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- @security
ALTER TABLE public.type_coupons ENABLE ROW LEVEL SECURITY;

-- @rollback(policies)
-- DROP POLICY IF EXISTS "type_coupons_select_policy" ON public.type_coupons;
-- DROP POLICY IF EXISTS "type_coupons_insert_policy" ON public.type_coupons;
-- DROP POLICY IF EXISTS "type_coupons_update_policy" ON public.type_coupons;
-- DROP POLICY IF EXISTS "type_coupons_delete_policy" ON public.type_coupons;

-- @policies
-- SELECT: Super Admin & Admin see all, other roles (Marketing, Finance, Crew) see published only
CREATE POLICY "type_coupons_select_policy" 
ON public.type_coupons FOR SELECT
USING (
    -- Super Admin & Admin: see all records (draft, published, archived)
    (SELECT auth.uid()) IN (
        SELECT ur.id_users 
        FROM public.user_roles ur
        JOIN public.roles r ON ur.id_roles = r.id_roles
        WHERE r.role_name IN ('Super Admin', 'Admin')
          AND ur.record_status = 'published'
          AND r.record_status = 'published'
    )
    OR
    -- Other authenticated roles: published only (Marketing, Finance, Crew)
    (
        record_status = 'published'
        AND (SELECT auth.uid()) IN (
            SELECT ur.id_users 
            FROM public.user_roles ur
            WHERE ur.record_status = 'published'
        )
    )
);

-- INSERT: Super Admin & Admin only
CREATE POLICY "type_coupons_insert_policy" 
ON public.type_coupons FOR INSERT
WITH CHECK (
    (SELECT auth.uid()) IN (
        SELECT ur.id_users 
        FROM public.user_roles ur
        JOIN public.roles r ON ur.id_roles = r.id_roles
        WHERE r.role_name IN ('Super Admin', 'Admin')
          AND ur.record_status = 'published'
          AND r.record_status = 'published'
    )
);

-- UPDATE: Super Admin & Admin only
CREATE POLICY "type_coupons_update_policy" 
ON public.type_coupons FOR UPDATE
USING (
    (SELECT auth.uid()) IN (
        SELECT ur.id_users 
        FROM public.user_roles ur
        JOIN public.roles r ON ur.id_roles = r.id_roles
        WHERE r.role_name IN ('Super Admin', 'Admin')
          AND ur.record_status = 'published'
          AND r.record_status = 'published'
    )
)
WITH CHECK (
    (SELECT auth.uid()) IN (
        SELECT ur.id_users 
        FROM public.user_roles ur
        JOIN public.roles r ON ur.id_roles = r.id_roles
        WHERE r.role_name IN ('Super Admin', 'Admin')
          AND ur.record_status = 'published'
          AND r.record_status = 'published'
    )
);

-- DELETE: Super Admin & Admin only
CREATE POLICY "type_coupons_delete_policy" 
ON public.type_coupons FOR DELETE
USING (
    (SELECT auth.uid()) IN (
        SELECT ur.id_users 
        FROM public.user_roles ur
        JOIN public.roles r ON ur.id_roles = r.id_roles
        WHERE r.role_name IN ('Super Admin', 'Admin')
          AND ur.record_status = 'published'
          AND r.record_status = 'published'
    )
);

-- @rollback(indexes)
-- DROP INDEX IF EXISTS public.idx_type_coupons_status_published;
-- DROP INDEX IF EXISTS public.idx_type_coupons_record_status;
-- DROP INDEX IF EXISTS public.idx_type_coupons_latest;
-- DROP INDEX IF EXISTS public.idx_type_coupons_status_created;
-- DROP INDEX IF EXISTS public.idx_type_coupons_search_name;
-- DROP INDEX IF EXISTS public.idx_user_roles_policy_check;
-- DROP INDEX IF EXISTS public.idx_roles_name_status;

-- @indexes
-- 1. Partial index: published types only (untuk e-commerce frontend dan dropdown)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_type_coupons_status_published 
ON public.type_coupons (record_status)
WHERE record_status = 'published';

-- 2. Count by status (dashboard aggregation: draft, published, archived)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_type_coupons_record_status 
ON public.type_coupons (record_status);

-- 3. Pagination: latest published types (untuk list di e-commerce)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_type_coupons_latest 
ON public.type_coupons (created_at DESC, id_type_coupons DESC)
WHERE record_status = 'published';

-- 4. Dashboard filter: status + date (admin filtering & sorting)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_type_coupons_status_created 
ON public.type_coupons (record_status, created_at DESC);

-- 5. Fuzzy search by name (dashboard search & e-commerce search)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_type_coupons_search_name 
ON public.type_coupons USING GIN (type_coupon_name gin_trgm_ops);

-- 6. Policy checks: user roles lookup (optimasi RLS performance)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_roles_policy_check 
ON public.user_roles (id_users, id_roles, record_status)
WHERE record_status = 'published';

-- 7. Policy checks: roles lookup (optimasi RLS performance)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_roles_name_status 
ON public.roles (role_name, record_status)
WHERE record_status = 'published';
```

## Overview
Pattern tampilan dan struktur mirip dengan halaman **"Products"** yang sudah ada di project (table, filters, pagination, form create modal, form edit modal dsb).

## Tugas
Buatkan seluruh bagian fitur **"TypeCoupons"** yang mirip dengan halaman **"Products"**, termasuk:

### 1. Endpoint API
Buat route handlers pada file `/api/v1/typecoupons` untuk:
- **List TypeCoupons** (filter, search, pagination, sorting)
- **Get detail TypeCoupons** berdasarkan `id_type_coupons`
- **View TypeCoupons**
- **Delete TypeCoupons**

### 2. Halaman Frontend `/dashboard/typecoupons`
Buat halaman frontend `/dashboard/typecoupons` dengan:
- Layout mirip dengan halaman **"Products"**
- Fitur:
  - Search (type_coupon_name)
  - Filter (`record_status`)
- Table TypeCoupons dengan kolom:
  - `No.` (row number)
  - Category Coupons Name as `type_coupon_name` - sortable
  - `record_status` - sortable
  - `created_at` - sortable
  - `updated_at` - sortable
  - `actions` (View TypeCoupons, Delete TypeCoupons) - only for Super Admin
  - Actions dropdown with "View TypeCoupons", "Published", "Unpublished" and "Delete" options
  - Follow same pattern as `src/components/Tables/Products/columns.tsx`
  - Pagination (mengikuti pola pagination yang sama dengan halaman Products).

### 3. Komponen Reusable
Gunakan struktur komponen reusable sebagai berikut:
- **Table + columns definition** di file `@/components/Tables/`
- **TypeCouponsForm** (View TypeCoupons) di file `@/components/Tables/TypeCoupons/Modal`
- **TypeCouponsActionsDropdown** (View TypeCoupons, Delete TypeCoupons)

### 4. Integrasi Permission
Integrasikan permission dengan ketentuan:
- Hanya user dengan role **"Super Admin"** yang bisa:
  - View detail TypeCoupons
  - Published or Unpublished
  - Delete TypeCoupons
- User tanpa permission hanya bisa melihat list TypeCoupons (read-only).

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
