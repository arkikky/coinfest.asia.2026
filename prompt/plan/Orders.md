# Plan Prompt – Fitur "Orders" (Mirip Halaman "Products")
## Context
Pada Schema SQL berikut tabel `orders`:
```sql
DO $$ BEGIN
    CREATE TYPE public.order_payment_status_enum AS ENUM (
        'pending', 'paid', 'failed', 'cancelled', 'refunded'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.record_status_enum AS ENUM (
        'draft', 'published', 'archived'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.orders (
    id SERIAL PRIMARY KEY,
    id_orders UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    id_events UUID REFERENCES public.events(id_events) ON DELETE SET NULL,
    id_customers UUID NOT NULL REFERENCES public.customers(id_customers) ON DELETE RESTRICT,
    id_coupons UUID REFERENCES public.coupons(id_coupons) ON DELETE SET NULL,
    order_id VARCHAR(50) NOT NULL,  -- format: "ORD-{random}"
    order_notes TEXT,
    order_subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    grand_order_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
    payment_method TEXT,
    payment_provider TEXT,
    payment_intent_id TEXT,
    payment_status public.order_payment_status_enum NOT NULL DEFAULT 'pending',
    expired_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    refunded_at TIMESTAMPTZ,
    created_by UUID REFERENCES public.users(id_users) ON DELETE CASCADE,
    updated_by UUID REFERENCES public.users(id_users) ON DELETE CASCADE,
    rank_record INTEGER DEFAULT 0,
    record_status public.record_status_enum NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- @security
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
```

## Overview
Pattern tampilan dan struktur mirip dengan halaman **"Products"** yang sudah ada di project (table, filters, pagination, form create modal, form edit modal dsb).

## Tugas
Buatkan seluruh bagian fitur **"Orders"** yang mirip dengan halaman **"Products"**, termasuk:

### 1. Endpoint API
Buat route handlers pada file `/api/v1/orders` untuk:
- **List Orders** (filter, search, pagination, sorting)
- **Get detail Orders** berdasarkan `id_orders`
- **View Orders**
- **Delete Orders**

### 2. Halaman Frontend `/dashboard/orders`
Buat halaman frontend `/dashboard/orders` dengan:
- Layout mirip dengan halaman **"Products"**
- Fitur:
  - Search (order_id, payment_method, payment_intent_id, id_coupons by coupon_code_name, id_customers by billing_name)
  - Filter (`record_status`)
- Table Orders dengan kolom:
  - `No.` (row number)
  - Order Detail as `order_id` - sortable
  - Customer as `id_customers` (`billing_name`)
  - Order Total as `grand_order_total` - sortable
  - Event Program as`id_events` (`event_name`) - sortable
  - Payment Detail as `payment_method` && `payment_provider`  - sortable
  - `payment_status` - sortable
  - `actions` (View Orders, Delete Orders) - only for Super Admin, Admin
  - Actions dropdown with "View Orders", "Published", "Unpublished" and "Delete" options
  - Follow same pattern as `src/components/Tables/Products/columns.tsx`
  - Pagination (mengikuti pola pagination yang sama dengan halaman Products).

### 3. Komponen Reusable
Gunakan struktur komponen reusable sebagai berikut:
- **Table + columns definition** di file `@/components/Tables/`
- **OrdersForm** (View Orders) di file `@/components/Tables/Orders/Modal`
- **OrdersActionsDropdown** (View Orders, Delete Orders)

### 4. Integrasi Permission
Integrasikan permission dengan ketentuan:
- Hanya user dengan role **"Super Admin","Admin", "Finance"** yang bisa:
  - View detail Orders
  - Published or Unpublished
  - Delete Orders
- User tanpa permission hanya bisa melihat list Orders (read-only).

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
