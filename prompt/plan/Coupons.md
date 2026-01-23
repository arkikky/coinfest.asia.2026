# Plan Prompt – Fitur "Coupons" (Mirip Halaman "Products")
## Context
Pada Schema SQL berikut tabel `coupons`:
```sql
DO $$ BEGIN
    CREATE TYPE public.record_status_enum AS ENUM ('draft', 'published', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.type_coupon_enum AS ENUM ('percentage', 'fixed_amount');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.coupons (
    id SERIAL PRIMARY KEY,
    id_coupons UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    id_events UUID NOT NULL REFERENCES public.events (id_events) ON DELETE CASCADE,
    id_type_coupons UUID NOT NULL REFERENCES public.type_coupons (id_type_coupons) ON DELETE RESTRICT,
    coupon_code_name VARCHAR(50) NOT NULL,
    type_coupon public.type_coupon_enum NOT NULL,
    amount NUMERIC(12,2),
    expired_date TIMESTAMPTZ,
    usage_limit INTEGER,
    current_usage INTEGER DEFAULT 0,
    included_products UUID[],
    min_total_purchase NUMERIC(12,2),
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    sale_label TEXT,
    sale_shortdesc TEXT,
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    created_by UUID NOT NULL REFERENCES public.users (id_users) ON DELETE CASCADE,
    updated_by UUID NOT NULL REFERENCES public.users (id_users) ON DELETE CASCADE,
    rank_record INTEGER DEFAULT 0,
    record_status public.record_status_enum NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- @security
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- 1. Unique coupon code (business rule)
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS uq_coupons_code ON public.coupons (coupon_code_name);

-- 2. Foreign key: coupons by event
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coupons_id_events ON public.coupons (id_events);

-- 3. Foreign key: coupons by type
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coupons_id_type_coupons ON public.coupons (id_type_coupons);

-- 4. E-commerce: active & valid coupons (CRITICAL)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coupons_active_valid ON public.coupons (
    is_active,
    expired_date,
    record_status
)
WHERE
    is_active = TRUE
    AND record_status = 'published';

-- 5. E-commerce: public coupons (homepage promo)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coupons_public_active ON public.coupons (
    is_public,
    is_active,
    expired_date
)
WHERE
    is_public = TRUE
    AND is_active = TRUE
    AND record_status = 'published';

-- 6. Cleanup: expired coupons (batch job)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coupons_expired_date ON public.coupons (expired_date)
WHERE
    expired_date IS NOT NULL
    AND is_active = TRUE;

-- 7. Dashboard: published coupons only
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coupons_status_published ON public.coupons (record_status)
WHERE
    record_status = 'published';

-- 8. Dashboard: count by status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coupons_record_status ON public.coupons (record_status);

-- 9. Dashboard: coupons by event + status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coupons_event_status ON public.coupons (
    id_events,
    record_status,
    is_active
);

-- 10. Dashboard: latest coupons (pagination)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coupons_latest ON public.coupons (
    created_at DESC,
    id_coupons DESC
)
WHERE
    record_status = 'published';

-- 11. Checkout: validate coupon code (case-insensitive)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coupons_code_lookup ON public.coupons (LOWER(coupon_code_name))
WHERE
    is_active = TRUE
    AND record_status = 'published';

-- 12. Analytics: usage tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coupons_usage_tracking ON public.coupons (current_usage, usage_limit)
WHERE
    usage_limit IS NOT NULL
    AND is_active = TRUE;

-- 13. Product-specific coupons (jika sering query by product)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coupons_included_products ON public.coupons USING GIN (included_products)
WHERE
    included_products IS NOT NULL;

-- 14. Policy checks: user roles lookup (RLS optimization)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_roles_policy_check ON public.user_roles (
    id_users,
    id_roles,
    record_status
)
WHERE
    record_status = 'published';

-- 15. Policy checks: roles lookup (RLS optimization)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_roles_name_status ON public.roles (role_name, record_status)
WHERE
    record_status = 'published';
```

## Overview
Pattern tampilan dan struktur mirip halaman **"Products"** yang sudah ada di project (table, filters, pagination, form modal, dsb).

## Tugas
Buatkan seluruh bagian fitur **"Coupons"** yang mirip dengan halaman **"Products"**, termasuk:

### 1. Endpoint API
Buat route handlers pada file `/api/v1/coupons` untuk:
- **List coupons** (filter, search, pagination, sorting)
- **Get detail coupons** berdasarkan `id_authlogs`
- **View coupons**
- **Archive/soft-delete coupons** dengan cara mengubah `record_status` (misalnya menjadi `archived`)

### 2. Halaman Frontend `/dashboard/coupons`
Buat halaman frontend `/dashboard/coupons` dengan:
- Layout mirip dengan halaman **"Products"**
- Fitur:
  - Search (fullname, email)
  - Filter (`record_status`)
- Table coupons dengan kolom:
  - `No.` (row number)
  - `Coupons` (coupon_code_name, type_coupon) - sortable using `coupon_code_name` 
  - `id_events` (relation data dengan data "Products" menampilkan "event_name") - sortable
  - `id_type_coupons` (relation data dengan data "TypeCoupons" menampilkan "category coupon name") - sortable
  - `Usage` (usage_limit / current_usage) - sortable
  - `included_products` - sortable
  - `record_status` - sortable
  - `created_at` - sortable
  - `actions` (View Coupons, Delete Coupons) - only for [Super Admin, Admin]
  - Actions dropdown with "View Coupons" and "Delete" options
  - Follow same pattern as `src/components/Tables/Products/columns.tsx`
  - Pagination (mengikuti pola pagination yang sama dengan halaman Products).

### 3. Komponen Reusable
Gunakan struktur komponen reusable sebagai berikut:
- **Table + columns definition** di file `@/components/Tables/`
- **CouponsForm** (view Coupons) di file `@/components/Tables/Modal`
- **CouponsActionsDropdown** (View Coupons, Delete Coupons)

### 4. Integrasi Permission
Integrasikan permission dengan ketentuan:
- Hanya user dengan role [Super Admin,Admin] yang bisa:
  - View detail Coupons
  - Delete Coupons
- User tanpa permission hanya bisa melihat list coupons (read-only).

## Notes

- Use existing "import DialogFooterActions from "@/components/Customs/Tables/Dialog/DialogFooterActions";" for dialog Craete or Edit Form
- Use existing `import {
  WrappMetaData,
  ContentMetaData,
} from "@/components/Customs/Tables/Dialog/DialogMetaData"; for dialog Craete or Edit Form
- Use existing `StatusBadge` component for status display
- Use existing `BooleanStatusBadge` component for booleen display
- Use existing `BoxBadge` component for status display
- Use existing `DateTimeCellTables` component for date formatting
- Follow existing code patterns and naming conventions
- Ensure TypeScript types match SQL schema exactly
- Soft Delete by setting

## Output yang Diharapkan

- Jangan menggunakan implementasikan "any" dan pada route API juga jangan menggunakan implementasikan "any"
- Berikan contoh struktur file/folder yang rapi.
- Berikan contoh kode untuk setiap bagian (API routes, hooks, komponen React) dengan penulisan yang konsisten dengan pola **Next.js + Tailwind + shadcn**.
- Gunakan **TypeScript** dan tipe data yang sesuai dengan schema SQL di atas.
