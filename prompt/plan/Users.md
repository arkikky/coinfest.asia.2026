# Plan Prompt – Fitur "Users" (Mirip Halaman "Products")
## Context
Pada Schema SQL berikut tabel `users`:
```sql
-- @users(table)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

DO $$ BEGIN
    CREATE TYPE public.active_status_enum AS ENUM ('active', 'inactive');

EXCEPTION WHEN duplicate_object THEN null;

END $$;

DO $$ BEGIN
    CREATE TYPE public.record_status_enum AS ENUM ('draft', 'published', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.users (
    id SERIAL PRIMARY KEY,
    id_users UUID NOT NULL UNIQUE DEFAULT gen_random_uuid (),
    username TEXT NOT NULL UNIQUE,
    full_name TEXT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    users_status public.active_status_enum NOT NULL DEFAULT 'inactive',
    rank_record INTEGER,
    record_status public.record_status_enum NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- @rollback(policies)
-- DROP POLICY IF EXISTS "users_select_policy" ON public.users;
-- DROP POLICY IF EXISTS "users_insert_policy" ON public.users;
-- DROP POLICY IF EXISTS "users_update_policy" ON public.users;
-- DROP POLICY IF EXISTS "users_delete_policy" ON public.users;

-- @policies
-- SELECT: Super Admin & Admin see all, other roles see active + published only
CREATE POLICY "users_select_policy" ON public.users FOR
SELECT USING (
        -- Super Admin & Admin: see all users
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
        -- Other authenticated roles: see active + published users only
        (
            users_status = 'active'
            AND record_status = 'published'
            AND (
                SELECT auth.uid ()
            ) IN (
                SELECT ur.id_users
                FROM public.user_roles ur
                WHERE
                    ur.record_status = 'published'
            )
        )
        OR
        -- Users can always see their own profile (self-access)
        id_users = (
            SELECT auth.uid ()
        )
    );

-- INSERT: Super Admin & Admin only
CREATE POLICY "users_insert_policy" ON public.users FOR
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

-- UPDATE: Super Admin & Admin can update all, users can update own profile
CREATE POLICY "users_update_policy" ON public.users FOR
UPDATE USING (
    -- Super Admin & Admin: can update any user
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
    -- Users can update their own profile (limited fields)
    id_users = (
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
        -- Regular users: can only update own profile (self-update)
        (
            id_users = (
                SELECT auth.uid ()
            )
            -- Additional protection: prevent self-privilege escalation
            -- Users cannot change their own: users_status, record_status, rank_record
        )
    );

-- DELETE: Super Admin & Admin only
CREATE POLICY "users_delete_policy" ON public.users FOR DELETE USING (
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

-- @security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- @rollback
-- DROP EXTENSION IF EXISTS pg_trgm;
-- DROP INDEX IF EXISTS public.idx_users_status_count;
-- DROP INDEX IF EXISTS public.idx_users_record_count;
-- DROP INDEX IF EXISTS public.idx_users_search_trgm;
-- DROP INDEX IF EXISTS public.idx_users_public_list;
-- DROP INDEX IF EXISTS public.idx_users_admin_panel;

-- @indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_status_count ON public.users (users_status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_record_count ON public.users (record_status);

-- @indexes(search)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_search_trgm ON public.users USING gin (
    username gin_trgm_ops,
    full_name gin_trgm_ops,
    email gin_trgm_ops
);

-- @indexes(list active & published)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_public_list ON public.users (created_at DESC, id DESC)
WHERE
    users_status = 'active'
    AND record_status = 'published';

-- @indexes(filter + sorting + pagination)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_admin_panel ON public.users (
    users_status,
    record_status,
    created_at DESC,
    id DESC
);
```

## Overview
Pattern tampilan dan struktur mirip dengan halaman **"Products"** yang sudah ada di project (table, filters, pagination, form modal, dsb).

## Tugas
Buatkan seluruh bagian fitur **"Users"** yang mirip dengan halaman **"Products"**, termasuk:

### 1. Endpoint API
Buat route handlers pada file `/api/v1/users` untuk:
- **List Users** (filter, search, pagination, sorting)
- **Get detail Users** berdasarkan `id_users`
- **View Users** berdasarkan `id_users`
- **Hard Delete Users** berdasarkan `id_users`

### 2. Halaman Frontend `/dashboard/users`
Buat halaman frontend `/dashboard/users` dengan:
- Layout mirip dengan halaman **"Products"**
- Fitur:
  - Search (username, fullname, email)
  - Filter (`users_status`,`record_status`)
- Table users dengan kolom:
  - `User` (full_name, email) - sortable using `full_name` 
  - `is_email_verified` - sortable
  - `users_status` - sortable
  - `record_status` - sortable
  - `created_at` - sortable
  - `actions` (View Users, Delete Users) - only for [Super Admin, Admin]
  - Actions dropdown with "View Users" and "Delete" options
  - Follow same pattern as `src/components/Tables/Products/columns.tsx`
  - Pagination (mengikuti pola pagination yang sama dengan halaman Products).

### 3. Komponen Reusable
Gunakan struktur komponen reusable sebagai berikut:
- **Table + columns definition** di file `@/components/Tables/`
- **UsersForm** (view Users) di file `@/components/Tables/Modal`
- **UsersActionsDropdown** (View Users, Delete Users)

### 4. Integrasi Permission
Integrasikan permission dengan ketentuan:
- Hanya user dengan role [Super Admin,Admin] yang bisa:
  - View detail Users
  - Delete Users
- User tanpa permission hanya bisa melihat list Users (read-only).

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
