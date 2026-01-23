# Plan Prompt – Fitur "Activity" (Mirip Halaman "Events")
## Context
Pada Schema SQL berikut tabel `auth_logs`:
```sql
-- @auth_logs(table)
CREATE TABLE IF NOT EXISTS public.auth_logs (
    id SERIAL PRIMARY KEY,
    id_authlogs UUID NOT NULL UNIQUE DEFAULT gen_random_uuid (),
    id_users UUID NOT NULL REFERENCES public.users (id_users) ON DELETE CASCADE,
    ip_address INET,
    user_agent TEXT,
    token_hash TEXT NOT NULL,
    session_created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expired_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    rank_record INTEGER,
    record_status public.record_status_enum NOT NULL DEFAULT 'published',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_session_timing CHECK (
        (
            expired_at IS NULL
            OR expired_at > session_created_at
        )
        AND (
            revoked_at IS NULL
            OR revoked_at >= session_created_at
        )
        AND (
            last_activity_at >= session_created_at
        )
    )
);

-- @security
ALTER TABLE public.auth_logs ENABLE ROW LEVEL SECURITY;

-- @indexes(list session)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_auth_active_sessions
    ON public.auth_logs (id_users, session_created_at DESC)
    WHERE is_active = TRUE
      AND revoked_at IS NULL;

-- @indexes(JWT/refresh token validation)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_auth_token_hash
    ON public.auth_logs (token_hash)
    WHERE is_active = TRUE
      AND revoked_at IS NULL;

-- @indexes(cron job harian)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_auth_cleanup
    ON public.auth_logs (last_activity_at)
    WHERE is_active = FALSE
       OR revoked_at IS NOT NULL
       OR expired_at IS NOT NULL;

-- @indexes(audit log)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_auth_by_user_all
    ON public.auth_logs (id_users, session_created_at DESC);
);
```

## Overview
Pattern tampilan dan struktur mirip halaman **"Events"** yang sudah ada di project (table, filters, pagination, form modal, dsb).

## Tugas
Buatkan seluruh bagian fitur **"Activity"** yang mirip dengan halaman **"Events"**, termasuk:

### 1. Endpoint API
Buat route handlers pada file `/api/v1/activity` untuk:
- **List activity** (filter, search, pagination, sorting)
- **Get detail rolactivitye** berdasarkan `id_authlogs`
- **View activity**
- **Archive/soft-delete activity** dengan cara mengubah `record_status` (misalnya menjadi `archived`)

### 2. Halaman Frontend `/dashboard/activity`
Buat halaman frontend `/dashboard/activity` dengan:
- Layout mirip dengan halaman **"Events"**
- Fitur:
  - Search (fullname, email)
  - Filter (`record_status`)
- Table activity dengan kolom:
  - `No.` (row number)
  - `Users` (fullname, email) - sortable using id_users from users
  - `Agent` (ip_address, user_agent) - sortable
  - `session_created_at` - sortable
  - `expired_at` - sortable
  - `last_activity_at` - sortable
  - `is_active` - sortable
  - `actions` (View Activity, Delete Activity) - only for Super Admin
  - Actions dropdown with "View Activity" and "Delete" options
  - Follow same pattern as `src/components/Tables/Events/columns.tsx`
  - Pagination (mengikuti pola pagination yang sama dengan halaman Events).

### 3. Komponen Reusable
Gunakan struktur komponen reusable sebagai berikut:
- **Table + columns definition** di file `@/components/Tables/`
- **ActivityForm** (view activity) di file `@/components/Tables/Modal`
- **ActivityActionsDropdown** (View Activity, Delete Activity)

### 4. Integrasi Permission
Integrasikan permission dengan ketentuan:
- Hanya user dengan role **"Super Admin"** yang bisa:
  - View detail Activity
  - Archive/Delete Activity
- User tanpa permission hanya bisa melihat list activity (read-only).

## Notes
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
