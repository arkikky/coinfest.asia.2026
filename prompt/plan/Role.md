# Roles Feature Implementation Plan

## Overview

Create a complete "Roles" management feature that mirrors the existing "Events" feature structure, with API routes, frontend pages, reusable components, hooks, and permission-based access control.

## File Structure

### 1. Types Definition

- **File**: `src/types/roles.ts`
- Define `Role` interface matching the SQL schema
- Define `RoleStats` interface for statistics
- Define `CreateRoleInput` and `UpdateRoleInput` interfaces
- Define `RoleFilters` interface
- Export `RoleName` types

### 2. API Routes

#### 2.1 Main Roles API

- **File**: `src/app/api/roles/route.ts`
- `GET`: List roles with filtering, search, pagination, sorting
- Query params: `page`, `limit`, `q` (search), `record_status`, `sortBy`, `sortOrder`
- Validate sortBy columns: `role_name`, `record_status`, `created_at`, `rank_record`
- `POST`: Create new role (Super Admin only)
- Validate input with Zod schema
- Check permission using `isSuperAdmin()`

#### 2.2 Role Detail API

- **File**: `src/app/api/roles/[id]/route.ts`
- `GET`: Get role by `id_roles` (Super Admin only for detail view)
- `PATCH`: Update role (Super Admin only)
- `DELETE`: Archive role by setting `record_status` to `'archived'` (Super Admin only)

#### 2.3 Role Statistics API

- **File**: `src/app/api/roles/stats/route.ts`
- `GET`: Get role statistics (total, active, archived counts by record_status)

### 3. Library Functions

- **File**: `src/lib/api/roles.ts`
- `getRoles()`: Fetch roles with filters, search, pagination, sorting
- `getRoleById()`: Fetch single role by `id_roles`
- `getRoleStats()`: Fetch role statistics
- `createRole()`: Create new role
- `updateRole()`: Update existing role
- `archiveRole()`: Soft-delete by setting `record_status` to `'archived'`
- Follow same pattern as `src/lib/api/events.ts`

### 4. React Hooks

- **File**: `src/hooks/useRoles.ts`
- `useRoles()`: Query hook for listing roles
- `useRoleStats()`: Query hook for statistics
- `useCreateRole()`: Mutation hook for creating roles
- `useUpdateRole()`: Mutation hook for updating roles
- `useArchiveRole()`: Mutation hook for archiving roles
- Follow same pattern as `src/hooks/useEvents.ts`

### 5. Frontend Components

#### 5.1 Main Page

- **File**: `src/app/dashboard/roles/page.tsx`
- Client component with URL state management
- Display stats cards (Total Roles, Active, Archived, Published, Draft)
- Integrate `RolesDataTable` component
- Show `CreateRoleDialog` (only for Super Admin)
- Follow same pattern as `src/app/dashboard/events/page.tsx`

#### 5.2 Role Detail Page (Optional - if needed)

- **File**: `src/app/dashboard/roles/[id]/page.tsx`
- Server component to display role details
- Only accessible to Super Admin
- Similar structure to `src/app/dashboard/events/[id]/page.tsx`

#### 5.3 Table Components

- **File**: `src/components/Tables/Roles/roles-data-table.tsx`
- Data table component with toolbar, filters, pagination
- Follow same pattern as `src/components/Tables/Events/events-data-table.tsx`

- **File**: `src/components/Tables/Roles/columns.tsx`
- Column definitions:
- `No.` (row number)
- `role_name` (Role Name) - sortable
- `short_desc` (Description)
- `rank_record` - sortable
- `created_at` (DateTimeCellTables) - sortable
- `actions` (View Role, Delete) - only for Super Admin
- Actions dropdown with "View Role" and "Delete" options
- Follow same pattern as `src/components/Tables/Events/columns.tsx`

#### 5.4 Modal Components

- **File**: `src/components/Tables/Roles/Modal/CreateRoleDialog.tsx`
- Form dialog for creating new roles
- Fields: `role_name` (select from enum), `short_desc` (textarea), `rank_record` (number)
- Validation with Zod schema
- Only visible/accessible to Super Admin
- Follow same pattern as `src/components/Tables/Events/Modal/CreateEventDialog.tsx`

- **File**: `src/components/Tables/Roles/Modal/ViewRoleDialog.tsx`
- Read-only dialog to view role details
- Only accessible to Super Admin
- Display all role fields

- **File**: `src/components/Tables/Roles/Modal/DeleteRoleDialog.tsx`
- Confirmation dialog for archiving roles
- Sets `record_status` to `'archived'`
- Only accessible to Super Admin
- Follow same pattern as `src/components/Tables/Events/Modal/DeleteEventDialog.tsx`

### 6. Permission Integration

#### 6.1 API Route Protection

- Add permission checks in API routes:
- `POST /api/roles`: Check `isSuperAdmin()`
- `GET /api/roles/[id]`: Check `isSuperAdmin()` for detail view
- `PATCH /api/roles/[id]`: Check `isSuperAdmin()`
- `DELETE /api/roles/[id]`: Check `isSuperAdmin()`
- Use `hasAnyPermission([PERMISSIONS.VIEW_ROLES])` for list endpoint (read-only for non-Super Admin)

#### 6.2 Frontend Permission Checks

- Hide "Create Role" button for non-Super Admin users
- Hide "View Role" and "Delete" actions in table for non-Super Admin users
- Use `useAuth()` hook or permission checks in components

### 7. Implementation Details

#### 7.1 Search & Filtering

- Search by `role_name` and `short_desc`
- Filter by `record_status` (draft/published/archived)
- URL state management for filters

#### 7.2 Sorting

- Sortable columns: `role_name`, `record_status`, `created_at`, `rank_record`
- Default sort: `created_at DESC`

#### 7.3 Pagination

- Default page size: 5 (matching Events)
- URL-based pagination state

#### 7.4 Form Validation

- `role_name`: Required, must be one of enum values ('Super Admin', 'Admin', 'Marketing', 'Finance', 'Crew')
- `short_desc`: Optional, but if provided must not be empty (enforced by DB constraint)
- `rank_record`: Optional number

### 8. Key Differences from Events

- Roles use `record_status` (record_status_enum)
- Roles have enum constraint on `role_name` (must be one of predefined values)
- Archive operation uses `record_status = 'archived'` instead of hard delete
- Simpler structure (no dates, images, URLs like Events)

## Implementation Order

1. Create types (`src/types/roles.ts`)
2. Create library functions (`src/lib/api/roles.ts`)
3. Create API routes (`src/app/api/roles/`)
4. Create hooks (`src/hooks/useRoles.ts`)
5. Create table components (`src/components/Tables/Roles/`)
6. Create modal components (`src/components/Tables/Roles/Modal/`)
7. Create main page (`src/app/dashboard/roles/page.tsx`)
8. Add permission checks throughout
9. Test all CRUD operations

## Notes

- Use existing `StatusBadge` component for status display
- Use existing `DateTimeCellTables` component for date formatting
- Follow existing code patterns and naming conventions
- Ensure TypeScript types match SQL schema exactly
- Archive = soft delete by setting `record_status` to `'archived'`
