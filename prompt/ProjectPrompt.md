Bantu buatkan prompt Auth Login, Register, Role Management, Reset Password & Email Verification dan akses halaman dashboard dan setiap role terdapat akses halamannya sendiri seperti berikut ini :
* Super Admin : /dashboard/admin
* Admin : /dashboard/admin
* Marketing : /dashboard/admin
* Finance : /dashboard/finance
* Crew : /dashboard/crew

Teknologi stack yang wajib dipakai:
- Next.js 15.5.4 (App Router)
- TypeScript (strict mode)
- Supabase Client (@supabase/supabase-js)
- Supabase SSR (@supabase/ssr)
- Tailwind CSS v3+ (untuk styling minimal)
- Zod untuk validasi form
- React Hook Form
- @hookform/resolvers
- Lucide-react
- @vercel/analytics
- @tanstack/react-query
- @tanstack/react-table
- bcryptjs
- use-debounce
- ui.shadcn

Setup Nextjs : 
✔ What is your project named? … icn-organizers
✔ Would you like to use TypeScript? … No / Yes
✔ Which linter would you like to use? › None
✔ Would you like to use Tailwind CSS? … No / Yes
✔ Would you like your code inside a `src/` directory? … No / Yes
✔ Would you like to use App Router? (recommended) … No / Yes
✔ Would you like to use Turbopack? (recommended) … No / Yes
✔ Would you like to customize the import alias (`@/*` by default)? … No / Yes
✔ What import alias would you like configured? … @/*




# V2
Buatkan aplikasi Next.js 15 (App Router) lengkap dengan nama project **icn-organizers** untuk sistem Auth (Login, Register, Email Verification, Reset Password) + Role-Based Access Control + Dashboard per role sesuai spesifikasi berikut:

### Tech Stack WAJIB (harus dipakai semua):
- Next.js 15.5.4 (App Router + Server Components)
- TypeScript (strict mode)
- Supabase Client (@supabase/supabase-js)
- Supabase SSR (@supabase/ssr)
- Tailwind CSS v3+
- shadcn/ui (sudah di-init)
- Zod + React Hook Form + @hookform/resolvers/zod
- Lucide React icons
- @tanstack/react-query (v5)
- @tanstack/react-table (v8)
- bcryptjs (untuk hash password di edge runtime jika diperlukan)
- use-debounce
- @vercel/analytics

### Setup project (sudah seperti ini):
- src/ directory
- App Router
- Tailwind + shadcn/ui
- Import alias: @/*

### Database Schema PostgreSQL (Supabase)
Gunakan EXACT schema SQL yang saya lampirkan di bawah (sudah 100% sesuai, termasuk RLS, index, enum, dll). Semua tabel sudah ada di Supabase.

[PASTE SELURUH SQL YANG KAMU BERIKAN DI ATAS DI SINI]

### Fitur yang HARUS dibuat:

1. **Auth Flow Lengkap**
   - Register (username, full_name, email, password) → kirim email verification
   - Login (email/username + password)
   - Email Verification (token dari tabel email_verification_tokens)
   - Forgot Password → Reset Password (menggunakan password_reset_tokens)
   - Protected Route + Middleware Supabase SSR
   - Auto redirect ke dashboard sesuai role setelah login

2. **Role-Based Dashboard**
   Setelah login, redirect otomatis ke:
   - Super Admin → /dashboard/admin
   - Admin → /dashboard/admin
   - Marketing → /dashboard/admin
   - Finance → /dashboard/finance
   - Crew → /dashboard/crew

   Artinya:
   - Super Admin, Admin, Marketing → bisa akses halaman admin lengkap
   - Finance → hanya halaman finance
   - Crew → hanya halaman crew

3. **Route Protection & Role Guard**
   - Gunakan middleware.ts (Supabase SSR) untuk protect semua route /dashboard/*
   - Buat Server Component `RoleGuard` atau `ProtectedRoute` yang mengecek role user dari tabel user_roles → roles
   - Jika role tidak sesuai → redirect ke /unauthorized atau dashboard yang diizinkan

4. **Struktur Folder (wajib ikuti)**
src/
├── app/
│   ├── (auth)/
│   │   ├── login/            → page.tsx
│   │   ├── register/         → page.tsx
│   │   ├── forgot-password/  → page.tsx
│   │   ├── reset-password/   → page.tsx [token]
│   │   ├── verify-email/     → page.tsx [token]
│   ├── dashboard/
│   │   ├── layout.tsx        → sidebar + navbar + role-based menu
│   │   ├── admin/
│   │   │   ├── page.tsx
│   │   │   ├── users/        → table + CRUD (hanya Super Admin & Admin)
│   │   │   ├── roles/        → table + assign permission
│   │   ├── finance/
│   │   │   ├── page.tsx
│   │   ├── crew/
│   │   │   ├── page.tsx
│   │   └── unauthorized/    → page.tsx
│   ├── layout.tsx
│   ├── page.tsx              → landing / home
│   └── globals.css
├── components/
│   ├── ui/                   → shadcn components
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   ├── ForgotPasswordForm.tsx
│   │   └── ResetPasswordForm.tsx
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Navbar.tsx
│   │   └── DashboardLayout.tsx
│   └── RoleGuard.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts         → createBrowserClient
│   │   ├── server.ts         → createServerClient (SSR)
│   │   └── middleware.ts
│   └── utils.ts
├── hooks/
│   └── use-auth.ts
├── types/
│   └── supabase.ts           → gunakan supabase generate types
└── middleware.ts             → protect /dashboard/*


5. **Tambahan Wajib**
   - Gunakan shadcn/ui components (Button, Input, Card, Table, Dialog, Toast, etc)
   - Semua form pakai React Hook Form + Zod resolver
   - Toast notification pakai sonner atau shadcn toast
   - Loading state & error handling yang baik
   - Dark mode support (optional tapi lebih bagus)
   - Responsive sidebar (mobile collapse)
   - Logout button di navbar

6. **Contoh Role Check (contoh logika di server component)**
```ts
const userRoles = await getUserRoles(session.user.id);
const hasRole = (role: string) => userRoles.some(r => r.roles.role_name === role);

if (!hasRole('Super Admin') && !hasRole('Admin') && !hasRole('Marketing')) {
  redirect('/dashboard/unauthorized');
}

7. Output yang saya inginkan
- Seluruh kode siap jalan (tidak ada placeholder)
- File per file dengan path lengkap
- Termasuk middleware.ts, supabase client setup, dan contoh query RLS-safe
- Semua form sudah divalidasi Zod
- Sudah include seed data minimal untuk testing (1 Super Admin, 1 Admin, 1 Marketing, 1 Finance, 1 Crew)


Tolong buatkan SEMUA file yang diperlukan secara lengkap dan bisa langsung dijalankan setelah supabase start dan npm run dev.
Mulai dari setup supabase client sampai dashboard per role.